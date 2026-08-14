import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// `metadataBase` is what turns the relative image URL an opengraph-image.tsx
// file produces into the absolute URL a link-preview crawler needs. Deliber-
// ately built from Vercel's own env vars rather than lib/site.ts's
// header-reading getSiteOrigin() — that needs headers(), which would force
// every page in the app (including the plain static "/" marketing page) into
// dynamic rendering just to compute a URL that Vercel already exposes
// statically. VERCEL_PROJECT_PRODUCTION_URL is the stable *.vercel.app
// domain in production (per Phase 0, no custom domain yet); VERCEL_URL is
// the per-deployment URL Vercel sets on preview builds; localhost covers
// local dev, where neither is set.
const siteUrl =
  process.env.VERCEL_ENV === "production"
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Shelfie",
  description: "A digital display cabinet for the things you own.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
