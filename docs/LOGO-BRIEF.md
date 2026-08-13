# Shelfie — Logo Brief

**Status:** direction decided, execution deferred to Phase 6.

**Decision:** a typographic wordmark, not an illustrated logo. An
object-as-letters concept (books forming the H, a golf club as the L, a
cologne bottle as the I) was explored and rejected — too high-risk to
execute well, doesn't scale to favicon size, and the illustrative style
fights the restraint the rest of the product is going for.

---

## The product, in one line

Shelfie is a web platform where anyone creates a beautiful public "space"
cataloguing the things they own — a wardrobe, a cologne collection, a golf
bag, a garage — and shares it as a single link, designed to live in a
social media bio.

It is a **digital display cabinet**, not a shop. Nothing is for sale.

## Brand feel

Premium, restrained, well-made. The kind of quality that doesn't announce
itself. Reference points in feel, not in style: a good gallery's signage, a
boutique's packaging, understatement rather than loudness.

Avoid: playful mascots, gradients, geometric tech abstractions, anything
that looks like a generic SaaS logo.

---

## Why a wordmark

Most well-designed products of this type use one — the name set carefully in
a good typeface, nothing more. It costs nothing but a font choice, it can't
date badly, and it can't be executed cheaply in a way that undermines the
product.

**The typeface is only the starting point.** What turns typed text into a
wordmark is what happens after: tightening or opening the letter-spacing,
choosing lowercase versus uppercase, occasionally one subtle custom tweak to
a single letter. Same typeface, different treatment, completely different
result.

---

## When to decide

**Phase 6**, alongside the theme system's five font pairings. Two reasons:

1. You'll be evaluating typefaces properly at that point anyway, so the
   logo decision comes almost free.
2. A wordmark can't be judged in isolation — it needs to sit against real
   pages. Those don't visually exist until Phase 5/6.

---

## Candidates reviewed so far

All free for commercial use (Google Fonts).

| Typeface | Character | Note |
|---|---|---|
| **Fraunces** (light) | Soft, boutique, editorial | Already one of the five font pairings |
| **Instrument Serif** | High contrast, elegant | Fashion-adjacent |
| **DM Serif Display** | Classic, confident | Safest serif option |
| **Archivo** (medium) | Grotesque, sturdy | Also already in the system |
| **Syne** | Distinctive, arty | Most memorable, most divisive |
| **Bricolage Grotesque** | Characterful sans | Quirks without shouting |
| **Archivo uppercase, wide tracking** | Restrained, expensive | Classic luxury treatment |

**Coherence argument:** Fraunces and Archivo are already in the product's
font pairings, so either would share DNA with the app rather than feeling
bolted on.

**Still to explore:** custom and paid typefaces. Pangram Pangram is worth a
browse — widely used across premium fashion and design sites, several
families free for personal use. Check commercial licence terms before
committing, since that's where the cost sits.

Collect typeface references in the `moodboard` folder as you find them, with
a note on what drew you to each.

---

## Technical requirements

**1. Primary wordmark**
- Format: **SVG** (vector, editable paths)
- Use: landing page, marketing, anywhere with room

**2. Favicon mark**
- A single letter or simple glyph — the full word won't render at 16px
- Formats: SVG plus square PNG at 512×512 and 32×32

Must work in pure single-colour black before any colour is considered.

---

## Where the logo actually appears

Only four places. Worth remembering before over-investing:

1. Browser favicon
2. The generated OG share image (built in Phase 5) — the corner of every
   preview card when a Shelfie link is pasted anywhere
3. The landing page at `/`
4. The small "Made with Shelfie" credit at the bottom of public spaces

---

## Licensing note

Google Fonts are free for commercial use with no complications. Anything
from a commercial foundry needs its licence checked before the product
starts earning — worth resolving before launch rather than after.
