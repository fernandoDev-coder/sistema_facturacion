import { notFound } from "next/navigation";
import { DocumentPrint } from "@/components/document-print";
import { fallbackInvoiceItems } from "@/lib/invoice-items";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function PrintInvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const supabase = await createClient();
  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .eq("document_type", "invoice")
    .single();

  if (!invoice) notFound();

  const [{ data: community }, { data: company }, { data: items }] = await Promise.all([
    supabase.from("communities").select("*").eq("id", invoice.community_id).eq("owner_id", user.id).single(),
    supabase.from("company_settings").select("*").eq("owner_id", user.id).maybeSingle(),
    supabase.from("invoice_items").select("*").eq("owner_id", user.id).eq("invoice_id", id).order("sort_order"),
  ]);

  return (
    <DocumentPrint
      document={invoice}
      items={items?.length ? items : fallbackInvoiceItems(invoice)}
      company={company}
      title="Factura"
      backHref="/invoices"
      customer={{
        name: invoice.community_name ?? community?.name,
        taxId: invoice.community_tax_id ?? community?.tax_id,
        address: invoice.community_address ?? community?.address,
        postalCode: invoice.community_postal_code ?? community?.postal_code,
        city: invoice.community_city ?? community?.city,
        province: invoice.community_province ?? community?.province,
        email: invoice.community_email ?? community?.email,
        phone: invoice.community_phone ?? community?.phone,
      }}
    />
  );
}
