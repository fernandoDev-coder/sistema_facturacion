import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";

// Real PostgreSQL SQL/RLS in an ephemeral local WASM database. Auth and Storage
// scaffolding emulate Supabase's roles; this does not replace hosted Auth tests.
test("security migrations execute against PostgreSQL and enforce access/atomicity", async (t) => {
  const db = new PGlite({ extensions: { pgcrypto } });
  try {
    await db.exec(`
      create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create schema storage; create schema extensions;
      create table auth.users(id uuid primary key, email text);
      create table auth.sessions(id uuid primary key, user_id uuid);
      create table auth.mfa_factors(id uuid primary key default gen_random_uuid(), user_id uuid, status text);
      create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
      create function auth.uid() returns uuid language sql stable as $$ select (auth.jwt()->>'sub')::uuid $$;
      create function auth.role() returns text language sql stable as $$ select auth.jwt()->>'role' $$;
      grant usage on schema auth, storage to anon,authenticated,service_role;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant select,insert,update,delete on storage.objects to anon,authenticated;
      create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;
    `);
    await db.exec(readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8"));
    for (const name of readdirSync(new URL("../supabase/migrations/", import.meta.url)).sort()) {
      if (name.endsWith(".sql")) await db.exec(readFileSync(new URL(`../supabase/migrations/${name}`, import.meta.url), "utf8"));
    }
    const a = randomUUID(), b = randomUUID(), admin = randomUUID();
    const sessions = new Map([a,b,admin].map((id) => [id, randomUUID()]));
    const community = randomUUID(), foreign = randomUUID();
    await db.query("insert into auth.users(id,email) values($1,'a@example.test'),($2,'b@example.test'),($3,'admin@example.test')", [a,b,admin]);
    for (const [id, session] of sessions) await db.query("insert into auth.sessions(id,user_id) values($1,$2)", [session,id]);
    await db.query("update public.profiles set plan='premium' where id=$1", [a]);
    await db.query("update public.profiles set is_super_admin=true where id=$1", [admin]);
    await db.query("insert into public.communities(id,owner_id,name) values($1,$2,'A'),($3,$4,'B')", [community,a,foreign,b]);
    async function actor(id, aal = "aal1", role = "authenticated") {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claims',$1,false)", [JSON.stringify({ sub: id, aal, role, session_id: sessions.get(id) })]);
      await db.exec(`set role ${role}`);
    }
    async function owner() {
      await db.exec("reset role");
      await db.exec("select set_config('request.jwt.claims','{}',false)");
    }

    await t.test("rate N+1, independent actors, denied public calls and TTL", async () => {
      await actor(a, "aal1", "service_role");
      const key = "a".repeat(64);
      const calls = await Promise.all(Array.from({ length: 6 }, () => db.query("select public.consume_rate_limit($1,5,60) as result",[key])));
      assert.equal(calls.filter((x) => x.rows[0].result.allowed).length,5);
      assert.equal(calls[5].rows[0].result.allowed,false);
      assert.ok(calls[5].rows[0].result.retry_after > 0);
      assert.equal((await db.query("select public.consume_rate_limit($1,5,60) as r",["b".repeat(64)])).rows[0].r.allowed,true);
      await owner();
      await db.query("update public.request_limits set expires_at=now()-interval '1 second' where key=$1",[key]);
      await actor(a,"aal1","service_role");
      assert.equal((await db.query("select public.consume_rate_limit($1,5,60) as r",[key])).rows[0].r.allowed,true);
      await actor(a);
      await assert.rejects(db.query("select public.consume_rate_limit($1,5,60)",[key]), /permission denied/);
    });

    await t.test("owner isolation, admin aal1 denied, aal2 admin and no self-escalation", async () => {
      await actor(a);
      assert.deepEqual((await db.query("select id from public.communities")).rows.map((r)=>r.id),[community]);
      await assert.rejects(db.query("update public.profiles set is_super_admin=true where id=$1",[a]),/service role|permission denied/);
      assert.equal((await db.query("select is_super_admin from public.profiles where id=$1",[a])).rows[0].is_super_admin,false);
      await actor(admin);
      assert.equal((await db.query("select public.mfa_required() as r")).rows[0].r,true);
      assert.equal((await db.query("select id from public.profiles")).rows.length,0);
      await actor(admin,"aal2");
      assert.equal((await db.query("select id from public.profiles")).rows.length,0);
      await owner();
      await db.query("insert into auth.mfa_factors(user_id,status) values($1,'verified')",[admin]);
      await actor(admin,"aal2");
      assert.equal((await db.query("select id from public.profiles")).rows.length,3);
      await actor(null,"aal1","anon");
      await assert.rejects(db.query("select public.create_monthly_drafts($1,11,2026,'[]',false)",[randomUUID()]),/permission denied/);
    });

    await t.test("revoked sessions and removed admin factors reject previously elevated claims", async () => {
      await owner();
      await db.query("delete from auth.sessions where user_id=$1",[a]);
      await actor(a,"aal2");
      assert.equal((await db.query("select id from public.communities")).rows.length,0);
      await owner();
      await db.query("insert into auth.sessions(id,user_id) values($1,$2)",[sessions.get(a),a]);
      await db.query("delete from auth.mfa_factors where user_id=$1",[admin]);
      await actor(admin,"aal2");
      assert.equal((await db.query("select public.is_super_admin() as r")).rows[0].r,false);
      assert.equal((await db.query("select id from public.profiles")).rows.length,0);
    });

    await t.test("enabled factor blocks aal1 via RLS and privileged fiscal RPC", async () => {
      await owner();
      await db.query("insert into auth.mfa_factors(user_id,status) values($1,'verified')",[a]);
      await actor(a);
      assert.equal((await db.query("select id from public.communities")).rows.length,0);
      await assert.rejects(db.query("select public.issue_invoice($1)",[randomUUID()]),/MFA required/);
      await assert.rejects(db.query("select public.issue_invoice_internal($1)",[randomUUID()]),/permission denied/);
      await assert.rejects(db.query("insert into public.communities(owner_id,name) values($1,'blocked')",[a]),/row-level security/);
      await actor(a,"aal2");
      assert.equal((await db.query("select id from public.communities")).rows.length,1);
    });

    await t.test("monthly retries return same IDs, duplicates need confirmation, plan and ownership hold", async () => {
      await actor(a,"aal2");
      const op=randomUUID();
      const rows=JSON.stringify([{ community_id:community,amount:120,vat_rate:21,subject:"Maintenance",notes:null }]);
      const sql="select public.create_monthly_drafts($1,11,2026,$2::jsonb,$3) as ids";
      const responses=await Promise.all(Array.from({length:3},()=>db.query(sql,[op,rows,false])));
      assert.deepEqual(responses[0].rows,responses[1].rows);
      assert.deepEqual(responses[1].rows,responses[2].rows);
      assert.equal((await db.query("select total from public.invoices")).rows[0].total,"145.20");
      assert.equal((await db.query("select count(*)::int as n from public.invoice_items")).rows[0].n,1);
      await assert.rejects(db.query(sql,[randomUUID(),rows,false]),/duplicate confirmation/);
      await db.query(sql,[randomUUID(),rows,true]);
      assert.equal((await db.query("select count(*)::int as n from public.invoices")).rows[0].n,2);
      await assert.rejects(db.query(sql,[op,rows,true]),/idempotency key reused/);
      await assert.rejects(db.query(sql,[randomUUID(),JSON.stringify([{community_id:foreign,amount:1,vat_rate:21,subject:"bad"}]),true]),/community not owned/);
      await actor(b);
      await assert.rejects(db.query(sql,[randomUUID(),rows,true]),/Premium required/);
    });

    await t.test("mid-batch failure rolls back drafts, items, audit and operation", async () => {
      await actor(a,"aal2");
      const second=randomUUID();
      await db.query("insert into public.communities(id,owner_id,name) values($1,$2,'second')",[second,a]);
      const op=randomUUID();
      const row={community_id:community,amount:120,vat_rate:21,subject:"Maintenance"};
      const sql="select public.create_monthly_drafts($1,12,2026,$2::jsonb,true) as ids";
      await assert.rejects(db.query(sql,[op,JSON.stringify([row,{...row,community_id:second,amount:-1}])]),/invalid monthly row/);
      assert.equal((await db.query("select count(*)::int as n from public.invoices where month=12")).rows[0].n,0);
      const success=await db.query(sql,[op,JSON.stringify([row,{...row,community_id:second}])]);
      assert.equal(success.rows[0].ids.length,2);
    });

    await t.test("webhook leases reject concurrent processing and accept retry after failure", async () => {
      await owner();
      await db.exec("insert into public.billing_events(event_id,type,payload) values('evt_test','test','{}')");
      await actor(a,"aal1","service_role");
      const first=(await db.query("select public.claim_billing_event('evt_test') as r")).rows[0].r;
      assert.equal(first.status,"acquired");
      assert.equal((await db.query("select public.claim_billing_event('evt_test') as r")).rows[0].r.status,"busy");
      await db.query("select public.finish_billing_event('evt_test',$1,'synthetic failure')",[first.token]);
      const retry=(await db.query("select public.claim_billing_event('evt_test') as r")).rows[0].r;
      assert.equal(retry.status,"acquired");
      await db.query("select public.finish_billing_event('evt_test',$1)",[retry.token]);
      assert.equal((await db.query("select public.claim_billing_event('evt_test') as r")).rows[0].r.status,"done");
    });
  } finally { await db.close(); }
});
