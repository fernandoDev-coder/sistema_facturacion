"use client";

import { useActionState } from "react";
import { enrollMfaAction, verifyMfaAction, type Enrollment } from "@/app/actions/mfa";
import { FormButton } from "@/components/form-button";

export function MfaEnrollment({ es, requireReauth, next }: { es: boolean; requireReauth: boolean; next: string }) {
  const [state, action, pending] = useActionState<Enrollment, FormData>(enrollMfaAction, {});
  return <div className="space-y-4">
    <form action={action} className="space-y-3" autoComplete="off">
      {requireReauth ? <>
        <label className="block">{es ? "Contraseña actual" : "Current password"}<input className="field-control" name="password" type="password" autoComplete="current-password" required /></label>
        <label className="block">{es ? "Código nuevo del primer factor" : "Fresh code from the first factor"}<input className="field-control" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} data-no-autosave /></label>
      </> : null}
      <FormButton disabled={pending} pendingText={es ? "Preparando…" : "Preparing…"}>{es ? "Configurar aplicación autenticadora" : "Set up authenticator app"}</FormButton>
    </form>
    {state.error ? <p role="alert">{state.error}</p> : null}
    {state.factorId ? <>
      <p>{es ? "Escanea el QR en tu aplicación autenticadora o introduce la clave manualmente. Guárdala de forma segura." : "Scan the QR in your authenticator app or enter the key manually. Store it securely."}</p>
      {/* The enrollment QR is intentionally displayed once, with no local draft storage. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={state.qr} width={220} height={220} alt={es ? "QR para configurar TOTP" : "TOTP setup QR"} />
      <p className="break-all font-mono">{state.secret}</p>
      <form action={verifyMfaAction} className="space-y-3" autoComplete="off">
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="factor_id" value={state.factorId} />
        <label className="block">{es ? "Código de seis cifras" : "Six-digit code"}<input className="field-control" name="code" autoComplete="one-time-code" inputMode="numeric" pattern="[0-9]{6}" required maxLength={6} data-no-autosave /></label>
        <FormButton pendingText={es ? "Verificando…" : "Verifying…"}>{es ? "Verificar y activar" : "Verify and enable"}</FormButton>
      </form>
    </> : null}
  </div>;
}
