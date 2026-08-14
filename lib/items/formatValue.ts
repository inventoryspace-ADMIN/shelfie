export type ValueDisplayMode = "hidden" | "currency" | "number";

// How an item's raw `value` number renders on the public page, per its
// space's value_display_mode — see docs/SCHEMA.md "spaces.value_display_mode".
// Returns null when there's nothing to show (hidden mode, or no value set),
// so callers can skip rendering entirely rather than showing an empty tag.
export function formatItemValue(
  value: number | null,
  mode: ValueDisplayMode,
  currency: string | null
): string | null {
  if (value == null || mode === "hidden") return null;

  if (mode === "currency") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency ?? "USD",
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US").format(value);
}
