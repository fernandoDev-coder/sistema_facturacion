import type { User } from "@supabase/supabase-js";
import type { Database, Profile } from "@/lib/types";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

const systemAdminEmail = "fernandolaramillan@gmail.com";
const complimentaryPremiumEmail = "jandry38@hotmail.es";

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();

  if (profile && shouldSyncProfileAccess(user, profile)) {
    await syncCurrentUserAccess(user, supabase);
    const { data: syncedProfile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    return syncedProfile;
  }

  return profile;
}

export async function syncCurrentUserAccess(user: User, supabase?: SupabaseClient) {
  const client = supabase ?? (await createClient());
  const normalizedEmail = user.email?.trim().toLowerCase();
  const specialAccess = getSpecialAccessUpdate(normalizedEmail);

  await client.from("profiles").update({ email: user.email ?? null }).eq("id", user.id);

  try {
    const adminUpdate: ProfileUpdate = specialAccess
      ? { email: user.email ?? null, ...specialAccess }
      : { email: user.email ?? null, role: "user", is_super_admin: false };

    await createAdminClient().from("profiles").update(adminUpdate).eq("id", user.id);
  } catch {
    // Role and plan changes need SUPABASE_SERVICE_ROLE_KEY after billing hardening.
  }
}

export function getConfiguredSuperAdminEmails() {
  return [systemAdminEmail];
}

function getSpecialAccessUpdate(email?: string): ProfileUpdate | null {
  if (email === systemAdminEmail) {
    return {
      role: "super_admin",
      plan: "enterprise",
      is_super_admin: true,
      has_lifetime_access: true,
    };
  }

  if (email === complimentaryPremiumEmail) {
    return {
      role: "user",
      plan: "premium",
      is_super_admin: false,
      has_lifetime_access: true,
    };
  }

  return null;
}

function shouldSyncProfileAccess(user: User, profile: Profile) {
  const email = user.email ?? null;
  const normalizedEmail = email?.trim().toLowerCase();

  if (profile.email !== email) {
    return true;
  }

  if (normalizedEmail === systemAdminEmail) {
    return (
      profile.role !== "super_admin" ||
      profile.plan !== "enterprise" ||
      !profile.is_super_admin ||
      !profile.has_lifetime_access
    );
  }

  if (normalizedEmail === complimentaryPremiumEmail) {
    return (
      profile.role !== "user" ||
      profile.plan !== "premium" ||
      profile.is_super_admin ||
      !profile.has_lifetime_access
    );
  }

  return profile.role === "admin" || profile.role === "super_admin" || profile.is_super_admin;
}
