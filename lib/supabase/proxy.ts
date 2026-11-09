import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sessionCookies } from "@/lib/supabase/session-cookies";
import { canUseAuthEnvironment } from "@/lib/supabase/environment";

export async function updateSession(request: NextRequest, requestHeaders: Headers) {
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey || !canUseAuthEnvironment()) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: sessionCookies({
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set("cookie", request.cookies.toString());
        const previousCookies = response.cookies.getAll();
        const previousHeaders = response.headers;
        response = NextResponse.next({ request: { headers: requestHeaders } });
        // SSR can write more than once; retain all writes and cache protections.
        for (const name of ["Cache-Control", "Expires", "Pragma"]) {
          const value = previousHeaders.get(name);
          if (value) response.headers.set(name, value);
        }
        previousCookies.forEach((cookie) => response.cookies.set(cookie));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(cacheHeaders).forEach(([name, value]) => response.headers.set(name, value));
      },
    }),
  });

  // Upgrade pre-release, JavaScript-readable cookies on the first request.
  // Reissue the same chunks; do not decode or expose their values to the client.
  if (!request.cookies.has("faktudash-cookie-v2")) {
    const legacy = request.cookies.getAll().filter(({ name }) => /^sb-.+-auth-token(?:\.[0-9]+|-code-verifier.*)?$/.test(name));
    if (legacy.length) {
      sessionCookies({
        getAll: () => request.cookies.getAll(),
        setAll(writes) { writes.forEach(({ name, value, options }) => response.cookies.set(name, value, options)); },
      }).setAll(legacy.map((cookie) => ({ ...cookie, options: { path: "/", maxAge: 2592000 } })));
      response.cookies.set("faktudash-cookie-v2", "1", { httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/", maxAge: 2592000 });
      response.headers.set("Cache-Control", "private, no-store");
    }
  }

  // Refresh before Server Components run, while response cookies remain writable.
  await supabase.auth.getUser();
  return response;
}
