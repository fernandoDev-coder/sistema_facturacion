export function InvoiceLogo() {
  return (
    // Plain img keeps this compatible with user-replaced assets in /public.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/invoice-assets/logo.jpeg"
      alt="Logo de empresa"
      className="mb-5 h-20 max-w-56 object-contain object-left"
    />
  );
}
