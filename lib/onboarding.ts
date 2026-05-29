import type { CompanySettings } from "@/lib/types";

export const requiredCompanyFields = [
  { key: "fiscal_name", label: "Nombre fiscal" },
  { key: "tax_id", label: "NIF/CIF" },
  { key: "address", label: "Direccion" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefono" },
  { key: "logo_url", label: "Logo" },
] as const;

export function getCompanySetupStatus(company?: Partial<CompanySettings> | null, { requireLogo = true } = {}) {
  const fields = requireLogo ? requiredCompanyFields : requiredCompanyFields.filter(({ key }) => key !== "logo_url");
  const missingFields = fields.filter(({ key }) => {
    const value = company?.[key];
    return typeof value !== "string" || value.trim() === "";
  });

  return {
    completed: missingFields.length === 0,
    missingFields,
    completedFields: fields.length - missingFields.length,
    totalFields: fields.length,
  };
}
