"use client";

import { useMemo, useState } from "react";
import { FormButton } from "@/components/form-button";
import { money, monthNames } from "@/lib/format";
import { invoiceStatuses, type Community, type Invoice } from "@/lib/types";

type InvoiceFormProps = {
  action: (formData: FormData) => Promise<void>;
  communities: Community[];
  invoice?: Invoice;
  suggestedNumber?: string;
};

export function InvoiceForm({ action, communities, invoice, suggestedNumber }: InvoiceFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [communityId, setCommunityId] = useState(invoice?.community_id ?? communities[0]?.id ?? "");
  const [subject, setSubject] = useState(invoice?.subject ?? selectedCommunity(communityId)?.default_subject ?? "");
  const [amount, setAmount] = useState(String(invoice?.amount ?? 0));
  const [vatRate, setVatRate] = useState(String(invoice?.vat_rate ?? selectedCommunity(communityId)?.default_vat ?? 21));

  const totals = useMemo(() => {
    const base = parseNumber(amount);
    const vat = parseNumber(vatRate);
    const vatAmount = Math.round(((base * vat) / 100 + Number.EPSILON) * 100) / 100;
    return { vatAmount, total: Math.round((base + vatAmount + Number.EPSILON) * 100) / 100 };
  }, [amount, vatRate]);

  function selectedCommunity(id: string) {
    return communities.find((community) => community.id === id);
  }

  function handleCommunityChange(id: string) {
    const community = selectedCommunity(id);
    setCommunityId(id);
    if (community?.default_subject) setSubject(community.default_subject);
    setVatRate(String(community?.default_vat ?? 21));
  }

  return (
    <form action={action} className="space-y-6">
      {invoice ? <input type="hidden" name="id" value={invoice.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Comunidad</span>
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
          label="Número de factura"
          name="invoice_number"
          required
          defaultValue={invoice?.invoice_number ?? suggestedNumber}
        />
        <Field label="Fecha de factura" name="invoice_date" type="date" required defaultValue={invoice?.invoice_date ?? today} />
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Mes</span>
          <select
            name="month"
            required
            defaultValue={invoice?.month ?? new Date().getMonth() + 1}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <Field label="Año" name="year" type="number" required defaultValue={invoice?.year ?? new Date().getFullYear()} />
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Estado</span>
          <select
            name="status"
            defaultValue={invoice?.status ?? "draft"}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          >
            {invoiceStatuses.map((status) => (
              <option key={status.value} value={status.value}>
                {status.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-zinc-800">Asunto / concepto</span>
          <input
            name="subject"
            required
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">Importe base</span>
          <input
            name="amount"
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-zinc-800">IVA %</span>
          <input
            name="vat_rate"
            type="number"
            step="0.01"
            required
            value={vatRate}
            onChange={(event) => setVatRate(event.target.value)}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          />
        </label>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">IVA calculado</p>
          <p className="mt-1 text-xl font-semibold">{money(totals.vatAmount)}</p>
        </div>
        <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm text-zinc-500">Total</p>
          <p className="mt-1 text-xl font-semibold">{money(totals.total)}</p>
        </div>
        <label className="block md:col-span-2">
          <span className="text-sm font-medium text-zinc-800">Observaciones</span>
          <textarea
            name="notes"
            defaultValue={invoice?.notes ?? ""}
            rows={4}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>
      <FormButton>{invoice ? "Guardar cambios" : "Crear factura"}</FormButton>
    </form>
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
