"use server";

import { redirect } from "next/navigation";
import { reauthenticatePassword } from "@/lib/supabase/reauthenticate";
import { createClient } from "@/lib/supabase/server";
import { enforceActionLimit } from "@/lib/rate-limit";
import { getLocale } from "@/lib/i18n";

export type Enrollment = { qr?: string; secret?: string; factorId?: string; error?: string };

async function context() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  await enforceActionLimit("mfa", user.id, "/auth/mfa");
  const es = await getLocale() === "es";
  return { supabase, user, es };
}

function go(message: string, next = "/dashboard"): never {
  redirect(`/auth/mfa?${new URLSearchParams({ message, next })}`);
}

export async function enrollMfaAction(_previous: Enrollment, formData: FormData): Promise<Enrollment> {
  const { supabase, user, es } = await context();
  const { data: assurance, error: assuranceError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors();
  if (assuranceError || factorError || (factors.all.some((f) => f.status === "verified") && assurance?.currentLevel !== "aal2")) {
    return { error: es ? "Verifica primero tu segundo factor." : "Verify your second factor first." };
  }
  if (factors.totp.length) {
    if (!await reauthenticatePassword(user, String(formData.get("password") ?? ""))) return { error: es ? "No se pudo verificar la contraseña." : "Could not verify the password." };
    const code = String(formData.get("code") ?? "").trim();
    if (!/^\d{6}$/.test(code)) return { error: es ? "Introduce un código nuevo." : "Enter a fresh code." };
    const verified = await supabase.auth.mfa.challengeAndVerify({ factorId: factors.totp[0].id, code });
    if (verified.error) return { error: es ? "No se pudo verificar el código." : "Could not verify the code." };
  }
  // Discard abandoned enrollments without touching verified factors.
  for (const factor of factors.all.filter((f) => f.status === "unverified")) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
    if (error) return { error: es ? "No se pudo reiniciar la configuración." : "Could not restart setup." };
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `FaktuDash ${new Date().toISOString()}`, issuer: "FaktuDash" });
  if (error) return { error: es ? "No se pudo activar TOTP. Revisa la configuración del proyecto." : "Could not enable TOTP. Check the project configuration." };
  return { qr: data.totp.qr_code, secret: data.totp.secret, factorId: data.id };
}

export async function verifyMfaAction(formData: FormData) {
  const { supabase, es } = await context();
  const requestedNext = String(formData.get("next") ?? "");
  const next = ["/reset-password", "/welcome", "/settings/account"].includes(requestedNext) ? requestedNext : "/dashboard";
  const factorId = String(formData.get("factor_id") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error || !/^\d{6}$/.test(code) || !factors.all.some((factor) => factor.id === factorId && factor.factor_type === "totp")) {
    go(es ? "Revisa el factor y el código de seis cifras." : "Check the factor and six-digit code.", next);
  }
  const result = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (result.error) go(es ? "Código incorrecto, caducado o ya utilizado. Espera al siguiente código." : "Incorrect, expired or already used code. Wait for the next code.", next);
  // Never serialize the session returned by challengeAndVerify to a client component.
  redirect(next);
}

export async function removeMfaAction(formData: FormData) {
  const { supabase, user, es } = await context();
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") go(es ? "Verifica primero tu segundo factor." : "Verify your second factor first.");
  const factorId = String(formData.get("factor_id") ?? "");
  const code = String(formData.get("code") ?? "").trim();
  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  if (error || !factors.totp.some((f) => f.id === factorId) || !/^\d{6}$/.test(code)) go(es ? "Factor o código no válido." : "Invalid factor or code.");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("is_super_admin").eq("id", user.id).single();
  if (profileError || (profile.is_super_admin && factors.all.filter((f) => f.status === "verified").length <= 1)) {
    go(es ? "Administración requiere mantener al menos un segundo factor." : "Administration requires at least one second factor.");
  }
  // Password reauthentication must not replace the current aal2 cookies with an aal1 session.
  if (!await reauthenticatePassword(user, String(formData.get("password") ?? ""))) go(es ? "No se pudo verificar la contraseña." : "Could not verify the password.");
  const challenge = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
  if (challenge.error) go(es ? "Introduce un código nuevo de tu aplicación." : "Enter a fresh code from your app.");
  const removed = await supabase.auth.mfa.unenroll({ factorId });
  if (removed.error) go(es ? "No se pudo quitar el factor." : "Could not remove the factor.");
  await supabase.auth.signOut();
  redirect("/login");
}
