"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { nullableText, requiredText, toDecimal } from "@/lib/format";
import { createClient, requireUser } from "@/lib/supabase/server";
import { assertValidFields, cleanPhone, cleanPostalCode, cleanTaxId } from "@/lib/validators";

function communityPayload(formData: FormData) {
  const name = requiredText(formData.get("name"));
  const taxId = cleanTaxId(nullableText(formData.get("tax_id")));
  const postalCode = cleanPostalCode(nullableText(formData.get("postal_code")));
  const phone = cleanPhone(nullableText(formData.get("phone")));

  if (!name) {
    throw new Error("El nombre de la comunidad es obligatorio.");
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

export async function createCommunityAction(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  let payload: ReturnType<typeof communityPayload>;

  try {
    payload = communityPayload(formData);
  } catch (error) {
    redirect(`/communities/new?message=${encodeURIComponent((error as Error).message)}`);
  }

  const { error } = await supabase.from("communities").insert({
    owner_id: user.id,
    ...payload,
  });

  if (error) {
    redirect(`/communities/new?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/communities");
  redirect("/communities");
}

export async function updateCommunityAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();
  let payload: ReturnType<typeof communityPayload>;

  try {
    payload = communityPayload(formData);
  } catch (error) {
    redirect(`/communities/${id}/edit?message=${encodeURIComponent((error as Error).message)}`);
  }

  const { error } = await supabase
    .from("communities")
    .update(payload)
    .eq("id", id)
    .eq("owner_id", user.id);

  if (error) {
    redirect(`/communities/${id}/edit?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/communities");
  redirect("/communities");
}

export async function deleteCommunityAction(formData: FormData) {
  const user = await requireUser();
  const id = requiredText(formData.get("id"));
  const supabase = await createClient();

  const { error } = await supabase.from("communities").delete().eq("id", id).eq("owner_id", user.id);

  if (error) {
    redirect(`/communities?message=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/communities");
  redirect("/communities");
}
