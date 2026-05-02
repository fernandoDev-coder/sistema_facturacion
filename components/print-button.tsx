"use client";

import { buttonClass } from "@/components/button-styles";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className={buttonClass({ variant: "print", className: "print:hidden" })}
    >
      Imprimir
    </button>
  );
}
