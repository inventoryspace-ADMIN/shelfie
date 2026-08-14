"use client";

import { useEffect, useRef, useState } from "react";

const MOBILE_WIDTH = 390; // matches the mobile-first testing width in CLAUDE.md
const DESKTOP_WIDTH = 1440;
const DESKTOP_HEIGHT = 900;

// Collapsed by default — an iframe of the live page is real weight to add
// to every dashboard visit, so it only loads once actually opened. Mobile
// starts as the default view on purpose: the product is mobile-first, and
// most edits should be judged at that width before desktop.
export function DevicePreview({ url }: { url: string }) {
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState<"mobile" | "desktop">("mobile");
  const containerRef = useRef<HTMLDivElement>(null);
  // null until measured, so the desktop iframe never renders at a
  // wrong/default scale even for a frame — see the effect below.
  const [desktopScale, setDesktopScale] = useState<number | null>(null);

  useEffect(() => {
    if (device !== "desktop" || !containerRef.current) return;
    const el = containerRef.current;
    const observer = new ResizeObserver(([entry]) => {
      setDesktopScale(Math.min(1, entry.contentRect.width / DESKTOP_WIDTH));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [device]);

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
        <div ref={containerRef} className="flex w-full flex-col items-center gap-3">
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
              Mobile {MOBILE_WIDTH}
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
              Desktop {DESKTOP_WIDTH}
            </button>
          </div>

          {device === "mobile" ? (
            // A real device-width viewport, not a squeezed-down layout: an
            // iframe has its own viewport for CSS purposes, so the page's
            // actual mobile breakpoints apply here exactly as they would
            // on an actual phone.
            <div
              className="max-w-full overflow-hidden rounded border border-neutral-300"
              style={{ width: MOBILE_WIDTH }}
            >
              <iframe src={url} title="Space preview" className="h-[700px] w-full" />
            </div>
          ) : (
            desktopScale != null && (
              // Same idea, but a real 1440-wide viewport won't fit this
              // panel — so it renders at true desktop width (breakpoints
              // fire correctly) and gets scaled down visually afterward,
              // rather than actually being a narrower viewport the way
              // that produced the wrong column count before.
              <div
                className="overflow-hidden rounded border border-neutral-300"
                style={{
                  width: DESKTOP_WIDTH * desktopScale,
                  height: DESKTOP_HEIGHT * desktopScale,
                }}
              >
                <iframe
                  src={url}
                  title="Space preview"
                  width={DESKTOP_WIDTH}
                  height={DESKTOP_HEIGHT}
                  style={{
                    transform: `scale(${desktopScale})`,
                    transformOrigin: "top left",
                    border: 0,
                  }}
                />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
