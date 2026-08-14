// Every owner-customisable value on a `spaces` row maps to a token here —
// see docs/DESIGN-SYSTEM.md "The six owner-customisable axes" for the
// source spec. No component should hardcode a hex value or a one-off pixel
// size for any of these; it looks the value up here instead.

export const ACCENT_COLORS = {
  terracotta: "#C15F3C",
  ochre: "#B8842C",
  olive: "#6B7A3A",
  pine: "#2F5D50",
  teal: "#2C7A7B",
  sky: "#2B7FB8",
  indigo: "#4A55A2",
  violet: "#6D4AA8",
  plum: "#8C3A6B",
  rose: "#C24D6B",
  crimson: "#B23A48",
  slate: "#4B5563",
  graphite: "#27272A",
  sage: "#5C8368",
} as const;

export type AccentColorKey = keyof typeof ACCENT_COLORS;

export function isAccentColorKey(value: string): value is AccentColorKey {
  return value in ACCENT_COLORS;
}

// Relative luminance (WCAG formula) of a hex color, used to decide whether
// text sitting on top of a solid fill of that color should be light or
// dark — "the app computes light-vs-dark text automatically per swatch"
// per DESIGN-SYSTEM.md, rather than asking the owner to think about it.
function relativeLuminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const linear = [r, g, b].map((c) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

// For text/icons drawn directly ON TOP of a solid accent fill (e.g. a
// selected filter chip) — not for using the accent as a text color on the
// page's own background, which every swatch is already contrast-checked
// for regardless of luminance (see docs/DESIGN-SYSTEM.md).
export function getTextColorOnAccent(key: AccentColorKey): "#FFFFFF" | "#111111" {
  return relativeLuminance(ACCENT_COLORS[key]) > 0.4 ? "#111111" : "#FFFFFF";
}

export const BACKGROUND_TREATMENTS = {
  "gallery-white": { background: "#FFFFFF", foreground: "#111111" },
  "soft-paper": { background: "#F7F3EC", foreground: "#2B2620" },
  "studio-black": { background: "#111111", foreground: "#F5F5F5" },
  midnight: { background: "#161A2B", foreground: "#D7DCF5" },
} as const;

export type BackgroundTreatmentKey = keyof typeof BACKGROUND_TREATMENTS;

export function isBackgroundTreatmentKey(
  value: string
): value is BackgroundTreatmentKey {
  return value in BACKGROUND_TREATMENTS;
}

// "square" needs nothing extra — it's the ItemCard image container's own
// default styling with no shape-specific class added.
export const CARD_SHAPE_CLASSES = {
  square: "",
  rounded: "rounded-2xl",
  // The hairline needs to sit in "the current background treatment's
  // border tone" (DESIGN-SYSTEM.md), which isn't one of the two hex
  // values a background treatment defines above — color-mixing the
  // space's own foreground color at low opacity gives a border that's
  // always a subtle, correctly-toned step away from that background,
  // without needing a fifth hardcoded value per treatment.
  framed:
    "rounded-lg border [border-color:color-mix(in_srgb,var(--space-foreground)_15%,transparent)]",
} as const;

export type CardShapeKey = keyof typeof CARD_SHAPE_CLASSES;

export function isCardShapeKey(value: string): value is CardShapeKey {
  return value in CARD_SHAPE_CLASSES;
}

// Mobile-first per docs/DESIGN-SYSTEM.md: both start at 2 columns on the
// smallest screens, never 1 — a single column wastes the "browse a
// collection" feeling a display cabinet is going for.
export const GRID_DENSITY_CLASSES = {
  compact: "grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6",
  comfortable: "grid-cols-2 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
} as const;

export type GridDensityKey = keyof typeof GRID_DENSITY_CLASSES;

export function isGridDensityKey(value: string): value is GridDensityKey {
  return value in GRID_DENSITY_CLASSES;
}

export type LayoutModeKey = "grid" | "list";

export function isLayoutModeKey(value: string): value is LayoutModeKey {
  return value === "grid" || value === "list";
}

// Computed server-side (not via CSS color-mix) so item-card text colors are
// plain values a component can apply directly — no runtime dependency on
// which CSS features a visitor's browser supports.
export function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
