# Lumnix — Meta Ads Dashboard Redesign
**Complete UI Spec for Claude Code Agent**
*April 2026 | Oltaflock AI*

---

## Context

Read `README.md` before starting. This document is the complete implementation spec for the `/dashboard/meta-ads` page redesign. The goal is a clean, data-dense, professional ads analytics view that makes all campaign data readable at a glance. Build everything in this document exactly as specified. Read the existing file at `src/app/dashboard/meta-ads/page.tsx` (and any related components) before modifying anything.

---

## Page Overview

The Meta Ads page has five distinct sections stacked vertically:

```
1. Page Header (title + date tabs + sync button)
2. Account Switcher Bar
3. Six Metric Cards (single row)
4. Two Charts side by side (spend/clicks over time + campaign status donut)
5. Top Performer Highlight Strip
6. Full Campaigns Table (with filter tabs)
```

Page layout:
- Max width: `1200px`, `mx-auto`
- Padding: `32px 24px`
- Background: `var(--bg-page)`
- All sections stack with `16px` gap between them

---

## Section 1: Page Header

```
┌──────────────────────────────────────────────────────────────────┐
│  [Meta icon 20px]  Meta Ads  [SYNCED badge]      [7d][14d][30d][90d]  [↻ Sync Now] │
└──────────────────────────────────────────────────────────────────┘
```

### Left side
```
Display: flex, align-items: center, gap: 10px

Meta icon:
  SVG circle-with-infinity Meta logo or use a placeholder circle
  Width/height: 28px
  Background: rgba(124,58,237,0.1)
  Border-radius: 8px
  Padding: 4px
  Icon color: #7C3AED

Page title "Meta Ads":
  Font: Plus Jakarta Sans 700 22px
  Color: var(--text-primary)

"SYNCED" badge:
  Text: "SYNCED [date]" — pull from integrations.last_sync_at
  Font: DM Sans 600 11px
  Background: #DCFCE7
  Color: #166534
  Padding: 3px 8px
  Border-radius: 20px
  If sync failed: background #FEF2F2, color #991B1B, text "SYNC FAILED"
  If never synced: background #F1F5F9, color #64748B, text "NOT SYNCED"
```

### Right side
```
Display: flex, align-items: center, gap: 8px

Date range tabs (segmented control):
  Container: background var(--bg-card), border 1px solid var(--border-default), border-radius 8px, padding 3px, display flex, gap 2px
  Each tab: "7d" "14d" "30d" "90d"
  Tab padding: 5px 10px
  Tab border-radius: 6px
  Font: DM Sans 500 12px
  Default: background transparent, color var(--text-muted)
  Active: background var(--bg-page), color var(--text-primary), border 0.5px solid var(--border-default)
  Default selected: "30d"
  On click: re-fetch data for selected range, update all metrics and charts

Sync Now button:
  Height: 34px
  Padding: 0 14px
  Background: transparent
  Border: 1px solid #7C3AED
  Border-radius: 8px
  Color: #7C3AED
  Font: DM Sans 500 13px
  Icon: refresh SVG 13px, left of text, gap 5px
  Hover: background rgba(124,58,237,0.06)
  On click: trigger POST /api/sync/meta-ads, show spinner on icon, disable button during sync
  After sync: update last_sync_at badge, re-fetch all data
```

---

## Section 2: Account Switcher Bar

```
┌──────────────────────────────────────────────────────────────────┐
│  [user icon]  Vippy Soya  act_900085050581114 · INR    [Switch account ▾] │
└──────────────────────────────────────────────────────────────────┘
```

```
Container:
  Background: var(--bg-card)
  Border: 1px solid var(--border-default)
  Border-radius: 10px
  Padding: 10px 16px
  Display: flex
  Align-items: center
  Gap: 10px

User icon (left):
  SVG person icon
  Size: 16px
  Color: #7C3AED

Account name:
  Font: DM Sans 600 14px
  Color: var(--text-primary)

Account ID + currency:
  Font: DM Sans 400 12px
  Color: var(--text-muted)
  Text: "[account_id] · [currency]"

"Switch account ▾" (right, margin-left: auto):
  Font: DM Sans 500 12px
  Color: #7C3AED
  Cursor: pointer
  On click: show dropdown with all connected Meta ad accounts
  Hover: text-decoration underline

Dropdown (when open):
  Position: absolute, below the bar
  Background: var(--bg-card)
  Border: 1px solid var(--border-default)
  Border-radius: 10px
  Padding: 4px
  Min-width: 280px
  Box-shadow: 0 8px 24px rgba(0,0,0,0.12)
  Z-index: 50

  Dropdown header:
    Font: DM Sans 600 11px uppercase
    Color: var(--text-muted)
    Padding: 8px 12px 4px
    Letter-spacing: 0.06em
    Text: "SWITCH AD ACCOUNT"

  Each account option:
    Padding: 8px 12px
    Border-radius: 8px
    Cursor: pointer
    Display: flex, flex-direction column, gap 2px
    Hover: background var(--bg-card-secondary)

    Account name: DM Sans 500 14px var(--text-primary)
    Account ID + currency: DM Sans 400 12px var(--text-muted)
    Active account: show checkmark ✓ on right in #7C3AED

  "Cancel" option:
    Padding: 8px 12px
    Border-top: 1px solid var(--border-default)
    Font: DM Sans 400 13px
    Color: var(--text-muted)
    Cursor: pointer
```

**Data source:** Pull available ad accounts from `analytics_data` where `source = 'meta_ads'`, get distinct `account_id` values. Selected account filters all data on the page.

---

## Section 3: Six Metric Cards

Single row of 6 equal-width cards.

```
Container:
  Display: grid
  Grid-template-columns: repeat(6, minmax(0, 1fr))
  Gap: 10px
```

### Each metric card
```
Background: var(--bg-card)
Border: 1px solid var(--border-default)
Border-radius: 10px
Padding: 16px

Label row (top):
  Font: DM Sans 500 11px
  Color: var(--text-muted)
  Text-transform: uppercase
  Letter-spacing: 0.05em
  Margin-bottom: 6px

Value:
  Font: Plus Jakarta Sans 700 24px
  Color: var(--text-primary)
  Line-height: 1

Sub-text (below value):
  Font: DM Sans 400 12px
  Color: var(--text-muted)
  Margin-top: 4px

Trend indicator (optional, below sub-text):
  Up trend: color #059669, "▲ X%"
  Down trend: color #DC2626, "▼ X%"
  Neutral: color var(--text-muted)
  Font: DM Sans 500 11px
```

### The 6 cards — exact content

**Card 1: Total Spend**
- Label: "TOTAL SPEND"
- Value: `₹X,XXX` — sum of spend across all campaigns in selected date range
- Sub-text: "Last [N] days"
- Trend: % change vs previous period (same number of days)
- Icon (top right): dollar sign SVG, 18px, in a `28px` square, background `rgba(124,58,237,0.1)`, color `#7C3AED`, border-radius `6px`

**Card 2: Impressions**
- Label: "IMPRESSIONS"
- Value: formatted with Indian number system — `3,14,735` not `314,735`
- Sub-text: "All campaigns"
- Icon: eye SVG, same icon container style

**Card 3: Clicks**
- Label: "TOTAL CLICKS"
- Value: `12,194`
- Sub-text: `[X] reach` if reach data exists, else "All campaigns"
- Trend: vs previous period
- Icon: cursor SVG

**Card 4: Avg CTR**
- Label: "AVG CTR"
- Value: `3.87%`
- Sub-text: "Above average" in green `#059669` if > 2%, "Below average" in `#DC2626` if < 1%
- Icon: percent SVG

**Card 5: ROAS**
- Label: "ROAS"
- Value: `—` if no revenue data (NOT `0.00x`)
- Sub-text: "No revenue data" in var(--text-muted) if no data
- If ROAS exists: show `X.XXx`, sub-text "Return on ad spend"
- Sub-text color: `#DC2626` + "Needs improvement" if ROAS < 1, `#059669` + "Healthy" if > 2
- Icon: trending-up SVG

**Card 6: Conversions**
- Label: "CONVERSIONS"
- Value: `0` or actual count
- Sub-text: "Total actions"
- Icon: shopping-cart SVG

### Number formatting
- All INR values: use `₹` prefix with Indian number formatting (`3,14,735` style)
- Use `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })` for currency
- For large numbers: under 1,000 show raw; 1,000–99,999 show raw with commas; 1,00,000+ show in L format (`3.1L`) as sub-text only, full number as main value
- Percentages: always 2 decimal places (`3.87%`)
- ROAS: always 2 decimal places + `x` suffix (`2.34x`)

---

## Section 4: Two Charts Side by Side

```
Container:
  Display: grid
  Grid-template-columns: 1fr 1fr
  Gap: 14px
```

### Chart 1: Spend & Clicks Over Time (left)

```
Card:
  Background: var(--bg-card)
  Border: 1px solid var(--border-default)
  Border-radius: 12px
  Padding: 18px

Header row (flex, space-between):
  Left:
    Title: "Spend & Clicks over time"
      Font: Plus Jakarta Sans 600 14px var(--text-primary)
    Subtitle: "Mar 29 — Apr 11" (dynamic based on date range)
      Font: DM Sans 400 12px var(--text-muted)
      Margin-top: 2px

  Right (legend):
    Display: flex, gap 14px
    Each item: flex row, gap 5px, align-items center
      Dot: 8px circle
      Text: DM Sans 400 12px var(--text-secondary)
    Item 1: dot color #7C3AED, text "Spend"
    Item 2: dot color #0891B2, dashed line indicator, text "Clicks"

Chart:
  Type: Line chart (Recharts LineChart or Chart.js)
  Height: 160px
  Container: position relative, height 160px, margin-top 14px

  Spend line:
    Color: #7C3AED
    Stroke-width: 2
    Fill area: rgba(124,58,237,0.06)
    Smooth curve (tension 0.4)
    No dots on data points

  Clicks line:
    Color: #0891B2
    Stroke-width: 2
    Stroke-dasharray: 4 3
    No fill
    Smooth curve

  X-axis:
    Font: DM Sans 400 10px #94A3B8
    Show date labels: auto-skip to ~7 labels max
    No axis line
    Format: "Apr 1", "Apr 5" etc.

  Y-axis (left, spend):
    Font: DM Sans 400 10px #94A3B8
    Tick format: "₹[value]"
    Grid lines: rgba(0,0,0,0.04) in light, rgba(255,255,255,0.04) in dark
    No axis border line

  Tooltip (on hover):
    Background: var(--bg-card)
    Border: 1px solid var(--border-default)
    Border-radius: 8px
    Padding: 10px 14px
    Show date, spend value, clicks value
    Font: DM Sans 400 12px

  Data source: query analytics_data for the selected account and date range,
  extract daily spend and clicks, group by date
```

### Chart 2: Campaign Status Donut (right)

```
Card:
  Background: var(--bg-card)
  Border: 1px solid var(--border-default)
  Border-radius: 12px
  Padding: 18px

Header:
  Title: "Campaign status breakdown"
    Font: Plus Jakarta Sans 600 14px var(--text-primary)
  Subtitle: "25 total campaigns" (dynamic)
    Font: DM Sans 400 12px var(--text-muted)

Content layout (flex row, gap 20px, margin-top 16px, align-items center):

  Left: Donut chart
    Width: 120px, height: 120px, flex-shrink: 0
    Type: Doughnut (Chart.js) or PieChart (Recharts)
    Cutout: 70% (thick ring, not thin)
    Data:
      Active: #059669
      Paused: #D97706
    No legend from Chart.js — use custom HTML
    No border on segments
    Hover offset: 4px

  Right: Legend + insight
    Display: flex, flex-direction column, gap 12px

    Active item:
      Row: flex, gap 6px, align-items center
        Square: 10px × 10px, border-radius 2px, background #059669
        Label: "X Active" — DM Sans 600 13px var(--text-primary)
      Sub-text: "X% of campaigns" — DM Sans 400 12px var(--text-muted)

    Paused item:
      Same structure, color #D97706

    Insight card (below):
      Background: var(--bg-card-secondary)
      Border-radius: 8px
      Padding: 8px 10px
      Font: DM Sans 400 11px var(--text-muted)
      Line-height: 1.5
      Dynamic text:
        If 1 campaign = 100% of spend: "Only 1 campaign driving all spend"
        If top 3 < 5 campaigns: "Top [N] campaigns driving all spend"
        If all paused: "All campaigns paused — no active spend"
        Color the key stat in var(--text-primary)
```

---

## Section 5: Top Performer Highlight Strip

This is a special highlighted row shown ABOVE the main campaigns table. It always shows the single campaign with the highest spend in the selected date range.

```
Container:
  Background: rgba(124,58,237,0.04)
  Border: 1px solid rgba(124,58,237,0.2)
  Border-radius: 12px
  Overflow: hidden

Top label bar:
  Padding: 10px 18px 8px
  Border-bottom: 1px solid rgba(124,58,237,0.1)
  Display: flex, align-items center, gap 6px
  Text: "TOP PERFORMER BY SPEND"
  Font: DM Sans 600 11px #7C3AED
  Text-transform: uppercase
  Letter-spacing: 0.06em

Content row:
  Padding: 14px 18px
  Display: flex
  Align-items: center
  Justify-content: space-between
  Gap: 20px

  Left: Campaign name
    Font: Plus Jakarta Sans 600 15px var(--text-primary)
    Max-width: 320px
    White-space: nowrap, overflow hidden, text-overflow ellipsis
    Objective tag below:
      Font: DM Sans 400 11px var(--text-muted)
      Text-transform: uppercase
      Margin-top: 2px

  Right: Stats group (display flex, gap 32px)

    Each stat:
      Label: DM Sans 500 11px var(--text-muted), uppercase, letter-spacing 0.04em, margin-bottom 3px
      Value: Plus Jakarta Sans 700 18px var(--text-primary)

    Stats to show:
      SPEND: ₹[value]
      CLICKS: [value]
      IMPRESSIONS: [value formatted]
      CTR: [value]% — color #059669 if > 2%
      CPC: ₹[value]
      STATUS: badge (Active/Paused pill)

    Status badge:
      Active: background #DCFCE7, color #166534, "● Active"
      Paused: background #FEF3C7, color #92400E, "⏸ Paused"
      Font: DM Sans 600 11px
      Padding: 4px 10px
      Border-radius: 20px

Show this strip only if there is at least one campaign with spend > 0.
If all campaigns have 0 spend: hide this section entirely.
```

---

## Section 6: Campaigns Table

### Table header row

```
Container:
  Background: var(--bg-card)
  Border: 1px solid var(--border-default)
  Border-radius: 12px
  Overflow: hidden

Header bar:
  Padding: 16px 20px 12px
  Border-bottom: 1px solid var(--border-default)
  Display: flex
  Align-items: center
  Justify-content: space-between

  Left:
    Title: "All Campaigns" — Plus Jakarta Sans 600 15px var(--text-primary)
    Count: "[X] of [total] campaigns" — DM Sans 400 12px var(--text-muted), margin-top 2px

  Right (filter tabs):
    Display: flex, gap 6px

    Each filter button:
      Font: DM Sans 500 12px
      Padding: 5px 12px
      Border-radius: 6px
      Border: 1px solid var(--border-default)
      Background: transparent
      Color: var(--text-muted)
      Cursor: pointer
      Hover: background var(--bg-card-secondary)

    Active filter:
      Background: #7C3AED
      Color: #FFFFFF
      Border-color: #7C3AED

    Filters:
      "All (25)" — shows all campaigns
      "Active (4)" — filters to status = ACTIVE only
      "Paused (21)" — filters to status = PAUSED only
```

### Table column headers

```
<thead>
  <tr>
    Background: var(--bg-card-secondary)
    Border-bottom: 1px solid var(--border-default)

    Columns (in order):
      CAMPAIGN     — min-width 240px, padding-left 20px, text-align left
      OBJECTIVE    — width 140px, text-align left
      SPEND ▼      — width 90px, text-align right, sort indicator (sorted desc by default)
      CLICKS       — width 80px, text-align right
      IMPRESSIONS  — width 110px, text-align right
      CTR          — width 70px, text-align right
      CPC          — width 70px, text-align right
      ROAS         — width 70px, text-align right
      STATUS       — width 90px, text-align right, padding-right 20px

  Column header style:
    Font: DM Sans 600 11px
    Color: var(--text-muted)
    Text-transform: uppercase
    Letter-spacing: 0.04em
    Padding: 10px 8px
    Cursor: pointer (sortable columns)
    Hover: color var(--text-secondary)

  Sort indicator:
    Active sorted column: color #7C3AED, show ▼ or ▲
    Other sortable columns: show ↕ on hover
```

### Table rows

```
Each row:
  Border-bottom: 1px solid var(--border-default)
  Transition: background 150ms
  Hover: background var(--bg-card-secondary)

  Top performer row (highest spend):
    Background: rgba(124,58,237,0.04)
    Left border: 3px solid #7C3AED
    Hover: rgba(124,58,237,0.07)

  Last row: no border-bottom

Cell: CAMPAIGN (first column)
  Padding: 13px 8px 13px 20px
  Campaign name:
    Font: DM Sans 500 14px var(--text-primary)
    Max-width: 260px
    White-space: nowrap
    Overflow: hidden
    Text-overflow: ellipsis
    If top performer: prefix with ★ in #F59E0B, font-size 12px
  Objective tag (below name):
    Font: DM Sans 400 11px var(--text-muted)
    Text-transform: uppercase
    Letter-spacing: 0.03em
    Margin-top: 2px
    Map raw API values to readable text:
      OUTCOME_TRAFFIC → Traffic
      OUTCOME_SALES → Sales
      LINK_CLICKS → Link clicks
      MESSAGES → Messages
      OUTCOME_AWARENESS → Awareness
      OUTCOME_LEADS → Leads
      (show raw value if no mapping found)

Cell: OBJECTIVE
  Font: DM Sans 400 12px var(--text-muted)
  Same mapping as above, title case
  Show only the readable version here

Cell: SPEND
  Font: DM Sans 400 14px var(--text-secondary)
  Text-align: right
  Format: ₹[value] with Indian number formatting
  If value is 0: show "₹0" in var(--text-muted)

Cell: CLICKS
  Font: DM Sans 400 14px var(--text-secondary)
  Text-align: right
  Format: number with commas
  If 0: var(--text-muted)

Cell: IMPRESSIONS
  Font: DM Sans 400 14px var(--text-secondary)
  Text-align: right
  Format: Indian number system
  If 0: var(--text-muted)

Cell: CTR
  Font: DM Sans 400 14px
  Text-align: right
  If > 3%: color #059669 (good)
  If 1-3%: color var(--text-secondary) (normal)
  If < 1% and not 0: color #DC2626 (low)
  If 0: "0%" in var(--text-muted)

Cell: CPC
  Font: DM Sans 400 14px var(--text-secondary)
  Text-align: right
  Format: ₹[value]
  If no data (0 spend): "—" in var(--text-muted)

Cell: ROAS
  Font: DM Sans 400 14px var(--text-secondary)
  Text-align: right
  If no revenue data: "—" in var(--text-muted)
  If value exists: "[X.XX]x"
  If < 1: color #DC2626

Cell: STATUS
  Text-align: right
  Padding-right: 20px
  Active pill: background #DCFCE7, color #166534, "● Active"
  Paused pill: background #FEF3C7, color #92400E, "⏸ Paused"
  Font: DM Sans 600 11px
  Padding: 3px 8px
  Border-radius: 20px
```

### Collapsed rows for zero-spend campaigns

When the table has many campaigns all with ₹0 spend (like the 17 paused ones), collapse them:

```
After showing the first 5 zero-spend campaigns, show a collapsed footer row:

  Collapsed row:
    Background: var(--bg-card-secondary)
    Border-top: 1px solid var(--border-default)
    Padding: 10px 20px
    Text-align: center
    Font: DM Sans 400 12px var(--text-muted)
    Text: "+ [N] more paused campaigns · All with ₹0 spend"
    Cursor: pointer
    Hover: text color var(--text-secondary)
    On click: expand to show all remaining rows, change text to "▲ Show less"

This prevents the table from being dominated by empty rows.
```

### Empty states

```
If no campaigns at all:
  Center aligned in table body area
  Height: 200px
  Icon: bar-chart SVG, 40px, var(--text-muted)
  Title: "No campaign data" — DM Sans 500 14px var(--text-primary)
  Body: "Connect Meta Ads and sync to see your campaigns." — DM Sans 400 13px var(--text-muted)
  Button: "Connect Meta Ads" → links to /dashboard/settings?tab=integrations
    Primary style (purple)

If filter returns 0 results (e.g. "Active" selected but all paused):
  Center aligned
  Height: 120px
  Text: "No [active/paused] campaigns found." — DM Sans 400 13px var(--text-muted)
```

---

## Sorting Behavior

Allow sorting by clicking any column header (except Campaign name, which stays fixed):

```
Default sort: SPEND descending
Clicking active sort column: toggles asc/desc
Clicking new column: sorts by that column desc

Sort indicator:
  ▼ = descending (current)
  ▲ = ascending
  Show on active column header, color #7C3AED

Sorting is client-side only (data already loaded)
```

---

## Data Fetching

### API endpoint
Use existing data from `analytics_data` table where `source = 'meta_ads'` and `workspace_id = [current workspace]`.

The data structure in `analytics_data` is JSONB. Parse it to extract:

```typescript
// For metrics cards: sum across all campaigns
const totalSpend = campaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
const totalClicks = campaigns.reduce((sum, c) => sum + (c.clicks || 0), 0)
const totalImpressions = campaigns.reduce((sum, c) => sum + (c.impressions || 0), 0)
const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
const totalConversions = campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0)
// ROAS: only calculate if revenue data exists
const totalRevenue = campaigns.reduce((sum, c) => sum + (c.revenue || 0), 0)
const roas = totalRevenue > 0 && totalSpend > 0 ? totalRevenue / totalSpend : null

// For campaign table: one row per campaign object
// For charts: group campaign data by date
```

### Date range filtering
The selected date tab (7d / 14d / 30d / 90d) filters the data:
- Calculate `startDate = today - N days`
- Filter `analytics_data` rows where `date >= startDate`
- Re-calculate all metrics and re-render charts when date range changes

### Loading states
```
While data is fetching:
  Metric cards: show skeleton (animated pulse background, same card dimensions)
  Charts: show skeleton (gray rectangle, same height)
  Table: show 5 skeleton rows (alternating opacity)

Skeleton style:
  Background: var(--bg-card-secondary)
  Border-radius: 6px
  Animation: pulse 1.5s ease-in-out infinite
  @keyframes pulse { 0%, 100% { opacity: 0.6 } 50% { opacity: 1 } }
```

---

## Not Connected State

If Meta Ads is not connected (`integrations` table shows no meta_ads row or status = 'disconnected'):

```
Show full-page empty state instead of any data:

Container: flex column, align-items center, justify-content center, min-height 400px, text-center

Icon container:
  Width: 72px, height: 72px
  Background: rgba(124,58,237,0.1)
  Border-radius: 16px
  Display flex, align-items center, justify-content center
  Margin-bottom: 20px
  Meta icon SVG: 32px, color #7C3AED

Title: "Connect Meta Ads"
  Font: Plus Jakarta Sans 700 20px var(--text-primary)
  Margin-bottom: 8px

Description:
  Font: DM Sans 400 14px var(--text-secondary)
  Max-width: 360px
  Line-height: 1.6
  Margin-bottom: 24px
  Text: "Link your Facebook and Instagram ad accounts to track campaign performance, spend, ROAS, and get AI-powered optimization recommendations."

Button:
  Primary style: background #7C3AED, color white, height 42px, padding 0 20px, border-radius 8px
  Font: DM Sans 600 14px
  Icon: settings SVG 16px, gap 8px
  Text: "Connect in Settings"
  href: /dashboard/settings?tab=integrations
```

---

## Indian Number Formatting

Throughout this page all currency and large numbers must use Indian number formatting:

```typescript
// Indian number formatter
const formatINR = (value: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value)
  // Result: ₹4,479 or ₹3,14,735
}

const formatNumber = (value: number) => {
  return new Intl.NumberFormat('en-IN').format(value)
  // Result: 3,14,735
}
```

---

## Responsive Behavior

At `< 1024px`:
- Metric cards: `grid-template-columns: repeat(3, 1fr)` (2 rows of 3)
- Charts: stack vertically (`grid-template-columns: 1fr`)
- Top performer strip: stack stats vertically

At `< 768px`:
- Metric cards: `grid-template-columns: repeat(2, 1fr)` (3 rows of 2)
- Sidebar collapses (handled by layout, not this page)
- Campaign table: hide IMPRESSIONS, CPC, ROAS columns; keep CAMPAIGN, SPEND, CLICKS, CTR, STATUS

---

## CSS Variables Reference

This page uses the global CSS variables defined in `globals.css`:

```
Light mode:
--bg-page: #F8FAFC
--bg-card: #FFFFFF
--bg-card-secondary: #F1F5F9
--border-default: #E2E8F0
--text-primary: #0F172A
--text-secondary: #374151
--text-muted: #6B7280

Dark mode:
--bg-page: #0F172A
--bg-card: #1E293B
--bg-card-secondary: #273548
--border-default: rgba(255,255,255,0.10)
--text-primary: #F1F5F9
--text-secondary: #CBD5E1
--text-muted: #94A3B8
```

All colors on this page must use these variables — no hardcoded hex values for backgrounds, text, or borders (except brand purple `#7C3AED` and semantic colors for status badges and trend indicators).

---

## Definition of Done

- [ ] Page header shows correct sync status badge (green/red/gray based on last sync)
- [ ] Date range tabs (7d/14d/30d/90d) refetch and update all data when clicked
- [ ] Account switcher shows all connected Meta ad accounts, switches data on selection
- [ ] All 6 metric cards show real calculated values from `analytics_data`
- [ ] ROAS shows `—` not `0.00x` when no revenue data exists
- [ ] Spend/Clicks chart renders with real daily data from selected date range
- [ ] Donut chart shows correct active vs paused count
- [ ] Top performer strip shows only when at least 1 campaign has spend > 0
- [ ] Campaign table default sorted by spend descending
- [ ] Clicking column headers sorts the table (client-side)
- [ ] "Active (4)" / "Paused (21)" filter buttons correctly filter table rows
- [ ] Zero-spend campaigns collapse after first 5 with "show more" row
- [ ] Status badges (Active = green, Paused = amber) render as pills with correct colors
- [ ] Top performer row has left purple border and faint purple background
- [ ] CTR values above 3% render in green, below 1% in red
- [ ] All numbers use Indian formatting (`3,14,735` not `314,735`)
- [ ] Loading skeletons show during data fetch
- [ ] Not connected state shows with correct connect CTA
- [ ] All responsive breakpoints work correctly
- [ ] Dark mode and light mode both render correctly using CSS variables
- [ ] No blue buttons or accents — only `#7C3AED` and semantic greens/reds
