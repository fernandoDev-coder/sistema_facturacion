export function InvoiceLogo({ src }: { src?: string | null }) {
  if (!src) return null;

  return (
    // Plain img keeps this compatible with external company logos.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Logo de empresa"
      className="mb-5 h-20 max-w-56 object-contain object-left"
    />
  );
}
