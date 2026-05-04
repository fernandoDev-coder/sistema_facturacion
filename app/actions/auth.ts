"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncCurrentUserAccess } from "@/lib/profiles";

function authRedirect(path: string, message: string) {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
}

function validatePassword(password: string) {
  if (password.length < 10) {
    return "La contraseña debe tener al menos 10 caracteres.";
  }

  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "La contraseña debe incluir mayúsculas, minúsculas y números.";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un símbolo.";
  }

  return null;
}

function translateAuthError(message: string) {
  if (message === "Email not confirmed") {
    return "Tu email aún no está verificado. Revisa tu bandeja de entrada y confirma tu cuenta.";
  }

  if (message === "Invalid login credentials") {
    return "Email o contraseña incorrectos.";
  }

  return message;
}

async function getEmailRedirectTo() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const protocol = headerList.get("x-forwarded-proto") ?? "https";

  if (!host) {
    return undefined;
  }

  return `${protocol}://${host}/login?message=${encodeURIComponent("Email verificado. Ya puedes iniciar sesión.")}`;
}

export async function loginAction(formData: FormData) {
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
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("password_confirm") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email) {
    authRedirect("/register", "Introduce un email válido.");
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    authRedirect("/register", passwordError);
  }

  if (password !== passwordConfirm) {
    authRedirect("/register", "Las contraseñas no coinciden.");
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
    authRedirect("/register", translateAuthError(error.message));
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

export async function completeOnboardingAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
