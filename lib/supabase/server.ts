import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

type CreateClientOptions = {
  persistSession?: boolean;
};

export async function createClient(options: CreateClientOptions = {}) {
  const cookieStore = await cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const persistSession = options.persistSession ?? true;

  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            if (persistSession) {
              cookieStore.set(name, value, options);
              return;
            }

            cookieStore.set(name, value, withoutPersistentExpiry(options));
          });
        } catch {
          // Server Components cannot always write cookies. Server Actions can.
        }
      },
    },
  });
}

function withoutPersistentExpiry(options: CookieOptions) {
  const sessionCookieOptions = { ...options };
  delete sessionCookieOptions.maxAge;
  delete sessionCookieOptions.expires;
  return sessionCookieOptions;
}

export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function requireUser(): Promise<User> {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}
