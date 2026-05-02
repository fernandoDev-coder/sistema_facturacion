"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function authRedirect(path: string, message: string) {
  redirect(`${path}?message=${encodeURIComponent(message)}`);
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

  if (!email || password.length < 6) {
    authRedirect("/register", "Introduce un email y una contraseña de al menos 6 caracteres.");
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
