import Link from "next/link";
import {
  changePasswordAction,
  deleteAccountAction,
  saveAccountProfileAction,
} from "@/app/actions/account";
import { buttonClass } from "@/components/button-styles";
import { Message } from "@/components/message";
import { getDictionary, getLocale } from "@/lib/i18n";
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
  const locale = await getLocale();
  const t = getDictionary(locale);
  const account = t.pages.account;
  const effectivePlan = getEffectivePlan(profile);
  const limits = getPlanLimits(profile);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-950">{account.title}</h1>
        <p className="mt-1 text-sm text-zinc-600">{account.description}</p>
      </div>

      <Message text={message} />

      <section className="grid gap-4 lg:grid-cols-3">
        <AccountMetric label={account.email} value={user.email ?? account.noEmail} />
        <AccountMetric label={account.activePlan} value={getPlanLabel(effectivePlan, account)} />
        <AccountMetric label={account.role} value={profile?.is_super_admin ? account.administrator : account.user} />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">{account.personalData}</h2>
          <form action={saveAccountProfileAction} className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">{account.name}</span>
              <input
                name="full_name"
                type="text"
                autoComplete="name"
                maxLength={120}
                defaultValue={profile?.full_name ?? ""}
                placeholder={account.namePlaceholder}
                className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-200"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-zinc-800">{account.email}</span>
              <input
                type="email"
                value={user.email ?? ""}
                readOnly
                className="mt-1 min-h-11 w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 text-sm text-zinc-600 outline-none"
              />
            </label>
            <button className={buttonClass({ variant: "primary" })}>{account.saveProfile}</button>
          </form>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-950">{account.activePlan}</h2>
          <p className="mt-2 text-2xl font-semibold text-zinc-950">{getPlanLabel(effectivePlan, account)}</p>
          <dl className="mt-4 space-y-3 text-sm">
            <PlanRow label={account.clientsLimit} value={limits.clients === null ? account.unlimited : String(limits.clients)} />
            <PlanRow
              label={account.documentsLimit}
              value={limits.documentsPerMonth === null ? account.unlimited : String(limits.documentsPerMonth)}
            />
            <PlanRow label={account.monthlyBilling} value={limits.monthlyBulkInvoices ? account.included : account.notIncluded} />
            <PlanRow label={account.logoDocuments} value={limits.companyLogo ? account.includedMale : account.notIncludedMale} />
          </dl>
          <Link href="/settings/billing" className={buttonClass({ variant: "secondary", className: "mt-5" })}>
            {account.viewBilling}
          </Link>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-zinc-950">{account.changePassword}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{account.passwordHelp}</p>
          <form action={changePasswordAction} className="mt-4 grid gap-4 md:grid-cols-3">
            <PasswordInput label={account.currentPassword} name="current_password" autoComplete="current-password" />
            <PasswordInput label={account.newPassword} name="new_password" autoComplete="new-password" />
            <PasswordInput label={account.confirmNewPassword} name="confirm_password" autoComplete="new-password" />
            <div className="md:col-span-3">
              <button className={buttonClass({ variant: "secondary" })}>{account.updatePassword}</button>
            </div>
          </form>
        </div>
      </section>

      <section className="rounded-lg border border-red-200 bg-white p-5 shadow-sm">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-red-900">{account.dangerTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-700">{account.deleteDescription}</p>
          {profile?.is_super_admin ? (
            <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {account.adminDeleteBlocked}
            </p>
          ) : (
            <form action={deleteAccountAction} className="mt-5 space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-zinc-800">{account.confirmEmail}</span>
                <input
                  name="confirm_email"
                  type="email"
                  autoComplete="off"
                  required
                  placeholder={user.email ?? "tu@email.com"}
                  className="mt-1 min-h-11 w-full rounded-md border border-zinc-300 px-3 text-sm outline-none focus:border-red-700 focus:ring-2 focus:ring-red-100"
                />
              </label>
              <button className={buttonClass({ variant: "danger" })}>{account.deleteAccount}</button>
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

function getPlanLabel(
  plan: ReturnType<typeof getEffectivePlan>,
  labels: { freePlan: string; adminPlan: string },
) {
  if (plan === "starter") {
    return labels.freePlan;
  }

  if (plan === "enterprise") {
    return labels.adminPlan;
  }

  return plan === "pro" ? "Pro" : "Premium";
}
