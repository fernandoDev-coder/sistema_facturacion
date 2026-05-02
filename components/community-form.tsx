import { FormButton } from "@/components/form-button";
import type { Community } from "@/lib/types";

type CommunityFormProps = {
  action: (formData: FormData) => Promise<void>;
  community?: Community;
};

export function CommunityForm({ action, community }: CommunityFormProps) {
  return (
    <form action={action} className="space-y-6">
      {community ? <input type="hidden" name="id" value={community.id} /> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre / razón social" name="name" required defaultValue={community?.name} />
        <Field
          label="CIF/NIF"
          name="tax_id"
          defaultValue={community?.tax_id}
          autoComplete="off"
          maxLength={12}
          pattern="([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z]|[ABEHabeh][0-9]{7}[0-9]|[NPQSWnpqsw][0-9]{7}[A-Ja-j]|[CDFGJUVRcdfgjuvr][0-9]{7}[0-9A-Ja-j])"
          placeholder="B12345678"
          title="Introduce un DNI, NIE o CIF válido. Ejemplos: 12345678Z, X1234567L, B46066361, N0027810A."
        />
        <Field label="Dirección" name="address" defaultValue={community?.address} className="md:col-span-2" />
        <Field
          label="Código postal"
          name="postal_code"
          defaultValue={community?.postal_code}
          inputMode="numeric"
          maxLength={5}
          pattern="[0-9]{5}"
          placeholder="28001"
          title="Debe tener 5 dígitos."
        />
        <Field label="Ciudad" name="city" defaultValue={community?.city} />
        <Field label="Provincia" name="province" defaultValue={community?.province} />
        <Field label="Email" name="email" type="email" defaultValue={community?.email} />
        <Field
          label="Teléfono"
          name="phone"
          defaultValue={community?.phone}
          inputMode="tel"
          maxLength={18}
          pattern={"(\\+34|0034)?[\\s.-]?[6789][0-9\\s.-]{8,}"}
          placeholder="+34600111222"
          title="Introduce un teléfono español válido."
        />
        <Field
          label="IVA habitual"
          name="default_vat"
          type="number"
          step="0.01"
          min={0}
          max={100}
          defaultValue={community?.default_vat ?? 21}
        />
        <Field
          label="Concepto habitual de factura"
          name="default_subject"
          defaultValue={community?.default_subject}
          className="md:col-span-2"
        />
        <Textarea label="Observaciones" name="notes" defaultValue={community?.notes} />
      </div>
      <div className="flex items-center gap-3">
        <FormButton>{community ? "Guardar cambios" : "Crear comunidad"}</FormButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  className = "",
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "defaultValue"> & {
  label: string;
  name: string;
  defaultValue?: string | number | null;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        name={name}
        defaultValue={defaultValue ?? ""}
        className="mt-1 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        {...props}
      />
    </label>
  );
}

function Textarea({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
}) {
  return (
    <label className="block md:col-span-2">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <textarea
        name={name}
        defaultValue={defaultValue ?? ""}
        rows={4}
        className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}
