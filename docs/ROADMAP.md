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
- Category filter and text search on the public page (client-side is fine
  at expected collection sizes — no need for a search service).
- Consider a basic "filter by a shared custom field label" control (e.g.
  every item someone tagged "Size"), per the open question logged in
  `docs/SCHEMA.md` "Template registry" — same filter-chip pattern as
  category, sourced from a JSONB query instead. Pairs well with adding
  label autocomplete (suggest labels already used elsewhere in the space)
  to the item form, to keep labels consistent enough for this to actually
  work. Not full faceted search — that's a separate, larger conversation.

**Definition of done:** with 15+ items in a space, you can reorder them by
drag, and a visitor can filter down to one category or search by name.

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
