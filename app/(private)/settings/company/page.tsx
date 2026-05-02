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
            <Field label="CIF/NIF" name="tax_id" defaultValue={company?.tax_id} />
            <Field label="Dirección" name="address" defaultValue={company?.address} className="md:col-span-2" />
            <Field label="Código postal" name="postal_code" defaultValue={company?.postal_code} />
            <Field label="Ciudad" name="city" defaultValue={company?.city} />
            <Field label="Provincia" name="province" defaultValue={company?.province} />
            <Field label="Email" name="email" type="email" defaultValue={company?.email} />
            <Field label="Teléfono" name="phone" defaultValue={company?.phone} />
            <Field label="IBAN" name="iban" defaultValue={company?.iban} />
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
