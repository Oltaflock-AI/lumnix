# Lumnix — Data Visualization Overhaul + Sidebar Fixes
**Complete Plan for Claude Code Agent**
*April 2026 | Oltaflock AI*

---

## Context

Read `README.md` before starting. This document covers two things:
1. Making every data page feel like a high-quality SaaS product — better charts, better hierarchy, better visual representation of all API data
2. Fixing the sidebar bottom area (feedback button email, dark mode toggle alignment, removing the Settings duplicate)

Work through sections in order. Read every existing file before modifying it. CSS and layout changes only unless stated otherwise.

---

## Part A: Sidebar Bottom Fixes

### Current problems (from screenshots)
- The dark/light mode toggle button is misaligned — it appears as a floating element not properly integrated
- Below the workspace name there is a "Settings" text which is redundant (Settings is already in the nav)
- The "Give feedback" button needs to open a mailto: link with pre-filled workspace ID and user email

### Fix 1: Remove duplicate Settings text under workspace name

In the sidebar bottom user area, find the section that shows:
```
[Avatar]  Workspace Name
          Settings          ← REMOVE THIS
```

Remove the "Settings" sub-text entirely. The bottom user section should only show:
```
[Avatar]  Workspace Name        [logout icon]
```

Font for workspace name: DM Sans 500 14px, `var(--text-primary)`
No sub-label below it.

### Fix 2: Dark/Light mode toggle alignment

The toggle button must be a clean icon button sitting in a dedicated row above the user section, horizontally centered in the sidebar.

```
Sidebar bottom layout (from bottom up):
┌─────────────────────────────────┐
│  [Avatar] Workspace Name  [→]   │  ← user row, border-top
├─────────────────────────────────┤
│  [moon/sun icon]  Give feedback │  ← utility row
└─────────────────────────────────┘
```

Utility row:
- Display: flex, align-items center, justify-content space-between
- Padding: 8px 14px
- Border-top: 1px solid var(--border-default)

Dark/Light toggle button (left side of utility row):
- Width: 32px, height: 32px
- Border-radius: 8px
- Background: transparent
- Border: 1px solid var(--border-default)
- Icon: Moon SVG in dark mode, Sun SVG in light mode — 16px, color var(--text-muted)
- Hover: background var(--bg-card-secondary)
- On click: toggle theme via useTheme()
- No text label

Give Feedback button (right side of utility row):
- Display: flex, align-items center, gap 6px
- Font: DM Sans 400 13px, color var(--text-muted)
- Background: transparent, no border
- Cursor: pointer
- Icon: message-circle SVG 14px
- Hover: color var(--text-secondary)
- On click: open mailto link (see Fix 3)

### Fix 3: Give Feedback → Pre-filled Email

When user clicks "Give feedback", open a mailto: link constructed dynamically:

```typescript
// In the Give Feedback click handler:
const handleFeedback = () => {
  const subject = encodeURIComponent(`Lumnix Feedback — Workspace: ${workspace?.name}`)
  const body = encodeURIComponent(
`Hi Lumnix team,

Workspace: ${workspace?.name}
Workspace ID: ${workspace?.id}
User: ${user?.email}

My feedback:

[Please write your feedback here]
`)
  window.open(`mailto:hello@oltaflock.ai?subject=${subject}&body=${body}`, '_blank')
}
```

This pre-loads: workspace name in subject, workspace ID + user email in body body.
Replace `hello@oltaflock.ai` with the correct support email if different.

---

## Part B: Analytics Page (GA4) — `/dashboard/analytics`

### Current state (from screenshot)
Good data is showing (9,511 sessions, 8,957 users, 12,487 pageviews) but the layout is flat and underutilizes the data. The WoW Change `-25%` is a critical signal that needs to be much more prominent. The traffic sources section is just colored bars with no visual weight.

### What to fix

**Metric cards row (top 4)**

Change to a 4-column grid. Each card:
- Add a trend pill next to the value: `▼ 25%` in red if negative, `▲ X%` in green if positive
- WoW Change card: give it a red left border `3px solid #DC2626` and faint red background `rgba(220,38,38,0.04)` when negative
- Sessions card: largest number, use Plus Jakarta Sans 700 32px
- All sub-labels: DM Sans 500 11px uppercase `#6B7280`

**Insight strip (below metrics)**

The three mini-cards (Week-over-week, Anomalies Detected, Top Source) need more visual weight:

Week-over-week card:
- If negative: background `rgba(220,38,38,0.05)`, left border `3px solid #DC2626`
- Value: Plus Jakarta Sans 700 28px, red `#DC2626`
- Label: "Traffic declining" in DM Sans 400 12px muted

Anomalies card:
- Background `rgba(245,158,11,0.05)`, left border `3px solid #F59E0B`
- Value: Plus Jakarta Sans 700 28px, amber
- "13 days" → show as "13 anomalies" for clarity

Top Source card:
- Background `rgba(5,150,105,0.05)`, left border `3px solid #059669`
- "google" → capitalize to "Google"
- "8,419 sessions" shown in green

**Sessions Trend chart**

Currently a flat line chart. Improve it:
- Fill area under the line: `rgba(255,0,102,0.08)`
- Line color: `#FF0066`, stroke-width 2.5
- Add a reference line at the period average (horizontal dashed line `rgba(255,0,102,0.3)`)
- Tooltip: show date, sessions count, % vs average
- X-axis: show every 3rd date label to avoid crowding
- Y-axis: right-aligned, clean number formatting
- Chart height: 220px

**Traffic Sources — upgrade to visual breakdown**

Replace the plain colored bars with a proper two-column layout:

Left: Horizontal bar chart (Recharts BarChart horizontal)
- Each source is one bar
- Bar color: Google=`#FF0066`, CPC=`#00D4AA`, Direct=`#059669`, Others=`#94A3B8`
- Bar height: 28px with 8px gap between bars
- Show percentage label at end of each bar

Right: Summary stats
- Total sessions
- Top source name + percentage
- Organic vs Paid split if determinable

**Top Pages table (if it exists, add it; if not, create it)**

Pull from GA4 data the top 10 pages by sessions:
- Columns: Page path (truncated), Sessions, Pageviews, Avg time on page, Bounce rate
- Sort by sessions descending by default
- Page path: truncate at 40 chars with tooltip showing full URL
- Sessions column: show a mini bar (width proportional to max sessions in set, `#FF0066` fill, height 4px below the number)

---

## Part C: SEO Page (GSC) — `/dashboard/seo`

### Current state (from screenshot)
Data is good (214 clicks, 820 impressions, 26.10% CTR, position 5.8) but the charts use jarring colors (dark maroon for the trend, random greens/reds for ranking distribution). The keywords table is working well already.

### What to fix

**Metric cards — color fix**
- All 4 metric cards use white background with colored icon, value in `#0F172A`
- Sub-labels: DM Sans 400 12px `#6B7280`
- CTR card: if > 10%, add green border accent; if < 2%, red accent
- Avg Position card: show a small text "Page 1" in green if position < 10, "Page 2" in amber if 10-20

**Ranking Distribution chart — color system fix**

The current chart uses random green/maroon/orange. Replace with a meaningful gradient system:

```
#1–3:   #059669 (excellent — green)
#4–10:  #FF0066 (good — brand purple)  
#11–20: #F59E0B (needs work — amber)
#20+:   #94A3B8 (low — muted gray)
```

- Chart type: vertical bar chart, clean white background
- Bar border-radius: 6px top corners only
- Bar width: 48px
- Show count label above each bar
- Legend: inline below chart, small colored squares + labels

**Quick Wins section — upgrade**

Currently a plain list. Each quick win should be a card:
```
┌────────────────────────────────────────────┐
│  #8  soya mini chunks           0.0% CTR   │
│      190 impressions, 1 click              │
│  ▶ Optimize title to capture this traffic  │
└────────────────────────────────────────────┘
```
- Card background: `rgba(245,158,11,0.05)`, border `1px solid rgba(245,158,11,0.2)`
- Position badge: amber pill `#F59E0B`
- CTR: red `#DC2626`, DM Sans 700
- "Optimize title..." hint: DM Sans 400 12px, `#FF0066`, italic

**Organic Clicks Trend chart**

Same fixes as GA4 sessions chart:
- Line color: `#FF0066`, fill `rgba(255,0,102,0.08)`
- Remove the jarring maroon/dark red — use brand purple throughout
- Height: 200px
- Tooltip: date + click count

**All Keywords table**

This is already good. Minor fixes:
- Position badge colors: `#1–#3` = green `#059669`, `#4–#10` = purple `#FF0066`, `#11–#20` = amber, `#20+` = gray
- "Quick Win" signal badge: amber background `#FFFBEB`, text `#92400E`
- "Top 3" signal badge: green background `#ECFDF5`, text `#065F46`
- Clicks column: bold if > 10 clicks
- Search box: make it visible with border `1px solid #E2E8F0`, border-radius 8px, height 36px

---

## Part D: Google Ads Page — `/dashboard/google-ads`

### Current state (from screenshot)
This page is actually working well with real data! ROAS 165.10x is exceptional and needs to be the hero number. The table is clean but visually flat.

### What to fix

**Make ROAS the hero**

The ROAS card currently looks the same as all other cards. It should stand out:
- Card background: `rgba(5,150,105,0.06)`
- Border: `1px solid #A7F3D0`
- ROAS value: Plus Jakarta Sans 700 32px, color `#065F46`
- Below value: "Healthy" badge — green pill
- This is exceptional performance — it deserves visual emphasis

**Metric cards layout**

Currently 6 cards in a row. Group them better:
- Row 1: Total Spend, Total Clicks, Conversions (primary performance)
- Row 2: ROAS (hero, wider), Avg CPC, Campaigns (supporting)

Or keep 6-column but give ROAS the green hero treatment above.

**Conversions formatting**

`13,629.651` is wrong — conversions should never have decimals. Round to integer: `13,630`

**Campaigns table improvements**

Current table shows CAMPAIGN, STATUS, SPEND, CLICKS, IMPRESSIONS, CONVERSIONS, CPC, ROAS

- Status badge "Active": currently a solid purple pill. Change to: background `#DCFCE7`, text `#166534`, DM Sans 600 11px — green pill matches the positive meaning
- ROAS column: values like `295.75x`, `13.38x`, `675.18x` should all be in green `#065F46` with font-weight 600 since these are excellent
- Add a mini bar under each campaign name showing relative spend (width proportional to spend, `#FF0066` fill, height 3px)
- CPC `₹0.25` is very low — show in green
- Sort by Spend descending by default, show sort indicator on that column

**Add a top performer highlight strip**

Above the table, show the best-performing campaign (highest ROAS):
```
┌──────────────────────────────────────────────────────────┐
│  ★ BEST ROAS  Sales-Search- 30 Oct                       │
│  675.18x ROAS · ₹1.43 spend · 4 clicks · 10 conversions │
└──────────────────────────────────────────────────────────┘
```
Background: `rgba(5,150,105,0.05)`, border `1px solid #A7F3D0`, left border `3px solid #059669`

---

## Part E: AI Assistant Page — `/dashboard/ai-assistant`

### Current state (from screenshot)
The Insights tab looks great! The cards have proper color coding (green=WIN, purple=TIP, amber=OPPORTUNITY, red=WARNING). The main issues are visual consistency and the Chat tab.

### What to fix

**Insight cards — typography upgrade**

Each insight card currently has the type label + priority badge + title + body + data badge + action link. The visual hierarchy is good but needs tightening:

- Card border-radius: 12px (up from current)
- Card padding: 20px
- Card left border: 3px solid [type color] — WIN=`#059669`, TIP=`#FF0066`, OPPORTUNITY=`#F59E0B`, WARNING=`#DC2626`
- Card top-left type label: DM Sans 700 10px uppercase, letter-spacing 0.08em, matching color
- Priority badge (HIGH/MEDIUM): top-right, DM Sans 600 10px uppercase
  - HIGH: background `rgba(220,38,38,0.1)`, text `#DC2626`
  - MEDIUM: background `rgba(245,158,11,0.1)`, text `#F59E0B`
- Card title: Plus Jakarta Sans 600 15px `var(--text-primary)`, margin-top 8px
- Body text: DM Sans 400 14px `var(--text-secondary)`, line-height 1.6, margin-top 6px
- Data badge (e.g. "86 clicks"): background `var(--bg-card-secondary)`, DM Sans 600 12px, padding 4px 10px, border-radius 6px
- Action link (→ text): DM Sans 400 13px `#FF0066`, margin-top 10px, cursor pointer

**Insights grid**

2-column grid with `gap: 12px`. Cards should be same height within each row (use `align-items: stretch`).

**Chat tab**

The chat bubble issue in dark mode was previously identified. Ensure:
- User bubbles: background `#FF0066`, text white, right-aligned
- AI bubbles: background `var(--bg-card-secondary)`, text `var(--text-primary)`, left-aligned with "L" avatar
- Input area: full-width text area, send button inside (absolute position right side)
- Empty state: 4 quick-action prompt buttons in 2×2 grid

**"Refresh Insights" button**

Currently appears as a plain button. Style it:
- Border: `1px solid var(--border-default)`
- Background: transparent
- Icon: refresh SVG 13px, animates on click (rotate 360deg, 0.6s)
- Text: DM Sans 500 13px "Refresh Insights"
- "Last generated: Xd ago" — DM Sans 400 12px `var(--text-muted)`

---

## Part F: Competitor Ad Spy Page — `/dashboard/competitors`

### Current state (from screenshot)
Mostly empty because no competitors are added yet, but the stat cards (Competitors: 0, Winning Ads: 0, AI Briefs: 0) look flat and underwhelming.

### What to fix

**Stat cards — make them meaningful even when empty**

Each of the 3 stat cards:
- Add an icon (left of number): Competitors=users SVG, Winning Ads=trophy SVG, AI Briefs=sparkle SVG
- Icon container: 36px circle, background `rgba(255,0,102,0.1)`, icon color `#FF0066`
- Number: Plus Jakarta Sans 700 32px
- Sub-label: DM Sans 400 12px `var(--text-muted)`
- When 0: show `—` styled in `var(--text-muted)` instead of bold `0` — communicates "nothing yet" vs "a real zero"

**Empty state for the main panel**

Replace "Add a competitor to get started" plain text with a proper empty state:

```
[Eye icon — 48px, rgba(255,0,102,0.1) circle background]

Track your competitors' ads
Discover what's working for them before you spend a rupee.

[+ Add Your First Competitor]  ← primary purple button

How it works:
  1. Enter a competitor's name or website
  2. We find their Facebook ads automatically
  3. AI analyzes which ads are winning (90+ days running)
  4. Get a creative brief: what to make and why
```

The "How it works" section: 4 numbered steps in a horizontal row, each with a small icon and 2-line description. Background `var(--bg-card)`, border `1px solid var(--border-default)`, border-radius 12px, padding 20px.

**"AD LIBRARY" badge**

Currently appears as a generic badge. Style it:
- Background: `rgba(255,0,102,0.1)`
- Text: `#FF0066`
- DM Sans 600 11px uppercase
- Padding: 3px 8px, border-radius 6px

---

## Part G: Dashboard (Command Center) — `/dashboard`

### What to fix

**AI Anomalies section**

The anomaly rows currently look like plain yellow rows. Upgrade them:

Each anomaly row:
- Left: colored dot (red=critical, amber=warning, blue=info)
- Middle: anomaly title (DM Sans 500 14px) + description (DM Sans 400 12px muted)
- Right: source badge (GSC/GA4/Meta/Google Ads) + dismiss ✕ button

Source badge colors:
- GSC: `rgba(5,150,105,0.1)` bg, `#065F46` text
- GA4: `rgba(234,88,12,0.1)` bg, `#9A3412` text
- Meta Ads: `rgba(255,0,102,0.1)` bg, `#5B21B6` text
- Google Ads: `rgba(37,99,235,0.1)` bg, `#1D4ED8` text

**Organic vs Paid chart**

- Organic line: `#FF0066`, fill `rgba(255,0,102,0.08)`
- Paid line: `#00D4AA`, no fill, dashed `strokeDasharray="4 3"`
- Both lines smooth (tension 0.4)
- Legend: custom HTML legend above chart (not Chart.js default)
- Empty paid data: show "Connect Google Ads or Meta Ads →" inline link in the chart area

**Top keywords table**

Currently just 2 rows visible. Make it a proper mini-table:
- Show top 5 keywords (not just 2)
- Columns: Rank, Keyword (truncated), Clicks (bold if > 50), Impressions, CTR
- "View all →" goes to `/dashboard/seo`
- Rank badges: #1 in green, #2-#3 in purple, #4-#10 in amber

---

## Part H: Global Chart Color Standardization

All charts across the entire app must use this consistent palette:

```
Primary data line/bar:    #FF0066  (brand purple)
Secondary data line:      #00D4AA  (teal accent, dashed)
Positive/Success metric:  #059669  (green)
Negative/Warning metric:  #DC2626  (red)
Neutral/Other:            #94A3B8  (gray)
Amber/Caution:            #F59E0B  (amber)

Chart area fill (primary):   rgba(255, 0, 102, 0.06)
Chart area fill (secondary): rgba(0, 212, 170, 0.04)
Chart grid lines:            rgba(0, 0, 0, 0.04) light / rgba(255,255,255,0.04) dark
Chart axis text:             #94A3B8, DM Sans 400 11px
Chart tooltip:               white bg, 1px solid #E2E8F0, 8px border-radius, DM Sans 400 12px
```

Remove ALL dark maroon/crimson (#8B0000 or similar) that currently appears on the SEO and Analytics charts. These were likely Recharts defaults — override them explicitly.

---

## Part I: Typography Pass — All Pages

Every page must have this hierarchy applied consistently:

| Element | Font | Weight | Size | Color |
|---|---|---|---|---|
| Page title (h1) | Plus Jakarta Sans | 700 | 22-24px | `var(--text-primary)` |
| Section heading | Plus Jakarta Sans | 600 | 16px | `var(--text-primary)` |
| Card title | Plus Jakarta Sans | 600 | 14px | `var(--text-primary)` |
| Big metric number | Plus Jakarta Sans | 700 | 28-36px | `var(--text-primary)` |
| Metric label | DM Sans | 500 | 11px uppercase | `var(--text-muted)` |
| Body text | DM Sans | 400 | 14px | `var(--text-secondary)` |
| Table header | DM Sans | 600 | 11px uppercase | `var(--text-muted)` |
| Table cell | DM Sans | 400 | 13-14px | `var(--text-primary)` |
| Muted cell | DM Sans | 400 | 13px | `var(--text-muted)` |
| Badge/pill | DM Sans | 600 | 11px | — |

---

## Definition of Done

### Sidebar
- [ ] No "Settings" text below workspace name
- [ ] Dark/light toggle is a clean 32px icon button, left side of utility row
- [ ] "Give feedback" is right side of utility row, no border, icon + text
- [ ] Clicking "Give feedback" opens mailto: with workspace name in subject, workspace ID + user email pre-filled in body

### Analytics (GA4)
- [ ] WoW `-25%` card has red left border and is visually prominent
- [ ] Sessions trend chart uses purple fill, not default Recharts colors
- [ ] Traffic sources has horizontal bar chart with brand colors
- [ ] Top pages table shows top 10 with mini spend bars

### SEO (GSC)
- [ ] Ranking distribution bars use green/purple/amber/gray system (not maroon)
- [ ] Organic clicks trend uses purple (not maroon)
- [ ] Quick Wins are cards with amber border and CTR in red
- [ ] Keyword position badges use correct color system

### Google Ads
- [ ] ROAS card has green hero treatment
- [ ] Conversions shows `13,630` not `13,629.651`
- [ ] Top performer strip shows best ROAS campaign
- [ ] Active status badges are green pills (not purple)
- [ ] High ROAS values in table column are green + bold

### AI Assistant
- [ ] Insight cards have 3px left border in type color
- [ ] Type label color matches border color
- [ ] Chat tab dark mode bubbles are readable
- [ ] Refresh Insights button has rotate animation on click

### Competitor Ad Spy
- [ ] Stat cards show icon + purple circle background
- [ ] Empty state shows proper onboarding with "How it works" steps
- [ ] AD LIBRARY badge uses brand purple

### Dashboard
- [ ] Anomaly rows have source badges (GSC/GA4/Meta/Google Ads)
- [ ] Top keywords shows 5 rows with rank badges
- [ ] Organic vs Paid chart uses purple + teal, not defaults

### Charts global
- [ ] No dark maroon/crimson anywhere in the app
- [ ] All primary chart lines are `#FF0066`
- [ ] All chart tooltips use consistent card style
- [ ] All chart grid lines are the same faint color
