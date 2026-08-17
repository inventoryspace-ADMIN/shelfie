"use client";

import { useState } from "react";

// Collapses the space page's action row (Add item, Publish, Preview, Copy
// link) behind a single pill, so the page reads calmer at rest and the
// actions "explode" outward on demand. Desktop: hovering anywhere in the
// toolbar area reveals the row and keeps it revealed for as long as the
// cursor stays inside — plain CSS group-hover, no JS needed for that part.
// Keyboard: tabbing into any action (they're always in the DOM, just
// visually collapsed) reveals the row the same way, via :focus-within —
// so keyboard access never depends on hovering at all. Touch has neither,
// so tapping the pill toggles the same expanded state explicitly, the same
// pattern DashboardItemCard already uses for its hover-only edit overlay.
export function ExpandingToolbar({ children }: { children: React.ReactNode }) {
  const [tapped, setTapped] = useState(false);

  return (
    <div
      className="group grid place-items-center"
      onClick={() => {
        if (window.matchMedia("(pointer: coarse)").matches) {
          setTapped((v) => !v);
        }
      }}
    >
      {/* Purely decorative — the real actions below are always what's
          actually focusable/operable, so this never needs to be. */}
      <div
        aria-hidden="true"
        className={`col-start-1 row-start-1 rounded-full border border-neutral-300 px-4 py-1.5 text-sm font-medium text-neutral-600 transition-opacity duration-200 ease-out group-hover:opacity-0 group-focus-within:opacity-0 ${
          tapped ? "opacity-0" : "opacity-100"
        }`}
      >
        Actions
      </div>

      <div
        className={`col-start-1 row-start-1 flex flex-wrap items-start justify-center gap-3 pointer-events-none opacity-0 scale-0 transition-all duration-200 ease-out group-hover:pointer-events-auto group-hover:opacity-100 group-hover:scale-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-focus-within:scale-100 ${
          tapped ? "pointer-events-auto opacity-100 scale-100" : ""
        }`}
      >
        {children}
      </div>
    </div>
  );
}
