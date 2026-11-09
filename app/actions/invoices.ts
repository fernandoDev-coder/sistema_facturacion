"use server";

import { getLocale } from "@/lib/i18n";
import { enforceActionLimit } from "@/lib/rate-limit";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { calculateTotals, nullableText, requiredText, toDecimal } from "@/lib/format";
import { assertCanCreateDocuments } from "@/lib/plan-limits";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { Community, DocumentType, InvoiceStatus } from "@/lib/types";

const allowedStatuses: InvoiceStatus[] = ["draft", "issued", "cancelled", "corrective"];
const allowedDocumentTypes: DocumentType[] = ["invoice", "budget"];

type ParsedLineItem = {
  description: string;
  amount: number;
  vat_rate: number;
  vat_amount: number;
  total: number;
  sort_order: number;
};

function parseInvoicePayload(formData: FormData) {
  const documentType = requiredText(formData.get("document_type")) as DocumentType;
  const communityId = requiredText(formData.get("community_id"));
  const invoiceNumber = requiredText(formData.get("invoice_number"));
  const invoiceDate = requiredText(formData.get("invoice_date"));
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const status = parseDocumentStatus(formData.get("status"), documentType);
  const items = parseLineItems(formData);

  if (!communityId || !invoiceNumber || !invoiceDate || !month || !year) {
    throw new Error("Faltan campos obligatorios del documento.");
  }

  if (!allowedDocumentTypes.includes(documentType)) {
    throw new Error("Tipo de documento no valido.");
  }

  if (!allowedStatuses.includes(status)) {
    throw new Error("Estado no valido.");
  }

  if (!items.length) {
    throw new Error("Anade al menos un concepto.");
  }

  const amount = items.reduce((sum, item) => sum + item.amount, 0);
  const vatAmount = items.reduce((sum, item) => sum + item.vat_amount, 0);
  const total = items.reduce((sum, item) => sum + item.total, 0);
  const uniqueVatRates = Array.from(new Set(items.map((item) => item.vat_rate)));

  return {
    document_type: documentType,
    community_id: communityId,
    invoice_number: invoiceNumber,
    invoice_date: invoiceDate,
    month,
    year,
    subject: items.map((item) => item.description).join(" | "),
    amount,
    vat_rate: uniqueVatRates.length === 1 ? uniqueVatRates[0] : 0,
    vat_amount: vatAmount,
    total,
    status,
    notes: nullableText(formData.get("notes")),
    updated_at: new Date().toISOString(),
    items,
  };
}

function parseLineItems(formData: FormData): ParsedLineItem[] {
  const raw = requiredText(formData.get("items_json"));

  if (raw) {
    const parsed = JSON.parse(raw) as Array<{ description?: string; amount?: string; vat_rate?: string }>;

    return parsed
      .map((item, index) => buildLineItem(item.description ?? "", item.amount ?? "0", item.vat_rate ?? "21", index))
      .filter((item): item is ParsedLineItem => item !== null);
  }

  const subject = requiredText(formData.get("subject"));
  const amount = toDecimal(formData.get("amount"));
  const vatRate = toDecimal(formData.get("vat_rate"), 21);
  const fallback = buildLineItem(subject, String(amount), String(vatRate), 0);

  return fallback ? [fallback] : [];
}

function buildLineItem(description: string, amountValue: string, vatRateValue: string, index: number) {
  const cleanDescription = description.trim();
  const amount = toDecimal(amountValue);
  const vatRate = toDecimal(vatRateValue, 21);

  if (!cleanDescription) return null;

  const totals = calculateTotals(amount, vatRate);

  return {
    description: cleanDescription,
    amount,
    vat_rate: vatRate,
    vat_amount: totals.vatAmount,
    total: totals.total,
    sort_order: index,
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
  await enforceActionLimit("mutation", user.id, "/dashboard");
  const id = requiredText(formData.get("id"));
  const redirectPath = safeDocumentRedirectPath(formData.get("redirect_path"));
  const supabase = await createClient();

  const { data: existingInvoice, error: existingError } = await supabase
    .from("invoices")
    .select("id, document_type, status")
    .eq("id", id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (existingError || !existingInvoice) {
    redirect(`${redirectPath}?message=${encodeURIComponent(existingError?.message ?? "Documento no encontrado.")}`);
  }

  if (existingInvoice.document_type === "invoice" && existingInvoice.status !== "draft") {
    redirect(
      `${redirectPath}?message=${encodeURIComponent(
        "Las facturas emitidas no se eliminan. Si una factura emitida contiene un error, debe anularse o rectificarse para mantener la trazabilidad.",
      )}`,
    );
  }

  const { data: deletedInvoice, error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !deletedInvoice) {
    redirect(`${redirectPath}?message=${encodeURIComponent(error?.message ?? "Documento no encontrado.")}`);
  }

  revalidatePath("/invoices");
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  redirect(redirectPath);
}

export async function issueInvoiceAction(formData: FormData) {
  const user = await requireUser();
  await enforceActionLimit("mutation", user.id, "/dashboard");
  const id = requiredText(formData.get("id"));

  try {
    await issueInvoice(id, user.id);
  } catch (error) {
    redirect(`/invoices?message=${encodeURIComponent((error as Error).message)}`);
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices?message=${encodeURIComponent("Factura emitida con registro fiscal interno.")}`);
}

export async function cancelInvoiceAction(formData: FormData) {
  const user = await requireUser();
  await enforceActionLimit("mutation", user.id, "/dashboard");
  const id = requiredText(formData.get("id"));
  const reason = requiredText(formData.get("reason"));

  try {
    await cancelInvoice(id, user.id, reason);
  } catch (error) {
    redirect(`/invoices?message=${encodeURIComponent((error as Error).message)}`);
  }

  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices?message=${encodeURIComponent("Factura anulada con registro fiscal interno.")}`);
}

export async function issueInvoice(invoiceId: string, userId: string) {
  const user = await requireUser();
  await enforceActionLimit("mutation", user.id, "/dashboard");

  if (user.id !== userId) {
    throw new Error("Usuario no autorizado.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("issue_invoice", { p_invoice_id: invoiceId });

  if (error || !data) {
    throw new Error(translateFiscalRpcError(error, "emitir"));
  }

  return data;
}

export async function cancelInvoice(invoiceId: string, userId: string, reason: string) {
  const user = await requireUser();
  await enforceActionLimit("mutation", user.id, "/dashboard");

  if (user.id !== userId) {
    throw new Error("Usuario no autorizado.");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("cancel_invoice", { p_invoice_id: invoiceId, p_reason: reason });

  if (error || !data) {
    throw new Error(translateFiscalRpcError(error, "anular"));
  }

  return data;
}

export async function createMonthlyInvoicesAction(formData: FormData) {
  const user = await requireUser();
  await enforceActionLimit("monthly", user.id, "/invoices/create-month");
  const supabase = await createClient();
  const month = Number(formData.get("month"));
  const year = Number(formData.get("year"));
  const operationId = String(formData.get("operation_id") ?? "");
  const selected = Array.from(new Set(formData.getAll("include").map(String)));
  const es = await getLocale() === "es";
  const rows = selected.map((id) => ({
    community_id: id,
    amount: Number(String(formData.get(`amount_${id}`) ?? "").trim().replace(",", ".")),
    vat_rate: Number(String(formData.get(`vat_${id}`) ?? "").trim().replace(",", ".")),
    subject: requiredText(formData.get(`subject_${id}`)),
    notes: nullableText(formData.get(`notes_${id}`)),
  }));
  if (!/^[0-9a-f-]{36}$/i.test(operationId) || !rows.length || rows.some((row) => !row.subject || !Number.isFinite(row.amount) || row.amount < 0 || !Number.isFinite(row.vat_rate) || row.vat_rate < 0 || row.vat_rate > 100)) {
    redirect(`/invoices/create-month?${new URLSearchParams({ message: es ? "Revisa los datos del cierre mensual." : "Check the monthly closing details." })}`);
  }
  const { data: ids, error } = await supabase.rpc("create_monthly_drafts", {
    p_operation_id: operationId, p_month: month, p_year: year, p_rows: rows,
    p_confirm_duplicates: formData.get("confirm_duplicates") === "yes",
  });
  if (error || !ids) {
    const message = error?.code === "23505"
      ? (es ? "Ya existen facturas en este periodo. Confirma si deseas crear otras adicionales." : "Invoices already exist in this period. Confirm to create additional ones.")
      : (es ? "No se pudo completar el cierre. Comprueba el plan, los datos y la disponibilidad del servicio." : "Could not complete closing. Check the plan, details and service availability.");
    redirect(`/invoices/create-month?${new URLSearchParams({ message })}`);
  }
  revalidatePath("/invoices");
  revalidatePath("/dashboard");
  redirect(`/invoices?${new URLSearchParams({ message: es ? `${ids.length} borradores preparados.` : `${ids.length} drafts prepared.` })}`);
}

async function createDocumentAction(formData: FormData, documentType: DocumentType) {
  const user = await requireUser();
  await enforceActionLimit("mutation", user.id, "/dashboard");
  const supabase = await createClient();
  const limitError = await assertCanCreateDocuments(supabase, user.id);

  if (limitError) {
    redirect(`${basePath(documentType)}?message=${encodeURIComponent(limitError)}`);
  }

  const payload = parseInvoicePayload(formData);
  const snapshot = await getCommunitySnapshotOrRedirect(supabase, user.id, payload.community_id, `${basePath(documentType)}/new`);

  if (payload.document_type !== documentType) {
    throw new Error("Tipo de documento incoherente.");
  }

  const { items, ...invoicePayload } = payload;
  const { data: createdInvoice, error } = await supabase
    .from("invoices")
    .insert({
      owner_id: user.id,
      ...snapshot,
      ...invoicePayload,
    })
    .select("id")
    .single();

  if (error || !createdInvoice) {
    redirect(`${basePath(documentType)}/new?message=${encodeURIComponent(error?.message ?? "No se pudo crear el documento.")}`);
  }

  const { error: itemError } = await supabase.from("invoice_items").insert(
    items.map((item) => ({
      owner_id: user.id,
      invoice_id: createdInvoice.id,
      ...item,
    })),
  );

  if (itemError) {
    await supabase.from("invoices").delete().eq("id", createdInvoice.id).eq("owner_id", user.id);
    redirect(`${basePath(documentType)}/new?message=${encodeURIComponent(itemError.message)}`);
  }

  await createAuditLog(supabase, user.id, documentType, createdInvoice.id, documentType === "invoice" ? "invoice_created" : "budget_created");

  revalidateDocumentPaths(documentType);
  redirect(basePath(documentType));
}

async function updateDocumentAction(formData: FormData, documentType: DocumentType) {
  const user = await requireUser();
  await enforceActionLimit("mutation", user.id, "/dashboard");
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();
  const payload = parseInvoicePayload(formData);
  const snapshot = await getCommunitySnapshotOrRedirect(supabase, user.id, payload.community_id, `${basePath(documentType)}/${id}/edit`);

  if (payload.document_type !== documentType) {
    throw new Error("Tipo de documento incoherente.");
  }

  const { data: existingDocument, error: existingError } = await supabase
    .from("invoices")
    .select("id, status")
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("document_type", documentType)
    .maybeSingle();

  if (existingError || !existingDocument) {
    redirect(`${basePath(documentType)}/${id}/edit?message=${encodeURIComponent(existingError?.message ?? "Documento no encontrado.")}`);
  }

  if (documentType === "invoice" && existingDocument.status !== "draft") {
    redirect(
      `${basePath(documentType)}/${id}/edit?message=${encodeURIComponent(
        "Esta factura ya ha sido emitida y no puede modificarse directamente para preservar la trazabilidad.",
      )}`,
    );
  }

  const { items, ...invoicePayload } = payload;

  const { data: updatedInvoice, error } = await supabase
    .from("invoices")
    .update({ ...snapshot, ...invoicePayload })
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("document_type", documentType)
    .select("id")
    .maybeSingle();

  if (error || !updatedInvoice) {
    redirect(`${basePath(documentType)}/${id}/edit?message=${encodeURIComponent(error?.message ?? "Documento no encontrado.")}`);
  }

  const { error: deleteItemsError } = await supabase.from("invoice_items").delete().eq("invoice_id", id).eq("owner_id", user.id);

  if (deleteItemsError) {
    redirect(`${basePath(documentType)}/${id}/edit?message=${encodeURIComponent(deleteItemsError.message)}`);
  }

  const { error: itemError } = await supabase.from("invoice_items").insert(
    items.map((item) => ({
      owner_id: user.id,
      invoice_id: id,
      ...item,
    })),
  );

  if (itemError) {
    redirect(`${basePath(documentType)}/${id}/edit?message=${encodeURIComponent(itemError.message)}`);
  }

  await createAuditLog(supabase, user.id, documentType, id, documentType === "invoice" ? "invoice_updated" : "budget_updated");

  revalidateDocumentPaths(documentType);
  redirect(basePath(documentType));
}

async function getCommunitySnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  communityId: string,
) {
  const { data: community, error } = await supabase
    .from("communities")
    .select("*")
    .eq("id", communityId)
    .eq("owner_id", ownerId)
    .maybeSingle();

  if (error || !community) {
    throw new Error("El cliente seleccionado no existe o no pertenece a tu cuenta.");
  }

  return snapshotFromCommunity(community);
}

async function getCommunitySnapshotOrRedirect(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  communityId: string,
  path: string,
) {
  try {
    return await getCommunitySnapshot(supabase, ownerId, communityId);
  } catch (error) {
    redirect(`${path}?message=${encodeURIComponent((error as Error).message)}`);
  }
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

function safeDocumentRedirectPath(value: FormDataEntryValue | null) {
  const path = requiredText(value);
  return path === "/budgets" ? "/budgets" : "/invoices";
}

function revalidateDocumentPaths(documentType: DocumentType) {
  revalidatePath(basePath(documentType));
  revalidatePath("/dashboard");
}

function parseDocumentStatus(value: FormDataEntryValue | null, documentType: DocumentType): InvoiceStatus {
  const status = requiredText(value) as InvoiceStatus;

  if (!allowedStatuses.includes(status)) {
    throw new Error("Estado no valido.");
  }

  if (documentType === "invoice" && status !== "draft") {
    throw new Error("Las facturas se crean y editan como borrador. Usa Emitir factura para cambiar su estado.");
  }

  if (documentType === "budget" && status !== "draft" && status !== "cancelled") {
    throw new Error("Los presupuestos solo pueden estar en borrador o anulados.");
  }

  return status;
}

function translateFiscalRpcError(error: { code?: string; message?: string } | null, action: "emitir" | "anular") {
  const message = error?.message ?? `No se pudo ${action} la factura.`;

  if (
    error?.code === "PGRST202" ||
    (message.includes("schema cache") && (message.includes("issue_invoice") || message.includes("cancel_invoice")))
  ) {
    return "Falta aplicar la migracion fiscal de Supabase. Ejecuta supabase/migrations/20260603093000_verifactu_architecture_alignment.sql en la base de datos y recarga la cache de esquema antes de emitir o anular facturas.";
  }

  return message;
}
