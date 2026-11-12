"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonVariant } from "@/components/button-styles";

type FormButtonProps = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  variant?: ButtonVariant;
  disabled?: boolean;
};

export function FormButton({
  children,
  className = "",
  pendingText = "Guardando...",
  variant = "primary",
  disabled = false,
}: FormButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className={buttonClass({ variant, size: className.includes("w-full") ? "full" : "md", className })}
    >
      {pending ? <span className="spinner" aria-hidden="true" /> : null}
      <span>{pending ? pendingText : children}</span>
    </button>
  );
}
