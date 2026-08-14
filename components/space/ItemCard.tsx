import { CrossfadeImage } from "./CrossfadeImage";

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

// The core "digital display cabinet" interaction — see CrossfadeImage for
// the image behavior itself. `previewActive` forwards through to it; see
// that component's comment for why it exists.
export function ItemCard({
  item,
  valueLabel,
  theme,
  previewActive,
  sizes,
  priority,
}: {
  item: ItemCardData;
  valueLabel: string | null;
  theme?: ItemCardTheme;
  previewActive?: boolean;
  // Matches GRID_DENSITY_SIZES for whichever grid the card sits in — see
  // lib/themes/tokens.ts.
  sizes: string;
  priority?: boolean;
}) {
  return (
    <div>
      <div className="mb-3">
        <CrossfadeImage
          primaryUrl={item.primaryImageUrl}
          hoverUrl={item.hoverImageUrl}
          alt={item.title}
          sizes={sizes}
          cardShapeClassName={theme?.cardShapeClassName}
          previewActive={previewActive}
          priority={priority}
        />
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
