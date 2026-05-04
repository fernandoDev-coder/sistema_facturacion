import Link from "next/link";
import { completeOnboardingAction } from "@/app/actions/auth";
import { FormButton } from "@/components/form-button";
import { buttonClass } from "@/components/button-styles";
import { getCurrentProfile } from "@/lib/profiles";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function WelcomePage() {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const supabase = await createClient();

  const [{ count: communities }, { count: invoices }, { data: company }] = await Promise.all([
    supabase.from("communities").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .eq("document_type", "invoice"),
    supabase.from("company_settings").select("id").eq("owner_id", user.id).maybeSingle(),
  ]);

  const checklist = [
    {
      title: "Completa los datos de tu empresa",
      description: "Añade razón social, NIF, dirección y forma de cobro para que salgan en tus documentos.",
      href: "/settings/company",
      done: Boolean(company),
      cta: "Ir a empresa",
    },
    {
      title: "Crea tu primera comunidad o cliente",
      description: "Guarda los datos fiscales y de contacto para no tener que repetirlos en cada factura.",
      href: "/communities/new",
      done: (communities ?? 0) > 0,
      cta: "Nueva comunidad",
    },
    {
      title: "Genera tu primera factura o presupuesto",
      description: "Cuando ya tengas una comunidad creada, podrás emitir el primer documento en pocos pasos.",
      href: (communities ?? 0) > 0 ? "/invoices/new" : "/communities/new",
      done: (invoices ?? 0) > 0,
      cta: (communities ?? 0) > 0 ? "Nueva factura" : "Crear antes una comunidad",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-500">Bienvenida inicial</p>
        <h1 className="mt-3 text-3xl font-semibold text-zinc-950">Tu cuenta ya está lista para empezar</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          {profile?.is_super_admin
            ? "Esta cuenta tiene acceso total y además verá el panel de usuarios registrados."
            : "Te dejo una ruta corta para completar lo mínimo y empezar a facturar sin perderte por la aplicación."}
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

      <section className="grid gap-4 md:grid-cols-3">
        {checklist.map((item) => (
          <article key={item.title} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {item.done ? "Hecho" : "Pendiente"}
            </p>
            <h2 className="mt-3 text-lg font-semibold text-zinc-950">{item.title}</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{item.description}</p>
            <Link href={item.href} className={buttonClass({ variant: item.done ? "secondary" : "primary", className: "mt-5 w-full" })}>
              {item.cta}
            </Link>
          </article>
        ))}
      </section>
    </div>
  );
}
