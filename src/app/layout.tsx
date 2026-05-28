import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://cooked.not.toys"),
  title: { default: "Cooked", template: "%s — Cooked" },
  description: "Your interactive cooking companion. Beautiful recipes, step-by-step guidance.",
  keywords: ["cooking", "recipes", "cookbook", "food"],
  authors: [{ name: "Cooked" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cooked",
  },
  formatDetection: { telephone: false },
  openGraph: {
    siteName: "Cooked",
    title: "Cooked",
    description: "Your interactive cooking companion. Beautiful recipes, step-by-step guidance.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Cooked — Your cooking companion" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cooked",
    description: "Your interactive cooking companion. Beautiful recipes, step-by-step guidance.",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF7F2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans bg-parchment-100 text-ink-900 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
