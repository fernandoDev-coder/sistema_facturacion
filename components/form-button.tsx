"use client";

import { useFormStatus } from "react-dom";

type FormButtonProps = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
};

export function FormButton({ children, className = "", pendingText = "Guardando..." }: FormButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-10 items-center justify-center rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
