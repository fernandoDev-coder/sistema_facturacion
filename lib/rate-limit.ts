import "server-only";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n";

export const ratePolicies = {
  read: { limit: 300, seconds: 60 },
  mutation: { limit: 60, seconds: 60 },
  login: { limit: 10, seconds: 600 },
  register: { limit: 5, seconds: 3600 },
  email: { limit: 5, seconds: 900 },
  mfa: { limit: 5, seconds: 300 },
  export: { limit: 10, seconds: 60 },
  monthly: { limit: 5, seconds: 60 },
  admin: { limit: 30, seconds: 60 },
  callback: { limit: 30, seconds: 60 },
  locale: { limit: 60, seconds: 60 },
  webhook: { limit: 120, seconds: 60 },
} as const;

type Policy = keyof typeof ratePolicies;
type LimitResult = { allowed: boolean; retryAfter: number; unavailable?: boolean };

/** Only Vercel's overwritten ingress header is trusted. Other hosts share an anonymous bucket. */
export async function requestActor() {
  const headerList = await headers();
  const ip = process.env.VERCEL === "1" ? headerList.get("x-vercel-forwarded-for")?.split(",")[0].trim() : null;
  return `ip:${ip || "unidentified"}`;
}

export async function checkRateLimit(policy: Policy, actor: string): Promise<LimitResult> {
  const { limit, seconds } = ratePolicies[policy];
  // Local UI development can run without a provisioned database. Never bypass in production.
  if (process.env.NODE_ENV !== "production" && process.env.RATE_LIMIT_LOCAL_BYPASS === "true") return { allowed: true, retryAfter: 0 };
  const key = createHash("sha256").update(`${policy}:${actor}`).digest("hex");
  try {
    const { data, error } = await createAdminClient().rpc("consume_rate_limit", { p_key: key, p_limit: limit, p_window_seconds: seconds });
    if (error || !data) return { allowed: policy === "locale", retryAfter: 60, unavailable: true };
    return { allowed: data.allowed, retryAfter: data.retry_after };
  } catch {
    return { allowed: policy === "locale", retryAfter: 60, unavailable: true };
  }
}

export async function enforceActionLimit(policy: Policy, actor?: string, destination = "/login") {
  const result = await checkRateLimit(policy, actor ?? await requestActor());
  if (result.allowed) return;
  const es = await getLocale() === "es";
  const message = es
    ? `No se pudo completar la solicitud. Vuelve a intentarlo en ${result.retryAfter} segundos.`
    : `The request could not be completed. Try again in ${result.retryAfter} seconds.`;
  redirect(`${destination}?${new URLSearchParams({ message })}`);
}

export function rateLimitResponse(result: LimitResult) {
  return Response.json({ error: result.unavailable ? "temporarily_unavailable" : "rate_limited", retryAfter: result.retryAfter }, {
    status: result.unavailable ? 503 : 429,
    headers: { "Retry-After": String(result.retryAfter), "Cache-Control": "private, no-store" },
  });
}
