import Image from "next/image";

export interface ItemCardData {
  id: string;
  title: string;
  category: string | null;
  value: number | null;
  primaryImageUrl: string;
  hoverImageUrl: string | null;
}

// Set by the public space page, which renders against a space's actual
// six-axis theme (see docs/DESIGN-SYSTEM.md). Left undefined by the
// dashboard's item manager, which intentionally stays in the app's fixed
// neutral chrome regardless of any space's theme — the dashboard isn't
// themed, only the public page is.
export interface ItemCardTheme {
  cardShapeClassName: string;
  headingFontFamily: string;
  bodyFontFamily: string;
  titleColor: string;
  categoryColor: string;
  valueColor: string;
}

// The core "digital display cabinet" interaction, per
// docs/DESIGN-SYSTEM.md: no card background or border, just the
// (background-removed) photo floating on the page with a soft shadow,
// cross-fading to a second angle on ~500ms hover. Pure CSS — no JS event
// handlers needed, so this stays a Server Component. On touch devices,
// hover simply never triggers, which is the documented, intentional
// fallback rather than a bug.
export function ItemCard({
  item,
  valueLabel,
  theme,
}: {
  item: ItemCardData;
  valueLabel: string | null;
  theme?: ItemCardTheme;
}) {
  return (
    <div className="group">
      <div
        className={`relative mb-3 aspect-square overflow-hidden [filter:drop-shadow(0_4px_20px_rgb(0_0_0/0.08))] ${theme?.cardShapeClassName ?? ""}`}
      >
        <Image
          src={item.primaryImageUrl}
          alt={item.title}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className={`object-contain transition-opacity duration-300 ${
            item.hoverImageUrl
              ? "group-hover:opacity-0 group-hover:delay-500"
              : ""
          }`}
        />
        {item.hoverImageUrl && (
          <Image
            src={item.hoverImageUrl}
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:delay-500"
          />
        )}
      </div>
      <div className="space-y-0.5 text-center">
        <h3
          className="text-sm font-medium tracking-wide"
          style={
            theme
              ? { fontFamily: theme.headingFontFamily, color: theme.titleColor }
              : undefined
          }
        >
          {item.title}
        </h3>
        {item.category && (
          <p
            className={`text-xs uppercase tracking-wide ${theme ? "" : "text-neutral-500"}`}
            style={
              theme
                ? { fontFamily: theme.bodyFontFamily, color: theme.categoryColor }
                : undefined
            }
          >
            {item.category}
          </p>
        )}
        {valueLabel && (
          <p
            className={`text-xs font-medium ${theme ? "" : "text-neutral-700"}`}
            style={
              theme
                ? { fontFamily: theme.bodyFontFamily, color: theme.valueColor }
                : undefined
            }
          >
            {valueLabel}
          </p>
        )}
      </div>
    </div>
  );
}
