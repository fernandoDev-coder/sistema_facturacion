import type { Profile } from "@/lib/types";
import type { createClient } from "@/lib/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type PlanLimits = {
  clients: number | null;
  documentsPerMonth: number | null;
  monthlyBulkInvoices: boolean;
  companyLogo: boolean;
  csvExport: boolean;
};

export type LimitPlan = "starter" | "pro" | "premium" | "enterprise";
type PlanSource = LimitPlan | Pick<Profile, "plan" | "has_lifetime_access" | "is_super_admin"> | null | undefined;

export const planLimits: Record<LimitPlan, PlanLimits> = {
  starter: {
    clients: 5,
    documentsPerMonth: 20,
    monthlyBulkInvoices: false,
    companyLogo: false,
    csvExport: false,
  },
  pro: {
    clients: 30,
    documentsPerMonth: 100,
    monthlyBulkInvoices: false,
    companyLogo: true,
    csvExport: true,
  },
  premium: {
    clients: null,
    documentsPerMonth: null,
    monthlyBulkInvoices: true,
    companyLogo: true,
    csvExport: true,
  },
  enterprise: {
    clients: null,
    documentsPerMonth: null,
    monthlyBulkInvoices: true,
    companyLogo: true,
    csvExport: true,
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

export function getPlanLimits(plan?: PlanSource) {
  return planLimits[resolvePlan(plan)];
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

export function isPremium(plan?: PlanSource) {
  const effectivePlan = resolvePlan(plan);
  return effectivePlan === "premium" || effectivePlan === "enterprise";
}

export function canExportInvoices(plan?: PlanSource) {
  return getPlanLimits(plan).csvExport;
}

export function canCreateClient(plan: PlanSource, currentClients: number) {
  const limits = getPlanLimits(plan);
  return limits.clients === null || currentClients < limits.clients;
}

export function canCreateDocument(plan: PlanSource, documentsThisMonth: number, quantity = 1) {
  const limits = getPlanLimits(plan);
  return limits.documentsPerMonth === null || documentsThisMonth + quantity <= limits.documentsPerMonth;
}

export function getPlanDisplayName(plan?: PlanSource) {
  const effectivePlan = resolvePlan(plan);

  if (effectivePlan === "starter") {
    return "Gratis";
  }

  if (effectivePlan === "enterprise") {
    return "Premium";
  }

  return effectivePlan === "pro" ? "Pro" : "Premium";
}

export function getRemainingClientMessage(plan: PlanSource, currentClients: number) {
  const effectivePlan = resolvePlan(plan);
  const limits = getPlanLimits(effectivePlan);

  if (limits.clients === null) {
    return null;
  }

  const remaining = limits.clients - currentClients;
  const planName = getPlanDisplayName(effectivePlan);

  if (remaining <= 0) {
    return `Has alcanzado el limite de clientes de tu plan ${planName}. Actualiza a Premium para trabajar sin limites y generar facturas mensuales en lote.`;
  }

  return `Te quedan ${remaining} clientes disponibles en tu plan ${planName}.`;
}

export function getRemainingDocumentMessage(plan: PlanSource, documentsThisMonth: number) {
  const effectivePlan = resolvePlan(plan);
  const limits = getPlanLimits(effectivePlan);

  if (limits.documentsPerMonth === null) {
    return null;
  }

  const remaining = limits.documentsPerMonth - documentsThisMonth;
  const planName = getPlanDisplayName(effectivePlan);

  if (remaining <= 0) {
    return `Has alcanzado el limite mensual de documentos de tu plan ${planName}. Actualiza tu plan para seguir creando documentos.`;
  }

  return `Te quedan ${remaining} documentos disponibles este mes en tu plan ${planName}.`;
}

export function isNearLimit(used: number, limit: number | null) {
  if (limit === null) {
    return false;
  }

  const remaining = limit - used;
  return remaining > 0 && remaining <= Math.max(2, Math.ceil(limit * 0.1));
}

function resolvePlan(plan?: PlanSource): LimitPlan {
  if (typeof plan === "string") {
    return plan;
  }

  return getEffectivePlan(plan);
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
  const currentCount = await getClientCount(supabase, ownerId);

  if (!canCreateClient(profile, currentCount)) {
    return getRemainingClientMessage(profile, currentCount);
  }

  return null;
}

export async function assertCanCreateDocuments(supabase: SupabaseClient, ownerId: string, quantity = 1) {
  const profile = await getProfileForLimits(supabase, ownerId);
  const currentCount = await getCurrentMonthDocumentCount(supabase, ownerId);

  if (!canCreateDocument(profile, currentCount, quantity)) {
    return getRemainingDocumentMessage(profile, currentCount);
  }

  return null;
}

export async function assertCanUseMonthlyBulkInvoices(supabase: SupabaseClient, ownerId: string) {
  const profile = await getProfileForLimits(supabase, ownerId);

  if (!isPremium(profile)) {
    return "La facturacion mensual masiva esta incluida en el plan Premium.";
  }

  return null;
}
