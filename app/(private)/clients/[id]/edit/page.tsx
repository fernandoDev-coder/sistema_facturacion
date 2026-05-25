import Link from "next/link";
import { notFound } from "next/navigation";
import { updateClientAction } from "@/app/actions/clients";
import { buttonClass } from "@/components/button-styles";
import { CommunityForm } from "@/components/community-form";
import { Message } from "@/components/message";
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
          Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Editar cliente</h1>
      </div>
      <Message text={message} />
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <CommunityForm action={updateClientAction} community={client} />
      </section>
    </div>
  );
}
