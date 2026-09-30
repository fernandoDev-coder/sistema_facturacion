import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ExperienceTools } from "@/components/experience-tools";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "FaktuDash | Facturación mensual para autónomos",
    template: "%s | FaktuDash",
  },
  description:
    "Gestiona clientes, facturas, presupuestos y facturación mensual recurrente desde un dashboard sencillo para autónomos y pequeños negocios.",
  applicationName: "FaktuDash",
  keywords: [
    "facturación mensual",
    "programa de facturación",
    "facturas para autónomos",
    "presupuestos online",
    "gestion de clientes",
    "FaktuDash",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: "/icon.svg",
  },
  openGraph: {
    title: "FaktuDash | Facturación mensual para autónomos",
    description:
      "Crea facturas, presupuestos y facturación mensual recurrente desde un dashboard sencillo.",
    url: "https://www.faktudash.com",
    siteName: "FaktuDash",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "FaktuDash",
      },
    ],
    locale: "es_ES",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FaktuDash | Facturación mensual para autónomos",
    description:
      "Crea facturas, presupuestos y facturación mensual recurrente desde un dashboard sencillo.",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const t = getDictionary(locale);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <ExperienceTools
          labels={{
            ...t.experience,
            home: locale === "es" ? "Inicio" : "Home",
            pricing: t.common.pricing,
            dashboard: t.nav.dashboard,
            clients: t.nav.clients,
            invoices: t.nav.invoices,
            budgets: t.nav.budgets,
            contact: t.legalFooter.contact,
          }}
        />
      </body>
    </html>
  );
}
