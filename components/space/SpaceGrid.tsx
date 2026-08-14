import { GRID_DENSITY_CLASSES, type GridDensityKey } from "@/lib/themes/tokens";

// The one thing genuinely shared between the public page and the
// dashboard's item manager: the actual column layout, driven by the
// space's real grid_density — so the two views can't drift apart on row
// count/item size the way two independently-hardcoded grids did. What
// renders per item stays entirely up to the caller (a themed, linked
// ItemCardLink on the public page; a hover/focus/tap-reveal edit card on
// the dashboard) — this component only owns the grid itself.
//
// Renders the "grid" layout mode only. `layout_mode` has no picker UI yet
// (Phase 6) and every space is stuck on its 'grid' default until then, so
// there's nothing reachable to render "list" mode for yet — it also needs
// item attributes threaded through for its "attributes" column per
// docs/DESIGN-SYSTEM.md, which callers here don't have. Build list mode
// alongside its own picker in Phase 6, not speculatively now.
export function SpaceGrid({
  gridDensity,
  children,
}: {
  gridDensity: GridDensityKey;
  children: React.ReactNode;
}) {
  return <div className={`grid ${GRID_DENSITY_CLASSES[gridDensity]}`}>{children}</div>;
}
