import type { InvoiceStatus } from "@/lib/types";

const labels: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  paid: "Pagada",
  cancelled: "Cancelada",
};

const classes: Record<InvoiceStatus, string> = {
  draft: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  pending: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelled: "bg-red-50 text-red-800 ring-red-200",
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}
