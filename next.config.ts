import type { NextConfig } from "next";

const isDevelopment = process.env.NODE_ENV === "development";

const scriptSrc = isDevelopment
  ? ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com"]
  : ["'self'", "https://js.stripe.com"];

const contentSecurityPolicy = [
  ["default-src", "'self'"],
  ["base-uri", "'self'"],
  ["form-action", "'self'"],
  ["frame-ancestors", "'none'"],
  ["object-src", "'none'"],
  ["script-src", ...scriptSrc],
  ["style-src", "'self'", "'unsafe-inline'"],
  ["img-src", "'self'", "https:", "data:", "blob:"],
  ["font-src", "'self'", "data:"],
  ["connect-src", "'self'", "https://*.supabase.co", "wss://*.supabase.co", "https://api.stripe.com"],
  ["frame-src", "https://js.stripe.com", "https://hooks.stripe.com"],
  ["upgrade-insecure-requests"],
]
  .map((directive) => directive.join(" "))
  .join("; ")
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: contentSecurityPolicy,
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
