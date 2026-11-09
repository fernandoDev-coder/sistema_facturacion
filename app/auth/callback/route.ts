import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeAuthRedirect } from "@/lib/supabase/auth-redirect";
import { checkRateLimit, requestActor, rateLimitResponse } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const limit = await checkRateLimit("callback", await requestActor());
  if (!limit.allowed) return rateLimitResponse(limit);
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeAuthRedirect(requestUrl.searchParams.get("next"), requestUrl.origin)
    ?? new URL("/dashboard", requestUrl.origin);

  if (code) {
    const supabase = await createClient();
    const flowId = requestUrl.searchParams.get("sb_flow_id");
    const { error } = await supabase.auth.exchangeCodeForSession(code, flowId === null ? undefined : { flowId });

    if (!error) {
      return NextResponse.redirect(next, { headers: { "Cache-Control": "private, no-store" } });
    }
  }

  const fallbackUrl = new URL("/forgot-password", requestUrl.origin);
  fallbackUrl.searchParams.set("message", "No se pudo validar el enlace. Solicita uno nuevo.");
  return NextResponse.redirect(fallbackUrl, { headers: { "Cache-Control": "private, no-store" } });
}
