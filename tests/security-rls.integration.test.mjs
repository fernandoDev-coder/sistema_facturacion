import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";
import { createClient } from "@supabase/supabase-js";

const requiredEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SECURITY_TEST_USER_A_EMAIL",
  "SECURITY_TEST_USER_A_PASSWORD",
  "SECURITY_TEST_USER_B_EMAIL",
  "SECURITY_TEST_USER_B_PASSWORD",
];

const hasIntegrationEnv = requiredEnv.every((key) => process.env[key]);
const integrationTest = hasIntegrationEnv ? test : test.skip;

integrationTest("RLS blocks cross-user reads, creates, updates, and deletes", async () => {
  const userA = createTestClient();
  const userB = createTestClient();
  const tag = randomUUID().slice(0, 8);
  let communityId;
  let invoiceId;

  const ownerA = await signIn(userA, "SECURITY_TEST_USER_A_EMAIL", "SECURITY_TEST_USER_A_PASSWORD");
  const ownerB = await signIn(userB, "SECURITY_TEST_USER_B_EMAIL", "SECURITY_TEST_USER_B_PASSWORD");

  assert.notEqual(ownerA, ownerB);

  try {
    const { data: community, error: communityError } = await userA
      .from("communities")
      .insert({
        owner_id: ownerA,
        name: `RLS Cliente ${tag}`,
        default_vat: 21,
      })
      .select("id")
      .single();

    assert.ifError(communityError);
    communityId = community.id;

    const { data: hiddenCommunities, error: hiddenCommunityError } = await userB
      .from("communities")
      .select("id")
      .eq("id", communityId);

    assert.ifError(hiddenCommunityError);
    assert.deepEqual(hiddenCommunities, []);

    const { data: updatedCommunities, error: updateCommunityError } = await userB
      .from("communities")
      .update({ name: "No permitido" })
      .eq("id", communityId)
      .select("id");

    assert.ifError(updateCommunityError);
    assert.deepEqual(updatedCommunities, []);

    const { data: deletedCommunities, error: deleteCommunityError } = await userB
      .from("communities")
      .delete()
      .eq("id", communityId)
      .select("id");

    assert.ifError(deleteCommunityError);
    assert.deepEqual(deletedCommunities, []);

    const crossOwnerInvoice = invoicePayload(ownerB, communityId, tag);
    const { error: crossOwnerInvoiceError } = await userB.from("invoices").insert(crossOwnerInvoice);

    assert.ok(crossOwnerInvoiceError);

    const { data: invoice, error: invoiceError } = await userA
      .from("invoices")
      .insert(invoicePayload(ownerA, communityId, tag))
      .select("id")
      .single();

    assert.ifError(invoiceError);
    invoiceId = invoice.id;

    const { data: hiddenInvoices, error: hiddenInvoiceError } = await userB
      .from("invoices")
      .select("id")
      .eq("id", invoiceId);

    assert.ifError(hiddenInvoiceError);
    assert.deepEqual(hiddenInvoices, []);

    const { data: updatedInvoices, error: updateInvoiceError } = await userB
      .from("invoices")
      .update({ notes: "No permitido" })
      .eq("id", invoiceId)
      .select("id");

    assert.ifError(updateInvoiceError);
    assert.deepEqual(updatedInvoices, []);

    const { data: deletedInvoices, error: deleteInvoiceError } = await userB
      .from("invoices")
      .delete()
      .eq("id", invoiceId)
      .select("id");

    assert.ifError(deleteInvoiceError);
    assert.deepEqual(deletedInvoices, []);

    const { error: crossOwnerItemError } = await userB.from("invoice_items").insert({
      owner_id: ownerB,
      invoice_id: invoiceId,
      description: "No permitido",
      amount: 10,
      vat_rate: 21,
      vat_amount: 2.1,
      total: 12.1,
      sort_order: 0,
    });

    assert.ok(crossOwnerItemError);
  } finally {
    if (invoiceId) {
      await userA.from("invoices").delete().eq("id", invoiceId);
    }

    if (communityId) {
      await userA.from("communities").delete().eq("id", communityId);
    }
  }
});

function createTestClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function signIn(client, emailKey, passwordKey) {
  const { data, error } = await client.auth.signInWithPassword({
    email: process.env[emailKey],
    password: process.env[passwordKey],
  });

  assert.ifError(error);
  assert.ok(data.user?.id);

  return data.user.id;
}

function invoicePayload(ownerId, communityId, tag) {
  return {
    owner_id: ownerId,
    community_id: communityId,
    document_type: "invoice",
    invoice_number: `SEC-${tag}`,
    invoice_date: "2026-01-01",
    month: 1,
    year: 2026,
    subject: `RLS Factura ${tag}`,
    amount: 10,
    vat_rate: 21,
    vat_amount: 2.1,
    total: 12.1,
    status: "draft",
  };
}
