# Shelfie — Monetisation Strategy

**Status:** direction agreed, nothing built. Revisit after launch, once
there is meaningful usage.

**Guiding constraint:** no on-screen advertising, and nothing that degrades
the quality or feel of a space. The product's positioning is premium and
restrained — monetisation must not undercut that.

---

## The three chosen directions

### 1. Affiliate revenue

**What it is:** taking a share of purchases made through outbound item
links.

**Why it fits:** the plumbing already exists. Every outbound link routes
through `/r/[itemId]`, which logs a click before redirecting — built in
Phase 4 specifically so this would be a config change later, not a rebuild.

**How it works in practice:** services like Skimlinks or Sovrn
automatically convert outbound retailer links into affiliate links and pay
a share of resulting sales. Users change nothing about how they use the
product and see no difference on the page.

**Characteristics:** revenue per user is small, but it costs nothing to
operate, degrades nothing, and scales with usage rather than with pressure
on users. Genuinely invisible.

**Open questions for later:**
- Which network — Skimlinks/Sovrn (automatic, broad) vs direct programmes
  (Amazon Associates, Awin, Rakuten — better rates, far more setup)
- Disclosure requirements. Affiliate relationships must be disclosed in
  most jurisdictions; needs to be handled tastefully, not as a banner
- Whether space owners should get a share of revenue from their own
  links, or whether that changes the product into something more
  commercial than intended

---

### 2. Pro subscription (~£5–8/month)

**Why it matters most:** it's the only option here that recurs, which makes
it the only one that compounds.

**What justifies the price:**

| Feature | Why someone pays |
|---|---|
| Custom domain | `theoworsley.com` instead of `shelfie.app/theo` — the single most requested upgrade in products like this |
| Unlimited spaces | Free tier caps at a small number |
| Premium themes | Beyond the free curated set |
| Remove the "Made with Shelfie" badge | See below — this is its own mechanic |
| Real analytics | Which items get clicked, over time |

**On analytics specifically:** this matters more than it first appears.
Anyone using Shelfie semi-professionally — a vintage seller, a personal
stylist, a small brand's ambassador — genuinely wants to know which items
drive clicks. That's the difference between a toy and a tool, and it's what
converts a free user into a paying one.

---

### 3. Badge removal

**The mechanic:** the "Made with Shelfie" credit at the bottom of every
public space is the product's main growth loop — every published space is a
distribution node. Charging to remove it means free users spread the
product while paying users fund it.

**Precedent:** Linktree, Calendly, and Notion all monetise exactly this way.
It's proven, and it's self-reinforcing.

**The key reframe:** the free tier is not a cost centre, it's the marketing
budget.

Likely bundled into Pro rather than sold separately.

---

## Explicitly rejected

**One-off charge to publish (e.g. £1).** Technically doable, strategically
poor:

- Stripe takes roughly 20p + 1.5% on a £1 charge — over 20% lost to fees
- Adds card-entry friction at the moment of peak user intent
- No recurring revenue, so nothing compounds
- Worst of all, it taxes the exact behaviour the growth loop depends on.
  Charging people to publish means charging them to market Shelfie

**Transactional fees / taking a cut of sales.** Would turn Shelfie into a
marketplace, which `CLAUDE.md` explicitly says it isn't. It would also
change what people list and how they photograph it — the incentive shifts
from "display what I own" to "sell what I'm getting rid of." Different
product.

**On-screen advertising.** Rejected outright. Incompatible with the premium,
restrained positioning.

---

## Sequencing

Do not monetise early. Charging before there's meaningful usage converts a
small number of users into trivial revenue while capping growth.

1. **Free for everyone** through launch and early growth
2. **Add affiliate quietly** once there's real outbound-link traffic —
   invisible to users, no product change
3. **Introduce Pro** only when people are actively asking for custom
   domains and analytics. Demand should pull it into existence rather than
   it being pushed

---

## Cost note

The moment real revenue flows, Vercel's Hobby tier no longer covers the
project — commercial use requires Pro at roughly £16/month. Budget this into
any monetisation plan; it's the first fixed cost the product incurs.
