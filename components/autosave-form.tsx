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
  autoComplete,
}: {
  children: React.ReactNode;
  storageKey: string;
  savedLabel?: string;
  restoredLabel?: string;
  className?: string;
  action?: (formData: FormData) => Promise<void>;
  onSubmit?: React.FormEventHandler<HTMLFormElement>;
  autoComplete?: React.HTMLInputAutoCompleteAttribute;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const timerRef = useRef<number | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const rawDraft = window.localStorage.getItem(storageKey);
    if (!rawDraft || !formRef.current) return;
    let statusTimer: number | undefined;

    try {
      const draft = JSON.parse(rawDraft) as DraftEntry[];
      const controls = Array.from(formRef.current.elements).filter(
        (element): element is HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement =>
          element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement,
      );

      draft.forEach(([name, value, position]) => {
        const matching = controls.filter((control) => control.name === name);
        const control = matching[position];
        if (!control || control instanceof HTMLInputElement && ["password", "file", "hidden"].includes(control.type)) return;
        if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
          control.checked = value === "true";
        } else {
          control.value = value;
        }
        control.dispatchEvent(new Event("input", { bubbles: true }));
        control.dispatchEvent(new Event("change", { bubbles: true }));
      });
      statusTimer = window.setTimeout(() => setStatus(restoredLabel), 0);
    } catch {
      window.localStorage.removeItem(storageKey);
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
        if (control instanceof HTMLInputElement && ["password", "file", "hidden", "submit"].includes(control.type)) return;
        const position = counts.get(control.name) ?? 0;
        counts.set(control.name, position + 1);
        const value = control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")
          ? String(control.checked)
          : control.value;
        entries.push([control.name, value, position]);
      });

      window.localStorage.setItem(storageKey, JSON.stringify(entries));
      setStatus(savedLabel);
    }, 450);
  }

  return (
    <form
      ref={formRef}
      action={action}
      onSubmit={(event) => {
        window.localStorage.removeItem(storageKey);
        onSubmit?.(event);
      }}
      onInput={saveDraft}
      onChange={saveDraft}
      autoComplete={autoComplete}
      className={className}
    >
      <p className="autosave-status" aria-live="polite">{status}</p>
      {children}
    </form>
  );
}
