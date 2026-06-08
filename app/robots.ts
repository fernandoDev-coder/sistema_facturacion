import type { MetadataRoute } from "next";
import { getAbsoluteUrl, getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin/",
        "/api/",
        "/budgets/",
        "/clients/",
        "/communities/",
        "/dashboard/",
        "/invoices/",
        "/forgot-password",
        "/auth/callback",
        "/login",
        "/register",
        "/reset-password",
        "/settings/",
        "/welcome",
      ],
    },
    sitemap: getAbsoluteUrl("/sitemap.xml"),
    host: siteUrl.origin,
  };
}
