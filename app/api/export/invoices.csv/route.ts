import { NextResponse } from "next/server";
import { createAuditLog } from "@/lib/audit";
import { canExportInvoices, getProfileForLimits } from "@/lib/plan-limits";
import { createClient } from "@/lib/supabase/server";
import { invoiceStatuses, type InvoiceStatus, type InvoiceWithCommunity } from "@/lib/types";

const maxExportRangeDays = 366;
const csvHeaders = [
  "numero_factura",
  "fecha_emision",
  "fecha_vencimiento",
  "cliente_nombre",
  "cliente_nif",
  "base_imponible",
  "iva_porcentaje",
  "iva_importe",
  "irpf_porcentaje",
  "irpf_importe",
  "total",
  "estado",
  "serie",
  "numero_secuencial",
  "emitida_en",
  "anulada_en",
  "estado_fiscal",
  "metodo_pago",
  "concepto",
  "notas",
] as const;

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return csvError("No autenticado.", 401);
  }

  const profile = await getProfileForLimits(supabase, user.id);

  if (!canExportInvoices(profile)) {
    return csvError("La exportacion CSV esta disponible en Pro y Premium.", 403);
  }

  const url = new URL(request.url);
  const from = parseDateParam(url.searchParams.get("from"));
  const to = parseDateParam(url.searchParams.get("to"));
  const status = parseStatusParam(url.searchParams.get("status"));
  const clientId = cleanOptionalParam(url.searchParams.get("clientId"));

  if (!from || !to) {
    return csvError("Fechas no validas. Usa from=YYYY-MM-DD&to=YYYY-MM-DD.", 400);
  }

  if (from > to) {
    return csvError("La fecha desde no puede ser posterior a la fecha hasta.", 400);
  }

  if (daysBetween(from, to) > maxExportRangeDays) {
    return csvError("El rango maximo por exportacion es de 1 año.", 400);
  }

  if (url.searchParams.get("status") && !status) {
    return csvError("Estado no valido.", 400);
  }

  if (clientId) {
    const { data: client, error: clientError } = await supabase
      .from("communities")
      .select("id")
      .eq("id", clientId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (clientError || !client) {
      return csvError("Cliente no encontrado.", 404);
    }
  }

  let query = supabase
    .from("invoices")
    .select("*, communities(id,name,tax_id,city)")
    .eq("owner_id", user.id)
    .eq("document_type", "invoice")
    .gte("invoice_date", from)
    .lte("invoice_date", to)
    .order("invoice_date", { ascending: true })
    .order("invoice_number", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  if (clientId) {
    query = query.eq("community_id", clientId);
  }

  const { data, error } = await query;

  if (error) {
    return csvError(error.message, 500);
  }

  const invoices = (data ?? []) as InvoiceWithCommunity[];

  if (!invoices.length) {
    return csvError("No hay facturas para exportar en este periodo.", 404);
  }

  const csv = toCsv(invoices);
  const filename = `facturas-${from}-a-${to}.csv`;

  try {
    await createAuditLog(supabase, user.id, "invoice_export", user.id, "csv_export_generated", {
      from,
      to,
      status,
      client_filtered: Boolean(clientId),
      row_count: invoices.length,
    });
  } catch (error) {
    return csvError((error as Error).message, 500);
  }

  return new Response(`\uFEFF${csv}`, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

function toCsv(invoices: InvoiceWithCommunity[]) {
  const rows = invoices.map((invoice) => [
    invoice.invoice_number,
    invoice.invoice_date,
    "",
    invoice.communities?.name ?? invoice.community_name ?? "",
    invoice.communities?.tax_id ?? invoice.community_tax_id ?? "",
    formatCsvNumber(invoice.amount),
    formatCsvNumber(invoice.vat_rate),
    formatCsvNumber(invoice.vat_amount),
    "",
    "",
    formatCsvNumber(invoice.total),
    invoice.status,
    invoice.invoice_series ?? "",
    invoice.sequential_number ?? "",
    invoice.issued_at ?? "",
    invoice.cancelled_at ?? "",
    invoice.fiscal_status,
    "",
    invoice.subject,
    invoice.notes ?? "",
  ]);

  return [csvHeaders, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function csvCell(value: string | number) {
  const stringValue = String(value ?? "");
  const safeValue = /^[=+\-@\t]/.test(stringValue) ? `'${stringValue}` : stringValue;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function formatCsvNumber(value: number) {
  return Number(value ?? 0).toFixed(2);
}

function parseDateParam(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const date = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return null;
  }

  return value;
}

function parseStatusParam(value: string | null): InvoiceStatus | null {
  if (!value) {
    return null;
  }

  return invoiceStatuses.some((status) => status.value === value) ? (value as InvoiceStatus) : null;
}

function cleanOptionalParam(value: string | null) {
  const cleanValue = value?.trim();
  return cleanValue ? cleanValue : null;
}

function daysBetween(from: string, to: string) {
  const fromTime = new Date(`${from}T00:00:00.000Z`).getTime();
  const toTime = new Date(`${to}T00:00:00.000Z`).getTime();
  return Math.floor((toTime - fromTime) / 86_400_000) + 1;
}

function csvError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
