import type { CookieOptions } from "@supabase/ssr";

export const SESSION_PREFERENCE_COOKIE = "faktudash-remember-session";

type CookieWrite = { name: string; value: string; options: CookieOptions };
type CookieStore = {
  getAll: () => { name: string; value: string }[];
  setAll: (cookies: CookieWrite[], headers: Record<string, string>) => void;
};

// Keep the preference across requests, including refresh and PKCE callbacks.
// Missing preferences default to session-only cookies instead of extending a session.
export function sessionCookies(store: CookieStore, remember?: boolean) {
  return {
    getAll: () => store.getAll(),
    setAll(cookies: CookieWrite[], headers: Record<string, string> = {}) {
      const persist = remember ?? store.getAll().some(
        ({ name, value }) => name === SESSION_PREFERENCE_COOKIE && value === "1",
      );
      const writes = cookies.map(({ name, value, options }) => {
        const nextOptions = { ...options, httpOnly: true, sameSite: "lax" as const, path: "/",
          secure: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true };
        // Deletions must keep their expiry, even for a session-only login.
        if (!value) {
          nextOptions.maxAge = 0;
        } else if (!persist
          && !(nextOptions.maxAge !== undefined && nextOptions.maxAge <= 0)
          && !(nextOptions.expires && nextOptions.expires.getTime() <= Date.now())) {
          delete nextOptions.maxAge;
          delete nextOptions.expires;
        } else if (value) {
          nextOptions.maxAge = Math.min(nextOptions.maxAge ?? 2592000, 2592000);
        }
        return { name, value, options: nextOptions };
      });
      if (remember !== undefined && writes.length) {
        writes.push({
          name: SESSION_PREFERENCE_COOKIE,
          value: remember ? "1" : "0",
          options: {
            path: "/",
            sameSite: "lax",
            httpOnly: true,
            secure: process.env.NODE_ENV === "production" || process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") === true,
            ...(remember ? { maxAge: 60 * 60 * 24 * 365 } : {}),
          },
        });
      }
      store.setAll(writes, headers);
    },
  };
}
