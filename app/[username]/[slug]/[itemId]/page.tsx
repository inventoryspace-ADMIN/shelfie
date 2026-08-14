import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getPublicSpace } from "@/lib/spaces/getPublicSpace";
import { resolveSpaceTheme } from "@/lib/themes/resolveSpaceTheme";
import { CARD_SHAPE_CLASSES, withAlpha } from "@/lib/themes/tokens";
import { CrossfadeImage } from "@/components/space/CrossfadeImage";
import {
  formatItemValue,
  type ValueDisplayMode,
} from "@/lib/items/formatValue";
import { withCacheBust } from "@/lib/images/uploadItemImage";
import { itemAttributesSchema } from "@/lib/templates/attributes";

type PageParams = { username: string; slug: string; itemId: string };

// Same reasoning as getPublicSpace: shared by generateMetadata and the
// page body, cached per-request so both only query once between them.
const getItem = cache(async (spaceId: string, itemId: string) => {
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("items")
    .select(
      "id, title, description, category, value, primary_image_path, hover_image_path, attributes, updated_at"
    )
    .eq("id", itemId)
    .eq("space_id", spaceId)
    .maybeSingle();
  return item;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const { username, slug, itemId } = await params;
  const result = await getPublicSpace(username, slug);
  if (!result) notFound();
  const item = await getItem(result.space.id, itemId);
  if (!item) notFound();

  const ownerName = result.profile.display_name ?? result.profile.username;
  return {
    title: `${item.title} — ${result.space.name}`,
    description:
      item.description ||
      `${item.title}, from ${ownerName}'s ${result.space.name} on Shelfie.`,
    // Same rule as the parent space page — see docs/ROADMAP.md Phase 5.
    // No dedicated OG image here: this inherits the space's once it
    // exists (Next.js's file convention applies the nearest
    // opengraph-image up the route tree), rather than generating a
    // separate one per item — see docs/ROADMAP.md's post-launch list.
    robots: { index: false, follow: false },
  };
}

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const { username, slug, itemId } = await params;
  const result = await getPublicSpace(username, slug);
  if (!result) notFound();
  const { space } = result;

  const item = await getItem(space.id, itemId);
  if (!item) notFound();

  const supabase = await createClient();
  const bucket = supabase.storage.from("space-images");
  const theme = resolveSpaceTheme(space);
  const valueDisplayMode: ValueDisplayMode =
    space.value_display_mode === "currency" ||
    space.value_display_mode === "number"
      ? space.value_display_mode
      : "hidden";
  const valueLabel = formatItemValue(
    item.value,
    valueDisplayMode,
    space.value_currency
  );

  const attributesResult = itemAttributesSchema.safeParse(item.attributes);
  const fields = attributesResult.success ? attributesResult.data.fields : [];

  const primaryUrl = withCacheBust(
    bucket.getPublicUrl(item.primary_image_path).data.publicUrl,
    item.updated_at
  );
  const hoverUrl = item.hover_image_path
    ? withCacheBust(
        bucket.getPublicUrl(item.hover_image_path).data.publicUrl,
        item.updated_at
      )
    : null;

  const mutedColor = withAlpha(theme.foreground, 0.6);

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
      <div className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-12 sm:px-8">
        <Link
          href={`/${username}/${slug}`}
          className="text-sm underline underline-offset-2"
          style={{ color: mutedColor }}
        >
          ← Back to {space.name}
        </Link>

        <div className="mx-auto w-full max-w-md">
          <CrossfadeImage
            primaryUrl={primaryUrl}
            hoverUrl={hoverUrl}
            alt={item.title}
            sizes="(max-width: 640px) 90vw, 32rem"
            cardShapeClassName={CARD_SHAPE_CLASSES[theme.cardShapeKey]}
          />
        </div>

        <div className="flex flex-col items-center gap-1 text-center">
          <h1
            className={`text-2xl tracking-wide ${theme.fontProps.headingWeightClass}`}
            style={{ fontFamily: "var(--space-font-heading)" }}
          >
            {item.title}
          </h1>
          {item.category && (
            <p
              className="text-xs uppercase tracking-wide"
              style={{ color: mutedColor, fontFamily: "var(--space-font-body)" }}
            >
              {item.category}
            </p>
          )}
          {valueLabel && (
            <p
              className="text-sm font-medium"
              style={{ fontFamily: "var(--space-font-body)" }}
            >
              {valueLabel}
            </p>
          )}
        </div>

        {item.description && (
          <p
            className="text-center text-sm leading-relaxed"
            style={{ fontFamily: "var(--space-font-body)" }}
          >
            {item.description}
          </p>
        )}

        {fields.length > 0 && (
          <dl className="mx-auto grid w-full max-w-xs grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {fields.map((field, index) => (
              <div key={`${field.label}-${index}`} className="contents">
                <dt style={{ color: mutedColor }}>{field.label}</dt>
                <dd className="text-right">{field.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </main>
  );
}
