import Link from "next/link";
import { createClientAction } from "@/app/actions/clients";
import { buttonClass } from "@/components/button-styles";
import { CommunityForm } from "@/components/community-form";
import { Message } from "@/components/message";
import { getDictionary, getLocale } from "@/lib/i18n";

export default async function NewClientPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clients" className={buttonClass({ variant: "ghost", size: "sm" })}>
          {t.common.back}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.pages.clients.newTitle}</h1>
      </div>
      <Message text={message} />
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <CommunityForm action={createClientAction} labels={t.forms.client} />
      </section>
    </div>
  );
}
