import Link from "next/link";
import { notFound } from "next/navigation";
import { updateClientAction } from "@/app/actions/clients";
import { buttonClass } from "@/components/button-styles";
import { CommunityForm } from "@/components/community-form";
import { Message } from "@/components/message";
import { getDictionary, getLocale } from "@/lib/i18n";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function EditClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const { message } = await searchParams;
  const locale = await getLocale();
  const t = getDictionary(locale);
  const supabase = await createClient();
  const { data: client } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/clients" className={buttonClass({ variant: "ghost", size: "sm" })}>
          {t.common.back}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">{t.pages.clients.editTitle}</h1>
      </div>
      <Message text={message} />
      <section className="rounded-lg border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
        <CommunityForm action={updateClientAction} community={client} labels={t.forms.client} />
      </section>
    </div>
  );
}
