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

test("registration keeps the email after password validation errors", () => {
  const authActions = readProjectFile("app/actions/auth.ts");
  const registerPage = readProjectFile("app/(auth)/register/page.tsx");

  assert.match(authActions, /function registerRedirect\(message: string, email: string\)/);
  assert.match(authActions, /registerRedirect\(passwordError, email\)/);
  assert.match(authActions, /registerRedirect\("Las contraseñas no coinciden\.", email\)/);
  assert.match(registerPage, /searchParams: Promise<\{ message\?: string; email\?: string \}>/);
  assert.match(registerPage, /defaultValue=\{email\}/);
});

test("special account access is pinned to the requested emails", () => {
  const profiles = readProjectFile("lib/profiles.ts");

  assert.match(profiles, /const systemAdminEmail = "fernandolaramillan@gmail\.com"/);
  assert.match(profiles, /const complimentaryPremiumEmail = "jandry38@hotmail\.es"/);
  assert.match(profiles, /return \[systemAdminEmail\]/);
  assert.doesNotMatch(profiles, /SUPER_ADMIN_EMAILS/);
  assert.match(profiles, /plan: "premium"/);
  assert.match(profiles, /has_lifetime_access: true/);
});

test("company logo URLs are normalized and protocol-validated before storing", () => {
  const validators = readProjectFile("lib/validators.ts");
  const companyAction = readProjectFile("app/actions/company.ts");

  assert.match(validators, /export function cleanLogoUrl/);
  assert.match(validators, /\["http:", "https:"\]\.includes\(parsed\.protocol\)/);
  assert.match(validators, /"mediaurl", "imgurl", "cdnurl"/);
  assert.match(companyAction, /cleanLogoUrl\(nullableText\(formData\.get\("logo_url"\)\)\)/);
  assert.match(companyAction, /if \(limits\.companyLogo\) {\s+fields\.push\(\["logo_url", logoUrl\]\)/);
  assert.match(companyAction, /logo_url: limits\.companyLogo \? uploadedLogoUrl \?\? logoUrl\.value : existingCompany\?\.logo_url \?\? null/);
});

test("company logo uploads are size-limited and stored in a user-scoped bucket", () => {
  const companyAction = readProjectFile("app/actions/company.ts");
  const settingsPage = readProjectFile("app/(private)/settings/company/page.tsx");
  const schema = readProjectFile("supabase/schema.sql");
  const nextConfig = readProjectFile("next.config.ts");

  assert.match(companyAction, /const LOGO_BUCKET = "company-logos"/);
  assert.match(companyAction, /const MAX_LOGO_BYTES = 2 \* 1024 \* 1024/);
  assert.match(companyAction, /"image\/png": "png"/);
  assert.match(companyAction, /"image\/jpeg": "jpg"/);
  assert.match(companyAction, /"image\/webp": "webp"/);
  assert.match(companyAction, /storage\.upload\(objectPath, Buffer\.from\(await value\.arrayBuffer\(\)\)/);
  assert.match(settingsPage, /encType="multipart\/form-data"/);
  assert.match(settingsPage, /name="logo_file"/);
  assert.match(schema, /insert into storage\.buckets \(id, name, public, file_size_limit, allowed_mime_types\)/);
  assert.match(schema, /\(storage\.foldername\(name\)\)\[1\] = auth\.uid\(\)::text/);
  assert.match(nextConfig, /bodySizeLimit: "3mb"/);
});
