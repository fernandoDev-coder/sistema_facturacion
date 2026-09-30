"use client";

import { useEffect } from "react";
import Link from "next/link";
import { buttonClass } from "@/components/button-styles";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-zinc-50 px-4 py-10 text-zinc-950">
      <section className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-red-700">Error</p>
        <h1 className="mt-3 text-2xl font-semibold">No hemos podido cargar esta pantalla</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-600">
          Tus datos no se han borrado. Puedes reintentar la operación o volver al inicio.
        </p>
        {error.digest ? <p className="mt-3 text-xs text-zinc-500">Referencia: {error.digest}</p> : null}
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <button type="button" onClick={unstable_retry} className={buttonClass({ variant: "primary", size: "full" })}>
            Reintentar
          </button>
          <Link href="/" className={buttonClass({ variant: "secondary", size: "full" })}>
            Volver al inicio
          </Link>
        </div>
      </section>
    </main>
  );
}
