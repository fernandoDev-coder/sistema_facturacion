import assert from "node:assert/strict";
import test from "node:test";
import { createServerClient } from "@supabase/ssr";
import { sessionCookies, SESSION_PREFERENCE_COOKIE } from "../lib/supabase/session-cookies.ts";
import { safeAuthRedirect } from "../lib/supabase/auth-redirect.ts";

function fixture() {
  const values = new Map();
  const writes = [];
  const calls = [];
  const cacheHeaders = {};
  const user = {
    id: "00000000-0000-4000-8000-000000000001", aud: "authenticated", role: "authenticated",
    email: "session@example.test", app_metadata: {}, user_metadata: { detail: "x".repeat(6000) },
    created_at: "2026-01-01T00:00:00Z",
  };
  const store = {
    getAll: () => [...values].map(([name, value]) => ({ name, value })),
    setAll(cookies, headers) {
      Object.assign(cacheHeaders, headers);
      for (const cookie of cookies) {
        writes.push(cookie);
        if (cookie.options.maxAge === 0) values.delete(cookie.name);
        else values.set(cookie.name, cookie.value);
      }
    },
  };
  let serial = 0;
  const fetch = async (input, init) => {
    const url = new URL(input);
    assert.equal(url.origin, "https://session-test.supabase.co");
    calls.push(url.pathname + url.search);
    if (url.pathname.endsWith("/logout")) return new Response(null, { status: 204 });
    if (url.pathname.endsWith("/user")) return Response.json(user);
    assert.equal(url.pathname, "/auth/v1/token");
    const body = JSON.parse(init.body);
    if (url.searchParams.get("grant_type") === "pkce") assert.ok(body.code_verifier);
    const expires = Math.floor(Date.now() / 1000) + 3600;
    const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
    const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({ sub: user.id, exp: expires, iat: expires - 3600, aud: "authenticated" })}.test-signature`;
    return Response.json({ access_token: token, refresh_token: `test-refresh-${++serial}`, expires_in: 3600,
      expires_at: expires, token_type: "bearer", user });
  };
  const client = (remember) => createServerClient("https://session-test.supabase.co", "test-anon-key", {
    global: { fetch }, cookies: sessionCookies(store, remember),
  });
  return { values, writes, calls, cacheHeaders, client };
}

for (const remember of [false, true]) {
  test(`login, renewal and logout retain remember=${remember} across requests`, async () => {
    const f = fixture();
    const signedIn = await f.client(remember).auth.signInWithPassword({
      email: "session@example.test", password: "synthetic-test-password",
    });
    assert.ifError(signedIn.error);
    assert.equal(f.values.get(SESSION_PREFERENCE_COOKIE), remember ? "1" : "0");
    const authNames = [...f.values.keys()].filter((name) => name.startsWith("sb-"));
    assert.ok(authNames.length > 1, "Exercise chunked auth cookies");
    assert.match(f.cacheHeaders["Cache-Control"], /no-store/);

    f.writes.length = 0;
    const refreshed = await f.client().auth.refreshSession();
    assert.ifError(refreshed.error);
    assert.ok(f.calls.includes("/auth/v1/token?grant_type=refresh_token"));
    const activeWrites = f.writes.filter(({ name, value }) => name.startsWith("sb-") && value);
    assert.ok(activeWrites.length > 0);
    for (const { options } of activeWrites) {
      if (remember) assert.ok(options.maxAge > 0);
      else {
        assert.equal(options.maxAge, undefined);
        assert.equal(options.expires, undefined);
      }
    }

    const verified = await f.client().auth.getUser();
    assert.ifError(verified.error);
    assert.equal(verified.data.user.id, signedIn.data.user.id);
    f.writes.length = 0;
    const signedOut = await f.client().auth.signOut();
    assert.ifError(signedOut.error);
    assert.ok(f.calls.some((path) => path.startsWith("/auth/v1/logout")));
    assert.equal([...f.values.keys()].some((name) => name.startsWith("sb-")), false);
    for (const { name, options } of f.writes) {
      if (name.startsWith("sb-")) assert.equal(options.maxAge, 0);
    }
  });
}

test("PKCE callback removes the verifier and retains session-only cookies", async () => {
  const f = fixture();
  const started = await f.client(false).auth.signInWithOAuth({
    provider: "github", options: { skipBrowserRedirect: true, redirectTo: "https://app.example.test/auth/callback" },
  });
  assert.ifError(started.error);
  assert.ok([...f.values.keys()].some((name) => name.includes("code-verifier")));
  f.writes.length = 0;
  assert.ok(started.data.flowId);
  const exchanged = await f.client().auth.exchangeCodeForSession("synthetic-code", { flowId: started.data.flowId });
  assert.ifError(exchanged.error);
  assert.ok(f.calls.includes("/auth/v1/token?grant_type=pkce"));
  assert.equal([...f.values.keys()].some((name) => name.includes("code-verifier")), false);
  for (const { value, options } of f.writes) {
    if (value) assert.equal(options.maxAge, undefined);
    else assert.equal(options.maxAge, 0);
  }
});

test("callback redirects stay on the application origin after URL normalization", () => {
  const origin = "https://app.example.test";
  for (const path of [null, "https://evil.example", "//evil.example", "/\\evil.example", "/\t/evil.example"]) {
    assert.equal(safeAuthRedirect(path, origin), null);
  }
  assert.equal(safeAuthRedirect("/reset-password?source=email", origin)?.href,
    "https://app.example.test/reset-password?source=email");
});

test("missing persistence preference never extends an auth cookie", () => {
  const writes = [];
  const cookies = sessionCookies({ getAll: () => [], setAll: (items) => writes.push(...items) });
  cookies.setAll([{ name: "sb-test-auth-token", value: "synthetic", options: { maxAge: 3600 } }], {});
  assert.equal(writes[0].options.maxAge, undefined);
});

test("callback rejects an unknown PKCE flow without submitting another flow's verifier", async () => {
  const f = fixture();
  await f.client(false).auth.signInWithOAuth({ provider: "github", options: { skipBrowserRedirect: true } });
  const before = [...f.values];
  const result = await f.client().auth.exchangeCodeForSession("synthetic-code", { flowId: "unknown-flow-12345" });
  assert.ok(result.error);
  assert.equal(f.calls.length, 0);
  assert.deepEqual([...f.values], before);
});

test("session-only cookies preserve explicit deletion expiry", () => {
  const writes = [];
  sessionCookies({ getAll: () => [], setAll: (items) => writes.push(...items) }, false).setAll([
    { name: "sb-test-token", value: "old", options: { expires: new Date(0) } },
    { name: "sb-test-token.0", value: "old", options: { maxAge: 0 } },
  ]);
  assert.equal(writes[0].options.expires.getTime(), 0);
  assert.equal(writes[1].options.maxAge, 0);
});
