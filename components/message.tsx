import Link from "next/link";
import { buttonClass } from "@/components/button-styles";

export function Message({ text }: { text?: string }) {
  if (!text) return null;

  const showUpgradeCta = text.includes("Pro") || text.includes("plan gratis");

  return (
    <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>{text}</p>
        {showUpgradeCta ? (
          <Link href="/settings/billing" className={buttonClass({ variant: "warning", size: "sm" })}>
            Ver Pro
          </Link>
        ) : null}
      </div>
    </div>
  );
}
