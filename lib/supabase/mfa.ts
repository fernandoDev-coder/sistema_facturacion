import "server-only";

import type { createClient } from "@/lib/supabase/server";

export async function hasMfaAccess(supabase: Awaited<ReturnType<typeof createClient>>) {
  // The RPC evaluates the verified JWT and the current factors in the database.
  // Fail closed if the migration is missing or the service is unavailable.
  const { data, error } = await supabase.rpc("mfa_access_allowed");
  return !error && data === true;
}
