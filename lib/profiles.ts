import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

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

  const update: Partial<Profile> = shouldBeSuperAdmin
    ? {
        email: user.email ?? null,
        role: "super_admin",
        plan: "enterprise",
        is_super_admin: true,
        has_lifetime_access: true,
      }
    : {
        email: user.email ?? null,
      };

  await client.from("profiles").update(update).eq("id", user.id);
}

export function getConfiguredSuperAdminEmails() {
  return String(process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}
