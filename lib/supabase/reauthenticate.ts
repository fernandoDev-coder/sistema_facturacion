import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";

// Check a password without downgrading the browser's existing aal2 session.
export async function reauthenticatePassword(user: User, password: string) {
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const result = await client.auth.signInWithPassword({ email: user.email ?? "", password });
  const valid = !result.error && result.data.user?.id === user.id;
  if (result.data.session) await client.auth.signOut({ scope: "local" });
  return valid;
}
