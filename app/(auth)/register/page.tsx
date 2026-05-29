import Link from "next/link";
import { registerAction } from "@/app/actions/auth";
import { BrandLogo } from "@/components/brand-logo";
import { FormButton } from "@/components/form-button";
import { LegalFooter } from "@/components/legal-footer";
import { Message } from "@/components/message";
import { PasswordField } from "@/components/password-field";
import { RememberSessionField } from "@/components/remember-session-field";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50">
      <section className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <BrandLogo href="/" className="mb-6" />
        <h1 className="text-2xl font-semibold text-zinc-950">Crear cuenta</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Registra un usuario para empezar a facturar. Si la verificación por email está activa, tendrás que confirmar
          tu correo antes de entrar.
        </p>
        <Message text={message} />
        <form action={registerAction} autoComplete="on" className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <PasswordField minLength={10} autoComplete="new-password" />
          <PasswordField
            label="Confirmar contraseña"
            name="password_confirm"
            minLength={10}
            autoComplete="new-password"
          />
          <RememberSessionField />
          <FormButton className="w-full">Crear cuenta</FormButton>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-600">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-slate-900 hover:underline">
            Inicia sesión
          </Link>
        </p>
        <p className="mt-3 text-center text-sm text-zinc-600">
          <Link href="/pricing" className="font-medium text-slate-900 hover:underline">
            Ver planes y precios
          </Link>
        </p>
        </div>
      </section>
      <LegalFooter />
    </main>
  );
}
