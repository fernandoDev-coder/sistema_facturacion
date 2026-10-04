"use client";

import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => console.error(error), [error]);

  return (
    <html lang="es">
      <body>
        <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-zinc-950">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">FaktuDash</p>
            <h1 className="mt-3 text-2xl font-semibold">Algo no ha salido bien</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">El error es temporal en la mayoría de los casos.</p>
            <button type="button" onClick={unstable_retry} className="mt-6 min-h-11 rounded-md bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800">
              Reintentar
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
