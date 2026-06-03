export type AeatSubmissionStatus = "pending" | "accepted" | "rejected" | "error";

export type AeatSubmissionDraft = {
  fiscalRecordId: string;
  xml: string;
};

// TODO VERIFACTU: cargar tipos definitivos desde los disenos de registro, esquemas y WSDL oficiales de AEAT.
