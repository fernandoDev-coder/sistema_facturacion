"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nullableText, requiredText, toDecimal } from "@/lib/format";
import { assertCanCreateClient } from "@/lib/plan-limits";
import { createClient, requireUser } from "@/lib/supabase/server";
import { assertValidFields, cleanPhone, cleanPostalCode, cleanTaxId } from "@/lib/validators";

function clientPayload(formData: FormData) {
  const name = requiredText(formData.get("name"));
  const taxId = cleanTaxId(nullableText(formData.get("tax_id")));
  const postalCode = cleanPostalCode(nullableText(formData.get("postal_code")));
  const phone = cleanPhone(nullableText(formData.get("phone")));

  if (!name) {
    throw new Error("El nombre del cliente es obligatorio.");
  }

  assertValidFields([
    ["tax_id", taxId],
    ["postal_code", postalCode],
    ["phone", phone],
  ]);

  return {
    name,
    tax_id: taxId.value,
    address: nullableText(formData.get("address")),
    postal_code: postalCode.value,
    city: nullableText(formData.get("city")),
    province: nullableText(formData.get("province")),
    email: nullableText(formData.get("email")),
    phone: phone.value,
    default_subject: nullableText(formData.get("default_subject")),
    default_vat: toDecimal(formData.get("default_vat"), 21),
    notes: nullableText(formData.get("notes")),
    updated_at: new Date().toISOString(),
  };
}

export async function createClientAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const limitError = await assertCanCreateClient(supabase, user.id);

  if (limitError) {
    redirect(`/clients?message=${encodeURIComponent(limitError)}`);
  }

  let payload: ReturnType<typeof clientPayload>;

  try {
    payload = clientPayload(formData);
  } catch (error) {
    redirect(`/clients/new?message=${encodeURIComponent((error as Error).message)}`);
  }

  const { error } = await supabase.from("communities").insert({
    owner_id: user.id,
    ...payload,
  });

  if (error) {
    redirect(`/clients/new?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/clients");
  redirect("/clients");
}

export async function updateClientAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();
  let payload: ReturnType<typeof clientPayload>;

  try {
    payload = clientPayload(formData);
  } catch (error) {
    redirect(`/clients/${id}/edit?message=${encodeURIComponent((error as Error).message)}`);
  }

  const { data: updatedClient, error } = await supabase
    .from("communities")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !updatedClient) {
    redirect(`/clients/${id}/edit?message=${encodeURIComponent(error?.message ?? "Cliente no encontrado.")}`);
  }

  revalidatePath("/clients");
  redirect("/clients");
}

export async function deleteClientAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();

  const { data: deletedClient, error } = await supabase
    .from("communities")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !deletedClient) {
    redirect(`/clients?message=${encodeURIComponent(error?.message ?? "Cliente no encontrado.")}`);
  }

  revalidatePath("/clients");
  redirect("/clients");
}
