"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nullableText, requiredText, toDecimal } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";
import type { ExpenseDocumentStatus } from "@/lib/types";

const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
const allowedStatuses: ExpenseDocumentStatus[] = ["pending", "paid", "archived"];
const maxExpenseFileBytes = 5 * 1024 * 1024;

export async function createExpenseDocumentAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const supplierName = requiredText(formData.get("supplier_name"));
  const issueDate = requiredText(formData.get("issue_date"));
  const status = parseStatus(formData.get("status"));
  const file = formData.get("file");

  if (!supplierName || !issueDate) {
    redirect(`/expenses?message=${encodeURIComponent("Proveedor y fecha son obligatorios.")}`);
  }

  if (!(file instanceof File) || !file.size) {
    redirect(`/expenses?message=${encodeURIComponent("Sube un archivo PDF, JPG o PNG.")}`);
  }

  if (!allowedMimeTypes.has(file.type)) {
    redirect(`/expenses?message=${encodeURIComponent("El archivo debe ser PDF, JPG o PNG.")}`);
  }

  if (file.size > maxExpenseFileBytes) {
    redirect(`/expenses?message=${encodeURIComponent("El archivo no puede superar 5 MB.")}`);
  }

  const extension = extensionForFile(file);
  const filePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
  const { error: uploadError } = await supabase.storage.from("expense-documents").upload(filePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (uploadError) {
    redirect(`/expenses?message=${encodeURIComponent(uploadError.message)}`);
  }

  const { error } = await supabase.from("expense_documents").insert({
    owner_id: user.id,
    supplier_name: supplierName,
    invoice_number: nullableText(formData.get("invoice_number")),
    issue_date: issueDate,
    total_amount: toDecimal(formData.get("total_amount")),
    tax_amount: nullableText(formData.get("tax_amount")) ? toDecimal(formData.get("tax_amount")) : null,
    category: nullableText(formData.get("category")),
    file_url: filePath,
    status,
  });

  if (error) {
    await supabase.storage.from("expense-documents").remove([filePath]);
    redirect(`/expenses?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/expenses");
  redirect(`/expenses?message=${encodeURIComponent("Factura recibida guardada.")}`);
}

function parseStatus(value: FormDataEntryValue | null): ExpenseDocumentStatus {
  const status = String(value ?? "pending") as ExpenseDocumentStatus;
  return allowedStatuses.includes(status) ? status : "pending";
}

function extensionForFile(file: File) {
  if (file.type === "application/pdf") {
    return "pdf";
  }

  return file.type === "image/png" ? "png" : "jpg";
}
