"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/button-styles";
import { useDocumentEnglish } from "@/components/use-document-english";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  const en = useDocumentEnglish();
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 text-center sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">Error</p>
        <h1 className="mt-3 text-2xl font-semibold">{en ? "We could not load this screen" : "No hemos podido cargar esta pantalla"}</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          {en ? "Try again or return home. Check the result before repeating an operation." : "Puedes reintentar o volver al inicio. Comprueba el resultado antes de repetir una operación."}
        </p>
        {error.digest ? <p className="mt-3 text-xs text-zinc-500">{en ? "Reference" : "Referencia"}: {error.digest}</p> : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={unstable_retry} className={buttonClass({ variant: "primary", size: "full" })}>
            {en ? "Try again" : "Reintentar"}
          </button>
          <Link href="/" className={buttonClass({ variant: "secondary", size: "full" })}>
            {en ? "Back home" : "Volver al inicio"}
          </Link>
        </div>
      </section>
    </main>
  );
}
