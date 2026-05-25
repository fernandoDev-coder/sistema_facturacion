import { redirect } from "next/navigation";

export default async function OldEditCommunityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/clients/${id}/edit`);
}
