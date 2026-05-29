import Link from "next/link";
import { completeOnboardingAction } from "@/app/actions/auth";
import { buttonClass } from "@/components/button-styles";
import { FormButton } from "@/components/form-button";
import { getCompanySetupStatus } from "@/lib/onboarding";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ count: communities }, { count: invoices }, { data: company }, { data: latestInvoice }] = await Promise.all([
    supabase.from("communities").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("document_type", "invoice"),
    supabase.from("company_settings").select("*").eq("owner_id", user.id).maybeSingle(),
    supabase
      .from("invoices")
      .select("id")
      .eq("owner_id", user.id)
      .eq("document_type", "invoice")
      .order("invoice_date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const companyStatus = getCompanySetupStatus(company);
  const hasClient = (communities ?? 0) > 0;
  const hasInvoice = (invoices ?? 0) > 0;

  const checklist = [
    {
      title: "Completa los datos de tu empresa",
      description: companyStatus.completed
        ? "Tus datos principales ya estan listos para aparecer en facturas y presupuestos."
        : `Faltan: ${companyStatus.missingFields.map((field) => field.label).join(", ")}.`,
      href: "/settings/company",
      done: companyStatus.completed,
      cta: "Ir a empresa",
    },
    {
      title: "Crea tu primer cliente",
      description: "Guarda sus datos fiscales y de contacto para no repetirlos en cada documento.",
      href: "/clients/new",
      done: hasClient,
      cta: "Nuevo cliente",
    },
    {
      title: "Genera tu primera factura",
      description: "Cuando tengas un cliente, crea una factura sencilla y revisa el resultado.",
      href: hasClient ? "/invoices/new" : "/clients/new",
      done: hasInvoice,
      cta: hasClient ? "Nueva factura" : "Crear antes un cliente",
    },
    {
      title: "Prueba la impresion A4",
      description: "Abre una factura en vista de impresion para comprobar datos, logo y totales.",
      href: latestInvoice?.id ? `/invoices/${latestInvoice.id}/print` : "/invoices",
      done: hasInvoice,
      cta: latestInvoice?.id ? "Ver impresion" : "Ver facturas",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">Bienvenida inicial</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950">Prepara FaktuFlow en pocos minutos</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          {profile?.is_super_admin
            ? "Esta cuenta tiene acceso total y tambien vera el panel de usuarios registrados."
            : "Sigue estos pasos para crear documentos completos desde el primer dia y evitar pantallas vacias."}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/dashboard" className={buttonClass({ variant: "secondary" })}>
            Ir al dashboard
          </Link>
          <form action={completeOnboardingAction}>
            <FormButton pendingText="Guardando..." variant="primary">
              Marcar onboarding como completado
            </FormButton>
          </form>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {checklist.map((item) => (
          <article key={item.title} className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {item.done ? "Hecho" : "Pendiente"}
            </p>
            <h2 className="mt-3 text-lg font-semibold text-zinc-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
            <Link
              href={item.href}
              className={buttonClass({ variant: item.done ? "secondary" : "primary", className: "mt-5 w-full" })}
            >
              {item.cta}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
