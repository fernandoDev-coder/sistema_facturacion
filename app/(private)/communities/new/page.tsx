import Link from "next/link";
import { createCommunityAction } from "@/app/actions/communities";
import { buttonClass } from "@/components/button-styles";
import { CommunityForm } from "@/components/community-form";
import { Message } from "@/components/message";

export default async function NewCommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/communities" className={buttonClass({ variant: "ghost", size: "sm" })}>
          Volver
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Nueva comunidad</h1>
      </div>
      <Message text={message} />
      <section className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
        <CommunityForm action={createCommunityAction} />
      </section>
    </div>
  );
}
