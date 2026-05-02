export const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export function money(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return new Intl.DateTimeFormat("es-ES").format(new Date(`${value}T00:00:00`));
}

export function currentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear(),
  };
}

export function invoiceNumber(year: number, month: number, sequence: number) {
  return `FAC-${year}-${String(month).padStart(2, "0")}-${String(sequence).padStart(4, "0")}`;
}

export function toDecimal(value: FormDataEntryValue | null, fallback = 0) {
  const normalized = String(value ?? "")
    .replace(",", ".")
    .trim();
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : fallback;
}

export function nullableText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length ? text : null;
}

export function requiredText(value: FormDataEntryValue | null) {
  return String(value ?? "").trim();
}

export function calculateTotals(amount: number, vatRate: number) {
  const vatAmount = roundMoney((amount * vatRate) / 100);
  return {
    vatAmount,
    total: roundMoney(amount + vatAmount),
  };
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
