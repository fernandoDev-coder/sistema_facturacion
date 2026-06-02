import Link from "next/link";
import {
  changePasswordAction,
  deleteAccountAction,
  saveAccountProfileAction,
} from "@/app/actions/account";
import { buttonClass } from "@/components/button-styles";
import { Message } from "@/components/message";
import { getEffectivePlan, getPlanLimits } from "@/lib/plan-limits";
import { getCurrentProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/supabase/server";

export default async function AccountSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const { message } = await searchParams;
  const effectivePlan = getEffectivePlan(profile);
  const limits = getPlanLimits(profile);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">Perfil</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Gestiona tu informacion personal, seguridad, plan activo y borrado de cuenta.
        </p>
      </div>

      <Message text={message} />

      <section className="grid gap-4 lg:grid-cols-3">
        <AccountMetric label="Email" value={user.email ?? "Sin email"} />
        <AccountMetric label="Plan activo" value={getPlanLabel(effectivePlan)} />
        <AccountMetric label="Rol" value={profile?.is_super_admin ? "Administrador" : "Usuario"} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Datos personales</h2>
          <form action={saveAccountProfileAction} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">Nombre</span>
              <input
                name="full_name"
                type="text"
                autoComplete="name"
                maxLength={120}
                defaultValue={profile?.full_name ?? ""}
                placeholder="Tu nombre"
                className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">Email</span>
              <input
                type="email"
                value={user.email ?? ""}
                readOnly
                className="mt-1 min-h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600 outline-none"
              />
            </label>
            <button className={buttonClass({ variant: "primary" })}>Guardar perfil</button>
          </form>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">Plan activo</h2>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">{getPlanLabel(effectivePlan)}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <PlanRow label="Clientes" value={limits.clients === null ? "Ilimitados" : String(limits.clients)} />
            <PlanRow
              label="Documentos al mes"
              value={limits.documentsPerMonth === null ? "Ilimitados" : String(limits.documentsPerMonth)}
            />
            <PlanRow label="Facturacion mensual" value={limits.monthlyBulkInvoices ? "Incluida" : "No incluida"} />
            <PlanRow label="Logo en documentos" value={limits.companyLogo ? "Incluido" : "No incluido"} />
          </dl>
          <Link href="/settings/billing" className={buttonClass({ variant: "secondary", className: "mt-5" })}>
            Ver plan y facturacion
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-zinc-950">Cambiar contrasena</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">
            La nueva contrasena debe tener minimo 10 caracteres, una mayuscula y un simbolo.
          </p>
          <form action={changePasswordAction} className="mt-4 grid gap-4 md:grid-cols-3">
            <PasswordInput label="Contrasena actual" name="current_password" autoComplete="current-password" />
            <PasswordInput label="Nueva contrasena" name="new_password" autoComplete="new-password" />
            <PasswordInput label="Confirmar nueva" name="confirm_password" autoComplete="new-password" />
            <div className="md:col-span-3">
              <button className={buttonClass({ variant: "secondary" })}>Actualizar contrasena</button>
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-red-900">Danger zone</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">
            Borrar la cuenta elimina tu usuario y los datos asociados: perfil, empresa, clientes, facturas,
            presupuestos, lineas de documentos, suscripciones internas y logo subido. La base de datos usa borrado en
            cascada para que no queden registros colgando. No se puede deshacer.
          </p>
          {profile?.is_super_admin ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Las cuentas administradoras no se pueden borrar desde la aplicacion.
            </p>
          ) : (
            <form action={deleteAccountAction} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">Escribe tu email para confirmar</span>
                <input
                  name="confirm_email"
                  type="email"
                  autoComplete="off"
                  required
                  placeholder={user.email ?? "tu@email.com"}
                  className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>
              <button className={buttonClass({ variant: "danger" })}>Borrar mi cuenta definitivamente</button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}

function AccountMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 break-words text-lg font-semibold text-zinc-950">{value}</p>
    </div>
  );
}

function PlanRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-zinc-500">{label}</dt>
      <dd className="text-right font-medium text-zinc-900">{value}</dd>
    </div>
  );
}

function PasswordInput({
  label,
  name,
  autoComplete,
}: {
  label: string;
  name: string;
  autoComplete: "current-password" | "new-password";
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <input
        name={name}
        type="password"
        minLength={10}
        autoComplete={autoComplete}
        required
        className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
      />
    </label>
  );
}

function getPlanLabel(plan: ReturnType<typeof getEffectivePlan>) {
  if (plan === "starter") {
    return "Gratis";
  }

  if (plan === "enterprise") {
    return "Admin";
  }

  return plan === "pro" ? "Pro" : "Premium";
}
