# Pricing — Complete Setup & User Guide

This is a start-to-finish guide to the **Pricing** side of HPAS (AI Pricing): what every
screen and setting does, why it exists, and how to set it up — written for a shop owner
using it for the first time, and detailed enough for a developer standing up a new
environment. For a technical dependency map, see `KNOWLEDGE_GRAPH.md`'s `ai-pricing` and
`business-units` nodes — this document is the "how do I actually use this" companion.

---

## 1. What Pricing is (and isn't)

Pricing is an **optional, paid add-on** that suggests price changes for your menu items,
based on nothing but your own sales history. It is:

- **Bounded and explainable** — every suggestion comes with a plain-language reason, and is
  always capped by min/max prices and a max %-change you set. This is a demand-trend
  heuristic (is this item selling more or less than it used to), not a black-box AI
  guessing prices out of thin air, and not a real economic elasticity model — a small shop
  doesn't have the transaction volume for one.
- **Manual by default, automatic if you choose.** A plain refresh never changes a price by
  itself — applying (one at a time, "Apply all," or a **Pipeline** you've explicitly set to
  automatic, §3.5) is the only thing that ever changes a price. Nothing changes silently:
  even an automatic Pipeline still holds back anything the Safety Net flags.
- **Admin-gated.** This feature has no in-app payment — a platform admin turns it on for
  your account (`modules.pricing.enabled` in your tenant config) once you've arranged
  payment outside the app. If it's not enabled, every Pricing page shows a **Demo** banner
  and an illustrative (non-interactive, clearly-fake) preview of Recommendations instead of a
  bare error — so you can see exactly what you'd get, and know who to ask to unlock it (§3.6).

---

## 2. Requirements & backend setup

### 2.1 Turning the feature on

A developer/admin adds this to your `tenants/<slug>/config.json`:

```json
"modules": {
  "pricing": { "enabled": true, "order": 11 }
}
```

Then either re-seed (`pnpm db:seed`) or patch the tenant's config in the database directly.
Once enabled, the **Pricing** tab appears unlocked in your dashboard's top bar (it's always
*visible* — even to tenants without it — just shown with a 🔒 lock and an upsell message
until enabled, so you know the option exists).

### 2.2 What data it needs

Nothing extra — Pricing works entirely from data you're already generating:

- **Your menu** (Master Data) — item names, categories, and current prices.
- **Your sales history** — however it got into the system (POS CSV upload, QR orders, the
  Counter screen, or GST billing all feed the same `events` table Pricing reads from).

The more sales history an item has, the higher-confidence its recommendation will be — a
brand-new item with only a handful of sales will be flagged "low confidence" and held back
by the safety net (§3.2) until it has more data.

### 2.3 AI rationale (optional, degrades gracefully)

Each recommendation gets a short plain-English reason ("demand is up 30% over the last 90
days, so a modest increase captures willingness to pay"). This one line comes from an AI
call, gated by the **AI Assist** toggle for Pricing (`/settings` → **AI Assist** →
"Use AI for Pricing & Inventory rationale", off by default) — if AI Assist is off, no API
key is available, or the AI call fails for any reason, a deterministic fallback reason
(built straight from the demand trend) is used instead. **The suggested price itself never
depends on the AI call** — only the wording of the explanation does. The same toggle also
gates Inventory's reorder rationale (see `INVENTORY_GUIDE.md` §2.3) — Pricing and Inventory
share one AI Assist surface, not two separate switches.

**Turning it on**: `/settings` → **AI Assist** card → toggle "Use AI for Pricing & Inventory
rationale" on → set a **Model provider** (only `anthropic` is supported today) and,
optionally, a **Model** override → paste your provider's API key → **Save key**. The key is
stored per tenant, in its own database row — never inside your tenant config, and never
sent back to the browser once saved. An admin can instead set `AI_API_KEY` (+ optionally
`AI_PROVIDER`/`AI_MODEL`) as a platform-wide fallback for every tenant that turns the toggle
on without pasting their own key — a tenant's own saved key always wins if both exist.

**Example — before/after**: with AI Assist off, "Kaju Katli" rising 22% shows the reason
"Selling more than usual lately — a small increase captures demand without denting volume."
With AI Assist on, the same recommendation might instead read something like "Kaju Katli
has been flying off the shelves this Diwali season — a modest bump keeps margins healthy
without slowing sales." Same suggested price and % change either way — only the sentence
changes.

### 2.4 Should this tenant even see a Pricing tab?

There are two separate, independent admin controls, easy to mix up:

| Setting | What it controls | Where |
|---|---|---|
| `modules.pricing.enabled` | Whether Pricing is **unlocked** (real data) or shown as a **Demo** (§3.6) — the tab is always visible either way. | `tenants/<slug>/config.json` |
| `areas.pricing` (default `true`) | Whether the Pricing tab **exists at all** for this tenant — `false` hides it completely, no Demo, no lock. | `tenants/<slug>/config.json` |

Use `modules.pricing.enabled: false` for a prospective customer you want to see the upsell.
Use `areas.pricing: false` for a tenant Pricing was never going to be offered to (e.g. a
service business with no per-item pricing to optimize) — and its mirror, `areas.personalization:
false`, for a tenant who bought Pricing only and has no use for the customer/campaign side at
all. Example — a shop that only wants Master Data + Pricing:

```json
"areas": { "personalization": false, "pricing": true }
```

Both default to `true`, so every existing tenant is unaffected unless you explicitly add this.

---

## 3. The Pricing dashboard, screen by screen

Reached via the **Pricing** tab in the top bar.

### 3.1 Dashboard (`/pricing/dashboard`)

A configurable widget board, exactly like Personalization's — click **"+ Widget"** to add,
↑/↓ to reorder, × to remove. Every widget renders from data you already have; adding one
never triggers new computation.

| Widget | What it shows |
|---|---|
| **Recommendation Summary** | How many items currently have a suggestion, the average suggested % change, how many are trending up vs. down, and how many need your review. |
| **Demand Trend Chart** | A bar chart of how many items are rising / flat / falling in demand. |
| **Top Movers** | The 8 items with the single biggest suggested price change (up or down), sorted by size of change. |
| **Needs Review** | Every recommendation currently flagged by the safety net (§3.2) — thin data or a bound was hit — so you can see what needs a second look without leaving the dashboard. |
| **Pricing Settings Summary** | Your current mode (all items vs. selected items), default max change %, rounding rule, and whether the safety net is on. |

This dashboard is always tenant-wide (it doesn't have its own branch selector) — branch
work happens on the Recommendations page (§3.4).

### 3.2 Item Settings (`/pricing/settings`)

This is where you decide **what** gets optimized and **how far** it's allowed to move.
Laid out as a grid of cards:

**Rounding Rule** — applied to every suggested price as the very last step, after your
min/max bounds:
| Option | Effect (example: raw suggestion ₹123.40) |
|---|---|
| No rounding | stays ₹123.40 |
| Nearest ₹5 | → ₹125 |
| Nearest ₹10 | → ₹120 |
| End in .99 | → ₹119.99 (classic "charm pricing") |
| End in .95 | → ₹119.95 |

**Safety Net** — a toggle, on by default. When on, any recommendation built on thin sales
data, or one that had to be capped by your min/max bounds, is marked **"Needs review"** on
the Recommendations page and *can't* be applied without you explicitly checking a
"Reviewed" box first (both per-item, and — for "Apply all" — those items are simply
skipped, never silently applied). Turn it off only if you're confident enough to apply
everything, low-confidence or not, without a second look.

**Business Units in Pricing** — *only shown if you've turned on Business Units at all* (see
the Personalization Guide, §3.13). This is a **second, independent switch**: you can have
branches configured and used everywhere else in the app, and still keep Pricing completely
tenant-wide by leaving this off. Turn it on to unlock branch-scoped optimization — see §3.4.

**Item Bounds** — the core configuration:
- **"Optimize all items"** toggle — when on, every menu item is a candidate every time you
  refresh (subject to the settings below); when off, only items you explicitly enable in the
  table are considered.
- **Default max change %** — the ceiling on how far a suggestion can move an item's price,
  applied to any item without its own override.
- **Occasion** (optional) — pick a configured festival; items in that festival's linked
  categories get a small extra upward nudge while it's active.
- **Per-item table** (shown when "Optimize all items" is off): for each item —
  - checkbox to enable it for optimization,
  - **Min ₹ / Max ₹** — hard price floor/ceiling, never crossed regardless of trend,
  - **Max change %** — overrides the tenant-wide default for this one item,
  - **Manual pricing** — a per-item escape hatch: check this and the algorithm skips the
    item *entirely*, forever, until you uncheck it — you set its price by hand on Master
    Data instead. Useful for items you have a firm reason to price a specific way (a loss
    leader, a contractual price, etc.) that shouldn't drift with sales trends.

### 3.3 Master Data (`/menu`)

The same menu-catalog page used by Personalization's Master Data — reachable directly from
either area's sidebar now, not just via a settings link — see the Personalization Guide §3.12
for the full item-management walkthrough (adding items, editing, photos, in-stock toggle,
CSV import/export, print labels) and §3.14 for descriptive tags ("Fast Selling"/"Most
Favorited"/"Premium"/custom). Pricing-specific things to know:

- The **Current price** the algorithm reasons about is this page's price — editing it here
  changes what "current" means for the next refresh.
- If Business Units + branch pricing are on (§3.4), selecting a specific branch in the
  filter dropdown reveals an editable **Branch price** column — a hand-set override just for
  that branch, independent of the shared base price.
- **Use suggested price**: open an item's **Edit** form and, if it already has a
  recommendation from your last refresh, you'll see "AI suggests ₹X (trend) — Use this
  price" right next to the price field. Click it to fill the price field with the
  suggestion, then hit **Save** to commit — this is a shortcut for "I want the AI's number,
  but I'd rather set it from here than go to Recommendations," it never applies anything
  by itself.

  *Example*: you're already on Master Data fixing a typo in "Rasgulla"'s category, and
  notice the inline note "AI suggests ₹42 (rising) — Use this price." One click fills ₹42
  into the price box; you hit Save once for both the category fix and the new price.

### 3.4 Recommendations (`/pricing`)

The actual working screen. Two buttons up top:

- **Refresh recommendations** — runs the algorithm now (never automatically — refreshing
  costs one AI call per batch, so it's always your call). Pulls each eligible item's last
  90 days of sales vs. the 90 days before that, computes a bounded suggestion, applies
  rounding, and flags anything the safety net catches.
- **Apply all** — applies every recommendation that *isn't* flagged for review, in one
  click. Anything flagged is left alone and reported back to you ("3 need review — apply
  them individually").

Each row: item name, current price, suggested price, the % change (with a ▲/▼/— trend
arrow), a confidence badge (high/medium/low), the plain-English reason, and an **Apply**
button. A flagged row shows a **"Needs review"** badge and a **Reviewed** checkbox — Apply
stays disabled until you tick it.

**Branch selector** (only visible if you've turned on *both* Business Units and "Business
Units in Pricing," §3.2): a dropdown for "All branches" or one specific branch.

- **Refreshing with a branch selected** computes the recommendation from *only that
  branch's own sales* (matched via the branch tag on each sale) — not blended with any
  other branch selling the same item. This is the whole point: a branch where an item sells
  poorly no longer drags down the price at a branch where it sells great, and vice versa.
- **Applying with a branch selected** sets a price *just for that branch* (a branch price
  override, visible/editable on Master Data, §3.3) — it never touches the shared base price.
- **Refreshing/applying with "All branches" selected** works exactly as if Business Units
  didn't exist — one recommendation, one shared price, tenant-wide.
- An item only shows up as a target for a specific branch if it's tagged to that branch (or
  tagged to no branch at all, meaning "every branch").

**Worked example 1 — branch-scoped refresh**: "Kaju Katli" is sold at both Downtown and Mall
Road, tagged to both. Downtown's sales are rising, Mall Road's are flat. Select "Downtown,"
hit Refresh — you get a suggestion based only on Downtown's rising trend. Apply it:
Downtown's effective price for Kaju Katli goes up; Mall Road's price is untouched, still the
shared base price. Switch to "Mall Road," refresh again: since Mall Road's own sales are
flat, you'll likely see little or no suggested change there.

**Worked example 2 — a whole-menu sweep**: it's the start of the month and you want a
quick read on your entire catalog. Leave the branch selector on "All branches," click
Refresh, and skim the table for anything with a large ▲ or ▼ — those are your biggest
opportunities either way (a rising item you could nudge up, a falling one you could discount
to move stock before it goes stale).

**Worked example 3 — festival pricing**: Diwali is 10 days out and you've linked "sweets"
and "gifts" categories to it in Item Settings' Occasion field. Refreshing now gives every
matching item a small extra upward nudge on top of its normal trend — reflecting that demand
typically spikes going into the festival, without you having to hand-adjust two dozen prices.

### 3.5 Pipelines (`/pricing/pipelines`)

Refreshing and applying by hand works, but if you find yourself doing the same thing every
week, a **Pipeline** does it for you. A pipeline is three decisions, made once:

1. **Scope** — which branch (if Business Units in Pricing is on) and, optionally, which
   specific items (leave none checked to mean "every item Item Settings already targets" —
   a pipeline can only *narrow* that set, never widen it; if an item isn't enabled in Item
   Settings, no pipeline will ever touch it).
2. **Mode**:
   - **Manual** — the pipeline refreshes on schedule and stops there; recommendations wait
     for you on the Recommendations page, exactly as if you'd clicked Refresh yourself.
   - **Automatic** — the pipeline refreshes *and* applies everything that isn't flagged by
     the Safety Net. Flagged items are still held back for you to review by hand — automatic
     mode speeds up the routine 90% of cases, it doesn't remove your one safety check.
3. **Schedule**:
   | Type | Behavior |
   |---|---|
   | Daily | Runs every night. |
   | Weekly | Runs every 7 days. |
   | Every N days | A custom interval you pick (e.g. every 3 days). |
   | Once, on a date | Fires the first time that date arrives, then disables itself — a one-off, not recurring. |

   Pipelines are checked as part of the platform's nightly maintenance run — so "daily"
   means "once every night," not a specific time of day you can pick.

Click **"+ New Pipeline"**, fill in the three decisions above, and **Create pipeline**. Each
pipeline in the list shows its mode, schedule, scope, and last-run time, with **Run now**
(trigger it immediately, without waiting for the schedule — great for testing a new
pipeline before trusting it to run unattended) and a per-pipeline on/off toggle.

**Worked example — hands-off daily pricing for one category**: you have 15 bakery items
enabled in Item Settings with sensible min/max bounds already set. Create a pipeline named
"Bakery daily," mode **Automatic**, schedule **Daily**, no branch, no item subset (so it
covers all 15). From tonight onward, those items' prices quietly track demand on their own —
you only ever see them on Recommendations if the Safety Net flags one as needing a look.

**Worked example — a one-time seasonal correction**: you're launching a monsoon discount on
umbrellas and snacks on a specific date. Create a pipeline, mode **Manual** (you want to eyeball
it first), schedule **Once, on a date**, item subset = just those items. On that date it
refreshes once and stops recurring — you review and apply by hand, then the pipeline is done.

**Worked example — per-branch automation**: with Business Units in Pricing on, create two
automatic weekly pipelines, one scoped to "Downtown" and one to "Mall Road," each covering
only the items actually sold there. Every week, each branch's price drifts based on its own
sales, independently — no manual branch-switching required.

### 3.6 When Pricing isn't enabled: the Demo

If your account doesn't have Pricing purchased (`modules.pricing.enabled` is off), every
Pricing page — Dashboard, Recommendations, Pipelines, Item Settings — shows a **Demo**
banner plus a dimmed, static, illustrative Recommendations table using obviously-fake
example rows, so you can see the shape of the feature without it being a dead end. There's
nothing to click there — it's a preview, not a trial. Contact your HPAS admin to purchase
and unlock real functionality with your own data.

---

## 4. Deliberate scope limits (so you know what *not* to expect)

- This is a **demand-trend heuristic**, not real price-elasticity modeling — it reacts to
  whether sales are rising or falling, it doesn't model how customers would react to a
  *specific* price point.
- **Counter recommendations** (the cashier upsell screen) and **CSV export/import** for the
  menu are tenant-wide/base-price only — they don't currently read branch price overrides.
- There's no in-app payment for enabling this feature — it's an admin/operator action.
- Automatic application only happens through a **Pipeline** you explicitly created and set
  to Automatic — a plain refresh or the manual Apply buttons never change anything by
  themselves, and even automatic pipelines never bypass the Safety Net.

---

## 5. Common "how do I...?" walkthroughs

**"I just turned this on — what's the fastest way to see it working?"**
Item Settings → toggle "Optimize all items" on → save → go to Recommendations → click
Refresh. If you have at least a little sales history, you'll see suggestions immediately.

**"I don't want the algorithm anywhere near my bestseller."**
Item Settings → find that item in the table → check **Manual pricing**. It's now
permanently excluded from every future refresh until you uncheck it.

**"Every recommendation says 'needs review' — why?"**
Either your items have thin sales data (low confidence) or your min/max bounds are tight
enough that the suggestion keeps hitting them. Either is normal for a new setup — as more
sales data accumulates, confidence rises and fewer items will need review.

**"I have two locations and one keeps overselling/underselling the other in price terms."**
Set up Business Units (Personalization Guide §3.13), turn on "Business Units in Pricing"
(§3.2), tag your menu items to their actual branches, and use the branch selector on
Recommendations (§3.4) to refresh/apply per branch instead of tenant-wide.

**"I want to print price tags with the new prices."**
Apply the recommendations you want on Recommendations, then go to Master Data, tick the
items you want labels for, and click **Print Labels** — it opens a printable price-tag sheet
using each item's current (post-apply) price.

**"I want prices to update themselves without me logging in every week."**
Create a Pipeline (§3.5), mode **Automatic**, schedule **Daily** or **Weekly**. From then on
it runs itself; you'll only need to visit Recommendations for anything the Safety Net flags.

**"I want to try automatic pricing but I'm nervous about it."**
Create the pipeline as **Manual** first, click **Run now** a few times over a week or two,
and watch what it *would* have applied on Recommendations. Once you trust the suggestions,
edit the pipeline and switch its mode to Automatic — no need to recreate it.

**"How do I know if a pipeline actually ran?"**
Its row on `/pricing/pipelines` shows **Last run** — check it after the schedule should have
fired. If a run silently didn't happen, confirm `modules.pricing.enabled` is still on for
your account and that the pipeline itself is still switched on (the enabled toggle on its row).

**"I have a rented-space clause that fixes one item's price by contract — I never want it touched."**
Item Settings → check **Manual pricing** for that item. It's now invisible to every refresh
and every pipeline, forever, until you uncheck it — set its price directly on Master Data.

**"My account shows 'Demo' on Pricing — how do I get the real thing?"**
That means `modules.pricing.enabled` is off for your account — contact your HPAS admin to
purchase it. Once turned on, the exact same pages start showing your own data instead of the
illustrative example rows — nothing else changes, no re-setup needed.

**"I only want Pricing, not the customer/campaign side of the app."**
That's an `areas` config change (§2.4), not something you can toggle yourself from the
dashboard — ask your admin to set `"areas": {"personalization": false}` on your tenant.

**"I want the price-change reasons to sound less generic."**
`/settings` → AI Assist card → toggle "Use AI for Pricing & Inventory rationale" on → paste
an API key → Save key (§2.3). Recommendations keep computing exactly the same suggested
prices/bounds either way — only the explanation sentence changes.

**"AI Assist is on but the reasons still look templated."**
Confirm a key is actually saved — `/settings` → AI Assist shows "a key is already saved"
once one exists. With the toggle on but no key anywhere (no saved per-tenant key and no
platform `AI_API_KEY` env var), every rationale silently falls back to the deterministic
demand-trend wording, same as with the toggle off — nothing errors, so it's easy to miss.
