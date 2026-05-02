"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nullableText } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";

export async function saveCompanySettingsAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();

  const payload = {
    owner_id: user.id,
    fiscal_name: nullableText(formData.get("fiscal_name")),
    tax_id: nullableText(formData.get("tax_id")),
    address: nullableText(formData.get("address")),
    postal_code: nullableText(formData.get("postal_code")),
    city: nullableText(formData.get("city")),
    province: nullableText(formData.get("province")),
    email: nullableText(formData.get("email")),
    phone: nullableText(formData.get("phone")),
    iban: nullableText(formData.get("iban")),
    invoice_footer: nullableText(formData.get("invoice_footer")),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from("company_settings").upsert(payload, {
    onConflict: "owner_id",
  });

  if (error) {
    redirect(`/settings/company?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/settings/company");
  revalidatePath("/invoices");
  redirect("/settings/company?message=Configuración guardada.");
}
