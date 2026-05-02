"use client";

import { useFormStatus } from "react-dom";
import { buttonClass, type ButtonVariant } from "@/components/button-styles";

type FormButtonProps = {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  variant?: ButtonVariant;
};

export function FormButton({
  children,
  className = "",
  pendingText = "Guardando...",
  variant = "primary",
}: FormButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={buttonClass({ variant, size: className.includes("w-full") ? "full" : "md", className })}
    >
      {pending ? pendingText : children}
    </button>
  );
}
