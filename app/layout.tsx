import type { Metadata } from "next";
import { headers } from "next/headers";
import { ExperienceTools } from "@/components/experience-tools";
import { TextareaAutosize } from "@/components/textarea-autosize";
import { getDictionary, getLocale } from "@/lib/i18n";
import { getSiteUrl, getPublicShareUrl } from "@/lib/site-url";
import "./globals.css";

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
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html
      lang={locale}
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: `(()=>{let t;try{t=localStorage.getItem('faktudash-theme')}catch{}if(t!=='dark'&&t!=='light')t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t})()` }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <TextareaAutosize />
        <ExperienceTools
          publicUrl={getPublicShareUrl()}
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
