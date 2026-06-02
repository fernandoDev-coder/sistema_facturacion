const defaultSiteUrl = "https://www.faktudash.com";

export function getSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredUrl && configuredUrl.includes("localhost")) {
    return new URL(configuredUrl);
  }

  return new URL(defaultSiteUrl);
}

export function getAbsoluteUrl(path: string) {
  return new URL(path, getSiteUrl()).toString();
}
