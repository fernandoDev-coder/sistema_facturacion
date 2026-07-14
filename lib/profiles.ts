import type { User } from "@supabase/supabase-js";
import type { Database, Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProfilePublicUpdate = Pick<Database["public"]["Tables"]["profiles"]["Update"], "email">;

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (profile && shouldSyncProfileEmail(user, profile)) {
    await syncCurrentUserAccess(user, supabase);
    const { data: syncedProfile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return syncedProfile;
  }

  return profile;
}

export async function syncCurrentUserAccess(user: User, supabase?: SupabaseClient) {
  const client = supabase ?? (await createClient());
  const publicUpdate: ProfilePublicUpdate = { email: user.email?.trim().toLowerCase() ?? null };

  await client.from("profiles").update(publicUpdate).eq("id", user.id);
}

export function getConfiguredSuperAdminEmails() {
  return [];
}

function shouldSyncProfileEmail(user: User, profile: Profile) {
  return profile.email !== (user.email?.trim().toLowerCase() ?? null);
}
