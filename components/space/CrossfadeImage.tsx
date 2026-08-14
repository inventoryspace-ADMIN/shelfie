import Image from "next/image";

// The core "digital display cabinet" visual, per docs/DESIGN-SYSTEM.md: no
// card background or border, just the (background-removed) photo floating
// on the page with a soft shadow, cross-fading to a second angle on
// ~500ms hover. Pure CSS by default — no JS needed, so this stays usable
// on its own as a Server Component. `previewActive` is the one JS-driven
// exception: touch has no real :hover state to lean on (see
// ItemCardLink), so it forces the same cross-faded look via inline style,
// which wins over the group-hover classes without needing to remove them.
// Shared by ItemCard (grid-size) and the item detail page (enlarged) —
// same interaction, two sizes.
export function CrossfadeImage({
  primaryUrl,
  hoverUrl,
  alt,
  sizes,
  cardShapeClassName = "",
  previewActive,
  priority,
}: {
  primaryUrl: string;
  hoverUrl: string | null;
  alt: string;
  sizes: string;
  cardShapeClassName?: string;
  previewActive?: boolean;
  // For the first couple of above-the-fold cards on the public grid, so
  // next/image preloads them instead of lazy-loading — meaningfully
  // improves mobile LCP on the page docs/ROADMAP.md flags as "the page
  // that matters most." Left unset (lazy) everywhere else, including the
  // dashboard, which isn't the page that pass is about.
  priority?: boolean;
}) {
  return (
    <div
      className={`group relative aspect-square overflow-hidden [filter:drop-shadow(0_4px_20px_rgb(0_0_0/0.08))] ${cardShapeClassName}`}
    >
      <Image
        src={primaryUrl}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`object-contain transition-opacity duration-300 ${
          hoverUrl ? "group-hover:opacity-0 group-hover:delay-500" : ""
        }`}
        style={previewActive ? { opacity: 0 } : undefined}
      />
      {hoverUrl && (
        <Image
          src={hoverUrl}
          alt=""
          aria-hidden
          fill
          sizes={sizes}
          className="object-contain opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-hover:delay-500"
          style={previewActive ? { opacity: 1 } : undefined}
        />
      )}
    </div>
  );
}
