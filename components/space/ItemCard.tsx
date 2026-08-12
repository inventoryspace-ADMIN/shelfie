import Image from "next/image";

export interface ItemCardData {
  id: string;
  title: string;
  category: string | null;
  value: number | null;
  primaryImageUrl: string;
  hoverImageUrl: string | null;
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
}: {
  item: ItemCardData;
  valueLabel: string | null;
}) {
  return (
    <div className="group">
      {/* DIAGNOSTIC — temporary border to check container sizing, not the final look */}
      <div className="relative mb-3 aspect-square border border-dashed border-red-400 [filter:drop-shadow(0_4px_20px_rgb(0_0_0/0.08))]">
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
            className="object-contain opacity-0 transition-opacity delay-500 duration-300 group-hover:opacity-100"
          />
        )}
      </div>
      <div className="space-y-0.5 text-center">
        <h3 className="text-sm font-medium tracking-wide">{item.title}</h3>
        {item.category && (
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            {item.category}
          </p>
        )}
        {valueLabel && (
          <p className="text-xs font-medium text-neutral-700">{valueLabel}</p>
        )}
      </div>
    </div>
  );
}
