import { notFound } from "next/navigation";
import { DocumentPrint } from "@/components/document-print";
import { fallbackInvoiceItems } from "@/lib/invoice-items";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function PrintBudgetPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const { data: budget } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("document_type", "budget")
    .single();

  if (!budget) notFound();

  const [{ data: community }, { data: company }, { data: items }] = await Promise.all([
    supabase.from("communities").select("*").eq("id", budget.community_id).eq("owner_id", user.id).single(),
    supabase.from("company_settings").select("*").eq("owner_id", user.id).maybeSingle(),
    supabase.from("invoice_items").select("*").eq("owner_id", user.id).eq("invoice_id", id).order("sort_order"),
  ]);

  return (
    <DocumentPrint
      document={budget}
      items={items?.length ? items : fallbackInvoiceItems(budget)}
      company={company}
      title="Presupuesto"
      backHref="/budgets"
      customer={{
        name: budget.community_name ?? community?.name,
        taxId: budget.community_tax_id ?? community?.tax_id,
        address: budget.community_address ?? community?.address,
        postalCode: budget.community_postal_code ?? community?.postal_code,
        city: budget.community_city ?? community?.city,
        province: budget.community_province ?? community?.province,
        email: budget.community_email ?? community?.email,
        phone: budget.community_phone ?? community?.phone,
      }}
    />
  );
}
