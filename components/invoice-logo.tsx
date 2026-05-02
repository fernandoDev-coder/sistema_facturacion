"use client";

import { useState } from "react";

export function InvoiceLogo() {
  const [available, setAvailable] = useState(true);

  if (!available) return null;

  return (
    // Plain img keeps this compatible with user-replaced assets in /public.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/invoice-assets/logo.jpg"
      alt="Logo de empresa"
      className="mb-5 h-20 max-w-56 object-contain object-left"
      onError={() => setAvailable(false)}
    />
  );
}
