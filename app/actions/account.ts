"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { validatePassword } from "@/lib/password";
import { getStripe } from "@/lib/stripe";
import { createAdminClient, createClient, requireUser } from "@/lib/supabase/server";

const logoBucket = "company-logos";
const logoExtensions = ["png", "jpg", "webp"] as const;

function accountRedirect(message: string): never {
  redirect(`/settings/account?message=${encodeURIComponent(message)}`);
}

export async function saveAccountProfileAction(formData: FormData) {
  const user = await requireUser();
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (fullName.length > 120) {
    accountRedirect("El nombre no puede superar 120 caracteres.");
  }

  const { error } = await createAdminClient()
    .from("profiles")
    .update({ full_name: fullName || null, email: user.email ?? null })
    .eq("id", user.id);

  if (error) {
    accountRedirect(error.message);
  }

  revalidatePath("/settings/account");
  accountRedirect("Perfil actualizado.");
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireUser();
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!user.email) {
    accountRedirect("No se pudo identificar el email de la cuenta.");
  }

  if (!currentPassword || !newPassword || !confirmPassword) {
    accountRedirect("Completa todos los campos de contrasena.");
  }

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    accountRedirect(passwordError);
  }

  if (newPassword !== confirmPassword) {
    accountRedirect("Las contrasenas nuevas no coinciden.");
  }

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (signInError) {
    accountRedirect("La contrasena actual no es correcta.");
  }

  const { error } = await supabase.auth.updateUser({ password: newPassword });

  if (error) {
    accountRedirect(error.message);
  }

  accountRedirect("Contrasena actualizada.");
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireUser();
  const confirmationEmail = String(formData.get("confirm_email") ?? "").trim().toLowerCase();
  const userEmail = user.email?.trim().toLowerCase();

  if (!userEmail || confirmationEmail !== userEmail) {
    accountRedirect("Escribe tu email exactamente para confirmar el borrado de la cuenta.");
  }

  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("is_super_admin,stripe_subscription_id,subscription_status")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    accountRedirect(profileError.message);
  }

  if (profile?.is_super_admin) {
    accountRedirect("La cuenta administradora no se puede borrar desde la aplicacion.");
  }

  try {
    if (profile?.stripe_subscription_id && profile.subscription_status !== "canceled") {
      await getStripe().subscriptions.cancel(profile.stripe_subscription_id);
    }

    await deleteCompanyLogoFiles(admin, user.id);

    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (error) {
      throw error;
    }

    await supabase.auth.signOut();
  } catch (error) {
    accountRedirect((error as Error).message);
  }

  redirect("/login?message=Cuenta eliminada. Hemos cerrado tu sesion.");
}

async function deleteCompanyLogoFiles(admin: ReturnType<typeof createAdminClient>, ownerId: string) {
  const paths = logoExtensions.map((extension) => `${ownerId}/logo.${extension}`);
  await admin.storage.from(logoBucket).remove(paths);
}
