const dniLetters = "TRWAGMYFPDXBNJZSQVHLCKE";
const cifAnyControlLetters = "CDFGJUVR";
const cifDigitControlLetters = "ABEH";
const cifLetterControlLetters = "NPQSW";

const ibanLengths: Record<string, number> = {
  AD: 24,
  AE: 23,
  AL: 28,
  AT: 20,
  AZ: 28,
  BA: 20,
  BE: 16,
  BG: 22,
  BH: 22,
  BR: 29,
  CH: 21,
  CR: 22,
  CY: 28,
  CZ: 24,
  DE: 22,
  DK: 18,
  DO: 28,
  EE: 20,
  ES: 24,
  FI: 18,
  FO: 18,
  FR: 27,
  GB: 22,
  GI: 23,
  GL: 18,
  GR: 27,
  GT: 28,
  HR: 21,
  HU: 28,
  IE: 22,
  IL: 23,
  IS: 26,
  IT: 27,
  JO: 30,
  KW: 30,
  KZ: 20,
  LB: 28,
  LI: 21,
  LT: 20,
  LU: 20,
  LV: 21,
  MC: 27,
  MD: 24,
  ME: 22,
  MK: 19,
  MR: 27,
  MT: 31,
  MU: 30,
  NL: 18,
  NO: 15,
  PK: 24,
  PL: 28,
  PS: 29,
  PT: 25,
  QA: 29,
  RO: 24,
  RS: 22,
  SA: 24,
  SE: 24,
  SI: 19,
  SK: 24,
  SM: 27,
  TN: 24,
  TR: 26,
  UA: 29,
  VG: 24,
  XK: 20,
};

export type ValidationResult = {
  value: string | null;
  error?: string;
};

export function cleanTaxId(value: string | null): ValidationResult {
  const taxId = compact(value);
  if (!taxId) return { value: null };

  if (!isValidSpanishTaxId(taxId)) {
    return { value: taxId, error: "El CIF/NIF no tiene un formato válido." };
  }

  return { value: taxId };
}

export function cleanPostalCode(value: string | null): ValidationResult {
  const postalCode = compact(value);
  if (!postalCode) return { value: null };

  if (!/^\d{5}$/.test(postalCode)) {
    return { value: postalCode, error: "El código postal debe tener 5 dígitos." };
  }

  const provinceCode = Number(postalCode.slice(0, 2));
  if (provinceCode < 1 || provinceCode > 52) {
    return { value: postalCode, error: "El código postal no corresponde a una provincia española válida." };
  }

  return { value: postalCode };
}

export function cleanPhone(value: string | null): ValidationResult {
  const raw = String(value ?? "").trim();
  if (!raw) return { value: null };

  const normalized = raw.replace(/[\s().-]/g, "");
  const digits = normalized.startsWith("+")
    ? normalized.slice(1)
    : normalized.startsWith("00")
      ? normalized.slice(2)
      : normalized;

  const nationalNumber = digits.startsWith("34") && digits.length === 11 ? digits.slice(2) : digits;

  if (!/^[6789]\d{8}$/.test(nationalNumber)) {
    return { value: raw, error: "El teléfono debe ser un número español válido de 9 dígitos." };
  }

  return { value: `+34${nationalNumber}` };
}

export function cleanIban(value: string | null): ValidationResult {
  const iban = compact(value);
  if (!iban) return { value: null };

  if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(iban)) {
    return { value: iban, error: "El IBAN tiene caracteres o estructura no válidos." };
  }

  const expectedLength = ibanLengths[iban.slice(0, 2)];
  if (!expectedLength || iban.length !== expectedLength) {
    return { value: iban, error: "El IBAN no tiene la longitud correcta para su país." };
  }

  if (!hasValidIbanChecksum(iban)) {
    return { value: iban, error: "El IBAN no supera la validación de control." };
  }

  return { value: iban };
}

export function assertValidFields(fields: Array<[string, ValidationResult]>) {
  const invalid = fields.find(([, result]) => result.error);
  if (invalid) {
    throw new Error(invalid[1].error);
  }
}

function compact(value: string | null) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/[\s-]/g, "");
}

function isValidSpanishTaxId(value: string) {
  return isValidDni(value) || isValidNie(value) || isValidCif(value);
}

function isValidDni(value: string) {
  if (!/^\d{8}[A-Z]$/.test(value)) return false;
  return dniLetters[Number(value.slice(0, 8)) % 23] === value[8];
}

function isValidNie(value: string) {
  if (!/^[XYZ]\d{7}[A-Z]$/.test(value)) return false;
  const prefix = { X: "0", Y: "1", Z: "2" }[value[0] as "X" | "Y" | "Z"];
  const numericPart = `${prefix}${value.slice(1, 8)}`;
  return dniLetters[Number(numericPart) % 23] === value[8];
}

function isValidCif(value: string) {
  if (!/^[ABCDEFGHJNPQRSUVW]\d{7}[0-9A-J]$/.test(value)) return false;

  const letter = value[0];
  const control = value[8];

  if (cifDigitControlLetters.includes(letter)) return /^\d$/.test(control);
  if (cifLetterControlLetters.includes(letter)) return /^[A-J]$/.test(control);
  if (cifAnyControlLetters.includes(letter)) return /^[0-9A-J]$/.test(control);

  return false;
}

function hasValidIbanChecksum(iban: string) {
  const rearranged = `${iban.slice(4)}${iban.slice(0, 4)}`;
  let remainder = 0;

  for (const char of rearranged) {
    const value = /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char;
    for (const digit of value) {
      remainder = (remainder * 10 + Number(digit)) % 97;
    }
  }

  return remainder === 1;
}
