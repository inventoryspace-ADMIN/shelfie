"use client";

import { useState } from "react";
import Link from "next/link";
import { ItemCard, type ItemCardData } from "@/components/space/ItemCard";
import { DeleteItemButton } from "./DeleteItemButton";

// Edit/Delete used to sit as permanent text links below every card,
// changing its height and making the dashboard grid look different from
// the public page even at matching columns. They're an overlay now,
// revealed on hover, keyboard focus (group-focus-within — tab to either
// control and it appears), or tap. Tap needs its own handling: touch has
// neither hover nor a mouse-driven focus flow, so without it the overlay
// would be genuinely unreachable on a phone, not just less convenient —
// same reasoning as ItemCardLink's touch handling on the public page.
export function DashboardItemCard({
  item,
  valueLabel,
  spaceId,
}: {
  item: ItemCardData;
  valueLabel: string | null;
  spaceId: string;
}) {
  const [tapped, setTapped] = useState(false);

  return (
    <div
      className="group relative"
      onClick={() => {
        if (window.matchMedia("(pointer: coarse)").matches) {
          setTapped((v) => !v);
        }
      }}
    >
      <ItemCard item={item} valueLabel={valueLabel} />
      <div
        className={`absolute inset-x-0 top-0 flex justify-center gap-3 rounded-t bg-gradient-to-b from-white/95 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${
          tapped ? "opacity-100" : ""
        }`}
      >
        <Link
          href={`/dashboard/${spaceId}/items/${item.id}/edit`}
          className="text-xs font-medium underline"
        >
          Edit
        </Link>
        <DeleteItemButton
          itemId={item.id}
          spaceId={spaceId}
          itemTitle={item.title}
        />
      </div>
    </div>
  );
}
