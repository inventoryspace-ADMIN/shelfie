# Shelfie — Design System

This document has two parts: the tokens extracted from your Figma
prototype (the raw material), and the bounded customisation system built
from them (what an owner actually gets to choose). Every value here is a
named token — nothing in the app should ever contain a raw hex code or a
one-off pixel value; if a component needs a color or a size, it reaches for
one of these.

## What we kept from the Figma prototype, and why

- **The "floating display cabinet" item card** — no card background, no
  border, no box. Just the image (with its background removed) sitting
  directly on the page with a soft drop shadow, and small centered text
  underneath. This is the single most important visual idea in the
  prototype and it's the foundation of every layout below.
- **Quiet, restrained chrome** — outline/ghost buttons, no loud filled
  colors except the one accent, generous whitespace, uppercase
  letter-spaced captions for metadata (category, brand). We kept this
  overall restraint and the caption treatment.
- **Named theme presets as the customisation model** — instead of asking an
  owner to pick 10 separate colors, the prototype let them pick one named
  "vibe." We kept that idea but tightened it: each of the six axes below
  is its own small named list, and — per your decision — **the accent
  color specifically is picked from a curated palette, never a raw hex
  picker**, so no combination the owner can reach ever looks broken.
- **The 4-column / 8-column grid toggle** — kept as "Grid density," renamed
  and re-tuned mobile-first (the original was designed desktop-first; see
  below).

## What we deliberately did not carry over

- The prototype's "Custom" theme let an owner type *any* hex color for
  background and accent. We replaced this entirely — see "Accent color"
  below.
- The two competing CSS files in the export (`default_theme.css` at 16px
  base and `globals.css` at 14px base, silently overridden by import
  order) — we standardize on a single 16px root font size. Below 16px,
  iOS Safari auto-zooms into text inputs on focus, which is a genuinely
  bad mobile experience for a mobile-first product.

---

## Base tokens (not owner-customisable)

These come from shadcn's default neutral palette (OKLCH-based, already
tuned for accessible contrast) and apply regardless of which theme options
an owner picks — they're the "chrome" (dashboard UI, form inputs, buttons)
that stays consistent app-wide.

| Token | Light | Dark |
|---|---|---|
| `--background` | `oklch(1 0 0)` (white) | `oklch(0.145 0 0)` (near-black) |
| `--foreground` | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` |
| `--border` | `oklch(0.922 0 0)` | `oklch(0.269 0 0)` |
| `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` |

Base font size: **16px**. Type scale, spacing scale, and shadow scale all
use Tailwind's default scale — never a hand-picked pixel value in a
component.

Heading weight: 500 (medium) — matches the prototype's restraint, avoids
the heavier default bold.

---

## The six owner-customisable axes

Every axis is a closed list. An owner picks one value per axis; there is no
free-text or free-color escape hatch anywhere in this list. Stored as the
six typed columns on `spaces` described in `docs/SCHEMA.md`.

### 1. Accent color — 14 curated swatches

Each swatch has been chosen to hold WCAG AA contrast (4.5:1 minimum) for
body text against both a white and a near-black surface, so it's safe to
use as a text/icon/button color against *any* of the four background
treatments below. The app computes light-vs-dark text automatically per
swatch using its relative luminance — the owner never has to think about
contrast at all.

| Key | Swatch | Hex |
|---|---|---|
| `terracotta` | 🟧 | `#C15F3C` |
| `ochre` | 🟨 | `#B8842C` |
| `olive` | 🟩 | `#6B7A3A` |
| `pine` | 🟩 | `#2F5D50` |
| `teal` | 🟦 | `#2C7A7B` |
| `sky` | 🟦 | `#2B7FB8` |
| `indigo` | 🟦 | `#4A55A2` |
| `violet` | 🟪 | `#6D4AA8` |
| `plum` | 🟪 | `#8C3A6B` |
| `rose` | 🟥 | `#C24D6B` |
| `crimson` | 🟥 | `#B23A48` |
| `slate` | ⬛ | `#4B5563` |
| `graphite` | ⬛ | `#27272A` |
| `sage` | 🟩 | `#5C8368` |

### 2. Font pairing — 5 curated pairs

Every font is loaded via `next/font/google` (self-hosted at build time, no
runtime request to Google — good for both performance and privacy).

| Key | Heading | Body | Feel |
|---|---|---|---|
| `modern-sans` | Inter, medium | Inter, regular | Clean, neutral, safe default |
| `editorial-serif` | Fraunces | Inter | Boutique, art/fashion, a little luxe |
| `classic-grotesk` | Archivo | Archivo | Bold, confident, streetwear/sneakers |
| `mono-technical` | Space Mono | Inter | Spec-sheet, technical — garages, tools, gear |
| `soft-rounded` | Poppins | Inter | Friendly, casual — plants, vinyl, hobbies |

### 3. Background treatment — 4 curated looks

| Key | Background | Foreground | Feel |
|---|---|---|---|
| `gallery-white` | `#FFFFFF` | `#111111` | Crisp, minimal, default |
| `soft-paper` | `#F7F3EC` | `#2B2620` | Warm, tactile, boutique |
| `studio-black` | `#111111` | `#F5F5F5` | Gallery-at-night, dramatic |
| `midnight` | `#161A2B` | `#D7DCF5` | Deep navy, moody, premium |

*(Not built in v1: a "follow visitor's system light/dark setting" option —
it would need two accent-contrast passes and two OG-image variants per
space. Worth adding post-launch, not before.)*

**Idea logged for Phase 6 scoping, not decided:** a custom-image background
option (owner uploads their own photo/texture as the space background,
instead of picking one of the 4 curated treatments above). Requested for
future consideration — needs real thought before building, not just
adding an upload field, because it's a different kind of escape hatch
than a raw hex picker or free CSS but raises the same underlying risk:
the 14 accent colors are contrast-checked against these 4 known
backgrounds specifically (see Accessibility baseline below), and an
arbitrary owner-uploaded image has no guaranteed contrast or brightness
at all. Whatever shape this takes — a curated set of backgrounds with an
overlay/scrim to guarantee text contrast, a brightness check that warns
or auto-adjusts foreground color, cropping/positioning controls — it
needs to preserve "an owner cannot produce an ugly or broken page no
matter what they pick," not just bolt an upload button onto this axis.

### 4. Card shape — how the floating image container reads

| Key | Description |
|---|---|
| `square` | Sharp corners, no border. The prototype's original look. |
| `rounded` | `1rem` corner radius, no border — softer, friendlier. |
| `framed` | `0.5rem` radius with a 1px hairline border in the current background treatment's border tone, no fill — like a museum mount around the photo. |

### 5. Grid density

Both are mobile-first: designed and checked at 390px width first, then
scaled up — not the reverse.

| Key | Mobile (<640px) | ≥640px | ≥1024px | ≥1280px | Gap |
|---|---|---|---|---|---|
| `compact` | 2 cols | 3 cols | 4 cols | 6 cols | `0.75rem` |
| `comfortable` | 2 cols | 2 cols | 3 cols | 4 cols | `1.5rem` |

Both start at 2 columns on mobile — a single column wastes the "browse a
collection" feeling on a phone, and the display-cabinet card is designed to
read fine at that size.

**Revisit before Phase 6 ships:** two options doesn't cover the real range
of collection sizes this product needs to serve — a small curated set (a
handful of watches, a car) wants very large cards, 1–2 per row on desktop;
a large one (hundreds of vinyl records, sneakers) wants many small cards
per row, 10–12 on desktop. Two presets locks in the middle of that range
and serves neither extreme well. Don't build the six-axis picker against
just `compact`/`comfortable` by default — expand this table to a wider
spread (something like a gallery/showcase preset at the large end and a
dense/catalog preset at the small end, in addition to the two here) as
part of scoping Phase 6, not after.

### 6. Layout mode

| Key | Description |
|---|---|
| `grid` | The default — a responsive grid per the density setting above. |
| `list` | Single column, each item a row: thumbnail on the left (fixed square, ~96px), title/category/attributes/value on the right. Better for spec-heavy templates where there's a lot to read per item (a golf club's loft/shaft/flex, a car's mileage/mods) and scanning down a list beats scanning a grid. |

---

## The item card, precisely

This is the one component almost every visitor will actually look at, so
it's worth specifying exactly.

**Grid mode:**
1. Square image container, aspect-ratio 1:1, sized by the grid density's
   column count. `object-fit: contain` (never crop a display-cabinet photo).
   Drop shadow: `0 4px 20px rgb(0 0 0 / 0.08)`, no card background behind it
   — the photo floats directly on the page's background treatment.
2. If `hover_image_path` exists: on desktop, hovering for **500ms** triggers
   a cross-fade from the primary to the hover image (CSS `transition:
   opacity`, not a layout shift). On touch devices, the same swap happens
   on press-and-hold, or is simply skipped in favor of just showing the
   primary image — no hover state exists on a phone, and simulating one
   with a tap gesture that isn't discoverable is worse than not having it.
3. Below the image, centered: title (heading font, medium weight, `text-sm`),
   category (body font, `text-xs`, uppercase, letter-spacing wide, muted
   color), and — governed by the space's `value_display_mode` — either
   nothing (`hidden`), a formatted currency amount (`currency`, using
   `value_currency`), or a plain number with no symbol (`number`, for
   owners who'd rather show "Qty: 3" than a price).

**List mode:** the same image (smaller, ~96px, left-aligned, no hover-swap
— the interaction doesn't read well in a row layout) with title, category,
template attributes, and value stacked to its right.

---

## States every screen must have

Per your engineering standards, these are part of the definition of done
for every feature phase in `docs/ROADMAP.md`, not an afterthought:

- **Empty state** — a draft space with zero items shows a clear "add your
  first item" prompt to the owner (never shown to the public, since a
  space with zero items can't be published — see roadmap Phase 3).
- **Loading state** — skeleton placeholders matching the card shape/grid
  density in use, not a spinner, so there's no layout shift when real
  content arrives.
- **Error state** — a failed image upload, a failed save, a failed
  redirect lookup all show a specific, human message and a retry action,
  never a silent failure or a raw stack trace.
- **404** — an unpublished or nonexistent `{username}/{slug}` renders
  Next.js's not-found page. It does not reveal whether the space exists in
  draft form — same 404 either way, so a guessed URL can't be used to
  confirm someone's working on something private.

## Accessibility baseline

- All 14 accent colors are contrast-checked (WCAG AA, 4.5:1) against their
  own auto-selected text color, and against all four background
  treatments' borders/muted tones, before being added to the palette —
  this is a checklist step for anyone adding a 15th swatch later, not a
  one-time audit.
- Every interactive element (item card, theme swatch, dialog) is reachable
  and operable by keyboard alone, with a visible focus ring using
  `--ring`.
- All images require real `alt` text — the item's title, at minimum, is
  used automatically if no separate alt text is provided.
