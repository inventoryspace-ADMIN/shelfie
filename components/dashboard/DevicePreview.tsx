"use client";

import { useState } from "react";

const MOBILE_WIDTH = 390; // matches the mobile-first testing width in CLAUDE.md

// Collapsed by default — an iframe of the live page is real weight to add
// to every dashboard visit, so it only loads once actually opened. Mobile
// starts as the default view on purpose: the product is mobile-first, and
// most edits should be judged at that width before desktop.
export function DevicePreview({ url }: { url: string }) {
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium"
      >
        {visible ? "Hide preview" : "Show preview"}
      </button>

      {visible && (
        <div className="flex w-full flex-col items-center gap-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`rounded px-3 py-1 text-xs font-medium ${
                device === "mobile"
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-300"
              }`}
            >
              Mobile
            </button>
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`rounded px-3 py-1 text-xs font-medium ${
                device === "desktop"
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-300"
              }`}
            >
              Desktop
            </button>
          </div>
          <div
            className="max-w-full overflow-hidden rounded border border-neutral-300"
            style={{ width: device === "mobile" ? MOBILE_WIDTH : "100%" }}
          >
            {/* A real device-width viewport, not a squeezed-down desktop
                layout: an iframe has its own viewport for CSS purposes, so
                the page's actual mobile breakpoints apply — same as
                opening it on an actual phone, unlike just shrinking a
                container would. */}
            <iframe
              src={url}
              title="Space preview"
              className="h-[700px] w-full"
            />
          </div>
        </div>
      )}
    </div>
  );
}
