export type FutureFiscalQrInput = {
  invoiceId: string;
  invoiceSeries: string;
  sequentialNumber: number;
};

export function buildFutureFiscalQrPayload(_input: FutureFiscalQrInput): never {
  void _input;
  // TODO VERIFACTU: implementar QR unicamente cuando los datos, formato y validaciones hayan sido contrastados con la especificacion oficial AEAT.
  throw new Error("QR fiscal no implementado. Pendiente de validacion contra la especificacion oficial AEAT.");
}
