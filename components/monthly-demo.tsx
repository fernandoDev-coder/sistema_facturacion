"use client";

import { useState } from "react";
import { CreateMonthForm, type CreateMonthLabels } from "@/components/create-month-form";
import { buttonClass } from "@/components/button-styles";

type Draft = { client: string; base: number; tax: number; total: number };

export function MonthlyDemo({ locale, labels, months }: { locale: string; labels: Readonly<CreateMonthLabels>; months: readonly string[] }) {
  const es = locale === "es";
  const [version, setVersion] = useState(0);
  const [result, setResult] = useState<{ period: string; drafts: Draft[] } | null>(null);
  const [error, setError] = useState("");
  const communities = [
    { id: "alameda", name: "Comunidad Alameda", default_subject: es ? "Cuota de mantenimiento" : "Maintenance fee", default_vat: 21 },
    { id: "norte", name: "Comunidad Norte", default_subject: es ? "Cuota 150 € + limpieza extra 30 €" : "Fee €150 + extra cleaning €30", default_vat: 21 },
    { id: "sur", name: "Comunidad Sur", default_subject: es ? "Cuota de jardinería (omitida inicialmente)" : "Gardening fee (initially excluded)", default_vat: 21 },
  ];
  const money = (value: number) => new Intl.NumberFormat(es ? "es-ES" : "en-GB", { style: "currency", currency: "EUR" }).format(value);

  function simulate(data: FormData) {
    const month = Number(data.get("month"));
    const year = Number(data.get("year"));
    const selected = data.getAll("include").map(String);
    const drafts = communities.filter((community) => selected.includes(community.id)).map((community) => {
      const base = Number(String(data.get(`amount_${community.id}`)).replace(",", "."));
      const rate = Number(String(data.get(`vat_${community.id}`)).replace(",", "."));
      const tax = Math.round(base * rate) / 100;
      return { client: community.name, base, tax, total: Math.round((base + tax) * 100) / 100, rate };
    });
    if (!drafts.length || !Number.isInteger(month) || month < 1 || month > 12 || !Number.isInteger(year) || year < 2000 || year > 2200 || drafts.some((d) => !Number.isFinite(d.total) || d.base < 0 || d.rate < 0 || d.rate > 100)) {
      setError(es ? "Selecciona una comunidad y revisa el periodo, la base y el IVA (0–100)." : "Select a community and check the period, base and VAT (0–100).");
      return;
    }
    setError("");
    setResult({ period: `${months[month - 1]} ${year}`, drafts });
  }

  return <section id="monthly-demo" className="space-y-5">
    <h2 className="text-2xl font-semibold">{es ? "Simula el cierre mensual · Premium" : "Simulate monthly closing · Premium"}</h2>
    <p className="text-sm text-zinc-600">{es ? "Datos ficticios. Los borradores simulados no son facturas válidas para uso fiscal. No se guarda información en el servidor." : "Fictional data. Simulated drafts are not valid tax invoices. No information is saved on the server."}</p>
    <CreateMonthForm key={version} communities={communities} existingInvoices={[]} initialMonth={11} initialYear={2026}
      labels={{ ...labels, createSelected: es ? "Simular borradores" : "Simulate drafts" }} months={months}
      monthLabel={es ? "Mes" : "Month"} yearLabel={es ? "Año" : "Year"}
      initiallyExcluded={["sur"]} initialAmounts={{ alameda: 120, norte: 180, sur: 100 }} onSimulate={simulate} />
    <p role="alert">{error}</p>
    <div role="status" className="space-y-3">
      {result ? <>
        <h3 className="font-semibold">{result.period} · {result.drafts.length} {es ? "borradores simulados" : "simulated drafts"}</h3>
        <div className="overflow-x-auto" tabIndex={0}>
          <table className="w-full text-left text-sm"><thead><tr>
            {[es ? "Comunidad" : "Community", es ? "Base" : "Base", es ? "Impuestos" : "Tax", "Total"].map((label) => <th scope="col" className="p-3" key={label}>{label}</th>)}
          </tr></thead><tbody>{result.drafts.map((d) => <tr className="border-t border-zinc-200" key={d.client}><th scope="row" className="p-3">{d.client}</th><td className="p-3">{money(d.base)}</td><td className="p-3">{money(d.tax)}</td><td className="p-3">{money(d.total)}</td></tr>)}</tbody></table>
        </div>
        <p className="font-semibold">Total: {money(result.drafts.reduce((sum, d) => sum + d.total, 0))}</p>
      </> : null}
    </div>
    <button type="button" className={buttonClass({ variant: "secondary" })} onClick={() => { setVersion((v) => v + 1); setResult(null); setError(""); }}>{es ? "Reiniciar demo" : "Reset demo"}</button>
  </section>;
}
