import { Inter, Fraunces, Archivo, Space_Mono, Poppins } from "next/font/google";

// next/font requires these calls at module scope, unconditionally — Next.js
// statically analyzes them at build time. All five pairings' fonts get
// self-hosted regardless of which spaces use which; only the CSS variable
// classes actually applied to a given page determine what a visitor's
// browser fetches. See docs/DESIGN-SYSTEM.md "Font pairing" for the source
// list this mirrors exactly.
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-fraunces",
});
const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-archivo",
});
const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-poppins",
});

interface FontPairing {
  heading: { variable: string };
  body: { variable: string };
  headingVar: string;
  bodyVar: string;
  headingWeightClass: string;
}

export const fontPairings = {
  "modern-sans": {
    heading: inter,
    body: inter,
    headingVar: "--font-inter",
    bodyVar: "--font-inter",
    headingWeightClass: "font-medium",
  },
  "editorial-serif": {
    heading: fraunces,
    body: inter,
    headingVar: "--font-fraunces",
    bodyVar: "--font-inter",
    headingWeightClass: "font-normal",
  },
  "classic-grotesk": {
    heading: archivo,
    body: archivo,
    headingVar: "--font-archivo",
    bodyVar: "--font-archivo",
    headingWeightClass: "font-medium",
  },
  "mono-technical": {
    heading: spaceMono,
    body: inter,
    headingVar: "--font-space-mono",
    bodyVar: "--font-inter",
    headingWeightClass: "font-bold",
  },
  "soft-rounded": {
    heading: poppins,
    body: inter,
    headingVar: "--font-poppins",
    bodyVar: "--font-inter",
    headingWeightClass: "font-medium",
  },
} as const satisfies Record<string, FontPairing>;

export type FontPairingKey = keyof typeof fontPairings;

export function isFontPairingKey(value: string): value is FontPairingKey {
  return value in fontPairings;
}

// className for the page wrapper (loads both fonts' CSS variables), plus
// the two semantic custom properties every heading/body element in the
// space's rendering reads via [font-family:var(--space-font-heading)].
export function getFontPairingProps(key: FontPairingKey) {
  const pairing = fontPairings[key];
  return {
    className: `${pairing.heading.variable} ${pairing.body.variable}`,
    style: {
      "--space-font-heading": `var(${pairing.headingVar})`,
      "--space-font-body": `var(${pairing.bodyVar})`,
    } as React.CSSProperties,
    headingWeightClass: pairing.headingWeightClass,
  };
}
