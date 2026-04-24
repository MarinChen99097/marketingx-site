import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import "../globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://salecraft.ai"),
  title: {
    default: "SaleCraft — AI Marketing Consultant",
    template: "%s | SaleCraft",
  },
  description:
    "Free AI marketing consultant for product sellers. Brand analysis, strategy planning, landing pages, reels, and social posts — all in 30 minutes.",
  keywords: [
    "AI marketing",
    "landing page generator",
    "marketing consultant",
    "brand analysis",
    "social media marketing",
    "reels generator",
  ],
  authors: [{ name: "SaleCraft" }],
  creator: "SaleCraft",
  publisher: "SaleCraft",
  openGraph: {
    type: "website",
    locale: "en",
    url: "https://salecraft.ai",
    siteName: "SaleCraft",
    title: "SaleCraft — AI Marketing Consultant",
    description:
      "Free AI marketing consultant for product sellers. Brand analysis, strategy planning, landing pages, reels, and social posts — all in 30 minutes.",
    // Must be declared explicitly: the `app/opengraph-image.tsx` convention
    // lives under the root segment while this metadata sits in `[locale]/`,
    // and Next.js shallow-merges the child's openGraph over the parent — so
    // the auto-injected og:image from the convention was being dropped.
    // Without og:image, scrapers (LINE, FB, ...) fell back to any large
    // page image and started picking the MingJian demo .webp.
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "SaleCraft — AI Marketing Consultant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SaleCraft — AI Marketing Consultant",
    description:
      "Free AI marketing consultant for product sellers. Brand analysis, strategy planning, landing pages, reels, and social posts.",
    images: [
      {
        url: "/twitter-image",
        width: 1200,
        height: 630,
        alt: "SaleCraft — AI Marketing Consultant",
      },
    ],
  },
  icons: {
    icon: [
      { url: "/icon", sizes: "32x32", type: "image/png" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180" }],
  },
  manifest: "/manifest.webmanifest",
};

const RTL_LOCALES = ['ar'];

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as any)) {
    notFound();
  }
  const messages = await getMessages();
  const dir = RTL_LOCALES.includes(locale) ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Noto+Sans+TC:wght@300;400;500;600;700;900&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
