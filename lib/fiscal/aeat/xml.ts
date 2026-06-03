import type { FiscalRecord } from "@/lib/types";

export function buildAeatXml(_record: FiscalRecord): never {
  void _record;
  // TODO VERIFACTU: cargar esquemas oficiales AEAT, generar XML conforme al diseno de registro y validar contra XSD oficial.
  throw new Error("XML AEAT no implementado. Pendiente de validar contra esquemas oficiales AEAT.");
}
