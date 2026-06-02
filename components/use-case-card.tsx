export function UseCaseCard({ title, description }: { title: string; description: string }) {
  return (
    <article className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
    </article>
  );
}
