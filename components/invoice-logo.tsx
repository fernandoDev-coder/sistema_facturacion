"use client";

import { useState } from "react";

const logoSources = ["/invoice-assets/logo.jpg", "/invoice-assets/logo.jpeg"];

export function InvoiceLogo() {
  const [sourceIndex, setSourceIndex] = useState(0);
  const source = logoSources[sourceIndex];

  if (!source) return null;

  return (
    // Plain img keeps this compatible with user-replaced assets in /public.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={source}
      alt="Logo de empresa"
      className="mb-5 h-20 max-w-56 object-contain object-left"
      onError={() => setSourceIndex((current) => current + 1)}
    />
  );
}
