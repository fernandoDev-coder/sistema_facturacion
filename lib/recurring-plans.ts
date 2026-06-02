import { calculateTotals, documentNumber } from "@/lib/format";
import { getProfileForLimits, isPremium } from "@/lib/plan-limits";
import { createAdminClient } from "@/lib/supabase/server";
import type { Community, RecurringPlan } from "@/lib/types";

type ActiveRecurringPlan = RecurringPlan & {
  communities: Community | null;
};

export async function generateMonthlyInvoices(userId: string, month: number, year: number) {
  if (!Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year)) {
    throw new Error("Mes o año no valido.");
  }

  const supabase = createAdminClient();
  const profile = await getProfileForLimits(supabase, userId);

  if (!isPremium(profile)) {
    throw new Error("La facturacion mensual en lote requiere el plan Premium.");
  }

  const { data: recurringPlans, error: plansError } = await supabase
    .from("recurring_plans")
    .select("*, communities(*)")
    .eq("owner_id", userId)
    .eq("is_active", true);

  if (plansError) {
    throw new Error(plansError.message);
  }

  const activePlans = ((recurringPlans ?? []) as ActiveRecurringPlan[]).filter((plan) => plan.communities);

  if (!activePlans.length) {
    return { created: 0, skipped: 0 };
  }

  const planIds = activePlans.map((plan) => plan.id);
  const { data: existingInvoices, error: existingError } = await supabase
    .from("invoices")
    .select("recurring_plan_id")
    .eq("owner_id", userId)
    .eq("document_type", "invoice")
    .eq("month", month)
    .eq("year", year)
    .in("recurring_plan_id", planIds);

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingPlanIds = new Set((existingInvoices ?? []).map((invoice) => invoice.recurring_plan_id).filter(Boolean));
  const plansToInvoice = activePlans.filter((plan) => !existingPlanIds.has(plan.id));

  if (!plansToInvoice.length) {
    return { created: 0, skipped: activePlans.length };
  }

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", userId)
    .eq("year", year)
    .eq("document_type", "invoice");

  const invoiceRows = plansToInvoice.map((plan, index) => {
    const totals = calculateTotals(Number(plan.base_amount), Number(plan.tax_rate));
    const community = plan.communities;

    return {
      owner_id: userId,
      community_id: plan.community_id,
      recurring_plan_id: plan.id,
      document_type: "invoice" as const,
      community_name: community?.name ?? null,
      community_tax_id: community?.tax_id ?? null,
      community_address: community?.address ?? null,
      community_postal_code: community?.postal_code ?? null,
      community_city: community?.city ?? null,
      community_province: community?.province ?? null,
      community_email: community?.email ?? null,
      community_phone: community?.phone ?? null,
      invoice_number: documentNumber("invoice", year, (count ?? 0) + index + 1),
      invoice_date: `${year}-${String(month).padStart(2, "0")}-${String(plan.billing_day).padStart(2, "0")}`,
      month,
      year,
      subject: plan.concept,
      amount: Number(plan.base_amount),
      vat_rate: Number(plan.tax_rate),
      vat_amount: totals.vatAmount,
      total: totals.total,
      status: "draft" as const,
      notes: null,
    };
  });

  const { data: createdInvoices, error: invoiceError } = await supabase
    .from("invoices")
    .insert(invoiceRows)
    .select("id, recurring_plan_id");

  if (invoiceError || !createdInvoices) {
    throw new Error(invoiceError?.message ?? "No se pudieron crear las facturas recurrentes.");
  }

  const plansById = new Map(plansToInvoice.map((plan) => [plan.id, plan]));
  const itemRows = createdInvoices.flatMap((invoice) => {
    const plan = invoice.recurring_plan_id ? plansById.get(invoice.recurring_plan_id) : null;

    if (!plan) {
      return [];
    }

    const totals = calculateTotals(Number(plan.base_amount), Number(plan.tax_rate));

    return [
      {
        owner_id: userId,
        invoice_id: invoice.id,
        description: plan.concept,
        amount: Number(plan.base_amount),
        vat_rate: Number(plan.tax_rate),
        vat_amount: totals.vatAmount,
        total: totals.total,
        sort_order: 0,
      },
    ];
  });

  if (itemRows.length) {
    const { error: itemError } = await supabase.from("invoice_items").insert(itemRows);
    if (itemError) {
      throw new Error(itemError.message);
    }
  }

  return { created: createdInvoices.length, skipped: activePlans.length - createdInvoices.length };
}
