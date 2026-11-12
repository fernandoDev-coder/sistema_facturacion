"use server";

import { enforceActionLimit } from "@/lib/rate-limit";
import { hasMfaAccess } from "@/lib/supabase/mfa";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncCurrentUserAccess } from "@/lib/profiles";
import { validatePassword } from "@/lib/password";

function authRedirect(path: string, message: string, params?: Record<string, string | null | undefined>): never {
  const searchParams = new URLSearchParams({ message });

  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) {
      searchParams.set(key, value);
    }
  }

  redirect(`${path}?${searchParams.toString()}`);
}

function registerRedirect(message: string, email: string): never {
  authRedirect("/register", message, { email });
}

function translateAuthError(message: string) {
  if (message === "Email not confirmed") {
    return "Tu email aún no está verificado. Revisa tu bandeja de entrada y confirma tu cuenta.";
  }

  if (message === "Invalid login credentials") {
    return "Email o contraseña incorrectos.";
  }

  return "No se pudo completar la autenticación. Inténtalo de nuevo.";
}

async function getEmailRedirectTo() {
  const baseUrl = await getBaseUrl();
  if (baseUrl) {
    return `${baseUrl}/auth/callback?next=/welcome`;
  }

  return undefined;
}

async function getPasswordRecoveryRedirectTo() {
  const baseUrl = await getBaseUrl();
  if (baseUrl) {
    return `${baseUrl}/auth/callback?next=/reset-password`;
  }

  return undefined;
}

async function getBaseUrl() {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.SITE_URL;
  if (configuredSiteUrl) {
    return configuredSiteUrl.replace(/\/$/, "");
  }

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");

  if (!host) {
    return null;
  }

  const protocol =
    headerList.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}

export async function loginAction(formData: FormData) {
  await enforceActionLimit("login", undefined, "/login");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    authRedirect("/login", "Introduce email y contraseña.");
  }

  const supabase = await createClient({ persistSession: remember });
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authRedirect("/login", translateAuthError(error.message));
  }

  if (data.user) {
    await syncCurrentUserAccess(data.user, supabase);
  }

  if (!data.user) {
    authRedirect("/login", "No se pudo iniciar sesión. Inténtalo de nuevo.");
  }

  const user = data.user;
  if (!await hasMfaAccess(supabase)) redirect("/auth/mfa");

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();
  if (profile && !profile.onboarding_completed_at) {
    redirect("/welcome");
  }

  redirect("/dashboard");
}

export async function registerAction(formData: FormData) {
  await enforceActionLimit("register", undefined, "/register");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email) {
    registerRedirect("Introduce un email válido.", email);
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    registerRedirect(passwordError, email);
  }

  if (password !== passwordConfirm) {
    registerRedirect("Las contraseñas no coinciden.", email);
  }

  const supabase = await createClient({ persistSession: remember });
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: await getEmailRedirectTo(),
    },
  });

  if (error) {
    registerRedirect(translateAuthError(error.message), email);
  }

  if (data.user && data.session) {
    await syncCurrentUserAccess(data.user, supabase);
    redirect("/welcome");
  }

  authRedirect(
    "/login",
    "Cuenta creada. Revisa tu email y confirma tu dirección antes de iniciar sesión.",
  );
}

export async function resendVerificationAction(formData: FormData) {
  await enforceActionLimit("email", undefined, "/login");
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    authRedirect("/login", "Indica el email al que quieres reenviar la verificación.");
  }

  const supabase = await createClient({ persistSession: false });
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: await getEmailRedirectTo(),
    },
  });

  if (error) {
    authRedirect("/login", translateAuthError(error.message));
  }

  authRedirect("/login", "Te hemos reenviado el email de verificación.");
}

export async function requestPasswordResetAction(formData: FormData) {
  await enforceActionLimit("email", undefined, "/forgot-password");
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    authRedirect("/forgot-password", "Introduce el email de tu cuenta.");
  }

  const supabase = await createClient({ persistSession: false });
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: await getPasswordRecoveryRedirectTo(),
  });

  if (error) {
    authRedirect("/forgot-password", translateAuthError(error.message), { email });
  }

  authRedirect(
    "/forgot-password",
    "Si existe una cuenta con ese email, te enviaremos un enlace para crear una nueva contraseña.",
    { email },
  );
}

export async function updateRecoveredPasswordAction(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");

  const passwordError = validatePassword(password);
  if (passwordError) {
    authRedirect("/reset-password", passwordError);
  }

  if (password !== passwordConfirm) {
    authRedirect("/reset-password", "Las contraseñas no coinciden.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    authRedirect("/forgot-password", "El enlace de recuperación ha caducado o no es válido. Solicita uno nuevo.");
  }

  if (!await hasMfaAccess(supabase)) redirect("/auth/mfa?next=/reset-password");
  await enforceActionLimit("mutation", user.id, "/reset-password");
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    authRedirect("/reset-password", translateAuthError(error.message));
  }

  await supabase.auth.signOut();
  authRedirect("/login", "Contraseña actualizada. Ya puedes iniciar sesión.");
}

export async function completeOnboardingAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!await hasMfaAccess(supabase)) redirect("/auth/mfa");
  await enforceActionLimit("mutation", user.id, "/welcome");
  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) authRedirect("/login", "No se pudo cerrar la sesión. Inténtalo de nuevo.");
  redirect("/login");
}
