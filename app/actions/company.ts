"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAuditLog } from "@/lib/audit";
import { nullableText } from "@/lib/format";
import { getPlanLimits, getProfileForLimits } from "@/lib/plan-limits";
import { createClient, requireUser } from "@/lib/supabase/server";
import {
  assertValidFields,
  cleanIban,
  cleanLogoUrl,
  cleanPhone,
  cleanPostalCode,
  cleanTaxId,
  type ValidationResult,
} from "@/lib/validators";

const LOGO_BUCKET = "company-logos";
const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const allowedLogoTypes = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

export async function saveCompanySettingsAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const taxId = cleanTaxId(nullableText(formData.get("tax_id")));
  const postalCode = cleanPostalCode(nullableText(formData.get("postal_code")));
  const phone = cleanPhone(nullableText(formData.get("phone")));
  const iban = cleanIban(nullableText(formData.get("iban")));
  const logoUrl = cleanLogoUrl(nullableText(formData.get("logo_url")));
  const logoFile = formData.get("logo_file");
  const defaultInvoiceSeries = nullableText(formData.get("default_invoice_series"))?.trim().toUpperCase() || "F";
  const nextInvoiceNumber = Math.max(1, Math.floor(Number(formData.get("next_invoice_number")) || 1));
  const attemptedLogo = Boolean(logoUrl.value) || (logoFile instanceof File && logoFile.size > 0);
  const [profile, { data: existingCompany }] = await Promise.all([
    getProfileForLimits(supabase, user.id),
    supabase.from("company_settings").select("logo_url").eq("owner_id", user.id).maybeSingle(),
  ]);
  const limits = getPlanLimits(profile);
  let uploadedLogoUrl: string | null = null;

  try {
    const fields: Array<[string, ValidationResult]> = [
      ["tax_id", taxId],
      ["postal_code", postalCode],
      ["phone", phone],
      ["iban", iban],
    ];

    if (limits.companyLogo) {
      fields.push(["logo_url", logoUrl]);
    }

    assertValidFields(fields);

    if (limits.companyLogo) {
      uploadedLogoUrl = await uploadCompanyLogo(supabase, user.id, logoFile);
    }
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
    logo_url: limits.companyLogo ? uploadedLogoUrl ?? logoUrl.value : existingCompany?.logo_url ?? null,
    invoice_footer: nullableText(formData.get("invoice_footer")),
    default_invoice_series: defaultInvoiceSeries,
    next_invoice_number: nextInvoiceNumber,
    updated_at: new Date().toISOString(),
  };

  const { data: savedCompany, error } = await supabase
    .from("company_settings")
    .upsert(payload, {
      onConflict: "owner_id",
    })
    .select("id")
    .single();

  if (error || !savedCompany) {
    redirect(`/settings/company?message=${encodeURIComponent(error?.message ?? "No se pudo guardar la configuracion.")}`);
  }

  await createAuditLog(supabase, user.id, "company_settings", savedCompany.id, "company_settings_updated");

  revalidatePath("/settings/company");
  revalidatePath("/invoices");
  revalidatePath("/budgets");
  redirect(
    `/settings/company?message=${encodeURIComponent(
      attemptedLogo && !limits.companyLogo
        ? "Datos guardados. El logo en facturas y presupuestos esta incluido en el plan Pro."
        : "Configuracion guardada.",
    )}`,
  );
}

async function uploadCompanyLogo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  value: FormDataEntryValue | null,
) {
  if (!(value instanceof File) || value.size === 0) {
    return null;
  }

  const extension = allowedLogoTypes[value.type as keyof typeof allowedLogoTypes];

  if (!extension) {
    throw new Error("El logo debe ser una imagen PNG, JPG o WebP.");
  }

  if (value.size > MAX_LOGO_BYTES) {
    throw new Error("El logo no puede superar 2 MB.");
  }

  const storage = supabase.storage.from(LOGO_BUCKET);
  const objectPath = `${ownerId}/logo.${extension}`;
  const oldPaths = Object.values(allowedLogoTypes)
    .map((typeExtension) => `${ownerId}/logo.${typeExtension}`)
    .filter((path) => path !== objectPath);

  if (oldPaths.length) {
    await storage.remove(oldPaths);
  }

  const { error } = await storage.upload(objectPath, Buffer.from(await value.arrayBuffer()), {
    cacheControl: "60",
    contentType: value.type,
    upsert: true,
  });

  if (error) {
    throw new Error(`No se pudo subir el logo: ${error.message}`);
  }

  return storage.getPublicUrl(objectPath).data.publicUrl;
}
