import { documentNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type { DocumentType } from "@/lib/types";

export async function suggestDocumentNumber(ownerId: string, year: number, documentType: DocumentType) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("year", year)
    .eq("document_type", documentType);

  return documentNumber(documentType, year, (count ?? 0) + 1);
}

export async function suggestInvoiceNumber(ownerId: string, year: number) {
  return suggestDocumentNumber(ownerId, year, "invoice");
}
