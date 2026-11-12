/** Public previews work without Auth; authenticated previews require an isolated project. */
export function canUseAuthEnvironment(env: Record<string, string | undefined> = process.env) {
  if (env.VERCEL_ENV !== "preview") return true;
  const testRef = env.SUPABASE_TEST_PROJECT_REF;
  const productionRef = env.SUPABASE_PRODUCTION_PROJECT_REF;
  if (env.APP_ENV !== "test" || !testRef || !productionRef || testRef === productionRef) return false;
  try {
    const url = new URL(env.NEXT_PUBLIC_SUPABASE_URL ?? "");
    return url.protocol === "https:" && url.hostname === `${testRef}.supabase.co`;
  } catch { return false; }
}
