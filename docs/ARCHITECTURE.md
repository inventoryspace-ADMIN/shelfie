# Shelfie — Architecture

This document explains how the codebase is organized, how a request flows
through the system, and — since you're new to this — *why* each significant
decision was made, not just what it is.

## The one-sentence version

Shelfie is a Next.js app where public space pages are rendered on the
server straight from Postgres (fast, and gives us real HTML for link
previews), owners edit their spaces through authenticated dashboard pages
built the same way, and the only two pieces of custom server logic are the
outbound-click redirect and the generated share image.

---

## Why Next.js App Router + Server Components by default

Two requirements drive this more than anything else in the brief:

1. **Rich link previews.** Instagram/WhatsApp/iMessage/X don't run
   JavaScript when they fetch a link to build a preview card — they read
   the raw HTML `<head>`. A page that renders its content client-side
   *after* JavaScript loads would show a blank preview. Server Components
   render full HTML on the server before anything reaches the visitor, so
   the `<title>`, description, and OG image tags are there from the first
   byte.
2. **Mobile performance.** Every unnecessary client-side JavaScript bundle
   is milliseconds a phone on a bio-link tap has to spend before showing
   anything. Server Components ship zero JS for the parts of the page that
   don't need interactivity (which, on the public space page, is almost
   all of it).

So the default for every new file is a Server Component. A file only
becomes a Client Component (`'use client'`) when it genuinely needs the
browser — the item form (typing, image preview), the theme picker (live
preview before saving), drag-to-reorder, the hover image swap. Everything
else — the public space page, the grid, the item cards — stays a Server
Component.

## Directory structure

```
shelfie/
  app/
    (auth)/
      sign-in/page.tsx
      sign-up/page.tsx
    (dashboard)/
      dashboard/
        page.tsx                    # list of the signed-in owner's spaces
        new/page.tsx                # create a new space (name, slug, template)
        [spaceId]/
          page.tsx                  # item list/manager for one space
          items/
            new/page.tsx
            [itemId]/edit/page.tsx
          theme/page.tsx            # the 6-axis theme customiser
          settings/page.tsx         # slug, value display mode, publish toggle
    [username]/
      [slug]/
        page.tsx                    # THE public space page (Server Component)
        opengraph-image.tsx         # @vercel/og generated share image
    r/
      [itemId]/
        route.ts                    # outbound click redirect (Route Handler)
    layout.tsx
    globals.css
    not-found.tsx
  components/
    ui/                             # shadcn primitives — generated via shadcn CLI, not hand-edited
    space/                          # public-facing rendering (ItemCard, SpaceGrid, ThemeProvider)
    dashboard/                      # owner-facing editing (ItemForm, SpaceCard, PublishToggle)
    theme/                          # theme picker controls
  lib/
    supabase/
      client.ts                    # browser Supabase client
      server.ts                    # Server Component / Server Action client (respects the visitor's session)
      admin.ts                     # service-role client — server-only, used ONLY by the click redirect route
    templates/
      wardrobe.ts                  # Zod schema + field labels for the wardrobe template
      custom.ts
      index.ts                     # template registry other code looks templates up through
    validations/
      space.ts                     # Zod schemas for space create/update (shared client+server)
      item.ts
      profile.ts
    actions/
      spaces.ts                    # Server Actions: createSpace, updateSpace, publishSpace...
      items.ts                     # Server Actions: createItem, updateItem, deleteItem, reorderItems
  types/
    supabase.ts                    # generated from the live schema — never hand-edited, see below
  supabase/
    migrations/                    # every schema change, in order, committed to git
  middleware.ts                    # refreshes the Supabase auth session on each request
```

**One responsibility per file, in practice:** `components/space/ItemCard.tsx`
only renders one item. It doesn't fetch data, doesn't know about Supabase,
doesn't know what page it's on. The page component (`app/[username]/[slug]/page.tsx`)
fetches the space and its items, then hands plain data down to
`SpaceGrid`, which hands each item to `ItemCard`. If you can't describe a
file's job in one sentence, it's a sign the file is doing two things and
should split.

## Routing map

| Route | Renders | Who can see it |
|---|---|---|
| `/` | Landing/marketing page | Everyone |
| `/sign-in`, `/sign-up` | Auth forms | Everyone (redirects away if already signed in) |
| `/dashboard` | List of your own spaces | Signed-in owner only |
| `/dashboard/new` | Create-space form | Signed-in owner only |
| `/dashboard/[spaceId]` | Item manager for one space | That space's owner only |
| `/dashboard/[spaceId]/theme` | Theme customiser | That space's owner only |
| `/dashboard/[spaceId]/settings` | Slug, value display, publish toggle | That space's owner only |
| `/{username}` | Owner's profile — redirects straight to their space if they have exactly one published, otherwise lists their published spaces | Everyone if at least one published space exists; 404 otherwise. `noindex` by default (see Roadmap Phase 5) |
| `/{username}/{slug}` | **The public space page** — the thing that goes in a bio | Everyone, if `status = 'published'`; 404 otherwise (even for the owner viewing it logged out — they see it via the dashboard preview instead). `noindex` by default |
| `/{username}/{slug}/{itemId}` | Enlarged per-item detail view, real URL rather than a modal — so "where'd you get that hoodie" is a link, not just a screenshot | Same visibility rule as its parent space. Inherits the space's OG image/meta rather than generating its own |
| `/{username}/{slug}/opengraph-image` | Generated share image (not visited by humans — fetched by link-preview crawlers) | Everyone |
| `/r/{itemId}` | No UI — logs a click, then 302-redirects to the item's `outbound_url` | Everyone (this is the link that's actually placed on the public page, never the raw `outbound_url`) |

Ownership checks (`/dashboard/...`) happen twice, deliberately: once in the
page itself (redirect to `/sign-in` if there's no session, 404 if the
`spaceId` doesn't belong to the signed-in user), and again for real by the
RLS policy on the database query. The page-level check is for a good user
experience (a clean redirect instead of a broken page); the RLS policy is
what actually keeps the data safe if the page-level check is ever
buggy or bypassed.

## Data flow: reads

Server Components query Supabase directly using the server client
(`lib/supabase/server.ts`), which carries the visitor's session (or no
session, for a logged-out visitor). RLS decides what comes back — the
public space page's query is identical in code whether the visitor is
logged in or not; the database enforces "only published, or you're the
owner," not the page.

```
Visitor requests /theo/wardrobe
  → app/[username]/[slug]/page.tsx (Server Component) runs on Vercel
  → queries `spaces` joined to `profiles` (by username) and `items`
  → RLS allows the row because status = 'published'
  → full HTML (including <head> meta tags) sent to the browser
  → crawler (or human) sees a complete page, no JS required
```

## Data flow: writes

Every mutation (create item, publish space, reorder items...) is a **Server
Action** in `lib/actions/`, not a client-side `fetch` to a hand-rolled API
route. A Server Action is a function marked `'use server'` that a Client
Component can call directly, as if it were local — Next.js handles turning
that into a network request. We use Server Actions instead of `app/api/...`
routes because:

- The Zod schema that validates the form (client-side, via
  react-hook-form) is the exact same schema the Server Action re-validates
  with server-side — one file, imported twice, per the "shared between
  client and server" requirement. A hand-rolled API route tends to
  duplicate or drift from the client validation over time.
- Fewer files, less boilerplate, for a feature set this size. An `app/api/`
  route only gets introduced if something genuinely needs to be called by a
  non-Next.js client — the click redirect (`/r/[itemId]`) is the one
  case, because that URL has to work as a plain link, not a form
  submission.

```
Owner submits the "add item" form (Client Component, react-hook-form)
  → client-side Zod validation (instant feedback, no round trip for typos)
  → calls createItem() Server Action
  → Server Action re-validates with the SAME Zod schema (never trust the client)
  → inserts into `items` via the server Supabase client (session-aware, RLS-checked)
  → revalidates the dashboard page's cache
  → UI updates
```

## The click redirect (`/r/[itemId]`)

This is the one piece of "real backend" logic in the app, and it's the
requirement the brief called out as most important to get right early:

```
Public page renders: <a href="/r/abc123">Shop this</a>   (never the raw outbound_url)
  → visitor clicks
  → app/r/[itemId]/route.ts runs (Route Handler, not a page)
  → looks up items.outbound_url for that id, using the SERVICE ROLE client
    (bypasses RLS deliberately — this route needs to read/write regardless
    of who's asking, since a visitor has no session at all)
  → inserts one row into `clicks`
  → issues a 302 redirect to outbound_url
```

Using the service-role client here (instead of the anon client) is why the
`clicks` table's RLS has **no** insert policy for `anon`/`authenticated` at
all — the only way a click row can be created is through this one
server-side code path, which is the whole point of routing every outbound
link through it rather than linking directly.

## Image handling & the background-removal / hover-swap feature

Per your product decision, every item can have a `primary_image_path` and
an optional `hover_image_path`, and both are expected to be transparent
PNGs (the "floating on the page" look) rather than photos with a
background.

```
Owner picks a file in the item form (Client Component)
  → client-side resize/compress (keeps upload small on mobile data)
  → client-side canvas background removal (same technique as the Figma
    prototype: works well on a plain/contrasting background, not true ML
    segmentation — documented limitation, see DESIGN-SYSTEM.md)
  → owner sees a live preview, can undo and keep the original
  → on save, uploads the final PNG to Supabase Storage via a signed URL
  → items.primary_image_path / hover_image_path stores the storage path
```

We're deliberately reusing the *technique* (canvas-based edge/background
heuristic), not the *code*, from the prototype, and reimplementing it
cleanly. If real-world results are too rough once you're testing on actual
items, the documented upgrade path is swapping this one function for a
paid ML background-removal API — that's a contained change (one function),
not a rebuild, because the rest of the app only ever deals with "a PNG
path," not with how it got that way.

## Generated share images (`opengraph-image.tsx`)

Next.js has a special file convention: any `opengraph-image.tsx` next to a
`page.tsx` is automatically rendered (using `@vercel/og`) into an image and
wired into the page's meta tags — no manual `<meta>` tag writing. For
`/{username}/{slug}`, this generates an image showing the space's name,
owner, and a few item photos, styled using that space's own accent color
and font pairing, so a shared link visually matches the space it links to.

## Types flow from the database, one direction only

`types/supabase.ts` is generated by running the Supabase CLI against the
live schema (`supabase gen types typescript`) — never hand-written. Every
other type in the app (the shape of a `Space`, an `Item`) is either this
generated type directly, or a Zod-inferred type from `lib/validations/`
(which itself is written to match the schema). If a column is renamed in a
migration, running the type generator is what surfaces every place in the
app that now fails to compile — that's the safety net, and it only works
if nobody hand-writes a competing type.

## What's deliberately not here yet

No `app/api/` folder beyond what's described above — no generic REST API,
because nothing outside this Next.js app needs to call Shelfie yet. No
state management library (Redux/Zustand/Jotai) — Server Components +
Server Actions + React's own `useState`/`useOptimistic` cover every
interactive piece in the current feature set; if a genuinely global
client-side state need shows up later, that's a conversation to have then,
not a library to pre-install now.
