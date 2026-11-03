"use client";

import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import type { Database } from "@/lib/types";
import { sessionCookies } from "@/lib/supabase/session-cookies";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  }

  return createBrowserClient<Database>(url, anonKey, {
    cookies: sessionCookies({
      getAll: () => typeof document === "undefined" ? [] : parseCookieHeader(document.cookie)
        .map(({ name, value }) => ({ name, value: value ?? "" })),
      setAll(cookiesToSet) {
        if (typeof document === "undefined") return;
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = serializeCookieHeader(name, value, options);
        });
      },
    }),
  });
}
