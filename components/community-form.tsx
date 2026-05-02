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
        <Field label="CIF/NIF" name="tax_id" defaultValue={community?.tax_id} />
        <Field label="Dirección" name="address" defaultValue={community?.address} className="md:col-span-2" />
        <Field label="Código postal" name="postal_code" defaultValue={community?.postal_code} />
        <Field label="Ciudad" name="city" defaultValue={community?.city} />
        <Field label="Provincia" name="province" defaultValue={community?.province} />
        <Field label="Email" name="email" type="email" defaultValue={community?.email} />
        <Field label="Teléfono" name="phone" defaultValue={community?.phone} />
        <Field
          label="IVA habitual"
          name="default_vat"
          type="number"
          step="0.01"
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
