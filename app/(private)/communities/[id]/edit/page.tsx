import Link from "next/link";
import { notFound } from "next/navigation";
import { updateCommunityAction } from "@/app/actions/communities";
import { CommunityForm } from "@/components/community-form";
import { Message } from "@/components/message";
import { createClient, requireUser } from "@/lib/supabase/server";

export default async function EditCommunityPage({
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
  const { data: community } = await supabase
    .from("communities")
    .select("*")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!community) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/communities" className="text-sm font-medium text-zinc-600 hover:text-zinc-950">
          Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Editar comunidad</h1>
      </div>
      <Message text={message} />
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <CommunityForm action={updateCommunityAction} community={community} />
      </section>
    </div>
  );
}
