"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

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

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    authRedirect("/login", "Introduce email y contraseña.");
  }

  const supabase = await createClient({ persistSession: remember });
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authRedirect("/login", error.message);
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
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    authRedirect("/register", error.message);
  }

  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      email,
    });
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
