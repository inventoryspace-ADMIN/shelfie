import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { CategoryFilterGrid } from "@/components/space/CategoryFilterGrid";
import { formatItemValue, type ValueDisplayMode } from "@/lib/items/formatValue";
import { withCacheBust } from "@/lib/images/uploadItemImage";
import { getPublicSpace } from "@/lib/spaces/getPublicSpace";
import { CARD_SHAPE_CLASSES, withAlpha } from "@/lib/themes/tokens";
import { resolveSpaceTheme } from "@/lib/themes/resolveSpaceTheme";

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
  const theme = resolveSpaceTheme(space);
  const valueDisplayMode: ValueDisplayMode =
    space.value_display_mode === "currency" ||
    space.value_display_mode === "number"
      ? space.value_display_mode
      : "hidden";

  const cardTheme = {
    cardShapeClassName: CARD_SHAPE_CLASSES[theme.cardShapeKey],
    headingFontFamily: "var(--space-font-heading)",
    bodyFontFamily: "var(--space-font-body)",
    titleColor: theme.foreground,
    categoryColor: withAlpha(theme.foreground, 0.6),
    valueColor: withAlpha(theme.foreground, 0.8),
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
    href: `/${username}/${slug}/${item.id}`,
  }));

  const ownerName = profile.display_name ?? profile.username;

  return (
    <main
      className={theme.fontProps.className}
      style={
        {
          ...theme.fontProps.style,
          backgroundColor: theme.background,
          color: theme.foreground,
          fontFamily: "var(--space-font-body)",
          "--space-foreground": theme.foreground,
          "--space-accent": theme.accentHex,
          minHeight: "100dvh",
        } as React.CSSProperties
      }
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-12 sm:px-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1
            className={`text-3xl tracking-wide ${theme.fontProps.headingWeightClass}`}
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
            gridDensity={theme.gridDensityKey}
            theme={cardTheme}
            accentColor={theme.accentHex}
            accentTextColor={theme.accentTextColor}
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
            style={{ color: theme.accentHex }}
          >
            Made with Shelfie
          </Link>
        </footer>
      </div>
    </main>
  );
}
