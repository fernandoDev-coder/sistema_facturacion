import Link from "next/link";
import { buttonClass } from "@/components/button-styles";

export function PricingCard({
  name,
  price,
  cadence,
  description,
  features,
  notIncluded = [],
  notIncludedLabel = "No incluido",
  cta,
  href,
  highlighted = false,
  recommendedLabel,
}: {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  features: readonly string[];
  notIncluded?: readonly string[];
  notIncludedLabel?: string;
  cta: string;
  href: string;
  highlighted?: boolean;
  recommendedLabel?: string;
}) {
  return (
    <article className={`rounded-lg border bg-white p-5 shadow-sm sm:p-6 ${highlighted ? "border-blue-300 ring-2 ring-blue-100" : "border-zinc-200"}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold text-zinc-950">{name}</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-600">{description}</p>
        </div>
        {highlighted && recommendedLabel ? (
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800">
            {recommendedLabel}
          </span>
        ) : null}
      </div>

      <div className="mt-6">
        <p className="text-2xl font-semibold leading-tight sm:text-3xl">{price}</p>
        {cadence ? <p className="mt-1 text-sm text-zinc-500">{cadence}</p> : null}
      </div>

      <ul className="mt-6 space-y-3 text-sm text-zinc-700">
        {features.map((feature) => (
          <li key={feature} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-700" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {notIncluded.length ? (
        <ul className="mt-4 space-y-2 text-sm text-zinc-500">
          {notIncluded.map((feature) => (
            <li key={feature}>
              {notIncludedLabel}: {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <Link href={href} className={buttonClass({ variant: highlighted ? "primary" : "secondary", size: "full", className: "mt-6" })}>
        {cta}
      </Link>
    </article>
  );
}
