"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nullableText } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";
import { assertValidFields, cleanIban, cleanPhone, cleanPostalCode, cleanTaxId } from "@/lib/validators";

export async function saveCompanySettingsAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const taxId = cleanTaxId(nullableText(formData.get("tax_id")));
  const postalCode = cleanPostalCode(nullableText(formData.get("postal_code")));
  const phone = cleanPhone(nullableText(formData.get("phone")));
  const iban = cleanIban(nullableText(formData.get("iban")));

  try {
    assertValidFields([
      ["tax_id", taxId],
      ["postal_code", postalCode],
      ["phone", phone],
      ["iban", iban],
    ]);
  } catch (error) {
    redirect(`/settings/company?message=${encodeURIComponent((error as Error).message)}`);
  }

  const payload = {
    owner_id: user.id,
    fiscal_name: nullableText(formData.get("fiscal_name")),
    tax_id: taxId.value,
    address: nullableText(formData.get("address")),
    postal_code: postalCode.value,
    city: nullableText(formData.get("city")),
    province: nullableText(formData.get("province")),
    email: nullableText(formData.get("email")),
    phone: phone.value,
    iban: iban.value,
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
