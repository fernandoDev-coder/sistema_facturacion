import Link from "next/link";
import { buttonClass } from "@/components/button-styles";

export function UpgradeBanner({
  message,
  cta,
  href = "/settings/billing",
  tone = "amber",
}: {
  message: string;
  cta: string;
  href?: string;
  tone?: "amber" | "blue";
}) {
  const classes =
    tone === "blue"
      ? "border-blue-200 bg-blue-50 text-blue-950"
      : "border-amber-200 bg-amber-50 text-amber-950";

  return (
    <section className={`rounded-lg border p-4 ${classes}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-medium leading-6">{message}</p>
        <Link href={href} className={buttonClass({ variant: tone === "blue" ? "primary" : "warning", size: "full", className: "sm:w-auto" })}>
          {cta}
        </Link>
      </div>
    </section>
  );
}
