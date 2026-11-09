"use client";

import { useEffect } from "react";
import { useDocumentEnglish } from "@/components/use-document-english";
import "./globals.css";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const en = useDocumentEnglish();
  useEffect(() => console.error(error), [error]);

  return (
    <html lang={en ? "en" : "es"}>
      <body>
        <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 text-zinc-950">
          <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">FaktuDash</p>
            <h1 className="mt-3 text-2xl font-semibold">{en ? "Something went wrong" : "Algo no ha salido bien"}</h1>
            <p className="mt-3 text-sm leading-6 text-zinc-600">{en ? "Try reloading the screen." : "Intenta cargar de nuevo la pantalla."}</p>
            <button type="button" onClick={unstable_retry} className="mt-6 min-h-11 rounded-md bg-blue-700 px-4 font-semibold text-white hover:bg-blue-800">
              {en ? "Try again" : "Reintentar"}
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
