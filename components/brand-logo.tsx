import Link from "next/link";
import Image from "next/image";

type BrandLogoProps = {
  href?: string;
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showTagline?: boolean;
};

export function BrandLogo({
  href,
  className = "",
  markClassName = "",
  textClassName = "",
  showTagline = false,
}: BrandLogoProps) {
  const content = (
    <>
      <Image
        src="/brand/faktuflow-mark.svg"
        alt=""
        width={36}
        height={36}
        priority
        className={`h-9 w-9 shrink-0 rounded-md object-contain ${markClassName}`}
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span className={`block text-lg font-extrabold tracking-normal ${textClassName}`}>
          <span className="text-[#071a3d]">Faktu</span>
          <span className="text-blue-700">Flow</span>
        </span>
        {showTagline ? (
          <span className="block text-[10px] font-bold uppercase tracking-[0.24em] text-zinc-500">
            Factura. Cobra.
          </span>
        ) : null}
      </span>
    </>
  );

  const classes = `inline-flex items-center gap-2 ${className}`.trim();

  if (href) {
    return (
      <Link href={href} className={classes} aria-label="FaktuFlow">
        {content}
      </Link>
    );
  }

  return (
    <div className={classes} aria-label="FaktuFlow">
      {content}
    </div>
  );
}
