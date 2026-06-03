import type { AeatSubmissionDraft } from "@/lib/fiscal/aeat/types";

export async function submitAeatRecord(_draft: AeatSubmissionDraft): Promise<never> {
  void _draft;
  // TODO VERIFACTU: integrar WSDL servicios AEAT, certificados, respuestas accepted/rejected/error, reintentos, colas y logs de envio.
  throw new Error("Envio AEAT no implementado. No existe integracion externa activa.");
}
