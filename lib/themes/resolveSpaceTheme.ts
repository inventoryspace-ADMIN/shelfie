import {
  ACCENT_COLORS,
  isAccentColorKey,
  BACKGROUND_TREATMENTS,
  isBackgroundTreatmentKey,
  isCardShapeKey,
  isGridDensityKey,
  getTextColorOnAccent,
  type GridDensityKey,
} from "./tokens";
import { getFontPairingProps, isFontPairingKey } from "./fonts";

interface SpaceThemeColumns {
  accent_color: string;
  font_pairing: string;
  background_treatment: string;
  card_shape: string;
  grid_density: string;
}

// One place every public route resolves a space's six-axis theme columns
// into usable values, falling back to each axis's database default for
// any value that's somehow outside the known set (defensive, not expected
// — the DB's CHECK constraints already prevent that at the source).
export function resolveSpaceTheme(space: SpaceThemeColumns) {
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

  const { background, foreground } = BACKGROUND_TREATMENTS[backgroundKey];
  const accentHex = ACCENT_COLORS[accentKey];
  const fontProps = getFontPairingProps(fontPairingKey);

  return {
    accentKey,
    backgroundKey,
    cardShapeKey,
    gridDensityKey,
    fontPairingKey,
    background,
    foreground,
    accentHex,
    accentTextColor: getTextColorOnAccent(accentKey),
    fontProps,
  };
}

export type ResolvedSpaceTheme = ReturnType<typeof resolveSpaceTheme>;
