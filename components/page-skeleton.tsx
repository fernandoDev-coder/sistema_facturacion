export function PageSkeleton({ compact = false, asMain = true }: { compact?: boolean; asMain?: boolean }) {
  const content = (
    <>
      <h1 className="sr-only">Cargando contenido</h1>
      <div className="skeleton h-5 w-28" />
      <div className="skeleton mt-5 h-10 w-full max-w-xl" />
      <div className="skeleton mt-3 h-5 w-full max-w-2xl" />
      <div className={`mt-8 grid gap-4 ${compact ? "sm:grid-cols-2" : "md:grid-cols-3"}`}>
        {Array.from({ length: compact ? 2 : 6 }, (_, index) => (
          <div key={index} className="rounded-xl border border-zinc-200 bg-white p-5">
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton mt-4 h-4 w-full" />
            <div className="skeleton mt-2 h-4 w-4/5" />
            <div className="skeleton mt-6 h-10 w-28" />
          </div>
        ))}
      </div>
    </>
  );

  const classes = "mx-auto w-full max-w-6xl animate-pulse px-4 py-8 sm:px-6 lg:px-8";
  return asMain ? (
    <main className={classes} aria-busy="true" aria-label="Cargando">{content}</main>
  ) : (
    <div className={classes} role="status" aria-busy="true" aria-label="Cargando">{content}</div>
  );
}
