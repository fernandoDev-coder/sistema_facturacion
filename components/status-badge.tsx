import type { InvoiceStatus } from "@/lib/types";

const defaultLabels: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  issued: "Emitida",
  cancelled: "Anulada",
  corrective: "Rectificativa",
};

const classes: Record<InvoiceStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  issued: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-red-50 text-red-800 ring-red-200",
  corrective: "bg-blue-50 text-blue-800 ring-blue-200",
};

export function StatusBadge({ status, labels = defaultLabels }: { status: InvoiceStatus; labels?: Readonly<Record<InvoiceStatus, string>> }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}
