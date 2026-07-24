# Inventory — Complete Setup & User Guide

This is a start-to-finish guide to the **Inventory** side of HPAS: what every screen and
setting does, why it exists, and how to set it up — written for a shop owner using it for
the first time, and detailed enough for a developer standing up a new environment. For a
technical dependency map, see `KNOWLEDGE_GRAPH.md`'s `inventory` and `ai-assist-toggle`
nodes — this document is the "how do I actually use this" companion.

---

## 1. What Inventory is (and isn't)

Inventory is an **optional, paid add-on** that tells you how long your stock will last and
what to reorder, based on your own sales history. It is:

- **Bounded and explainable** — every suggestion comes from a plain sales-velocity
  calculation (your average daily sales over the last 90 days, projected against what you
  have on hand), not a forecasting model or a black box. An optional plain-language
  rationale can be layered on top (§2.3), but the numbers themselves never depend on it.
- **One catalog, not two.** Inventory doesn't introduce a separate item list — it adds stock
  fields (quantity, unit, reorder point, lead time) directly onto the same menu catalog
  Personalization and Pricing already use. An item you already sell just needs "Track stock"
  turned on to show up here.
- **Suggestions, never automatic orders.** Inventory never places an order with a supplier —
  it suggests a quantity and a date, which you can accept as-is or override, on the Reorder
  Suggestions screen (§3.3). Nothing is sent anywhere on your behalf.
- **Admin-gated.** Like Pricing, this feature has no in-app payment — a platform admin turns
  it on for your account (`modules.inventory.enabled` in your tenant config) once you've
  arranged payment outside the app. If it's not enabled, every Inventory page shows a
  **Demo** banner and an illustrative (non-interactive, clearly-fake) preview instead of a
  bare error (§3.6).

---

## 2. Requirements & backend setup

### 2.1 Turning the feature on

A developer/admin adds this to your `tenants/<slug>/config.json`:

```json
"modules": {
  "inventory": { "enabled": true, "order": 12 }
}
```

Then either re-seed (`pnpm db:seed`) or patch the tenant's config in the database directly.
Once enabled, the **Inventory** tab appears unlocked in your dashboard's top bar (it's
always *visible* — even to tenants without it — just shown with a 🔒 lock and an upsell
message until enabled, so you know the option exists).

### 2.2 What data it needs

Nothing extra beyond what you're already generating, plus one opt-in step per item:

- **Your menu** (Master Data) — item names and categories.
- **Your sales history** — the same `events` table Pricing already reads (POS CSV upload,
  QR orders, the Counter screen, or GST billing all feed it).
- **"Track stock" turned on, per item** (`/inventory` — the Items screen, §3.2) — Inventory
  only computes suggestions for items you've explicitly opted in. An item with no sales
  history yet still shows up, just with "not enough data" instead of a days-left estimate.

Stock quantity itself starts at 0 for every item — set an initial count with a manual
adjustment (§3.2) or the bulk CSV stock-count import (§3.2) before trusting the numbers.

### 2.3 AI rationale (optional, degrades gracefully)

Each reorder suggestion can carry a short plain-English reason ("at your current pace,
you'll run out in about 4 days — worth ordering now"). This one line comes from an AI call,
gated by the **AI Assist** toggle for Pricing (`/settings` → AI Assist, off by default — see
`PRICING_GUIDE.md` §2.3 for the full mechanics, since Inventory reuses the same toggle and
the same per-tenant API key). If AI Assist is off, or the call fails for any reason, a
deterministic fallback reason (built straight from the urgency/days-left numbers) is used
instead. **The days-left estimate and suggested quantity never depend on the AI call** —
only the wording of the explanation does.

### 2.4 Should this tenant even see an Inventory tab?

Same two independent admin controls as every other paid area:

| Setting | What it controls | Where |
|---|---|---|
| `modules.inventory.enabled` | Whether Inventory is **unlocked** (real data) or shown as a **Demo** (§3.6) — the tab is always visible either way. | `tenants/<slug>/config.json` |
| `areas.inventory` (default `true`) | Whether the Inventory tab **exists at all** for this tenant — `false` hides it completely, no Demo, no lock. | `tenants/<slug>/config.json` |

Use `modules.inventory.enabled: false` for a prospective customer you want to see the
upsell. Use `areas.inventory: false` for a tenant Inventory was never going to be offered to.
Both default to `true`, so every existing tenant is unaffected unless you explicitly add this.

---

## 3. The Inventory dashboard, screen by screen

Reached via the **Inventory** tab in the top bar.

### 3.1 Dashboard (`/inventory/dashboard`)

A configurable widget board, exactly like Personalization's and Pricing's — click
**"+ Widget"** to add, ↑/↓ to reorder, × to remove.

| Widget | What it shows |
|---|---|
| **Low Stock Alerts** | Every tracked item currently at high urgency — running out soonest. |
| **Days-of-Stock-Left Leaderboard** | Every tracked item, sorted by runway (soonest-out first). |
| **Reorder Queue** | Everything with a nonzero suggested (or overridden) order quantity right now. |
| **Recent Stock Adjustments** | The last 10 stock movements — sales, manual edits, and restocks. |
| **Top Movers** | The tracked items selling fastest, by average units/day. |

### 3.2 Items (`/inventory`)

Every menu item, with its stock fields — and a full editor in its own right: you don't need
to visit Master Data for a routine edit, though the underlying data is the same either way.

- **+ Add Item** — create a brand-new item without leaving Inventory: name, category,
  price, unit, an initial quantity, and optional reorder point/lead time overrides. It's
  created with **Track stock already on**.
- **Edit** (per row) — turns that row into an editable form: name, category, price, tags,
  unit, quantity, reorder point, and lead time all become editable at once. **Save** commits
  everything in one go; **Cancel** discards. This is the "change every column" button — you
  are not limited to quantity-only edits.
- **Track stock** — a toggle, off by default per item. Only tracked items get a reorder
  suggestion, count toward the dashboard widgets, or show a Status badge.
- **Qty** — while editing, type the exact count directly (no more clicking +/− dozens of
  times); outside of edit mode, quick +/− buttons are still there for a fast one-off
  correction. Both paths write to the same auditable stock ledger.
- **Tags** — free-form labels for your own order/stock workflow, independent of the
  computed urgency badge: preset one-click chips for **Ordered**, **Will Order**,
  **Flagged**, and **Backordered**, plus a box for anything else you want to track (a
  supplier name, "damaged", whatever fits your process). Click a tag to remove it while
  editing.
- **Status** — a color-coded badge (and a matching tint on the whole row) driven by the
  reorder engine's urgency for that item: red/"high" (reorder now), amber/"medium" (plan
  ahead), green/"low" (comfortable). Untracked items, or tracked items with no sales
  history yet, show no badge — there's nothing to compute urgency from.
- **Reorder point** — the stock level that triggers "reorder now." Leave blank ("auto") to
  derive it from your sales velocity and the default safety-stock days (§3.4).
- **Lead time (days)** — how long it takes an order to arrive once placed. Leave blank
  ("default") to use the tenant-wide default.
- Search by name or tag with the box at the top.

**Bulk upload — any file format**: `GET /inventory/items/export.csv` downloads every
tracked item's name, category, price, unit, current quantity, reorder point, lead time, and
tags — usable both as a backup and as an import template. **Upload file** accepts CSV, TSV,
JSON, or an actual Excel workbook (`.xlsx`/`.xls`) — the format is detected from the file
extension, so you upload whatever you already have; there's no need to convert to CSV by
hand first. A row whose name doesn't match an existing item **creates a new tracked item**
(category/price default to "uncategorized"/₹0 if left out) rather than being rejected, so
this doubles as a one-shot "add my whole inventory" import, not just a recount tool. Any row
that can't be processed (bad quantity, missing name) is reported back by row number, and
every other row still goes through.

### 3.3 Reorder Suggestions (`/inventory/reorder`)

The working screen. For every tracked item: current quantity, average daily sales, days of
stock left, suggested order quantity and date, an urgency badge (low/medium/high), your
override (if any), and — when AI Assist is on — a plain-language reason.

- **Recompute now** — runs the engine immediately: reads each tracked item's last 90 days of
  sales, computes average daily sales, projects days-of-stock-left, and suggests a quantity
  that covers your configured safety-stock + lead-time window. Never runs automatically from
  this button — it's always your call, though the nightly platform job also recomputes for
  every Inventory-enabled tenant (§4).
- **Override** — type a number and hit Save; your number is used everywhere the suggested
  quantity would otherwise show (dashboard widgets included) until you clear it.

### 3.4 Settings (`/inventory/settings`)

Tenant-wide defaults, used whenever an item doesn't have its own override:

- **Default lead time (days)** and **Default safety stock (days)** — together these set how
  much buffer coverage a fresh suggestion targets.
- **Low-stock alert threshold (days)** — below this, the dashboard's Low Stock widget flags
  an item.
- **Auto-decrement from sales** — on by default. When on, every purchase of a tracked item
  (matched by name, the same way Pricing already matches sales to menu items) deducts from
  its stock count as it happens, so stock never drifts from your events history. Turn it off
  if you'd rather adjust stock only by hand or via restocks.
- **Per-item overrides** table — set a specific reorder point or lead time for any tracked
  item that needs one (a slow-moving import with a long shipping time, for example).

### 3.5 Master Data (`/menu`)

The same menu-catalog page used by Personalization and Pricing — see `PERSONALIZATION_GUIDE.md`
§3.12 for the full item-management walkthrough. Inventory-specific note: an item must exist
here before you can turn on stock tracking for it on `/inventory`.

### 3.6 When Inventory isn't enabled: the Demo

If your account doesn't have Inventory purchased (`modules.inventory.enabled` is off), every
Inventory page shows a **Demo** banner plus a dimmed, static, illustrative Reorder
Suggestions table using obviously-fake example rows. There's nothing to click there — it's a
preview, not a trial. Contact your HPAS admin to purchase and unlock real functionality.

---

## 4. Deliberate scope limits (so you know what *not* to expect)

- **No separate item catalog** — stock lives on the same menu items Master Data manages.
  "+ Add Item" on `/inventory` creates a real menu item (with tracking on), it doesn't spin
  up a parallel "inventory-only" record — the same item shows up on Master Data, Pricing,
  campaigns, everywhere else an item is referenced.
- **No automatic purchase orders** — Inventory only ever suggests a quantity and date; it
  never contacts a supplier or places an order for you.
- **No multi-warehouse/per-branch stock split yet** — a tracked item's quantity is one
  tenant-wide number, even if you have Business Units configured for Pricing/Personalization
  elsewhere. Splitting stock per branch is a natural future extension (mirroring Pricing's
  "Business Units in Pricing" toggle), not something this first version does.
- **Sales velocity is a simple 90-day rolling average**, not seasonality-aware forecasting —
  a big one-off spike or dip in the last 90 days moves the estimate the same way a steady
  trend would.
- The nightly platform job only recomputes suggestions for tenants with
  `modules.inventory.enabled` — an unlicensed tenant's numbers (in the Demo) never update.

---

## 5. Common "how do I...?" walkthroughs

**"I just turned this on — what's the fastest way to see it working?"**
Items (`/inventory`) → turn on **Track stock** for a few items you sell often → set an
initial quantity with the +/− buttons or the CSV import → Reorder Suggestions
(`/inventory/reorder`) → click **Recompute now**.

**"Every item says 'not enough data'."**
That means fewer than 90 days of sales history exist for that item yet (or it's brand new).
The estimate improves automatically as more sales come in — there's nothing to configure.

**"I don't want the system deducting stock automatically — I'll count it myself."**
Settings (`/inventory/settings`) → turn off **Auto-decrement from sales**. Stock then only
changes from manual adjustments and restocks you record yourself.

**"One item has a much longer shipping time than everything else."**
Settings (`/inventory/settings`) → find it in the Per-Item Overrides table → set its own
**Lead time (days)**. Its reorder date will now account for that longer wait.

**"I want to do a full physical stock count."**
Items (`/inventory`) → download the CSV export, count your shelves, fill in the actual
quantities, and re-upload via the import — each changed item becomes one recorded
adjustment, visible on that item's ledger.

**"I want the reasons to sound less generic."**
Turn on **AI Assist** for Pricing in Settings (`/settings`, see `PRICING_GUIDE.md` §2.3) and
paste in an API key — Reorder Suggestions will start showing an AI-written rationale per
item instead of the deterministic fallback text. This never changes the numbers, only the
explanation.

**"My account shows 'Demo' on Inventory — how do I get the real thing?"**
That means `modules.inventory.enabled` is off for your account — contact your HPAS admin to
purchase it. Once turned on, the exact same pages start showing your own data instead of the
illustrative example rows — nothing else changes, no re-setup needed.

**"I have my whole inventory in an Excel sheet already — do I have to retype it all?"**
No — Items (`/inventory`) → **Upload file** accepts `.xlsx`/`.xls` directly, alongside
CSV/TSV/JSON. Include at least a `name` column; add `category`, `price`, `unit`,
`currentQty`, `reorderPoint`, `leadTimeDays`, and `tags` (semicolon-separated) columns for
anything else you want set in the same pass. Rows matching an existing item update it; rows
with a new name create it, already tracked.

**"I typed the wrong quantity by clicking +/- too many times — how do I just set the right number?"**
Items (`/inventory`) → **Edit** on that row → type the exact quantity into the Qty field →
**Save**. No need to click +/− repeatedly to get there.

**"I want to mark an item as already ordered so I don't reorder it again."**
Items (`/inventory`) → **Edit** on that row → click the **Ordered** tag chip (or type your
own, e.g. a PO number) → **Save**. Tags are just for your own tracking — they don't change
the reorder math, so remove the tag once the delivery arrives if you want the badge to
reflect current reality again.
