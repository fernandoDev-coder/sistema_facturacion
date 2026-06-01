import { saveCompanySettingsAction } from "@/app/actions/company";
import { FormButton } from "@/components/form-button";
import { Message } from "@/components/message";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getPlanLimits } from "@/lib/plan-limits";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function CompanySettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const { message } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const limits = getPlanLimits(profile);
  const { data: company } = await supabase
    .from("company_settings")
    .select("*")
    .eq("owner_id", user.id)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{t.pages.company.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t.pages.company.description}</p>
      </div>
      <Message text={message} />
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <form action={saveCompanySettingsAction} encType="multipart/form-data" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label={t.pages.company.fiscalName} name="fiscal_name" defaultValue={company?.fiscal_name} />
            <Field
              label={t.pages.company.taxId}
              name="tax_id"
              defaultValue={company?.tax_id}
              autoComplete="off"
              maxLength={12}
              pattern="([0-9]{8}[A-Za-z]|[XYZxyz][0-9]{7}[A-Za-z]|[ABEHabeh][0-9]{7}[0-9]|[NPQSWnpqsw][0-9]{7}[A-Ja-j]|[CDFGJUVRcdfgjuvr][0-9]{7}[0-9A-Ja-j])"
              placeholder="B12345678"
              title={t.pages.company.taxTitle}
            />
            <Field label={t.pages.company.address} name="address" defaultValue={company?.address} className="md:col-span-2" />
            <Field
              label={t.pages.company.postalCode}
              name="postal_code"
              defaultValue={company?.postal_code}
              inputMode="numeric"
              maxLength={5}
              pattern="[0-9]{5}"
              placeholder="28001"
              title={t.pages.company.postalTitle}
            />
            <Field label={t.pages.company.city} name="city" defaultValue={company?.city} />
            <Field label={t.pages.company.province} name="province" defaultValue={company?.province} />
            <Field label={t.pages.company.email} name="email" type="email" defaultValue={company?.email} />
            <Field
              label={t.pages.company.phone}
              name="phone"
              defaultValue={company?.phone}
              inputMode="tel"
              maxLength={18}
              pattern={"(\\+34|0034)?[\\s.-]?[6789][0-9\\s.-]{8,}"}
              placeholder="+34600111222"
              title={t.pages.company.phoneTitle}
            />
            <Field
              label={t.pages.company.iban}
              name="iban"
              defaultValue={company?.iban}
              autoComplete="off"
              maxLength={42}
              pattern={"[A-Za-z]{2}[0-9]{2}[A-Za-z0-9\\s]{11,38}"}
              placeholder="ES9121000418450200051332"
              title={t.pages.company.ibanTitle}
              className="md:col-span-2"
            />
            {limits.companyLogo ? (
              <>
                <Field
                  label={t.pages.company.logoUrl}
                  name="logo_url"
                  type="url"
                  defaultValue={company?.logo_url}
                  placeholder="https://tudominio.com/logo.png"
                  title={t.pages.company.logoTitle}
                  className="md:col-span-2"
                />
                <label className="block md:col-span-2">
                  <span className="text-sm font-medium text-zinc-800">{t.pages.company.uploadLogo}</span>
                  <input
                    name="logo_file"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="mt-1 block w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
                  />
                  <span className="mt-1 block text-xs text-zinc-500">{t.pages.company.fileHelp}</span>
                </label>
              </>
            ) : (
              <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950 md:col-span-2">
                <p className="font-semibold">{t.pages.company.proLogoTitle}</p>
                <p className="mt-1 leading-6">{t.pages.company.proLogoDescription}</p>
              </div>
            )}
            {limits.companyLogo && company?.logo_url ? (
              <div className="md:col-span-2">
                <span className="text-sm font-medium text-zinc-800">{t.pages.company.currentLogo}</span>
                <div className="mt-2 flex h-24 w-48 items-center rounded-md border border-zinc-200 bg-zinc-50 p-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={company.logo_url} alt={t.pages.company.currentLogoAlt} className="max-h-full max-w-full object-contain object-left" />
                </div>
              </div>
            ) : null}
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t.pages.company.invoiceFooter}</span>
              <textarea
                name="invoice_footer"
                defaultValue={company?.invoice_footer ?? ""}
                rows={4}
                className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </label>
          </div>
          <FormButton className="w-full sm:w-auto">{t.pages.company.save}</FormButton>
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
        className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
        {...props}
      />
    </label>
  );
}
