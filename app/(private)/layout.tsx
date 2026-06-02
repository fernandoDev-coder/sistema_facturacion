import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { getLocale } from "@/lib/i18n";
import { getCurrentProfile } from "@/lib/profiles";
import { requireUser } from "@/lib/supabase/server";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await getCurrentProfile();
  const locale = await getLocale();

  return (
    <AppShell email={user.email} locale={locale} showAdminLink={profile?.is_super_admin}>
      {children}
    </AppShell>
  );
}
