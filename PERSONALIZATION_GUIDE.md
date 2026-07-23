# Personalization — Complete Setup & User Guide

This is a start-to-finish guide to the **Personalization** side of HPAS: what every screen
and setting does, why it exists, and how to set it up — written for a shop owner using the
dashboard for the first time, and detailed enough for a developer standing up a new
environment. If you only need a technical map of files/dependencies, see
`KNOWLEDGE_GRAPH.md` instead — this document is the "how do I actually use this" companion
to it.

---

## 1. What Personalization is

Personalization is everything about knowing your customers and talking to them well:

- Building a customer directory from your sales (POS uploads, online-order QR codes, the
  counter screen, or GST billing) — automatically, without extra data entry.
- Grouping customers into **segments** ("big spenders who haven't visited in 2 months").
- Sending WhatsApp campaigns to those segments, with AI-written (but human-approved)
  message copy.
- A cashier-facing customer lookup built into **Billing** — per-customer recommendations and
  loyalty points, right where you already type their phone number to bill them.
- Receipts, coupons, and online-order capture that all feed the same customer pool.

Nothing here ever sends a message without you clicking "Approve & Send" — the system only
ever *prepares* campaigns.

---

## 2. Requirements & backend setup (do this once per environment)

Before any of the screens below will fully work, a developer needs to configure the
backend. None of this is required to explore the dashboard with fake/demo data — it's
required to actually receive real customers and send real WhatsApp messages.

### 2.1 Environment variables

Copy `.env.example` to `.env` (already done for local dev; for a new deploy, set these in
your hosting provider's environment settings) and fill in:

| Variable | Required for | What it is |
|---|---|---|
| `DATABASE_URL` | Everything | Postgres connection string (pooled, e.g. Supabase port 6543) |
| `DIRECT_DATABASE_URL` | Migrations | Direct (non-pooled) Postgres connection, port 5432 |
| `AUTH_SECRET` | Login | Random secret used to sign dashboard session tokens |
| `PUBLIC_API_URL` | Printable pages/links | The public URL of the API (used in invoice/QR links) |
| `DEMO_PASSWORD` | Demo tenants | Password used by seeded demo tenants (e.g. `dadus`) |
| `CRON_SECRET` | Scheduled jobs | Shared secret Vercel Cron uses to call `/cron/*` endpoints |
| `ANTHROPIC_API_KEY` | AI features | Anthropic API key. **If left empty, the platform runs a deterministic mock AI provider** — segment discovery, campaign copy, counter pitches, and pricing rationale all still work, just with canned/templated text instead of real generation. This is fine for development; set a real key for production AI quality. |
| `ANTHROPIC_MODEL` | AI features | Which Claude model to call (only matters if `ANTHROPIC_API_KEY` is set) |
| `WHATSAPP_MODE` | Real WhatsApp sends | `stub` (default) or `live` — see §2.2 |
| `WHATSAPP_PHONE_NUMBER_ID` | Real WhatsApp sends | Meta WhatsApp Business phone number id |
| `WHATSAPP_ACCESS_TOKEN` | Real WhatsApp sends | Meta Graph API access token |
| `WHATSAPP_WEBHOOK_VERIFY_TOKEN` | Real WhatsApp sends | Token Meta uses to verify your webhook URL (defaults to `dev-verify-token`) |
| `EMAIL_MODE` | Real email sends | `stub` (default) or `resend` — see §2.3 |
| `RESEND_API_KEY` | Real email sends | API key from resend.com |
| `NEXT_PUBLIC_API_URL` | Dashboard | The API's URL, as seen by the dashboard's browser code |

### 2.2 Setting up real WhatsApp sending

By default (`WHATSAPP_MODE` unset or `stub`), the platform **simulates** WhatsApp sends —
nothing actually goes out, but every screen behaves as if it did (message status flips to
"sent" immediately). This is the right mode for development and demos.

To send real WhatsApp messages:

1. Get a **Meta WhatsApp Business Account** (WABA) through Meta's Business Platform (this
   is a real business onboarding process — expect it to take from hours to a few days for
   approval).
2. From your WABA, get a **phone number ID** and generate a permanent **access token**.
   Set these as `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN`.
3. Set `WHATSAPP_MODE=live`.
4. **Message templates**: WhatsApp requires every business-initiated message to use a
   pre-approved template. This platform does not yet auto-submit templates to Meta for
   approval (that's a manual step today) — you'll need to create and get your campaign
   templates approved in the Meta dashboard before campaigns using them can actually send.
5. **Webhooks**: each tenant gets its own webhook URL at
   `{PUBLIC_API_URL}/webhooks/whatsapp/{tenant-slug}` — register this in your Meta app
   dashboard so replies and delivery statuses flow back in. The verify token you set in
   Meta must match `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.
6. **Opt-in**: Meta requires an opt-in record before you can message a customer — this
   platform tracks that automatically as customers interact (QR scans, receipt replies,
   etc.), but a customer with no interaction yet can't be messaged until they've opted in
   somehow (e.g. scanning a QR code and sending the pre-filled WhatsApp message).

If you only ever see "stub-wa-..." provider IDs in message logs, `WHATSAPP_MODE` is not
`live` — that's expected until you complete the steps above.

### 2.3 Setting up real email sending

By default (`EMAIL_MODE` unset or `stub`), email sends are simulated the same way WhatsApp
is. To send real email:

1. Create an account at [resend.com](https://resend.com) and get an API key.
2. **Verify your sending domain** in Resend — this is required before Resend will deliver
   mail from your `fromAddress`; skipping this step means real sends will fail even with a
   valid API key.
3. Set `RESEND_API_KEY` and `EMAIL_MODE=resend`.
4. Set the tenant's `channels.email.fromAddress` (see §3, zero-code config) to an address on
   your verified domain.

Email is a fallback channel — it's used for invoice delivery and as a fallback path for
campaigns to customers without a usable WhatsApp number, not the primary channel.

### 2.4 Onboarding a new shop (zero-code)

A new tenant is a folder at `tenants/<slug>/config.json` plus a seed run — no code changes,
ever. Example shape (trimmed):

```json
{
  "slug": "dadus",
  "branding": {
    "shopName": "Dadu's Sweets",
    "logoUrl": "",
    "colors": { "primary": "#8b4513", "accent": "#f4a460", "background": "#fff8f0" }
  },
  "modules": {
    "insights": { "enabled": true, "order": 1 },
    "customers": { "enabled": true, "order": 2 },
    "segments": { "enabled": true, "order": 3 },
    "campaigns": { "enabled": true, "order": 4 },
    "loyalty": { "enabled": true, "order": 5 },
    "menu": { "enabled": true, "order": 6 },
    "preferences": { "enabled": true, "order": 7 },
    "data": { "enabled": true, "order": 8 },
    "settings": { "enabled": true, "order": 9 },
    "billing": { "enabled": true, "order": 10 },
    "pricing": { "enabled": false, "order": 11 }
  },
  "loyalty": { "enabled": true, "pointsPerRupee": 0.1, "pointValueRupees": 0.25 },
  "receipts": { "enabled": true, "showItems": true, "footerNote": "See you soon!" },
  "coupons": { "enabled": true, "tiers": [], "minDaysBetweenCoupons": 7 },
  "qrCapture": { "enabled": true, "messageTemplate": "Hi! Confirming my order {{token}} from {{shop_name}}" },
  "brandVoice": {
    "tone": "warm, friendly, a bit playful",
    "language": "English with occasional Hindi words",
    "samplePhrases": ["Hi {{name}}!", "Just for you..."],
    "avoid": ["overly formal language", "excessive emoji"]
  },
  "festivals": [
    { "name": "Diwali", "date": "2026-11-08", "preWindowDays": 14, "categories": ["sweets", "gifts"] }
  ],
  "posColumnMapping": {
    "phone": "Phone", "name": "Customer Name", "amount": "Total",
    "items": "Items", "itemsDelimiter": ";", "itemFormat": "name|category|qty|unitPrice",
    "itemPartsDelimiter": "|", "timestamp": "Date", "dateFormat": "DD/MM/YYYY HH:mm"
  },
  "channels": {
    "whatsapp": { "enabled": true, "number": "+919999999999" },
    "email": { "enabled": true, "fromAddress": "hello@dadus.example" },
    "callList": { "enabled": true, "minLtvThreshold": 5000 }
  }
}
```

**Every `modules.*` entry is a menu item you can turn on/off per tenant.** `enabled: false`
hides that item from the sidebar entirely; `order` controls its position. `posColumnMapping`
is the most important field to get right at onboarding — it tells the CSV importer how to
read *that shop's* POS export format, so a new shop with a differently-shaped export needs
zero code, just a different mapping here.

After writing `config.json`, run `pnpm db:seed` (idempotent — safe to re-run) to create the
tenant row and load the config.

### 2.5 Should this tenant even see a Personalization tab?

By default, yes — every tenant sees both the Personalization and Pricing top-bar tabs. A
tenant can be configured to only offer one, via `TenantConfig.areas` (defaults: both `true`):

```json
"areas": { "personalization": true, "pricing": false }
```

This is distinct from each individual `modules.*.enabled` flag, which controls which *items*
inside an already-visible area show up. `areas.personalization: false` removes the whole tab
— for a tenant that only bought Pricing and has no interest in customer/campaign features.
See the Pricing Guide §2.4 for the mirror-image case.

---

## 3. The Personalization dashboard, screen by screen

Everything below is reached via the **Personalization** tab in the top bar (hidden
entirely if `areas.personalization` is `false` — see §2.5). Some items only appear if
enabled in `modules` (noted below); Dashboard, Notifications, and Settings always show.

### 3.1 Dashboard (`/personalization/dashboard`)

A **widget board you configure yourself** — nothing is hard-coded. Click **"+ Widget"** top
right to add one; use the ↑/↓ arrows to reorder, × to remove. Every widget reads data that's
already computed elsewhere — adding widgets never slows anything down or changes what data
is collected.

Available widgets:

| Widget | What it shows |
|---|---|
| **Customer Stats** | Total customers, how many are "active" (bought in the last 60 days) vs. "drifting away," and average lifetime spend. |
| **Repeat-Purchase Trend** | A line chart, month by month, of what % of that month's buyers had also bought the month before — your best single "is loyalty working" number. |
| **Segment Sizes** | How many customers currently match each of your saved segments. |
| **Top Customers** | Your top 8 customers by lifetime spend, with their favorite item and last-visit date. |
| **Campaign A/B Compare** | For one sent campaign, compares the messaged group against the hold-out control group you never message — repeat-purchase rate, revenue per customer, and redemptions. Pick which campaign from a dropdown on the widget itself. |
| **Campaign Impact** | Totals across every sent campaign: how many campaigns sent, total incremental revenue, total coupon/code redemptions. |

There is no "wrong" set of widgets — add as many as you find useful, remove the rest. Your
layout is saved automatically per tenant.

### 3.2 My Customers (`/insights`) — requires `insights` module

Your at-a-glance homepage: the same Customer Stats/Repeat Trend/Top Customers information
as the dashboard widgets, plus your **overall campaign impact** (sent campaigns, incremental
revenue, redemptions). This page always shows the same fixed layout — the Dashboard (§3.1)
is where you customize what you see.

### 3.3 All Customers (`/customers`) — requires `customers` module

The full customer list — not just the top 8. Use this to:

- **Search** by name or phone (top-left box).
- **Sort** by Most recent, Top spenders, Most purchases, or Alphabetical.
- **Filter by branch** — only shown if you've set up Business Units (§3.9) and switched them
  on; lets you see only customers tagged to one branch.

Each row shows favorite item, lifetime spend, orders in the last 90 days, last visit, and
join date.

### 3.4 Segments (`/segments`) — requires `segments` module

A segment is a rule that describes an audience — "customers who spent over ₹2000 and
haven't visited in 30+ days," for example. Segments are what campaigns get sent *to*.

Click **"+ New Segment"** top-right to open the creator (hidden by default to keep the page
uncluttered):

- **Describe a segment**: type a plain-English description (e.g. *"big spenders who buy
  gift boxes but haven't visited in 2 months"*) and click **Preview audience**. The AI turns
  this into a validated rule and shows you exactly how many customers match it *today* —
  nothing is saved yet. If you're happy with the size, click **Save segment**.
- **Let AI suggest segments**: click **Suggest segments** and the AI studies your actual
  sales numbers (visit gaps, spend, categories, upcoming festivals) and proposes a handful of
  audiences worth messaging, each with a live size. Save any you like.

Every segment you save appears in **Your segments** below, each with:
- **Create campaign now** — immediately builds a campaign from this segment's current
  audience and drops it into the Campaigns approval queue (§3.5). This is a manual trigger;
  segments are *also* checked automatically once a day by the scheduled trigger engine.
- **Delete** (only for segments you created — the platform's standard seeded segments can't
  be deleted).

**More example prompts for "Describe a segment"** (any of these turn into a real, sized,
previewable rule):
- *"Customers who spent more than ₹5000 total but haven't come back in 60 days"* — a
  high-value win-back list.
- *"People who bought sweets in the last 2 weeks but never tried our bakery items"* —
  a cross-sell audience for a new-item-alert campaign.
- *"Anyone who visits at least twice a month"* — your most loyal regulars, good for a
  thank-you or early-access campaign rather than a discount they don't need.
- *"Customers who redeemed a coupon in the last 30 days"* — people who've already proven
  they respond to offers.

### 3.5 Campaigns (`/campaigns`) — requires `campaigns` module

**The approval queue. Nothing is ever sent without you clicking Approve.**

Click **"+ Create Campaign"** top-right for a quick way to turn any existing segment into a
campaign right from this page (a popover lists your segments — click one to create).

Each **pending** campaign shows:
- Which segment it's for and how many customers (plus how many are being held back as an
  unmessaged control group, so you can measure impact later).
- A preview of the actual message a few real customers would receive.
- **Approve & Send** — sends it now. **Edit message** — rewrite the template freely (you can
  use placeholders like `{{name}}`, `{{favorite_item}}`, `{{shop_name}}`, `{{redemption_code}}` —
  the page tells you which are valid). **Reject** — discards it.

Below that, **History** lists every past campaign with delivery/read/reply stats,
incremental revenue, and redemption counts, plus a **Call list** download for any campaign
that routed high-value customers to a human phone call instead of a message.

### 3.6 The counter card, on Billing (`/billing`)

There's no separate "Counter" page anymore — the cashier-facing lookup lives right on the
**Billing** page (Account → Billing, or via the top-right area if you've bought Pricing),
built into the same phone number field you already type when generating a bill. You never
enter a customer's number twice.

Type the phone number and tab/click away from the field (or it looks up automatically once
you've filled it in) and, if that number is a customer, a card appears above the item picker
showing:

- Their name, loyalty point balance (and its rupee value), last visit, favorite item.
- 2–3 recommended items to suggest, each with a one-line reason the cashier can say out
  loud ("goes well with what they usually buy," "haven't tried this yet," etc.) and a
  cashier-facing pitch line.
- Buttons to **award/redeem loyalty points**, with a running log of the last few point
  events, and a box to send a quick **1:1 WhatsApp note**.

If the number isn't a customer yet, you'll see a **"new customer"** notice instead of the
card — normally you don't need to do anything else: just fill in their name, pick what
they're buying below, and hit **Generate Invoice**, which creates their profile and records
that first purchase automatically. If they're *not* buying anything right now (e.g. you just
want to enroll them), a small **"add them now without a bill"** button next to the notice
does that directly, without going through the invoice form.

### 3.7 QR Codes (`/personalization/qr-codes`)

For sales through Swiggy, Zomato, or similar apps that don't share the customer's phone
number with you. Pick what they ordered from your menu (the amount is calculated
automatically), give it an order reference, and generate a QR code. When the customer scans
it, WhatsApp opens with a pre-written message already typed in — the moment they hit send,
they join your customer list with that order attached, phone number and all.

The table below shows every QR you've generated, whether it's been scanned/claimed yet, and
links to print the QR or copy its claim link.

### 3.8 Upload Data (`/data`) — requires `data` module

Two things live here:

- **Upload a billing CSV**: export your sales history from your POS system and upload it.
  The page tells you exactly which columns it expects (derived from your tenant's
  `posColumnMapping`, §2.4) — get a developer to adjust that mapping if your export's column
  names differ. Every upload's outcome (success, rows processed, any errors) is logged in
  **Upload history** below.
- A link out to **QR Codes** (§3.7) for online orders — that workflow now lives on its own
  page since it isn't a CSV import.

### 3.9 Preferences (`/preferences`) — requires `preferences` module

Per-campaign-type controls:
- **Enable/disable** each campaign type (win-back, festival pre-order, new item alert,
  reorder reminder) — a disabled type never triggers, ever.
- **Max sends per customer per week** — a frequency cap so no one gets messaged too often,
  even if they qualify for multiple campaigns.

### 3.10 Notifications (`/personalization/notifications`)

Platform-wide announcements — mainly planned server maintenance windows. These come from
HPAS itself (the platform operator), not from you — there's no authoring UI, it's a
read-only feed. Each shows a severity badge (info/warning/critical), the message, and when
it was posted.

### 3.11 Settings (`/personalization/settings`)

Three cards:

- **Master Data**: quick links into the Customer directory and Segments — this is "your"
  underlying data.
- **Upload Data**: link to the CSV importer (§3.8).
- **Download Data**: export your entire customer list as CSV, or pick one segment and
  export just its current audience as CSV — useful for taking your own data elsewhere or
  archiving it.

Also embedded here: the **Business Units** card (§3.12) — since branches are relevant to
both Personalization and Pricing, it's managed from either area's Settings page and stays
in sync.

### 3.12 Business Units (branches)

A **tag/filter feature**, not a way to split your shop into separate businesses — you still
have one customer list, one menu, and one campaign/segment engine either way. It exists so
a shop with multiple physical locations (or counters, or regions) can tell customers,
purchases, and menu items apart by branch, without any of the complexity of running
multiple separate tenants.

**It's off by default.** Turn it on with the toggle at the top of the **Business Units**
card (found in both Personalization Settings and Pricing Item Settings):

1. Flip the toggle on.
2. Type a branch name (e.g. "Downtown," "Mall Road") and click **Add**. Repeat for every
   branch.
3. Once at least one branch exists and the toggle is on, branch pickers start appearing
   everywhere relevant:
   - **All Customers**: a "Filter by branch" dropdown.
   - **Generate Bill**: an optional branch dropdown on the invoice form — picking one tags
     the customer, the purchase, and the invoice to that branch, and (if that branch has a
     price override for an item — see the Pricing Guide) uses the branch's price instead of
     the base price.
   - **Master Data (menu)**: business-unit checkboxes on each item (which branches sell it —
     leave all unchecked to mean "every branch"), a branch filter dropdown, and (when one
     specific branch is selected) an editable **branch price** column.
   - **Pricing Recommendations**: see the Pricing Guide — a separate switch there controls
     whether pricing itself uses branches.

You can flip the master toggle back off at any time — your branch list and any branch-price
overrides are kept, just hidden, so turning it back on later picks up right where you left
off.

---

## 4. Common "how do I...?" walkthroughs

**"How do I get my existing customers into the system?"**
Export your sales history as CSV from your POS → Upload Data → Upload a billing CSV. Every
past purchase becomes an event; customers, their lifetime spend, and loyalty points are all
backfilled automatically.

**"How do I send a win-back message to people who haven't visited in a while?"**
Segments → describe it in plain English (e.g. *"haven't bought anything in 45 days"*) →
Preview → Save → Create campaign now → review the preview messages on the Campaigns page →
Approve & Send.

**"A customer says they never got their WhatsApp message."**
Check `WHATSAPP_MODE` (§2.1) — if it's not `live`, no real messages are sent by design (demo
mode). If it is `live`, check that the customer has an opt-in interaction on file and that
your message template is Meta-approved (§2.2).

**"I want two branches to look separate in reporting."**
Turn on Business Units (§3.12), add both branches, and start tagging invoices with a branch
when you generate them. Give it a few days of billing before the filters show anything
meaningful.

**"How do I stop a specific campaign type entirely?"**
Preferences → toggle that campaign type off. It will never trigger again until you turn it
back on.

**"I'm selling through Swiggy/Zomato and don't have those customers' phone numbers."**
QR Codes → pick what they ordered → generate a QR → print it and attach it to the order/bag.
When they scan and send the pre-filled WhatsApp message, they join your customer list with
that order attached — no manual entry.

**"I want to reward my most loyal regulars without discounting for everyone."**
Segments → describe *"customers who visit at least twice a month"* → Preview → Save → Create
campaign now. Since it's not a discount-driven segment, write the message as a genuine
thank-you or early-access note rather than a coupon (Campaigns → Edit message).

**"I gave someone a discount at the counter and now their receipt/points look wrong."**
Loyalty points are earned on the *actual* amount charged, discount included, since points
are computed from real events — so a discounted bill should already show correct, lower
points. If it looks wrong, check that the discount was applied at Billing time (not entered
as a separate adjustment) and that the employee name/ID were filled in (mandatory whenever
a discount is applied).

**"How do I see whether a campaign actually worked, not just that it sent?"**
Campaigns → History → find the sent campaign → its row shows delivered/read/reply counts.
For the deeper comparison — messaged customers vs. the held-out control group — add a
**Campaign A/B Compare** widget to your Dashboard (§3.1) and pick that campaign.

**"A new cashier needs to use Billing to handle a walk-in customer — what do they need to know?"**
Just the customer's phone number, typed into the same field they'd use to bill the sale
(§3.6). Existing customers show recommendations and loyalty balance automatically, right
there on the page; a number that isn't a customer yet shows a "new customer" notice instead
of an error, and generating the bill creates their profile and awards points in one step —
no separate Counter screen to visit.

**"I want to warn my team about a maintenance window."**
You can't post these yourself — Notifications (§3.10) is a read-only feed from the platform
operator (HPAS), not tenant-authored. If you need your *team* to know about something
specific to your shop, use Billing's 1:1 WhatsApp note feature per-customer (§3.6), or
handle it outside the platform (this feed is specifically for platform-wide announcements).

**"Can I get all my customer data out if I ever need to leave?"**
Personalization Settings → Download Data → Export all customers (CSV). You can also export
just one segment's current audience the same way — useful for handing a specific list to a
call center or another tool.
