"use client";

import { useRef, useState } from "react";
import { AutosaveForm } from "@/components/autosave-form";
import { buttonClass } from "@/components/button-styles";

type ContactLabels = {
  name: string;
  email: string;
  subject: string;
  message: string;
  send: string;
  sending: string;
  ready: string;
  saved: string;
  restored: string;
};

export function ContactForm({ email, labels, locale }: { email: string; labels: ContactLabels; locale: string }) {
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const preparing = useRef(false);
  const es = locale === "es";

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preparing.current || !email) return;
    const form = event.currentTarget;
    for (const control of Array.from(form.elements)) {
      if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement)) continue;
      control.value = control.value.trim();
      control.setCustomValidity(control.required && control.value.length < Math.max(1, control.minLength)
        ? (es ? "Completa este campo con texto suficiente, sin contar espacios al principio o al final." : "Complete this field with enough text, excluding surrounding spaces.")
        : "");
    }
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const subject = String(data.get("subject") ?? "").trim();
    const body = [
      `${labels.name}: ${String(data.get("name") ?? "").trim()}`,
      `${labels.email}: ${String(data.get("email") ?? "").trim()}`,
      "",
      String(data.get("message") ?? "").trim(),
    ].join("\n");

    preparing.current = true;
    setPending(true);
    setStatus(labels.sending);
    window.setTimeout(() => {
      try {
        window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setStatus(labels.ready);
      } catch {
        setStatus(es ? "No se pudo abrir el correo. Copia la dirección y envíalo manualmente." : "Could not open email. Copy the address and send it manually.");
      } finally {
        preparing.current = false;
        setPending(false);
      }
    }, 300);
  }

  return (
    <AutosaveForm
      storageKey={`faktudash-contact-${locale}`}
      savedLabel={labels.saved}
      restoredLabel={labels.restored}
      onSubmit={handleSubmit}
      onInput={(event) => {
        const control = event.target;
        if (control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement) control.setCustomValidity("");
      }}
      className="space-y-4"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={labels.name} name="name" autoComplete="name" required maxLength={80} />
        <Field label={labels.email} name="email" type="email" autoComplete="email" required maxLength={160} />
      </div>
      <Field label={labels.subject} name="subject" required minLength={4} maxLength={120} />
      <label className="block">
        <span className="field-label">{labels.message}</span>
        <textarea name="message" required minLength={20} maxLength={2000} rows={6} className="field-control resize-y" />
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={pending || !email} className={buttonClass({ variant: "primary" })}>
          {pending ? <span className="spinner" aria-hidden="true" /> : null}
          {pending ? labels.sending : labels.send}
        </button>
        <p className="text-sm text-zinc-600" role="status">{status}</p>
      </div>
      {email ? (
        <div className="space-y-2 text-sm text-zinc-600">
          <p>{es ? "Debes revisar y enviar el mensaje desde tu aplicación de correo. Si no se abre, copia esta dirección:" : "Review and send the message in your email app. If it does not open, copy this address:"}</p>
          <p className="break-all">{email}</p>
          <button type="button" className={buttonClass({ variant: "secondary" })} onClick={async () => {
            try {
              await navigator.clipboard.writeText(email);
              setStatus(es ? "Dirección copiada." : "Address copied.");
            } catch {
              setStatus(es ? "No se pudo copiar. Selecciona la dirección y cópiala manualmente." : "Could not copy. Select the address and copy it manually.");
            }
          }}>{es ? "Copiar dirección" : "Copy address"}</button>
        </div>
      ) : <p role="status">{es ? "El contacto estará disponible cuando termine la configuración." : "Contact will be available once configuration is complete."}</p>}
    </AutosaveForm>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      <input {...props} className="field-control" />
    </label>
  );
}
