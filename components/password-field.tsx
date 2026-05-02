"use client";

import { useState } from "react";

type PasswordFieldProps = {
  label?: string;
  name?: string;
  minLength?: number;
  autoComplete?: "current-password" | "new-password";
};

export function PasswordField({
  label = "Contraseña",
  name = "password",
  minLength,
  autoComplete,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <div className="mt-1 flex rounded-md border border-zinc-300 bg-white focus-within:border-slate-900 focus-within:ring-2 focus-within:ring-slate-200">
        <input
          name={name}
          type={visible ? "text" : "password"}
          minLength={minLength}
          autoComplete={autoComplete}
          required
          className="h-10 min-w-0 flex-1 rounded-l-md px-3 text-sm outline-none"
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="h-10 border-l border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          aria-pressed={visible}
        >
          {visible ? "Ocultar" : "Mostrar"}
        </button>
      </div>
    </label>
  );
}
