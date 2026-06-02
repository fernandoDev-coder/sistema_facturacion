export function UsageLimitIndicator({
  label,
  used,
  limit,
  unlimitedLabel,
  warning,
}: {
  label: string;
  used: number;
  limit: number | null;
  unlimitedLabel: string;
  warning?: string | null;
}) {
  const capped = limit !== null;
  const percent = capped ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const reached = capped && used >= limit;

  return (
    <div className={`rounded-lg border bg-white p-5 shadow-sm ${reached ? "border-amber-300" : "border-zinc-200"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-zinc-950">{capped ? `${used} / ${limit}` : used}</p>
        </div>
        <span className="rounded-md border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-semibold text-zinc-600">
          {capped ? `${percent}%` : unlimitedLabel}
        </span>
      </div>
      {capped ? (
        <div className="mt-4 h-2 rounded-full bg-zinc-100">
          <div className={`h-2 rounded-full ${reached ? "bg-amber-500" : "bg-blue-700"}`} style={{ width: `${percent}%` }} />
        </div>
      ) : null}
      {warning ? <p className="mt-3 text-sm leading-6 text-amber-800">{warning}</p> : null}
    </div>
  );
}
