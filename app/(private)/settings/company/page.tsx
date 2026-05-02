import { saveCompanySettingsAction } from "@/app/actions/company";
import { FormButton } from "@/components/form-button";
import { Message } from "@/components/message";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function CompanySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { message } = await searchParams;
  const supabase = await createClient();
  const { data: company } = await supabase
    .from("company_settings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Configuración de empresa</h1>
        <p className="mt-1 text-sm text-zinc-600">Estos datos aparecerán en la plantilla imprimible.</p>
      </div>
      <Message text={message} />
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <form action={saveCompanySettingsAction} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre fiscal" name="fiscal_name" defaultValue={company?.fiscal_name} />
            <Field
              label="CIF/NIF"
              name="tax_id"
              defaultValue={company?.tax_id}
              autoComplete="off"
              maxLength={12}
              pattern="([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z]|[ABEHabeh][0-9]{7}[0-9]|[NPQSWnpqsw][0-9]{7}[A-Ja-j]|[CDFGJUVRcdfgjuvr][0-9]{7}[0-9A-Ja-j])"
              placeholder="B12345678"
              title="Introduce un DNI, NIE o CIF válido. Ejemplos: 12345678Z, X1234567L, B46066361, N0027810A."
            />
            <Field label="Dirección" name="address" defaultValue={company?.address} className="md:col-span-2" />
            <Field
              label="Código postal"
              name="postal_code"
              defaultValue={company?.postal_code}
              inputMode="numeric"
              maxLength={5}
              pattern="[0-9]{5}"
              placeholder="28001"
              title="Debe tener 5 dígitos."
            />
            <Field label="Ciudad" name="city" defaultValue={company?.city} />
            <Field label="Provincia" name="province" defaultValue={company?.province} />
            <Field label="Email" name="email" type="email" defaultValue={company?.email} />
            <Field
              label="Teléfono"
              name="phone"
              defaultValue={company?.phone}
              inputMode="tel"
              maxLength={18}
              pattern={"(\\+34|0034)?[\\s.-]?[6789][0-9\\s.-]{8,}"}
              placeholder="+34600111222"
              title="Introduce un teléfono español válido."
            />
            <Field
              label="IBAN"
              name="iban"
              defaultValue={company?.iban}
              autoComplete="off"
              maxLength={42}
              pattern={"[A-Za-z]{2}[0-9]{2}[A-Za-z0-9\\s]{11,38}"}
              placeholder="ES9121000418450200051332"
              title="Introduce un IBAN válido."
              className="md:col-span-2"
            />
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-zinc-800">Texto legal o pie de factura</span>
              <textarea
                name="invoice_footer"
                defaultValue={company?.invoice_footer ?? ""}
                rows={4}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>
          <FormButton>Guardar configuración</FormButton>
        </form>
      </section>
    </div>
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
