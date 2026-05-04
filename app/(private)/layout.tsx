import { AppShell } from "@/components/app-shell";
import { getCurrentProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/supabase/server";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getCurrentProfile();

  return (
    <AppShell email={user.email} showAdminLink={profile?.is_super_admin}>
      {children}
    </AppShell>
  );
}
