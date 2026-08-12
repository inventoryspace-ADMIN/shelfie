# Shelfie — Roadmap

You said timeline can flex — up to 6 months if it's going well — but you
want something real to show in 6 weeks. This roadmap is built around that:
**Phases 1–5 are the 6-week milestone.** By the end of Phase 5 you'll have
a real account, a real published space, real items with photos, and a link
you can paste into Instagram that shows a proper preview card. Phases 6–11
are the polish and power features that turn that into a launchable product
over the following months.

We build one phase at a time. At the end of each phase, I'll tell you
exactly what to click or run to verify it worked, and we don't start the
next phase until you've confirmed it.

---

## Phase 1 — Scaffold & deploy
*Goal: prove the whole pipeline (code → GitHub → Vercel) works before any
real feature exists.*

- Initialize the Next.js 15 project (App Router, TypeScript strict,
  Tailwind, shadcn/ui).
- Push to a new GitHub repository.
- Connect that repository to a new Vercel project.
- Deploy a bare page — just enough to prove the pipeline, not a real
  screen.

**Definition of done:** visiting a real `https://....vercel.app` URL in
your phone's browser shows a page. Every commit after this point
auto-deploys, so from here on you're always looking at a live version.

## Phase 2 — Auth & profiles
*Goal: you can create an account and claim a username.*

- Wire up the Supabase project (URL + keys as environment variables, never
  committed to git).
- `profiles` table + RLS policies, migration committed to the repo.
- Sign up / sign in pages (email + password).
- Username picker during onboarding (uniqueness checked live).

**Definition of done:** you can sign up with a real email, choose a
username, sign out, and sign back in. Trying to take an already-used
username shows a clear error, not a crash.

## Phase 3 — Space creation & the template system
*Goal: an owner can create a draft space and pick a template.*

- `spaces` table + RLS, migration committed.
- Wardrobe and Custom template Zod schemas in `lib/templates/`.
- "Create a space" flow: name, slug, template choice.
- Dashboard page listing your own spaces (draft or published).
- A space cannot be published with zero items (enforced in the publish
  action, not just the UI) — ties into the empty-state requirement.

**Definition of done:** you can create a space named "My Wardrobe," see it
listed on your dashboard as a draft, and open it back up to keep editing.

## Phase 4 — Item CRUD, two-image upload, background removal
*Goal: an owner can actually fill a space with real, good-looking items.*

- `items` table + RLS, migration committed.
- Add/edit/delete item form (react-hook-form + the template's Zod schema),
  rendering the right fields for whichever template the space uses.
- Image upload: primary + optional hover image, client-side background
  removal applied before upload, live preview, undo-to-original.
- Manual sort order (drag-to-reorder is Phase 7 — for now, newest-last is
  fine).

**Definition of done:** you can add a real item — a real photo of
something you own — with its background removed, see it saved, edit it,
and delete it. This is the phase where the product stops being abstract.

## Phase 5 — Public space page & OG image generation — 🎯 6-week milestone
*Goal: the actual shareable thing. This is what goes in your bio.*

- `/{username}/{slug}` public page — Server Component, grid layout,
  floating item cards, hover-swap interaction.
- Category filter bar above the grid — "All" plus one button per distinct
  `category` value present in that space (e.g. Tops, Bottoms, Denim,
  Footwear). Moved here from Phase 7 at your request — text *search*
  stays in Phase 7, category filtering ships with the page itself.
- Visible item count near the top of the page (e.g. "13 items").
- Visitor interaction, per your spec from Phase 4 testing: **desktop** —
  hover cross-fades to the second angle, as already built. **Touch** — tap
  cross-fades to the second angle; a further tap (or hold — exact gesture
  to be finalized here, not guessed at now) opens an enlarged view with
  the item's full details. That enlarged/detail view doesn't exist yet in
  any form — designing it is part of this phase, not an assumption.
- Publish/unpublish toggle in the dashboard.
- `opengraph-image.tsx` — generated share card via `@vercel/og`.
- Full meta tag set (title, description, OG image, Twitter card) on the
  public page.
- Mobile performance pass on this page specifically (this is the page that
  matters most): image sizing via `next/image`, no unnecessary client JS.

**Definition of done:** you publish a real space with a few real items,
paste the link into an actual Instagram bio (or a WhatsApp/iMessage
message to yourself), and see a proper title/description/image preview
card — not a blank link. The page loads fast on your actual phone, not
just on a laptop. **This is the thing you show people at 6 weeks.**

---

## Phase 6 — Theme customisation editor
*Goal: an owner can make their space look like theirs, without ever making
it look bad.*

- Theme picker UI for all six axes from `docs/DESIGN-SYSTEM.md` (accent
  color, font pairing, background treatment, card shape, grid density,
  layout mode).
- Live preview before saving.

**Definition of done:** you can change all six settings on your own space,
see an accurate preview, save, and see the public page reflect it exactly.

## Phase 7 — Drag-to-reorder, search & filtering
*Goal: usable at real collection sizes, not just 3 demo items.*

- Drag-to-reorder in the dashboard, persisting `sort_order`.
- Owner-side interaction model on the dashboard, per your Phase 4 testing
  spec: **touch** — tap an item to edit it, hold to pick it up and drag.
  **Desktop** — hold to edit or drag (exact way of telling "you're about
  to edit" from "you're about to drag" apart — e.g. hold-then-release vs
  hold-then-move — gets worked out here, not assumed in advance). This
  replaces the current dashboard's separate "Edit"/"Delete" text links
  below each card.
- Text search on the public page (client-side is fine at expected
  collection sizes — no need for a search service). Category filtering
  itself now ships earlier, with the public page in Phase 5.
- Consider a basic "filter by a shared custom field label" control (e.g.
  every item someone tagged "Size"), per the open question logged in
  `docs/SCHEMA.md` "Template registry" — same filter-chip pattern as the
  Phase 5 category filter, sourced from a JSONB query instead. Pairs well
  with adding label autocomplete (suggest labels already used elsewhere
  in the space) to the item form, to keep labels consistent enough for
  this to actually work. Not full faceted search — that's a separate,
  larger conversation.

**Definition of done:** with 15+ items in a space, you can reorder them by
drag, and a visitor can search by name.

## Phase 8 — Click tracking, outbound redirect, basic analytics
*Goal: the affiliate-ready plumbing, and a reason for an owner to check
back.*

- `clicks` table + `/r/[itemId]` redirect route (service-role insert,
  locked-down RLS — see `docs/ARCHITECTURE.md`).
- Every item with an `outbound_url` renders its link through `/r/[itemId]`,
  never directly.
- Simple analytics view in the dashboard: total clicks and per-item click
  counts. No trend charts, no referrer breakdown — deliberately simple,
  per your call.

**Definition of done:** clicking an item's outbound link on the public page
correctly lands on the real destination, and a click count visibly
increments in your dashboard.

## Phase 9 — Accessibility & performance audit
*Goal: verify the whole thing actually meets the bar you set, not just the
one page tested in Phase 5.*

- Keyboard-only pass through every screen (dashboard and public).
- Contrast check across all 14 accent × 4 background combinations.
- Lighthouse mobile pass on the public page (target: Performance ≥ 90,
  Accessibility ≥ 95) and a spot-check on the dashboard.
- Review every screen against the empty/loading/error state checklist in
  `docs/DESIGN-SYSTEM.md`.

**Definition of done:** a written checklist (this section, filled in) with
every item checked, plus Lighthouse scores pasted in.

## Phase 10 — Landing page
*Goal: shelfie.app's own front door — explain what it is, one obvious way
in. Added after Phase 0 planning, at your request.*

- Replace the current bare placeholder homepage (`app/page.tsx`, live
  since Phase 1) with a real one: what Shelfie is, who it's for, a couple
  of the use cases (wardrobe, garage, golf bag...), and one clear, centered
  call-to-action button into sign-up.
- Scheduled here rather than earlier because by this point there's a real
  published space to reference/screenshot — a landing page written before
  Phase 5 would be describing a product nobody can see yet.
- Still governed by the same design system as everything else — no new
  one-off styling introduced just for this page.

**Definition of done:** a stranger with no context can land on
shelfie.app, understand what it is within a few seconds, and find the
button to start their own space without hunting for it.

## Phase 11 — Launch
*Goal: ship it.*

- Final QA pass across sign-up → create space → add items → publish →
  share, on a real phone.
- README for the repo.
- You post the link somewhere real.

**Definition of done:** it's live, it's in your bio, and it's yours.

---

## Explicitly post-launch (6-month horizon, not scheduled yet)

These are real, and worth planning around, but starting them before Phase
11 is exactly the kind of scope creep your brief asked me to resist:

- **More templates** — Garage, Golf Bag, Art Collection, Sneakers. Each is
  a contained addition (one Zod schema + registry entry) once the pattern
  is proven by Wardrobe + Custom, so this is cheap to pick up post-launch.
- **Full image galleries** beyond the launch front/back pair, if a
  template genuinely needs more angles (e.g. a car's interior/exterior/engine bay).
- **"Follow visitor's system light/dark"** as a background-treatment option.
- **True-to-life relative item sizing** — deliberately not what the grid
  does now. Every card is a fixed-size square with its photo scaled via
  `object-fit: contain`, so a hoodie and a t-shirt render in identically
  sized boxes regardless of the real object's actual size. Genuinely
  showing scale relative to other items (so a car looks bigger than its
  keychain) is a real, separate idea — raised during Phase 4 testing,
  explicitly deferred rather than built now.
- **Optional "auto-rescale items to match" per space** — a distinct idea
  from true-to-life sizing above, not the opposite of it. Even with equal
  fixed-size boxes (the current, correct default), how much of its own
  box an item visually fills still depends on how close/zoomed the
  original photo was — two genuinely same-sized garments can read as
  inconsistent scale next to each other purely from how they were shot,
  confirmed during Phase 4 testing as a real (if minor) rough edge, not a
  bug. The idea: an owner-facing toggle, off by default, that has the app
  analyze every item in a space and normalize their apparent fill/scale
  in the grid. Must stay opt-in — some owners will want a piece to
  deliberately stand out bigger, so this can never be forced or
  default-on. Not designed yet, just recorded.
- **Custom domains** per space (currently: free `*.vercel.app` subdomain
  only, per your decision).
- **Analytics trend view** (clicks over time), if simple counts turn out
  to not be enough once you have real traffic.
- **Affiliate commission logic** on top of the existing click-logging
  plumbing — explicitly not built until there's a real reason to.
- **Per-item grid sizing (mosaic/bento layout)** — letting an owner make
  individual items span larger or smaller than others in the grid, as a
  distinct axis from manual drag-to-reorder (Phase 7). Not scoped or
  designed yet; revisit once the plain grid from Phase 5 is live and it's
  clear which items in a real space would actually benefit from standing
  out.

---

## Reducing friction when creating a space (brainstormed, not scheduled)

Kept deliberately separate from the post-launch list above — this is one
cohesive brainstorm about one specific problem, not a grab-bag, and
mixing it in would bury the thread. **The core problem:** getting a photo
and details for every item is the real bottleneck. Someone cataloguing an
entire wardrobe, a cologne collection, or a golf bag has to repeat the
same form dozens of times. None of this is built or scheduled — logged
per your request while we stay focused on Phase 5.

Your question was which phase each realistically belongs in, and whether
any are small enough to slot in before Phase 11 rather than after. My
read, organized by that:

### Small enough to genuinely consider before launch

These three don't touch the schema, don't open any new security surface,
and are each isolated to code that already exists — none of that's true
of the "highest priority" trio below, despite the trio being more
impactful once built. Flagging them as candidates, not deciding to build
them — say the word if you want any pulled into an actual phase.

- **#2, paste an image from the clipboard.** Genuinely tiny: a `paste`
  event listener on the existing `ImagePicker`, feeding into the exact
  same code path a file-input selection already uses. No new component,
  no new backend call, single client-side file. The cheapest win on this
  entire list.
- **#4, "Add another."** After saving, stay on the form instead of
  redirecting to the dashboard, with category pre-filled from what was
  just entered. A redirect-target change plus one pre-filled default —
  small, isolated to the existing create-item flow.
- **#8, camera-first on mobile — partially.** The core mechanism is
  almost free: the standard HTML file input attribute
  `capture="environment"` hints mobile browsers to open the camera
  directly instead of a gallery/file picker, with automatic graceful
  fallback on desktop. That alone gets you most of "tap add, camera
  opens." A fully streamlined *shoot → next → shoot → next* flow (as
  opposed to just skipping straight to the camera within the existing
  form) is more work and belongs with the rest of this list, not this
  fast-path.

### Post-launch — the highest-priority trio

Real impact (an evening of data entry down to ~15 minutes, per your
estimate), but each is genuinely new scope, not a tweak to something that
exists:

- **#1, paste a product URL to auto-fill.** The most valuable of the
  three, and the most involved — see the dedicated considerations section
  below before building this one.
- **#3, bulk photo upload creating draft items.** Needs a real design
  decision before any code: `items.title` is currently required
  (`NOT NULL`, 1–100 chars), so a photo-only draft item needs either a
  schema change (nullable title, or a lightweight draft/status concept
  mirroring how spaces are draft-until-published) or an entirely
  client-side staging area that only writes to the database once every
  item has a name. The second avoids touching the schema but risks losing
  uploaded-but-unsaved work if the tab closes mid-batch. Worth resolving
  that question deliberately, not defaulting into either option.
- Recommended build order for this trio once you're past launch: **#1
  first** (highest leverage per item), then **#3**, since bulk upload's
  draft-item question gets easier to answer once the URL-fill flow has
  already established a pattern for "an item that exists with a photo but
  incomplete details."

### Post-launch — also worth doing, lower urgency

- **#5, autocomplete from existing data.** Folds directly into the
  shared-custom-field-label idea already logged in Phase 7 above and in
  `docs/SCHEMA.md` "Template registry" — same underlying need (suggest
  values already used elsewhere in the space), so build them together
  rather than twice. One adjustment: drop "brand" from this — Wardrobe's
  dedicated Brand field was removed when templates were unified onto the
  open custom-fields system, so brand is just another custom field label
  now, not a special case.
- **#6, duplicate item.** Small-to-medium. Mostly a new Server Action
  copying an existing item's row (new id, same everything else) —
  cheapest if it copies the existing image files to the new item's
  storage path via Supabase Storage's `copy` API rather than
  re-downloading and reprocessing them, since the photo itself isn't
  changing. Reasonable early post-launch pick.
- **#8, the fuller camera-first flow.** The streamlined multi-shot
  version, beyond the free `capture` attribute noted above.

### Post-launch — bigger, needs its own design conversation

- **#7, let people build before signing up.** Not small — this is an
  architecture change, not a UX tweak. Every write in the app currently
  requires `auth.uid()` (see every RLS policy in `docs/SCHEMA.md`), so
  "add a few items, then create an account" needs either genuine
  anonymous sessions (Supabase supports anonymous sign-ins natively,
  worth researching as the likely building block, with the anonymous
  session's data re-owned to the real account at signup) or a
  client-side-only staging area with the same lost-work-on-close risk
  noted under #3. Real conversion-rate upside, per your instinct — but
  deserves a dedicated conversation about the mechanism before any of it
  gets designed, not a bullet point's worth of decision-making.

### Explicitly last

- **#9, auto-suggest title/category from a photo via a vision model.**
  Your own sequencing, and it's correct: only worth considering once
  everything above exists. The one thing that makes this different from
  every other idea on this list — genuine **per-item running cost** (a
  vision API call per photo), not a one-time build cost. Whenever this
  gets picked up, it needs a usage/cost control built in alongside it,
  not bolted on after the first surprising bill.

### Technical & legal considerations for #1 (paste a product URL)

Flagging these now, specifically requested, so future work on this
doesn't hit them blind:

- **Scraping sits in a legal gray zone.** Many e-commerce sites' Terms of
  Service prohibit automated fetching of their pages, even just reading
  meta tags. For a personal cataloguing tool operating at individual-user
  scale, the practical risk is low — but it isn't zero, and it grows if
  the product ever fetches at real volume from a shared set of server IPs
  (e.g. Vercel's), which is exactly what this feature would do.
- **Re-hosting a product photo is a copyright question, not just a
  technical one.** Downloading a retailer's product image and storing a
  permanent copy in our own Supabase Storage bucket copies copyrighted
  material, even for personal, non-commercial display. Very low
  real-world risk at hobbyist scale, similar to saving a screenshot — but
  worth being aware of before this runs at any real scale, not something
  to discover after the fact. Hotlinking the original URL instead of
  copying it sidesteps the copyright question but trades it for a
  reliability one (the source can delete or move the image anytime,
  silently breaking the display), and it wouldn't be compatible with
  running our own background-removal step, which needs actual pixel
  access to the image, not a remote reference.
- **This has to be fetched server-side, not client-side — not a style
  choice, a hard requirement.** A browser fetching a third-party image
  directly and then trying to read its pixels via canvas (which the
  existing background-removal step requires) will hit a CORS "tainted
  canvas" error on the vast majority of e-commerce image hosts, since
  most don't send permissive CORS headers. The image has to be fetched by
  our own server first, then handed to the client as data our own origin
  served, before the existing canvas-based removal code can touch it.
- **This is an SSRF (server-side request forgery) surface, and needs
  hardening as such.** The moment the server accepts an arbitrary
  user-supplied URL and fetches it, a malicious signed-in user could
  point it at an internal address instead of a real product page (cloud
  metadata endpoints, internal services) to try to get our own server to
  leak something back to them. Building this safely means validating the
  URL scheme (http/https only), rejecting private/internal IP ranges,
  enforcing a request timeout, and capping the response size — this is a
  real security requirement for whoever builds it, not an edge case to
  skip.
- **Metadata is unreliable by default, not by exception.** Design around
  this from the start: plenty of product pages have no Open Graph tags or
  schema.org markup at all, or have an `og:image` pointing at a generic
  logo instead of the actual product. Title and image are reasonably
  reliable when present (via `og:title` / `og:image`); price is the least
  reliable of the three — prefer structured `schema.org` Product markup
  (`offers.price` / `offers.priceCurrency`) over Open Graph's much rarer
  `og:price:amount` tag when both are absent, expect neither to always be
  there, and the "graceful fallback to manual entry" you already called
  out isn't optional polish — it's the main path for a meaningful share
  of real pages.
