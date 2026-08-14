"use client";

import { useMemo, useState } from "react";
import { SpaceGrid } from "./SpaceGrid";
import { ItemCardLink } from "./ItemCardLink";
import type { ItemCardData, ItemCardTheme } from "./ItemCard";
import type { GridDensityKey } from "@/lib/themes/tokens";

export interface SpaceGridItem {
  data: ItemCardData;
  valueLabel: string | null;
  href: string;
}

// "All" plus one chip per distinct category present in the space, per
// docs/DESIGN-SYSTEM.md. Client-side filtering rather than a URL param —
// instant, no navigation, and collection sizes here don't warrant more
// (same reasoning docs/ROADMAP.md Phase 7 uses for text search).
export function CategoryFilterGrid({
  items,
  gridDensity,
  theme,
  accentColor,
  accentTextColor,
}: {
  items: SpaceGridItem[];
  gridDensity: GridDensityKey;
  theme: ItemCardTheme;
  accentColor: string;
  accentTextColor: string;
}) {
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.data.category) set.add(item.data.category);
    }
    return Array.from(set).sort();
  }, [items]);

  const [active, setActive] = useState<string | null>(null);

  const filtered =
    categories.length >= 2 && active
      ? items.filter((item) => item.data.category === active)
      : items;

  const chipStyle = (isActive: boolean) =>
    isActive
      ? {
          backgroundColor: accentColor,
          color: accentTextColor,
          borderColor: accentColor,
        }
      : { borderColor: theme.categoryColor, color: theme.categoryColor };

  return (
    <div className="flex flex-col gap-6">
      {/* Nothing to filter by — skip the bar entirely rather than showing
          a lone, pointless "All" chip. */}
      {categories.length >= 2 && (
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setActive(null)}
            className="rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors"
            style={chipStyle(active === null)}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActive(category)}
              className="rounded-full border px-3 py-1 text-xs uppercase tracking-wide transition-colors"
              style={chipStyle(active === category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}
      <SpaceGrid gridDensity={gridDensity}>
        {filtered.map(({ data, valueLabel, href }) => (
          <ItemCardLink
            key={data.id}
            href={href}
            item={data}
            valueLabel={valueLabel}
            theme={theme}
          />
        ))}
      </SpaceGrid>
    </div>
  );
}
