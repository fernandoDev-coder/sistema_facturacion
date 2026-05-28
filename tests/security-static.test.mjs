import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}

test("client search avoids raw PostgREST OR filter interpolation", () => {
  const clientsPage = readProjectFile("app/(private)/clients/page.tsx");

  assert.equal(clientsPage.includes(".or("), false);
  assert.match(clientsPage, /\.ilike\("name", pattern\)/);
  assert.match(clientsPage, /\.ilike\("tax_id", pattern\)/);
  assert.match(clientsPage, /\.ilike\("city", pattern\)/);
});

test("server actions verify owned-row mutations before continuing", () => {
  const clientActions = readProjectFile("app/actions/clients.ts");
  const invoiceActions = readProjectFile("app/actions/invoices.ts");
  const mutationChecks = [...clientActions.matchAll(/\.select\("id"\)\s*\.maybeSingle\(\)/g)].length
    + [...invoiceActions.matchAll(/\.select\("id"\)\s*\.maybeSingle\(\)/g)].length;

  assert.ok(mutationChecks >= 5);
  assert.match(invoiceActions, /safeDocumentRedirectPath/);
  assert.match(invoiceActions, /Documento no encontrado/);
  assert.match(clientActions, /Cliente no encontrado/);
});

test("RLS policies tie invoice relationships to the authenticated owner", () => {
  const schema = readProjectFile("supabase/schema.sql");

  assert.match(schema, /where communities\.id = invoices\.community_id\s+and communities\.owner_id = auth\.uid\(\)/);
  assert.match(schema, /where invoices\.id = invoice_items\.invoice_id\s+and invoices\.owner_id = auth\.uid\(\)/);
});

test("dependency policy pins patched Next and overrides vulnerable PostCSS", () => {
  const packageJson = JSON.parse(readProjectFile("package.json"));

  assert.equal(packageJson.dependencies.next, "16.2.6");
  assert.equal(packageJson.devDependencies["eslint-config-next"], "16.2.6");
  assert.equal(packageJson.overrides.postcss, "8.5.13");
});
