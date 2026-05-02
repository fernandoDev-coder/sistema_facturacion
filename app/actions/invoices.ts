"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateTotals, invoiceNumber, nullableText, requiredText, toDecimal } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { Community, InvoiceStatus } from "@/lib/types";

const allowedStatuses: InvoiceStatus[] = ["draft", "pending", "paid", "cancelled"];

function parseInvoicePayload(formData: FormData) {
  const communityId = requiredText(formData.get("community_id"));
  const invoiceNumber = requiredText(formData.get("invoice_number"));
  const invoiceDate = requiredText(formData.get("invoice_date"));
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const subject = requiredText(formData.get("subject"));
  const amount = toDecimal(formData.get("amount"));
  const vatRate = toDecimal(formData.get("vat_rate"), 21);
  const status = requiredText(formData.get("status")) as InvoiceStatus;
  const totals = calculateTotals(amount, vatRate);

  if (!communityId || !invoiceNumber || !invoiceDate || !subject || !month || !year) {
    throw new Error("Faltan campos obligatorios de la factura.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Estado de factura no válido.");
  }

  return {
    community_id: communityId,
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    month,
    year,
    subject,
    amount,
    vat_rate: vatRate,
    vat_amount: totals.vatAmount,
    total: totals.total,
    status,
    notes: nullableText(formData.get("notes")),
    updated_at: new Date().toISOString(),
  };
}

export async function createInvoiceAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const payload = parseInvoicePayload(formData);
  const snapshot = await getCommunitySnapshot(supabase, user.id, payload.community_id);

  const { error } = await supabase.from("invoices").insert({
    owner_id: user.id,
    ...snapshot,
    ...payload,
  });

  if (error) {
    redirect(`/invoices/new?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function updateInvoiceAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();
  const payload = parseInvoicePayload(formData);
  const snapshot = await getCommunitySnapshot(supabase, user.id, payload.community_id);

  const { error } = await supabase
    .from("invoices")
    .update({ ...snapshot, ...payload })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/invoices/${id}/edit?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function deleteInvoiceAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("invoices").delete().eq("id", id).eq("owner_id", user.id);

  if (error) {
    redirect(`/invoices?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function markInvoicePaidAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/invoices?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/invoices");
  redirect("/invoices");
}

export async function createMonthlyInvoicesAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const confirmDuplicates = formData.get("confirm_duplicates") === "yes";
  const selectedCommunityIds = formData.getAll("include").map(String);

  if (!month || !year || selectedCommunityIds.length === 0) {
    redirect("/invoices/create-month?message=Selecciona mes, año y al menos una comunidad.");
  }

  const { data: duplicates, error: duplicateError } = await supabase
    .from("invoices")
    .select("community_id")
    .eq("owner_id", user.id)
    .eq("month", month)
    .eq("year", year)
    .in("community_id", selectedCommunityIds);

  if (duplicateError) {
    redirect(`/invoices/create-month?message=${encodeURIComponent(duplicateError.message)}`);
  }

  if ((duplicates?.length ?? 0) > 0 && !confirmDuplicates) {
    redirect(
      `/invoices/create-month?month=${month}&year=${year}&message=${encodeURIComponent(
        "Ya existen facturas para alguna comunidad seleccionada. Confirma los duplicados para continuar.",
      )}`,
    );
  }

  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id)
    .eq("year", year)
    .eq("month", month);

  const { data: selectedCommunities, error: communitiesError } = await supabase
    .from("communities")
    .select("*")
    .eq("owner_id", user.id)
    .in("id", selectedCommunityIds);

  if (communitiesError) {
    redirect(`/invoices/create-month?message=${encodeURIComponent(communitiesError.message)}`);
  }

  const communitiesById = new Map((selectedCommunities ?? []).map((community) => [community.id, community]));

  const rows = selectedCommunityIds.map((communityId, index) => {
    const community = communitiesById.get(communityId);
    const amount = toDecimal(formData.get(`amount_${communityId}`));
    const vatRate = toDecimal(formData.get(`vat_${communityId}`), 21);
    const totals = calculateTotals(amount, vatRate);

    return {
      owner_id: user.id,
      community_id: communityId,
      ...snapshotFromCommunity(community),
      invoice_number: invoiceNumber(year, month, (count ?? 0) + index + 1),
      invoice_date: `${year}-${String(month).padStart(2, "0")}-01`,
      month,
      year,
      subject: requiredText(formData.get(`subject_${communityId}`)) || `Factura ${month}/${year}`,
      amount,
      vat_rate: vatRate,
      vat_amount: totals.vatAmount,
      total: totals.total,
      status: "draft" as const,
      notes: nullableText(formData.get(`notes_${communityId}`)),
    };
  });

  const { error } = await supabase.from("invoices").insert(rows);

  if (error) {
    redirect(`/invoices/create-month?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/invoices");
  redirect("/invoices");
}

async function getCommunitySnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  communityId: string,
) {
  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("id", communityId)
    .eq("owner_id", ownerId)
    .single();

  return snapshotFromCommunity(community);
}

function snapshotFromCommunity(community?: Community | null) {
  return {
    community_name: community?.name ?? null,
    community_tax_id: community?.tax_id ?? null,
    community_address: community?.address ?? null,
    community_postal_code: community?.postal_code ?? null,
    community_city: community?.city ?? null,
    community_province: community?.province ?? null,
    community_email: community?.email ?? null,
    community_phone: community?.phone ?? null,
  };
}
