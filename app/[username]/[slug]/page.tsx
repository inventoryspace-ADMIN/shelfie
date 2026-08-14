import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CategoryFilterGrid } from "@/components/space/CategoryFilterGrid";
import { formatItemValue, type ValueDisplayMode } from "@/lib/items/formatValue";
import { withCacheBust } from "@/lib/images/uploadItemImage";
import {
  ACCENT_COLORS,
  isAccentColorKey,
  BACKGROUND_TREATMENTS,
  isBackgroundTreatmentKey,
  CARD_SHAPE_CLASSES,
  isCardShapeKey,
  isGridDensityKey,
  withAlpha,
  getTextColorOnAccent,
  type GridDensityKey,
} from "@/lib/themes/tokens";
import { getFontPairingProps, isFontPairingKey } from "@/lib/themes/fonts";

// Shared by generateMetadata and the page body so a request only ever
// queries the profile+space once — React's cache() dedupes calls with the
// same arguments within one render.
const getPublicSpace = cache(async (username: string, slug: string) => {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", username)
    .maybeSingle();
  if (!profile) return null;

  const { data: space } = await supabase
    .from("spaces")
    .select(
      "id, name, status, accent_color, font_pairing, background_treatment, card_shape, grid_density, layout_mode, value_display_mode, value_currency"
    )
    .eq("owner_id", profile.id)
    .eq("slug", slug)
    .maybeSingle();
  // RLS already restricts this to published spaces, or the owner's own —
  // if nothing came back, "doesn't exist" and "exists but is a private
  // draft" are indistinguishable on purpose (see docs/DESIGN-SYSTEM.md
  // 404 state: a guessed URL can't be used to confirm either way).
  if (!space) return null;

  return { profile, space };
});

type PageParams = { username: string; slug: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { username, slug } = await params;
  const result = await getPublicSpace(username, slug);
  if (!result) notFound();

  const ownerName = result.profile.display_name ?? result.profile.username;
  return {
    title: `${result.space.name} — ${ownerName}`,
    description: `Browse ${ownerName}'s ${result.space.name}, cataloged on Shelfie.`,
    // Personal possessions, sometimes with prices, are a different privacy
    // case than a typical unlisted page — sharing here is always
    // deliberate, so search-engine discovery is opt-in, not the default.
    // See docs/ROADMAP.md Phase 5.
    robots: { index: false, follow: false },
  };
}

export default async function SpacePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { username, slug } = await params;
  const result = await getPublicSpace(username, slug);
  if (!result) notFound();
  const { profile, space } = result;

  const supabase = await createClient();
  const { data: items } = await supabase
    .from("items")
    .select(
      "id, title, category, value, primary_image_path, hover_image_path, updated_at"
    )
    .eq("space_id", space.id)
    .order("sort_order", { ascending: true });

  const bucket = supabase.storage.from("space-images");

  const accentKey = isAccentColorKey(space.accent_color)
    ? space.accent_color
    : "graphite";
  const backgroundKey = isBackgroundTreatmentKey(space.background_treatment)
    ? space.background_treatment
    : "gallery-white";
  const cardShapeKey = isCardShapeKey(space.card_shape)
    ? space.card_shape
    : "square";
  const gridDensityKey: GridDensityKey = isGridDensityKey(space.grid_density)
    ? space.grid_density
    : "comfortable";
  const fontPairingKey = isFontPairingKey(space.font_pairing)
    ? space.font_pairing
    : "modern-sans";
  const valueDisplayMode: ValueDisplayMode =
    space.value_display_mode === "currency" ||
    space.value_display_mode === "number"
      ? space.value_display_mode
      : "hidden";

  const { background, foreground } = BACKGROUND_TREATMENTS[backgroundKey];
  const accentHex = ACCENT_COLORS[accentKey];
  const fontProps = getFontPairingProps(fontPairingKey);

  const cardTheme = {
    cardShapeClassName: CARD_SHAPE_CLASSES[cardShapeKey],
    headingFontFamily: "var(--space-font-heading)",
    bodyFontFamily: "var(--space-font-body)",
    titleColor: foreground,
    categoryColor: withAlpha(foreground, 0.6),
    valueColor: withAlpha(foreground, 0.8),
  };

  const gridItems = (items ?? []).map((item) => ({
    data: {
      id: item.id,
      title: item.title,
      category: item.category,
      value: item.value,
      primaryImageUrl: withCacheBust(
        bucket.getPublicUrl(item.primary_image_path).data.publicUrl,
        item.updated_at
      ),
      hoverImageUrl: item.hover_image_path
        ? withCacheBust(
            bucket.getPublicUrl(item.hover_image_path).data.publicUrl,
            item.updated_at
          )
        : null,
    },
    valueLabel: formatItemValue(
      item.value,
      valueDisplayMode,
      space.value_currency
    ),
  }));

  const ownerName = profile.display_name ?? profile.username;

  return (
    <main
      className={fontProps.className}
      style={
        {
          ...fontProps.style,
          backgroundColor: background,
          color: foreground,
          fontFamily: "var(--space-font-body)",
          "--space-foreground": foreground,
          "--space-accent": accentHex,
          minHeight: "100dvh",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:px-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1
            className={`text-3xl tracking-wide ${fontProps.headingWeightClass}`}
            style={{ fontFamily: "var(--space-font-heading)" }}
          >
            {space.name}
          </h1>
          <p className="text-sm" style={{ opacity: 0.7 }}>
            {ownerName} · {gridItems.length}{" "}
            {gridItems.length === 1 ? "item" : "items"}
          </p>
        </div>

        {gridItems.length > 0 ? (
          <CategoryFilterGrid
            items={gridItems}
            gridDensity={gridDensityKey}
            theme={cardTheme}
            accentColor={accentHex}
            accentTextColor={getTextColorOnAccent(accentKey)}
          />
        ) : (
          <p className="py-16 text-center text-sm" style={{ opacity: 0.6 }}>
            Nothing here yet.
          </p>
        )}

        <footer className="mt-8 text-center text-xs" style={{ opacity: 0.6 }}>
          <Link
            href="/"
            className="underline underline-offset-2"
            style={{ color: accentHex }}
          >
            Made with Shelfie
          </Link>
        </footer>
      </div>
    </main>
  );
}
