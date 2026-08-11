# Shelfie — Standing Rules

This file is read at the start of every session. It's the accumulated
context from Phase 0 planning — read `docs/ARCHITECTURE.md`,
`docs/SCHEMA.md`, `docs/DESIGN-SYSTEM.md`, and `docs/ROADMAP.md` for the
full detail behind each decision referenced here.

## What this is

**Shelfie** — a web platform where anyone creates a beautiful, bounded-
customisable public "space" cataloguing things they own, and shares it as
one link designed to live in a social media bio. Not a marketplace, not a
shop — a digital display cabinet. "Where do you get your clothes?" → send
the link, they browse the actual wardrobe.

Must work well, without feeling generic, for: a wardrobe, an art
collection, a car/garage, a golf bag, and genuinely "anything at all"
(sneakers, watches, vinyl, camera gear, plants, tools...).

## Who I'm working with

The user has strong product and design instincts (they built the Figma
prototype this was scoped from) but **virtually no hands-on technical
experience** — never used a terminal or Git before this project. Treat
them as a smart product owner, not an engineer:

- Explain the *why* in plain English before the *how*, every time —
  especially for terminal commands, Git operations, and backend concepts.
  Never assume familiarity with a tool or convention.
- Never assume they know what a command does just because it's common —
  spell it out.
- Timeline is flexible (up to 6 months), but there's a real 6-week target
  for a demoable, shareable version — see `docs/ROADMAP.md` Phase 5.
- They already have GitHub, Supabase, and Vercel accounts. No custom
  domain — using the free `*.vercel.app` subdomain for now.

## Non-negotiable product requirements

1. **Sharing is the product.** Every public space link must produce a
   proper rich preview card (title, description, image) in Instagram,
   WhatsApp, iMessage, and X. Link previews and mobile performance are
   first-class features, not polish.
2. **Deeply customisable, but bounded.** Six curated axes only — accent
   color, font pairing, background treatment, card shape, grid density,
   layout mode — each a closed list, documented in full in
   `docs/DESIGN-SYSTEM.md`. No raw hex picker, no free CSS, ever. An owner
   cannot produce an ugly or broken page no matter what they pick.
3. **Space templates solve "anything at all."** A template is a Zod schema
   + field labels in `lib/templates/`. Item template-specific fields live
   in one JSONB column (`items.attributes`), validated against that
   schema — never a new database column per hobby.
4. **Mobile-first.** Design and test at 390px width before desktop. Most
   traffic is a phone, from a bio link.
5. **Showcase now, affiliate-ready later.** No checkout, no payments, no
   cart. Every outbound item link routes through `/r/[itemId]`, which logs
   a click before redirecting. Click logging is built now; commission
   logic is explicitly not.

## Product decisions already made (Phase 0)

Don't re-litigate these without a real reason — they were decided
deliberately in planning:

- **One account, multiple spaces.** A user can own more than one public
  space (e.g. a wardrobe and a garage), each with its own URL.
- **URLs are `shelfie.app/{username}/{slug}`** — path-based, slug unique
  per owner (not globally). No subdomains, no DNS complexity.
- **Launch templates: Wardrobe and Custom only.** Garage, Golf Bag, Art
  Collection, and Sneakers are real, planned, and explicitly deferred
  post-launch (cheap to add later once the template pattern is proven).
- **Auth: email + password only for v1.** No social/magic-link sign-in yet.
- **Every item can have two images** — a primary and an optional "hover"
  (second-angle) image, both expected to be background-removed transparent
  PNGs. On desktop, hovering ~500ms cross-fades between them. Background
  removal is built in-app (client-side canvas technique) for v1 — this was
  called out as the product's most distinctive visual signature, worth
  doing right from launch rather than retrofitting. A full N-image gallery
  beyond this front/back pair is post-launch.
- **Spaces start as drafts and must be explicitly published.** A draft is
  visible only to its owner; the public route 404s for anyone else, and a
  space can't be published with zero items.
- **Item value display is owner-controlled per space**, via
  `value_display_mode`: `hidden`, `currency` (with a chosen ISO currency),
  or `number` (a plain quantity/count with no currency symbol, for owners
  who'd rather show units than price). Every individual item's value field
  stays optional regardless.
- **Analytics (Phase 8) is deliberately simple:** total and per-item click
  counts only. No trend charts, no referrer/device breakdown, no PII
  stored in the `clicks` table.
- **Cut from scope entirely, not just deferred:** the prototype's
  color-theory "outfit remix" generator and the drag-and-drop "Sets" grid
  composer. Both are wardrobe-specific and don't generalize to golf bags,
  art, or cars — they fail the "no feature not needed to make one space
  genuinely great" rule.

## Stack — exactly this, no substitutions without asking first

Next.js 15 (App Router, TypeScript strict) · Tailwind + shadcn/ui ·
Supabase (Postgres, Auth, Storage) · react-hook-form + Zod (schemas shared
client/server) · Vercel hosting · `next/image` for all images · `@vercel/og`
for generated share images · Server Components by default, Client
Components only where interactivity genuinely requires them.

## Engineering standards

- **Zero dead code.** No unused imports, variables, files, dependencies, or
  commented-out blocks. Delete in the same commit you stop using something.
- **No placeholders past their phase.** No `TODO`, no lorem ipsum, no stub
  functions returning fake data in anything called finished.
- **One responsibility per file**, obvious directory structure — see
  `docs/ARCHITECTURE.md`. If a file's job can't be described in one
  sentence, it's doing too much.
- **Types flow from the database.** `types/supabase.ts` is generated, never
  hand-written. No type duplicates a table shape. No `any`.
- **RLS enabled with explicit policies on every table, in the same
  migration that creates it.** Never retrofitted.
- **Every schema change is a migration file** in `supabase/migrations/`,
  committed to git. Never a manual Supabase dashboard edit.
- **Design tokens, never magic values.** No raw hex codes or one-off pixel
  values in components — see `docs/DESIGN-SYSTEM.md` for the full token
  set.
- **Errors, empty states, and loading states are part of every feature.**
  Not done without them — see the checklist in `docs/DESIGN-SYSTEM.md`.
- **Accessible by default** — semantic HTML, real labels, full keyboard
  navigation, WCAG AA contrast.
- **Conventional Commits, small and focused.** Explain each commit in one
  plain-English sentence when it's made.
- **No dependency added without explaining what it does and why nothing
  already in the stack can do the job.**
- **Never claim something is finished with known gaps.** State the gaps
  explicitly instead.

## How we work

- Build in phases, per `docs/ROADMAP.md`. Do not jump ahead of the current
  phase.
- At the end of each phase: stop, explain exactly what to click or run to
  verify it, and wait for explicit confirmation before starting the next
  phase.
- Things explicitly out of scope, always: comments, likes, follows,
  messaging, notifications, a feed — anything not needed to make one
  person's space genuinely great.
- One state-management approach only (Server Components + Server Actions +
  React's built-in state) — no Redux/Zustand/Jotai unless a real need
  shows up and is discussed first.
