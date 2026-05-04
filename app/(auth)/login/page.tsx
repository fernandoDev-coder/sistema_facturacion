import Link from "next/link";
import { loginAction, resendVerificationAction } from "@/app/actions/auth";
import { FormButton } from "@/components/form-button";
import { Message } from "@/components/message";
import { PasswordField } from "@/components/password-field";
import { RememberSessionField } from "@/components/remember-session-field";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <section className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-zinc-950">Iniciar sesión</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Accede para gestionar comunidades y facturas. Si acabas de registrarte, verifica tu email primero.
        </p>
        <Message text={message} />
        <form action={loginAction} autoComplete="on" className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Email</span>
            <input
              name="email"
              type="email"
              autoComplete="username"
              required
              className="mt-1 h-10 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
            />
          </label>
          <PasswordField autoComplete="current-password" />
          <RememberSessionField />
          <FormButton className="w-full">Entrar</FormButton>
        </form>
        <div className="mt-6 rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-medium text-zinc-900">¿No te llegó el email de verificación?</p>
          <p className="mt-1 text-sm text-zinc-600">Vuelve a introducir tu correo y te lo reenviamos.</p>
          <form action={resendVerificationAction} className="mt-4 space-y-3">
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
            <FormButton className="w-full" variant="secondary" pendingText="Reenviando...">
              Reenviar verificación
            </FormButton>
          </form>
        </div>
        <p className="mt-5 text-center text-sm text-zinc-600">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="font-medium text-slate-900 hover:underline">
            Regístrate
          </Link>
        </p>
      </section>
    </main>
  );
}
