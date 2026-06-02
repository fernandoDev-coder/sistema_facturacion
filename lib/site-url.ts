const defaultSiteUrl = "https://www.faktudash.com";

export function getSiteUrl() {
  return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? defaultSiteUrl);
}

export function getAbsoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}
