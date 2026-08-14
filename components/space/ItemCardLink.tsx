"use client";

import { useState } from "react";
import Link from "next/link";
import { ItemCard, type ItemCardData, type ItemCardTheme } from "./ItemCard";

// Desktop already has hover to preview the second angle, so a click just
// opens the item's detail page — no special handling needed there. Touch
// has no hover, so per docs/ROADMAP.md Phase 5 it gets a two-step tap
// instead: first tap previews the second angle (via ItemCard's
// previewActive), a further tap opens the detail page. This is a
// deliberate choice among a few reasonable options the roadmap left open
// ("tap, or hold — to be finalized... not guessed at now") — worth trying
// on an actual phone and revisiting if hold reads better in practice.
export function ItemCardLink({
  href,
  item,
  valueLabel,
  theme,
  sizes,
  priority,
}: {
  href: string;
  item: ItemCardData;
  valueLabel: string | null;
  theme: ItemCardTheme;
  sizes: string;
  priority?: boolean;
}) {
  const [previewed, setPreviewed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: coarse)").matches;

    if (isTouch && item.hoverImageUrl && !previewed) {
      e.preventDefault();
      setPreviewed(true);
    }
  };

  return (
    <Link href={href} onClick={handleClick} className="block">
      <ItemCard
        item={item}
        valueLabel={valueLabel}
        theme={theme}
        previewActive={previewed}
        sizes={sizes}
        priority={priority}
      />
    </Link>
  );
}
