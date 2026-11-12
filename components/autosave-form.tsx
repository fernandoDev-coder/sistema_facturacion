"use client";

import { useEffect, useRef, useState } from "react";

type DraftEntry = [string, string, number];

export function AutosaveForm({
  children,
  storageKey,
  savedLabel = "Borrador guardado",
  restoredLabel = "Borrador recuperado",
  className = "",
  action,
  onSubmit,
  onInput,
  autoComplete,
}: {
  children: React.ReactNode;
  storageKey: string;
  savedLabel?: string;
  restoredLabel?: string;
  className?: string;
  action?: (formData: FormData) => Promise<void>;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  onInput?: React.FormEventHandler<HTMLFormElement>;
  autoComplete?: React.HTMLInputAutoCompleteAttribute;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    let statusTimer: number | undefined;

    try {
      const rawDraft = window.localStorage.getItem(storageKey);
      if (!rawDraft || !formRef.current) return;
      const draft = JSON.parse(rawDraft) as DraftEntry[];
      const controls = Array.from(formRef.current.elements).filter(
        (element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
          element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement,
      );

      draft.forEach(([name, value, position]) => {
        const matching = controls.filter((control) => control.name === name);
        const control = matching[position];
        if (!control || isSensitive(control) || control instanceof HTMLInputElement && ["password", "file", "hidden"].includes(control.type)) return;
        if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "checked")?.set?.call(control, value === "true");
        } else {
          const prototype = control instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype
            : control instanceof HTMLSelectElement ? HTMLSelectElement.prototype : HTMLInputElement.prototype;
          Object.getOwnPropertyDescriptor(prototype, "value")?.set?.call(control, value);
        }
        control.dispatchEvent(new Event("input", { bubbles: true }));
        control.dispatchEvent(new Event("change", { bubbles: true }));
      });
      statusTimer = window.setTimeout(() => setStatus(restoredLabel), 0);
    } catch {
      // Storage may be unavailable; the form remains usable.
    }

    return () => {
      if (statusTimer) window.clearTimeout(statusTimer);
    };
  }, [restoredLabel, storageKey]);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
  }, []);

  function saveDraft() {
    if (!formRef.current) return;
    if (timerRef.current) window.clearTimeout(timerRef.current);

    timerRef.current = window.setTimeout(() => {
      if (!formRef.current) return;
      const counts = new Map<string, number>();
      const entries: DraftEntry[] = [];
      const controls = Array.from(formRef.current.elements).filter(
        (element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
          element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement,
      );

      controls.forEach((control) => {
        if (!control.name || control.disabled) return;
        if (isSensitive(control)) return;
        if (control instanceof HTMLInputElement && ["password", "file", "hidden", "submit"].includes(control.type)) return;
        const position = counts.get(control.name) ?? 0;
        counts.set(control.name, position + 1);
        const value = control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")
          ? String(control.checked)
          : control.value;
        entries.push([control.name, value, position]);
      });

      try {
        window.localStorage.setItem(storageKey, JSON.stringify(entries));
        setStatus(savedLabel);
      } catch {
        setStatus("");
      }
    }, 450);
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(event) => {
        onSubmit?.(event);
      }}
      onInput={(event) => { onInput?.(event); saveDraft(); }}
      onChange={saveDraft}
      autoComplete={autoComplete}
      className={className}
    >
      <p className="autosave-status" aria-live="polite">{status}</p>
      {children}
    </form>
  );
}

function isSensitive(control: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) {
  return control.autocomplete === "one-time-code" || control.dataset.noAutosave !== undefined
    || /password|secret|token|otp|mfa|recovery/i.test(control.name) || control.name === "code";
}
