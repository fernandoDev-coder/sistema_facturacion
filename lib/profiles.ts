import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { createAdminClient, createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;
type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"];

export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return profile;
}

export async function syncCurrentUserAccess(user: User, supabase?: SupabaseClient) {
  const client = supabase ?? (await createClient());
  const normalizedEmail = user.email?.trim().toLowerCase();
  const superAdminEmails = getConfiguredSuperAdminEmails();
  const shouldBeSuperAdmin = normalizedEmail ? superAdminEmails.includes(normalizedEmail) : false;

  await client.from("profiles").update({ email: user.email ?? null }).eq("id", user.id);

  if (!shouldBeSuperAdmin) {
    return;
  }

  const update: ProfileUpdate = {
    email: user.email ?? null,
    role: "super_admin",
    plan: "enterprise",
    is_super_admin: true,
    has_lifetime_access: true,
  };

  try {
    await createAdminClient().from("profiles").update(update).eq("id", user.id);
  } catch {
    // Super admin promotion needs SUPABASE_SERVICE_ROLE_KEY after billing hardening.
  }
}

export function getConfiguredSuperAdminEmails() {
  return String(process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
