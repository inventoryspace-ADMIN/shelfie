import { ItemCardLink } from "./ItemCardLink";
import type { ItemCardData, ItemCardTheme } from "./ItemCard";
import { GRID_DENSITY_CLASSES, type GridDensityKey } from "@/lib/themes/tokens";

export interface SpaceGridItem {
  data: ItemCardData;
  valueLabel: string | null;
  href: string;
}

// Renders the "grid" layout mode only. `layout_mode` has no picker UI yet
// (Phase 6) and every space is stuck on its 'grid' default until then, so
// there's nothing reachable to render "list" mode for yet — it also needs
// item attributes threaded through for its "attributes" column per
// docs/DESIGN-SYSTEM.md, which this component doesn't have. Build list
// mode alongside its own picker in Phase 6, not speculatively now.
export function SpaceGrid({
  items,
  gridDensity,
  theme,
}: {
  items: SpaceGridItem[];
  gridDensity: GridDensityKey;
  theme: ItemCardTheme;
}) {
  return (
    <div className={`grid ${GRID_DENSITY_CLASSES[gridDensity]}`}>
      {items.map(({ data, valueLabel, href }) => (
        <ItemCardLink
          key={data.id}
          href={href}
          item={data}
          valueLabel={valueLabel}
          theme={theme}
        />
      ))}
    </div>
  );
}
