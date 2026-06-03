import { createHash } from "node:crypto";
import { createClient } from "@/lib/supabase/server";

type FiscalRecordInput = {
  ownerId: string;
  invoiceId: string;
  recordType: "alta" | "anulacion";
  recordPayload: unknown;
};

// TODO VERIFACTU: validar campos exactos, orden, formato, normalizacion y codificacion contra la especificacion oficial AEAT antes de afirmar cumplimiento.
// Este hash es una estructura interna provisional para preparar trazabilidad. No debe presentarse como hash VeriFactu oficial hasta validar contra AEAT.
export function buildFiscalRecordCanonicalString(recordPayload: unknown) {
  return stableStringify(recordPayload);
}

// TODO VERIFACTU: validar campos exactos, orden, formato, normalizacion y codificacion contra la especificacion oficial AEAT antes de afirmar cumplimiento.
// Este hash es una estructura interna provisional para preparar trazabilidad. No debe presentarse como hash VeriFactu oficial hasta validar contra AEAT.
export function calculateFiscalRecordHash(recordPayload: unknown) {
  return createHash("sha256").update(buildFiscalRecordCanonicalString(recordPayload), "utf8").digest("hex");
}

export async function getPreviousFiscalRecord(ownerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("fiscal_records")
    .select("*")
    .eq("owner_id", ownerId)
    .order("chain_sequence", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function createChainedFiscalRecord(input: FiscalRecordInput) {
  const supabase = await createClient();
  const previous = await getPreviousFiscalRecord(input.ownerId);
  const chainSequence = (previous?.chain_sequence ?? 0) + 1;
  const hash = calculateFiscalRecordHash({
    payload: input.recordPayload,
    previous_hash: previous?.hash ?? null,
  });

  // TODO VERIFACTU: en el futuro la cadena puede necesitar segmentacion por NIF, serie o sistema segun la especificacion oficial.
  const { data, error } = await supabase
    .from("fiscal_records")
    .insert({
      owner_id: input.ownerId,
      invoice_id: input.invoiceId,
      record_type: input.recordType,
      record_payload: input.recordPayload,
      hash,
      previous_record_id: previous?.id ?? null,
      previous_hash: previous?.hash ?? null,
      chain_sequence: chainSequence,
      generated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) => left.localeCompare(right));
  return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`;
}
