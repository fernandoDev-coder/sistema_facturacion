"use client";

import { useMemo, useState } from "react";
import { buttonClass } from "@/components/button-styles";
import { FormButton } from "@/components/form-button";
import { money, monthNames as defaultMonthNames } from "@/lib/format";
import { invoiceStatuses, type Community, type DocumentType, type Invoice, type InvoiceItem, type InvoiceStatus } from "@/lib/types";

type DocumentFormLabels = {
  invoice: string;
  budget: string;
  client: string;
  numberOf: string;
  dateOf: string;
  month: string;
  year: string;
  status: string;
  concepts: string;
  conceptsHelp: string;
  addConcept: string;
  concept: string;
  base: string;
  vatPercent: string;
  remove: string;
  baseTotal: string;
  vatCalculated: string;
  total: string;
  notes: string;
  create: string;
  save: string;
};

type InvoiceFormProps = {
  action: (formData: FormData) => Promise<void>;
  communities: Community[];
  documentType: DocumentType;
  invoice?: Invoice;
  items?: InvoiceItem[];
  suggestedNumber?: string;
  labels?: Readonly<DocumentFormLabels>;
  months?: readonly string[];
  statusLabels?: Readonly<Record<InvoiceStatus, string>>;
};

type LineItem = {
  description: string;
  amount: string;
  vat_rate: string;
};

const defaultLabels: DocumentFormLabels = {
  invoice: "factura",
  budget: "presupuesto",
  client: "Cliente",
  numberOf: "Número de",
  dateOf: "Fecha de",
  month: "Mes",
  year: "Año",
  status: "Estado",
  concepts: "Conceptos",
  conceptsHelp: "Cada línea tiene su descripción, base e IVA.",
  addConcept: "Añadir concepto",
  concept: "Concepto",
  base: "Base",
  vatPercent: "IVA %",
  remove: "Quitar",
  baseTotal: "Base total",
  vatCalculated: "IVA calculado",
  total: "Total",
  notes: "Observaciones",
  create: "Crear",
  save: "Guardar cambios",
};

const defaultStatusLabels: Record<InvoiceStatus, string> = {
  draft: "Borrador",
  pending: "Pendiente",
  paid: "Pagada",
  cancelled: "Cancelada",
};

export function InvoiceForm({
  action,
  communities,
  documentType,
  invoice,
  items = [],
  suggestedNumber,
  labels = defaultLabels,
  months = defaultMonthNames,
  statusLabels = defaultStatusLabels,
}: InvoiceFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const label = labels[documentType];
  const [communityId, setCommunityId] = useState(invoice?.community_id ?? communities[0]?.id ?? "");
  const [lineItems, setLineItems] = useState<LineItem[]>(() => {
    if (items.length) {
      return items.map((item) => ({
        description: item.description,
        amount: String(item.amount),
        vat_rate: String(item.vat_rate),
      }));
    }

    return [
      {
        description: invoice?.subject ?? selectedCommunity(communityId)?.default_subject ?? "",
        amount: String(invoice?.amount ?? 0),
        vat_rate: String(invoice?.vat_rate ?? selectedCommunity(communityId)?.default_vat ?? 21),
      },
    ];
  });

  const totals = useMemo(() => {
    return lineItems.reduce(
      (acc, item) => {
        const amount = parseNumber(item.amount);
        const vatRate = parseNumber(item.vat_rate);
        const vatAmount = Math.round(((amount * vatRate) / 100 + Number.EPSILON) * 100) / 100;

        acc.amount += amount;
        acc.vatAmount += vatAmount;
        acc.total += amount + vatAmount;
        return acc;
      },
      { amount: 0, vatAmount: 0, total: 0 },
    );
  }, [lineItems]);

  const summarySubject = useMemo(
    () =>
      lineItems
        .map((item) => item.description.trim())
        .filter(Boolean)
        .join(" | "),
    [lineItems],
  );

  const summaryVatRate = useMemo(() => {
    const uniqueRates = Array.from(new Set(lineItems.map((item) => String(parseNumber(item.vat_rate)))));
    return uniqueRates.length === 1 ? uniqueRates[0] ?? "0" : "0";
  }, [lineItems]);

  function selectedCommunity(id: string) {
    return communities.find((community) => community.id === id);
  }

  function handleCommunityChange(id: string) {
    const community = selectedCommunity(id);
    setCommunityId(id);
    setLineItems((current) =>
      current.map((item, index) =>
        index === 0 && !item.description.trim()
          ? { ...item, description: community?.default_subject ?? "", vat_rate: String(community?.default_vat ?? 21) }
          : item,
      ),
    );
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    setLineItems((current) => current.map((item, currentIndex) => (currentIndex === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setLineItems((current) => [...current, { description: "", amount: "0", vat_rate: String(selectedCommunity(communityId)?.default_vat ?? 21) }]);
  }

  function removeItem(index: number) {
    setLineItems((current) => (current.length === 1 ? current : current.filter((_, currentIndex) => currentIndex !== index)));
  }

  return (
    <form action={action} className="space-y-6">
      {invoice ? <input type="hidden" name="id" value={invoice.id} /> : null}
      <input type="hidden" name="document_type" value={documentType} />
      <input type="hidden" name="subject" value={summarySubject} />
      <input type="hidden" name="amount" value={totals.amount.toFixed(2)} />
      <input type="hidden" name="vat_rate" value={summaryVatRate} />
      <input type="hidden" name="items_json" value={JSON.stringify(lineItems)} />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">{labels.client}</span>
          <select
            name="community_id"
            required
            value={communityId}
            onChange={(event) => handleCommunityChange(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            {communities.map((community) => (
              <option key={community.id} value={community.id}>
                {community.name}
              </option>
            ))}
          </select>
        </label>

        <Field
          label={`${labels.numberOf} ${label}`}
          name="invoice_number"
          required
          defaultValue={invoice?.invoice_number ?? suggestedNumber}
        />
        <Field
          label={`${labels.dateOf} ${label}`}
          name="invoice_date"
          type="date"
          required
          defaultValue={invoice?.invoice_date ?? today}
        />
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">{labels.month}</span>
          <select
            name="month"
            required
            defaultValue={invoice?.month ?? new Date().getMonth() + 1}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            {months.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <Field label={labels.year} name="year" type="number" required defaultValue={invoice?.year ?? new Date().getFullYear()} />
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">{labels.status}</span>
          <select
            name="status"
            defaultValue={invoice?.status ?? "draft"}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            {invoiceStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {statusLabels[status.value]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">{labels.concepts}</h2>
            <p className="mt-1 text-sm text-zinc-600">{labels.conceptsHelp}</p>
          </div>
          <button type="button" onClick={addItem} className={buttonClass({ variant: "secondary", size: "sm" })}>
            {labels.addConcept}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {lineItems.map((item, index) => (
            <div key={index} className="grid gap-3 rounded-md border border-zinc-200 bg-white p-3 md:grid-cols-[minmax(0,1fr)_140px_120px_88px]">
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">{labels.concept}</span>
                <textarea
                  required
                  rows={3}
                  value={item.description}
                  onChange={(event) => updateItem(index, { description: event.target.value })}
                  className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">{labels.base}</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={item.amount}
                  onChange={(event) => updateItem(index, { amount: event.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">{labels.vatPercent}</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={item.vat_rate}
                  onChange={(event) => updateItem(index, { vat_rate: event.target.value })}
                  className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  disabled={lineItems.length === 1}
                  className={buttonClass({ variant: "danger", size: "sm", className: "w-full" })}
                >
                  {labels.remove}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <Summary label={labels.baseTotal} value={totals.amount} />
        <Summary label={labels.vatCalculated} value={totals.vatAmount} />
        <Summary label={labels.total} value={totals.total} />
      </div>

      <label className="block">
        <span className="text-sm font-medium text-zinc-800">{labels.notes}</span>
        <textarea
          name="notes"
          defaultValue={invoice?.notes ?? ""}
          rows={4}
          className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        />
      </label>

      <FormButton>{invoice ? labels.save : `${labels.create} ${label}`}</FormButton>
    </form>
  );
}

function Summary({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-xl font-semibold">{money(value)}</p>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue"> & {
  label: string;
  name: string;
  defaultValue?: string | number | null;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        {...props}
      />
    </label>
  );
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}
