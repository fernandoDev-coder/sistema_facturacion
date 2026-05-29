"use client";

import { buttonClass } from "@/components/button-styles";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonClass({ variant: "print", className: "print:hidden" })}
    >
      {label}
    </button>
  );
}
