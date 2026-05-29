"use client";

import { useMemo, useState } from "react";
import { createMonthlyInvoicesAction } from "@/app/actions/invoices";
import { FormButton } from "@/components/form-button";
import { monthNames as defaultMonthNames } from "@/lib/format";
import type { Community } from "@/lib/types";

type ExistingInvoiceKey = {
  community_id: string;
  month: number;
  year: number;
};

type CreateMonthLabels = {
  previewTitle: string;
  selectedFor: string;
  alreadyHaveInvoice: string;
  selectOne: string;
  duplicatesConfirm: string;
  createConfirmStart: string;
  createConfirmEnd: string;
  include: string;
  client: string;
  concept: string;
  base: string;
  vat: string;
  duplicate: string;
  monthlyService: string;
  pending: string;
  createSelected: string;
};

type CreateMonthFormProps = {
  communities: Community[];
  existingInvoices: ExistingInvoiceKey[];
  initialMonth: number;
  initialYear: number;
  labels?: Readonly<CreateMonthLabels>;
  months?: readonly string[];
  monthLabel?: string;
  yearLabel?: string;
};

const defaultLabels: CreateMonthLabels = {
  previewTitle: "Vista previa de generación",
  selectedFor: "clientes seleccionados para",
  alreadyHaveInvoice: "ya tienen factura en ese mes.",
  selectOne: "Selecciona al menos un cliente.",
  duplicatesConfirm: "Ya existen facturas para algún cliente seleccionado en ese mes. ¿Quieres crear duplicados?",
  createConfirmStart: "Vas a crear",
  createConfirmEnd: "facturas en borrador. ¿Quieres continuar?",
  include: "Incluir",
  client: "Cliente",
  concept: "Concepto",
  base: "Base",
  vat: "IVA",
  duplicate: "Ya tiene factura en este mes.",
  monthlyService: "Servicio mensual",
  pending: "Creando...",
  createSelected: "Crear facturas seleccionadas",
};

export function CreateMonthForm({
  communities,
  existingInvoices,
  initialMonth,
  initialYear,
  labels = defaultLabels,
  months = defaultMonthNames,
  monthLabel = "Mes",
  yearLabel = "Año",
}: CreateMonthFormProps) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [selected, setSelected] = useState(() => new Set(communities.map((community) => community.id)));
  const [confirmDuplicates, setConfirmDuplicates] = useState("no");

  const duplicateKeys = useMemo(
    () => new Set(existingInvoices.map((invoice) => `${invoice.community_id}-${invoice.year}-${invoice.month}`)),
    [existingInvoices],
  );
  const selectedIds = Array.from(selected);
  const duplicateCount = selectedIds.filter(hasDuplicate).length;

  function hasDuplicate(communityId: string) {
    return duplicateKeys.has(`${communityId}-${year}-${month}`);
  }

  return (
    <form
      action={createMonthlyInvoicesAction}
      onSubmit={(event) => {
        const duplicates = selectedIds.filter(hasDuplicate);

        if (selectedIds.length === 0) {
          window.alert(labels.selectOne);
          event.preventDefault();
          return;
        }

        if (duplicates.length > 0 && confirmDuplicates !== "yes") {
          const accepted = window.confirm(labels.duplicatesConfirm);

          if (!accepted) {
            event.preventDefault();
            return;
          }

          const input = event.currentTarget.elements.namedItem("confirm_duplicates") as HTMLInputElement | null;
          if (input) input.value = "yes";
          setConfirmDuplicates("yes");
        }

        const accepted = window.confirm(
          `${labels.createConfirmStart} ${selectedIds.length} ${labels.createConfirmEnd}`,
        );

        if (!accepted) {
          event.preventDefault();
        }
      }}
      className="space-y-6"
    >
      <input type="hidden" name="confirm_duplicates" value={confirmDuplicates} />
      <section className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
        <p className="font-semibold">{labels.previewTitle}</p>
        <p className="mt-1">
          {selectedIds.length} {labels.selectedFor} {months[month - 1]} {year}.
          {duplicateCount > 0 ? ` ${duplicateCount} ${labels.alreadyHaveInvoice}` : ""}
        </p>
      </section>

      <div className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-2">
        <label>
          <span className="text-sm font-medium text-zinc-800">{monthLabel}</span>
          <select
            name="month"
            value={month}
            onChange={(event) => {
              setMonth(Number(event.target.value));
              setConfirmDuplicates("no");
            }}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
          >
            {months.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium text-zinc-800">{yearLabel}</span>
          <input
            name="year"
            type="number"
            value={year}
            onChange={(event) => {
              setYear(Number(event.target.value));
              setConfirmDuplicates("no");
            }}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
          />
        </label>
      </div>

      <div className="overflow-hidden rounded-md border border-zinc-200 bg-white">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="w-14 px-4 py-3">{labels.include}</th>
              <th className="px-4 py-3">{labels.client}</th>
              <th className="px-4 py-3">{labels.concept}</th>
              <th className="w-36 px-4 py-3">{labels.base}</th>
              <th className="w-28 px-4 py-3">{labels.vat}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {communities.map((community) => (
              <tr key={community.id} className={hasDuplicate(community.id) ? "bg-amber-50/60" : ""}>
                <td className="px-4 py-3 align-top">
                  <input
                    type="checkbox"
                    name="include"
                    value={community.id}
                    checked={selected.has(community.id)}
                    onChange={(event) => {
                      const next = new Set(selected);
                      if (event.target.checked) next.add(community.id);
                      else next.delete(community.id);
                      setSelected(next);
                      setConfirmDuplicates("no");
                    }}
                    className="h-4 w-4 rounded border-zinc-300"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <p className="font-medium text-zinc-900">{community.name}</p>
                  {hasDuplicate(community.id) ? (
                    <p className="mt-1 text-xs text-amber-700">{labels.duplicate}</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top">
                  <textarea
                    key={`${community.id}-${month}-${year}`}
                    name={`subject_${community.id}`}
                    defaultValue={community.default_subject ?? `${labels.monthlyService} ${months[month - 1]} ${year}`}
                    rows={3}
                    className="w-full min-w-[28rem] rounded-md border border-zinc-300 px-3 py-2 text-sm leading-6"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    name={`amount_${community.id}`}
                    type="number"
                    step="0.01"
                    defaultValue="0"
                    className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
                  />
                </td>
                <td className="px-4 py-3 align-top">
                  <input
                    name={`vat_${community.id}`}
                    type="number"
                    step="0.01"
                    defaultValue={community.default_vat ?? 21}
                    className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormButton variant="success" pendingText={labels.pending}>
        {labels.createSelected}
      </FormButton>
    </form>
  );
}
