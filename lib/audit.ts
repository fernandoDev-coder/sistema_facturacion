import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function createAuditLog(
  supabase: SupabaseServerClient,
  ownerId: string,
  entityType: string,
  entityId: string,
  action: string,
  metadata?: Record<string, unknown>,
) {
  const { error } = await supabase.from("audit_logs").insert({
    owner_id: ownerId,
    entity_type: entityType,
    entity_id: entityId,
    action,
    metadata: metadata ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}
