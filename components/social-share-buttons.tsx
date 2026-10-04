export function SocialShareButtons({ label, url, title }: { label: string; url: string; title: string }) {
  const linkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const whatsapp = `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`;

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label={label}>
      <span className="text-sm font-medium text-zinc-700">{label}</span>
      <a className="social-button" href={linkedIn} target="_blank" rel="noreferrer" data-haptic="true">in</a>
      <a className="social-button" href={whatsapp} target="_blank" rel="noreferrer" data-haptic="true">wa</a>
    </div>
  );
}
