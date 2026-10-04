"use client";

import { useState } from "react";
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    const subject = String(data.get("subject") ?? "").trim();
    const body = [
      `${labels.name}: ${String(data.get("name") ?? "").trim()}`,
      `${labels.email}: ${String(data.get("email") ?? "").trim()}`,
      "",
      String(data.get("message") ?? "").trim(),
    ].join("\n");

    setPending(true);
    setStatus(labels.sending);
    window.setTimeout(() => {
      window.location.href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      setPending(false);
      setStatus(labels.ready);
    }, 300);
  }

  return (
    <AutosaveForm
      storageKey={`faktudash-contact-${locale}`}
      savedLabel={labels.saved}
      restoredLabel={labels.restored}
      onSubmit={handleSubmit}
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
        <button type="submit" disabled={pending} className={buttonClass({ variant: "primary" })}>
          {pending ? <span className="spinner" aria-hidden="true" /> : null}
          {pending ? labels.sending : labels.send}
        </button>
        <p className="text-sm text-zinc-600" role="status">{status}</p>
      </div>
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
