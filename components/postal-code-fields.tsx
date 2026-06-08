"use client";

import { useMemo, useState } from "react";
import { getPostalCodeSuggestions } from "@/lib/postal-code-suggestions";

type PostalCodeFieldLabels = {
  postalCode: string;
  city: string;
  province: string;
  postalTitle: string;
  postalSuggestion?: string;
  postalMultiple?: string;
  postalApply?: string;
};

type PostalCodeFieldsProps = {
  labels: Readonly<PostalCodeFieldLabels>;
  postalCode?: string | null;
  city?: string | null;
  province?: string | null;
};

export function PostalCodeFields({
  labels,
  postalCode: initialPostalCode,
  city: initialCity,
  province: initialProvince,
}: PostalCodeFieldsProps) {
  const [postalCode, setPostalCode] = useState(initialPostalCode ?? "");
  const [city, setCity] = useState(initialCity ?? "");
  const [province, setProvince] = useState(initialProvince ?? "");

  const matches = useMemo(() => getPostalCodeSuggestions(city, province), [city, province]);
  const postalCodes = Array.from(new Set(matches.flatMap((match) => match.postalCodes))).slice(0, 8);
  const canAutofill = postalCodes.length === 1 && !postalCode.trim();

  function applySuggestion(code: string) {
    const match = matches.find((suggestion) => suggestion.postalCodes.includes(code));
    setPostalCode(code);
    if (match) {
      setCity(match.city);
      setProvince(match.province);
    }
  }

  function handleCityBlur() {
    if (canAutofill) {
      applySuggestion(postalCodes[0]);
    }
  }

  return (
    <>
      <Field
        label={labels.postalCode}
        name="postal_code"
        value={postalCode}
        onChange={(value) => setPostalCode(value)}
        inputMode="numeric"
        maxLength={5}
        pattern="[0-9]{5}"
        placeholder="28001"
        title={labels.postalTitle}
      />
      <Field
        label={labels.city}
        name="city"
        value={city}
        onChange={(value) => setCity(value)}
        onBlur={handleCityBlur}
        autoComplete="address-level2"
      />
      <Field
        label={labels.province}
        name="province"
        value={province}
        onChange={(value) => setProvince(value)}
        autoComplete="address-level1"
      />
      {postalCodes.length ? (
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-950 md:col-span-2">
          <p className="font-medium">
            {postalCodes.length === 1
              ? labels.postalSuggestion ?? "Codigo postal sugerido para esta localidad:"
              : labels.postalMultiple ?? "Esta localidad puede tener varios codigos postales. Elige uno o escribe el correcto."}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {postalCodes.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => applySuggestion(code)}
                className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-950 hover:bg-blue-100"
              >
                {labels.postalApply ?? "Usar"} {code}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  onBlur,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue" | "onChange" | "value"> & {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        {...props}
      />
    </label>
  );
}
