import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getLocale } from "@/lib/i18n";
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
    default: "FaktuDash | Facturacion online para autonomos y pequenos negocios",
    template: "%s | FaktuDash",
  },
  description:
    "Crea facturas, presupuestos y gestiona clientes desde un panel online sencillo para autonomos y pequenos negocios.",
  applicationName: "FaktuDash",
  keywords: [
    "facturacion online",
    "programa de facturacion",
    "facturas para autonomos",
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
    title: "FaktuDash | Facturacion online",
    description:
      "Crea facturas, presupuestos y gestiona clientes desde un panel online sencillo para autonomos y pequenos negocios.",
    url: "/",
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
    title: "FaktuDash | Facturacion online",
    description:
      "Crea facturas, presupuestos y gestiona clientes desde un panel online sencillo para autonomos y pequenos negocios.",
    images: ["/opengraph-image"],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
