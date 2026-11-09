import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getLocale } from "@/lib/i18n";
import { contactEmails, contactHref } from "@/lib/beta-config";
import { verifyMfaAction, removeMfaAction } from "@/app/actions/mfa";
import { logoutAction } from "@/app/actions/auth";
import { MfaEnrollment } from "@/components/mfa-enrollment";
import { FormButton } from "@/components/form-button";
import { canUseAuthEnvironment } from "@/lib/supabase/environment";
import { PreviewAccessNotice } from "@/components/preview-access-notice";

export const metadata = { title: "MFA · FaktuDash", robots: { index: false, follow: false } };

export default async function MfaPage({ searchParams }: { searchParams: Promise<{ message?: string; next?: string }> }) {
  if (!canUseAuthEnvironment()) return <PreviewAccessNotice />;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const es = await getLocale() === "es";
  const { message, next = "/dashboard" } = await searchParams;
  const { data: factors, error } = await supabase.auth.mfa.listFactors();
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  const verified = factors?.totp ?? [];
  const provisional = verified.length > 0 && assurance?.currentLevel !== "aal2";

  return <main className="mx-auto w-full max-w-xl space-y-6 px-4 py-12">
    <h1 className="text-2xl font-semibold">{es ? "Verificación en dos pasos" : "Two-step verification"}</h1>
    <p>{es ? "Usa una aplicación autenticadora. Es obligatoria para administración y opcional para el resto de cuentas." : "Use an authenticator app. It is required for administration and optional for other accounts."}</p>
    {message ? <p role="status">{message}</p> : null}
    {error ? <p role="alert">{es ? "No se pudo consultar el segundo factor. Inténtalo de nuevo." : "Could not load second factors. Try again."}</p> : null}
    {!provisional && !error ? <MfaEnrollment es={es} requireReauth={verified.length > 0} next={next} /> : null}
    {(factors?.all.filter((factor) => factor.factor_type === "totp") ?? []).map((factor) => <section className="space-y-3 border-t border-zinc-200 pt-4" key={factor.id}>
      <h2 className="font-semibold">{factor.friendly_name || "TOTP"}</h2>
      <form action={verifyMfaAction} className="space-y-3">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="factor_id" value={factor.id} />
        <label className="block">{es ? "Código de seis cifras" : "Six-digit code"}<input className="field-control" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} data-no-autosave /></label>
        <FormButton pendingText={es ? "Verificando…" : "Verifying…"}>{es ? "Verificar" : "Verify"}</FormButton>
      </form>
      {assurance?.currentLevel === "aal2" && factor.status === "verified" ? <details><summary>{es ? "Quitar este factor" : "Remove this factor"}</summary>
        <form action={removeMfaAction} className="mt-3 space-y-3" autoComplete="off">
          <input type="hidden" name="factor_id" value={factor.id} />
          <label className="block">{es ? "Contraseña actual" : "Current password"}<input className="field-control" name="password" type="password" autoComplete="current-password" required /></label>
          <label className="block">{es ? "Código nuevo de la aplicación" : "Fresh app code"}<input className="field-control" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} data-no-autosave /></label>
          <FormButton variant="danger" pendingText={es ? "Quitando…" : "Removing…"}>{es ? "Quitar factor y cerrar sesión" : "Remove factor and sign out"}</FormButton>
        </form>
      </details> : null}
    </section>)}
    <p className="text-sm">{es ? "Si has perdido el dispositivo, contacta con soporte. La recuperación requiere comprobar tu identidad; el email de alta no sustituye este factor." : "If you lost your device, contact support. Recovery requires an identity check; your signup email does not replace this factor."} <a className="underline" href={contactHref(contactEmails.support, "Recuperación MFA FaktuDash")}>{contactEmails.support || (es ? "Contacto" : "Contact")}</a></p>
    {assurance?.currentLevel === "aal2" || !verified.length ? <Link className="block underline" href="/dashboard">{es ? "Volver al panel" : "Back to dashboard"}</Link> : null}
    <form action={logoutAction}><FormButton variant="secondary" pendingText={es ? "Cerrando sesión…" : "Signing out…"}>{es ? "Cerrar sesión" : "Sign out"}</FormButton></form>
  </main>;
}
