"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { calculateTotals, documentNumber, nullableText, requiredText, toDecimal } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { Community, DocumentType, InvoiceStatus } from "@/lib/types";

const allowedStatuses: InvoiceStatus[] = ["draft", "pending", "paid", "cancelled"];
const allowedDocumentTypes: DocumentType[] = ["invoice", "budget"];

function parseInvoicePayload(formData: FormData) {
  const documentType = requiredText(formData.get("document_type")) as DocumentType;
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
    throw new Error("Faltan campos obligatorios del documento.");
  }

  if (!allowedDocumentTypes.includes(documentType)) {
    throw new Error("Tipo de documento no valido.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Estado no valido.");
  }

  return {
    document_type: documentType,
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
  return createDocumentAction(formData, "invoice");
}

export async function createBudgetAction(formData: FormData) {
  return createDocumentAction(formData, "budget");
}

export async function updateInvoiceAction(formData: FormData) {
  return updateDocumentAction(formData, "invoice");
}

export async function updateBudgetAction(formData: FormData) {
  return updateDocumentAction(formData, "budget");
}

export async function deleteInvoiceAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const redirectPath = requiredText(formData.get("redirect_path")) || "/invoices";
  const supabase = await createClient();

  const { error } = await supabase.from("invoices").delete().eq("id", id).eq("owner_id", user.id);

  if (error) {
    redirect(`${redirectPath}?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/invoices");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  redirect(redirectPath);
}

export async function markInvoicePaidAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase
    .from("invoices")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("document_type", "invoice");

  if (error) {
    redirect(`/invoices?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
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
    redirect("/invoices/create-month?message=Selecciona mes, anio y al menos una comunidad.");
  }

  const { data: duplicates, error: duplicateError } = await supabase
    .from("invoices")
    .select("community_id")
    .eq("owner_id", user.id)
    .eq("document_type", "invoice")
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
    .eq("document_type", "invoice");

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
      document_type: "invoice" as const,
      ...snapshotFromCommunity(community),
      invoice_number: documentNumber("invoice", year, (count ?? 0) + index + 1),
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
  revalidatePath("/dashboard");
  redirect("/invoices");
}

async function createDocumentAction(formData: FormData, documentType: DocumentType) {
  const user = await requireUser();
  const supabase = await createClient();
  const payload = parseInvoicePayload(formData);
  const snapshot = await getCommunitySnapshot(supabase, user.id, payload.community_id);

  if (payload.document_type !== documentType) {
    throw new Error("Tipo de documento incoherente.");
  }

  const { error } = await supabase.from("invoices").insert({
    owner_id: user.id,
    ...snapshot,
    ...payload,
  });

  if (error) {
    redirect(`${basePath(documentType)}/new?message=${encodeURIComponent(error.message)}`);
  }

  revalidateDocumentPaths(documentType);
  redirect(basePath(documentType));
}

async function updateDocumentAction(formData: FormData, documentType: DocumentType) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();
  const payload = parseInvoicePayload(formData);
  const snapshot = await getCommunitySnapshot(supabase, user.id, payload.community_id);

  if (payload.document_type !== documentType) {
    throw new Error("Tipo de documento incoherente.");
  }

  const { error } = await supabase
    .from("invoices")
    .update({ ...snapshot, ...payload })
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("document_type", documentType);

  if (error) {
    redirect(`${basePath(documentType)}/${id}/edit?message=${encodeURIComponent(error.message)}`);
  }

  revalidateDocumentPaths(documentType);
  redirect(basePath(documentType));
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

function basePath(documentType: DocumentType) {
  return documentType === "budget" ? "/budgets" : "/invoices";
}

function revalidateDocumentPaths(documentType: DocumentType) {
  revalidatePath(basePath(documentType));
  revalidatePath("/dashboard");
}
