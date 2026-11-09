import type { Metadata } from "next";
import { canUseAuthEnvironment } from "@/lib/supabase/environment";
import { PreviewAccessNotice } from "@/components/preview-access-notice";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  if (!canUseAuthEnvironment()) return <PreviewAccessNotice />;
  return children;
}
