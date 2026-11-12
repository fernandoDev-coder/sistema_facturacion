import assert from "node:assert/strict";
import test from "node:test";
import { canUseAuthEnvironment } from "../lib/supabase/environment.ts";
import { getPublicShareUrl } from "../lib/site-url.ts";

test("previews reject production Auth and require an explicit isolated project", () => {
  const env = { VERCEL_ENV: "preview", APP_ENV: "test", SUPABASE_PRODUCTION_PROJECT_REF: "production", SUPABASE_TEST_PROJECT_REF: "testing", NEXT_PUBLIC_SUPABASE_URL: "https://production.supabase.co" };
  assert.equal(canUseAuthEnvironment(env), false);
  assert.equal(canUseAuthEnvironment({ ...env, NEXT_PUBLIC_SUPABASE_URL: "https://testing.supabase.co" }), true);
  assert.equal(canUseAuthEnvironment({ ...env, SUPABASE_TEST_PROJECT_REF: "production" }), false);
  assert.equal(canUseAuthEnvironment({ VERCEL_ENV: "preview" }), false);
  assert.equal(canUseAuthEnvironment({ VERCEL_ENV: "production" }), true);
  assert.equal(canUseAuthEnvironment({}), true);
});

test("share links never expose private paths, queries, callback codes or foreign origins", () => {
  for (const path of ["/auth/callback?code=synthetic", "/invoices/private-id", "https://external.invalid/", "/contact?token=synthetic"]) {
    assert.equal(getPublicShareUrl(path), "https://www.faktudash.com/");
  }
  assert.equal(getPublicShareUrl("/demo"), "https://www.faktudash.com/demo");
});
