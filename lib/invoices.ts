import { invoiceNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function suggestInvoiceNumber(ownerId: string, year: number, month: number) {
  const supabase = await createClient();
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId)
    .eq("year", year)
    .eq("month", month);

  return invoiceNumber(year, month, (count ?? 0) + 1);
}
