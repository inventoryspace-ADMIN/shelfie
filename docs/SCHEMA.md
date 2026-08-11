# Shelfie — Data Model

This document describes every table, column, relationship, index, and Row
Level Security (RLS) policy in the Shelfie database, plus the per-template
JSONB attribute schemas. It is the source of truth for the schema — the
actual tables are created by migration files in `supabase/migrations/`, and
this document should be updated in the same commit as any migration that
changes the shape described here.

## Why Postgres + RLS instead of an application-level permission layer

Supabase gives every table a direct Postgres connection from the browser
(for reads) and from Server Components/Actions (for reads and writes). There
is no separate API server enforcing "can this person see this row?" — the
database itself enforces it, via RLS policies attached to each table. This
means:

- A bug in our React code can never leak a private (draft) space, because
  the database refuses the query regardless of what the frontend asked for.
- We write the permission rule once, in SQL, instead of re-checking it in
  every route/component that touches the table.

Every table below has RLS **enabled**, with explicit policies. There is no
table where "just don't build a UI for it" is the only thing stopping
unauthorized access.

---

## Table: `profiles`

One row per user account. Extends Supabase's built-in `auth.users` table
(which handles email/password and sessions) with the public-facing identity
info Shelfie needs — most importantly, the `username` that forms half of
every space's public URL.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key. Same value as `auth.users.id` (one-to-one). |
| `username` | `text` | Unique. Lowercase letters, numbers, hyphens only, 3–30 chars. Forms the first segment of every public space URL: `shelfie.app/{username}/{slug}`. |
| `display_name` | `text` | Free text, shown on the space page (e.g. "Theo"). Defaults to `username` if not set. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Default `now()`, kept current by trigger. |

**Indexes:** unique index on `username`.

**Known gap (documented, not fixed in v1):** if a user changes their
`username`, any link already shared using the old username breaks — there
is no redirect. Acceptable for launch since it's a rare action; flagged
here so it isn't forgotten.

**RLS policies:**
- `SELECT`: allowed for everyone (anon + authenticated) — a space page needs
  to show its owner's display name, and username uniqueness checks during
  sign-up need to query this table.
- `INSERT`: allowed only where `id = auth.uid()` — a user can only ever
  create their own profile row (done automatically right after sign-up).
- `UPDATE`: allowed only where `id = auth.uid()` — you can only edit your
  own profile.
- `DELETE`: not allowed via RLS at all (account deletion, if ever built, goes
  through a server-side admin action, not a client-facing policy).

---

## Table: `spaces`

One row per public "space" (a wardrobe, a garage, a golf bag...). A single
account can own multiple spaces.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()`. |
| `owner_id` | `uuid` | Foreign key → `profiles.id`. `ON DELETE CASCADE`. |
| `slug` | `text` | URL segment, unique **per owner** (not globally). Lowercase letters, numbers, hyphens, 1–50 chars. |
| `name` | `text` | Display title, e.g. "My Wardrobe". Shown as the page `<h1>` and in the OG title. |
| `template` | `text` | One of the template keys registered in `lib/templates/` — see [Template registry](#template-registry) below. `wardrobe` and `custom` exist at launch. |
| `status` | `text` | `'draft'` or `'published'`. New spaces start as `'draft'`. Only the owner can ever see a draft space; the public route 404s for anyone else. |
| `accent_color` | `text` | One key from the curated accent palette (see `docs/DESIGN-SYSTEM.md`), e.g. `'terracotta'`. Never a raw hex value. |
| `font_pairing` | `text` | One key from the curated font pairing list, e.g. `'editorial-serif'`. |
| `background_treatment` | `text` | One key from the curated background list, e.g. `'soft-paper'`. |
| `card_shape` | `text` | One of `'square'`, `'rounded'`, `'framed'`. |
| `grid_density` | `text` | One of `'compact'`, `'comfortable'`. |
| `layout_mode` | `text` | One of `'grid'`, `'list'`. |
| `value_display_mode` | `text` | One of `'hidden'`, `'currency'`, `'number'`. Controls whether item prices/quantities show at all on this space, and how. |
| `value_currency` | `text` | ISO 4217 code (e.g. `'USD'`, `'GBP'`), only meaningful when `value_display_mode = 'currency'`. Nullable. |
| `og_image_path` | `text` | Storage path of the cached generated share-preview image. Nullable until first generated. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Default `now()`, kept current by trigger. |

**Constraints:**
- `UNIQUE (owner_id, slug)` — your slugs must be unique to you, not globally.
- `CHECK` constraints on `status`, `card_shape`, `grid_density`,
  `layout_mode`, and `value_display_mode` restricting them to their known
  enum values, so a bad value can never even reach the database.

**Indexes:** `owner_id`, and the unique `(owner_id, slug)` composite (which
also serves as the lookup index for the public page route).

**Why explicit typed columns instead of one JSONB "theme" blob:** the six
customisation axes are a small, fixed, fully-known set (that's the whole
point of "bounded" customisation) — Postgres `CHECK` constraints can enforce
valid values directly, and every column gets a real generated TypeScript
type. JSONB is reserved for the one place where the field set genuinely
varies per template: item attributes, below.

**RLS policies:**
- `SELECT`: allowed for everyone where `status = 'published'`. Also allowed
  for the owner (`owner_id = auth.uid()`) regardless of status, so they can
  see and edit their own drafts.
- `INSERT`: allowed only where `owner_id = auth.uid()`.
- `UPDATE` / `DELETE`: allowed only where `owner_id = auth.uid()`.

---

## Table: `items`

One row per cataloged item inside a space.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()`. |
| `space_id` | `uuid` | Foreign key → `spaces.id`. `ON DELETE CASCADE`. |
| `title` | `text` | Required, 1–100 chars. |
| `description` | `text` | Optional, freeform. |
| `category` | `text` | Optional freeform label used for the filter UI (e.g. "Tops", "Irons", "Vinyl"). Not template-enforced — the owner types whatever makes sense for their collection. |
| `value` | `numeric` | Optional. Interpreted as currency or a plain number depending on the parent space's `value_display_mode`. |
| `primary_image_path` | `text` | Required once an item is saved. Storage path in the `space-images` bucket. Background pre-removed (transparent PNG). |
| `hover_image_path` | `text` | Optional "second angle" image. When present, the public card cross-fades from `primary_image_path` to this on ~500ms hover (desktop) / tap-and-hold (touch). |
| `outbound_url` | `text` | Optional. Where the "shop this" / "see this" link points. Never linked to directly from the public page — always routed through `/r/[itemId]` (see Architecture doc) so the click gets logged first. |
| `attributes` | `jsonb` | Template-specific fields. Shape is validated against the Zod schema for the parent space's `template` at write time — see below. Default `'{}'::jsonb`. |
| `sort_order` | `integer` | Owner-controlled manual ordering within a space. Not globally unique; ties broken by `created_at`. |
| `created_at` | `timestamptz` | Default `now()`. |
| `updated_at` | `timestamptz` | Default `now()`, kept current by trigger. |

**Indexes:** `space_id`, and a composite `(space_id, sort_order)` for the
public grid's main query.

**Why JSONB here, and not on `spaces`:** the whole reason templates exist is
that a golf club's fields (loft, shaft, flex) have nothing in common with a
garment's fields (brand, size). A new template should never require a
migration. The tradeoff — you can't `CHECK` constrain JSONB contents at the
database level — is why every read and write of `attributes` goes through
the matching Zod schema in application code (both client and server side,
from the same shared schema file, per the engineering standards).

**RLS policies:**
- `SELECT`: allowed for everyone where the parent `space.status = 'published'`
  (via a join/subquery against `spaces`). Also allowed for the owner
  regardless of the parent space's status.
- `INSERT` / `UPDATE` / `DELETE`: allowed only where the parent space's
  `owner_id = auth.uid()`.

---

## Table: `clicks`

An append-only log of outbound link clicks. This is the "affiliate-ready
later" plumbing — no commission logic, just a timestamped record of who
clicked what.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | Primary key, default `gen_random_uuid()`. |
| `item_id` | `uuid` | Foreign key → `items.id`. `ON DELETE CASCADE`. |
| `space_id` | `uuid` | Foreign key → `spaces.id`. Denormalized (duplicated from the item's space) purely so the owner's analytics query doesn't need a join through `items` — a deliberate, documented denormalization, not an oversight. |
| `clicked_at` | `timestamptz` | Default `now()`. |

No IP address, user agent, or any visitor-identifying data is stored —
v1 analytics is "simple click counts," and collecting more than that isn't
needed for that feature and would just be data we'd have to explain and
protect later.

**Indexes:** `item_id`, `space_id`.

**RLS policies:**
- `SELECT`: allowed only where the parent space's `owner_id = auth.uid()` —
  an owner can see counts for their own items, nobody else can.
- `INSERT`: **not** granted to `anon` or `authenticated` roles at all. Rows
  are only ever inserted by the `/r/[itemId]` redirect route running with
  the Supabase **service role** key (server-only, never shipped to the
  browser), so a visitor's browser cannot forge click rows directly.
- `UPDATE` / `DELETE`: not allowed to any role — the log is append-only.

---

## Storage: `space-images` bucket

Holds every item's `primary_image_path` / `hover_image_path`, plus generated
OG share images.

- **Public read** — space images must be publicly loadable for the public
  page and for the OG image crawlers (Instagram/WhatsApp/iMessage/X all
  fetch the image server-side with no auth).
- **Write** restricted to authenticated users, and only into a path prefixed
  with their own `auth.uid()` (e.g. `{owner_id}/{space_id}/{item_id}/...`),
  enforced by a Storage RLS policy mirroring the `items` table policy.

---

## Template registry

A template is a Zod schema plus field labels, living in `lib/templates/`,
registered by key. `spaces.template` stores the key; `items.attributes` is
validated against the matching schema. Adding a template later is a code
change (a new file + registry entry), **not** a migration.

### `wardrobe` (launch)

```ts
{
  brand: z.string().max(50).optional(),
  size: z.string().max(20).optional(),
  whereBought: z.string().max(100).optional(),
  condition: z.enum(['new', 'like-new', 'good', 'worn']).optional(),
}
```

`value` (top-level column) is used as "price paid." `category` (top-level
column) is used for things like "Tops," "Footwear," "Outerwear."

### `custom` (launch)

For anything without a dedicated template yet — sneakers, watches, vinyl,
plants, tools, whatever doesn't fit the curated list.

```ts
{
  fields: z.array(
    z.object({
      label: z.string().max(40),
      value: z.string().max(200),
    })
  ).max(10),
}
```

The owner defines their own label/value pairs per item (e.g. "Mileage:
42,000"). Capped at 10 fields so the item form and the public card layout
stay predictable.

### Post-launch templates (roadmap only, not built yet)

`garage`, `golf-bag`, `art-collection`, `sneakers` — each will follow the
exact same pattern: a Zod schema in `lib/templates/`, a registry entry, and
an entry in this document. No schema drafted yet; drafting one now would be
speculative given none of these are scheduled before the 6-week milestone.

---

## Shared migration conventions

- Every table gets an `updated_at` column maintained by a single shared
  trigger function `set_updated_at()`, defined once in the first migration.
- Every migration file is named `NNNN_description.sql` (sequential,
  zero-padded) and lives in `supabase/migrations/`. Nothing is ever edited
  directly in the Supabase dashboard — a dashboard change with no matching
  migration file is treated as a bug.
- RLS is enabled in the **same migration** that creates each table — never
  a follow-up migration "to add security later."
