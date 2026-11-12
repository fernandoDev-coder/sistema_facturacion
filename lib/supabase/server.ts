import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { sessionCookies } from "@/lib/supabase/session-cookies";
import { hasMfaAccess } from "@/lib/supabase/mfa";
import { enforceActionLimit } from "@/lib/rate-limit";
import { canUseAuthEnvironment } from "@/lib/supabase/environment";

type CreateClientOptions = {
  persistSession?: boolean;
};

export async function createClient(options: CreateClientOptions = {}) {
  if (!canUseAuthEnvironment()) throw new Error("Authenticated previews require an isolated Supabase test project.");
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: sessionCookies({
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot always write cookies. Server Actions can.
        }
      },
    }, options.persistSession),
  });
}

let adminClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function createAdminClient() {
  if (!canUseAuthEnvironment()) throw new Error("Authenticated previews require an isolated Supabase test project.");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  }

  if (!adminClient) {
    adminClient = createSupabaseClient<Database>(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(): Promise<User> {
  if (!canUseAuthEnvironment()) redirect("/login");
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  if (!await hasMfaAccess(await createClient())) redirect("/auth/mfa");
  await enforceActionLimit("read", user.id, "/login");

  return user;
}
