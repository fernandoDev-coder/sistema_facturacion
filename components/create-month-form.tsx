"use client";

import { useMemo, useState } from "react";
import { createMonthlyInvoicesAction } from "@/app/actions/invoices";
import { FormButton } from "@/components/form-button";
import { monthNames } from "@/lib/format";
import type { Community } from "@/lib/types";

type ExistingInvoiceKey = {
  community_id: string;
  month: number;
  year: number;
};

export function CreateMonthForm({
  communities,
  existingInvoices,
  initialMonth,
  initialYear,
}: {
  communities: Community[];
  existingInvoices: ExistingInvoiceKey[];
  initialMonth: number;
  initialYear: number;
}) {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [selected, setSelected] = useState(() => new Set(communities.map((community) => community.id)));
  const [confirmDuplicates, setConfirmDuplicates] = useState("no");

  const duplicateKeys = useMemo(
    () => new Set(existingInvoices.map((invoice) => `${invoice.community_id}-${invoice.year}-${invoice.month}`)),
    [existingInvoices],
  );

  function hasDuplicate(communityId: string) {
    return duplicateKeys.has(`${communityId}-${year}-${month}`);
  }

  return (
    <form
      action={createMonthlyInvoicesAction}
      onSubmit={(event) => {
        const selectedIds = Array.from(selected);
        const duplicates = selectedIds.filter(hasDuplicate);

        if (duplicates.length > 0 && confirmDuplicates !== "yes") {
          const accepted = window.confirm(
            "Ya existen facturas para alguna comunidad seleccionada en ese mes. ¿Quieres crear duplicados?",
          );

          if (!accepted) {
            event.preventDefault();
            return;
          }

          const input = event.currentTarget.elements.namedItem("confirm_duplicates") as HTMLInputElement | null;
          if (input) input.value = "yes";
          setConfirmDuplicates("yes");
        }
      }}
      className="space-y-6"
    >
      <input type="hidden" name="confirm_duplicates" value={confirmDuplicates} />
      <div className="grid gap-4 rounded-md border border-zinc-200 bg-white p-4 md:grid-cols-2">
        <label>
          <span className="text-sm font-medium text-zinc-800">Mes</span>
          <select
            name="month"
            value={month}
            onChange={(event) => {
              setMonth(Number(event.target.value));
              setConfirmDuplicates("no");
            }}
            className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm"
          >
            {monthNames.map((name, index) => (
              <option key={name} value={index + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="text-sm font-medium text-zinc-800">Año</span>
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
              <th className="w-14 px-4 py-3">Incluir</th>
              <th className="px-4 py-3">Comunidad</th>
              <th className="px-4 py-3">Concepto</th>
              <th className="w-36 px-4 py-3">Base</th>
              <th className="w-28 px-4 py-3">IVA</th>
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
                    <p className="mt-1 text-xs text-amber-700">Ya tiene factura en este mes.</p>
                  ) : null}
                </td>
                <td className="px-4 py-3 align-top">
                  <textarea
                    name={`subject_${community.id}`}
                    defaultValue={community.default_subject ?? `Cuota comunidad ${monthNames[month - 1]} ${year}`}
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

      <FormButton variant="success" pendingText="Creando...">
        Crear facturas seleccionadas
      </FormButton>
    </form>
  );
}
