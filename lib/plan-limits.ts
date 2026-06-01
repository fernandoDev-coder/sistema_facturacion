import type { Profile } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type PlanLimits = {
  clients: number | null;
  documentsPerMonth: number | null;
  monthlyBulkInvoices: boolean;
  companyLogo: boolean;
};

type LimitPlan = "starter" | "pro" | "premium" | "enterprise";

export const planLimits: Record<LimitPlan, PlanLimits> = {
  starter: {
    clients: 5,
    documentsPerMonth: 25,
    monthlyBulkInvoices: false,
    companyLogo: false,
  },
  pro: {
    clients: 15,
    documentsPerMonth: 50,
    monthlyBulkInvoices: false,
    companyLogo: true,
  },
  premium: {
    clients: null,
    documentsPerMonth: null,
    monthlyBulkInvoices: true,
    companyLogo: true,
  },
  enterprise: {
    clients: null,
    documentsPerMonth: null,
    monthlyBulkInvoices: true,
    companyLogo: true,
  },
};

export function hasPaidAccess(profile?: Pick<Profile, "plan" | "has_lifetime_access" | "is_super_admin"> | null) {
  return Boolean(
    profile?.is_super_admin ||
      profile?.has_lifetime_access ||
      profile?.plan === "pro" ||
      profile?.plan === "premium" ||
      profile?.plan === "enterprise",
  );
}

export function getPlanLimits(profile?: Pick<Profile, "plan" | "has_lifetime_access" | "is_super_admin"> | null) {
  return planLimits[getEffectivePlan(profile)];
}

export function getEffectivePlan(
  profile?: Pick<Profile, "plan" | "has_lifetime_access" | "is_super_admin"> | null,
): LimitPlan {
  if (profile?.is_super_admin || profile?.has_lifetime_access || profile?.plan === "enterprise") {
    return "enterprise";
  }

  if (profile?.plan === "premium") {
    return "premium";
  }

  if (profile?.plan === "pro") {
    return "pro";
  }

  return "starter";
}

export async function getProfileForLimits(supabase: SupabaseClient, ownerId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("plan,is_super_admin,has_lifetime_access")
    .eq("id", ownerId)
    .maybeSingle();

  return data;
}

export async function getCurrentMonthDocumentCount(supabase: SupabaseClient, ownerId: string) {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .gte("created_at", start.toISOString())
    .lt("created_at", end.toISOString());

  return count ?? 0;
}

export async function getClientCount(supabase: SupabaseClient, ownerId: string) {
  const { count } = await supabase
    .from("communities")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  return count ?? 0;
}

export async function assertCanCreateClient(supabase: SupabaseClient, ownerId: string) {
  const profile = await getProfileForLimits(supabase, ownerId);
  const limits = getPlanLimits(profile);
  const effectivePlan = getEffectivePlan(profile);

  if (limits.clients === null) {
    return null;
  }

  const currentCount = await getClientCount(supabase, ownerId);

  if (currentCount >= limits.clients) {
    return `Tu plan ${getPlanLabel(effectivePlan)} permite hasta ${limits.clients} clientes. Mejora a ${getUpgradePlanLabel(effectivePlan)} para crear mas.`;
  }

  return null;
}

export async function assertCanCreateDocuments(supabase: SupabaseClient, ownerId: string, quantity = 1) {
  const profile = await getProfileForLimits(supabase, ownerId);
  const limits = getPlanLimits(profile);
  const effectivePlan = getEffectivePlan(profile);

  if (limits.documentsPerMonth === null) {
    return null;
  }

  const currentCount = await getCurrentMonthDocumentCount(supabase, ownerId);

  if (currentCount + quantity > limits.documentsPerMonth) {
    return `Tu plan ${getPlanLabel(effectivePlan)} permite ${limits.documentsPerMonth} documentos al mes. Mejora a ${getUpgradePlanLabel(effectivePlan)} para crear mas.`;
  }

  return null;
}

export async function assertCanUseMonthlyBulkInvoices(supabase: SupabaseClient, ownerId: string) {
  const profile = await getProfileForLimits(supabase, ownerId);
  const limits = getPlanLimits(profile);

  if (!limits.monthlyBulkInvoices) {
    return "La facturacion mensual masiva esta incluida en el plan Premium.";
  }

  return null;
}

function getPlanLabel(plan: LimitPlan) {
  return plan === "pro" ? "Pro" : "gratis";
}

function getUpgradePlanLabel(plan: LimitPlan) {
  return plan === "pro" ? "Premium" : "Pro";
}
