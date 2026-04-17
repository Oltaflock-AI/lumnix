# LUMNIX — CLAUDE CODE MASTER INSTRUCTIONS
**Single Source of Truth for All Claude Code Sessions**
*April 2026 | Oltaflock AI*

---

## BEFORE STARTING ANY TASK

Read these files in this order before writing a single line of code:

1. `README.md` — full architecture, tech stack, API routes, database schema
2. `LUMNIX_MASTER_PLAN.md` — product vision, Phase 1 scope, pricing, nav structure
3. `.claude/skills/ui-ux-pro-max/SKILL.md` — **ALL UI work must pass this skill's 10-priority ruleset and Lumnix pre-delivery checklist before being considered done**

Then read the relevant spec file for the specific task (listed in Section 5 below).

**Rule:** Read existing files before modifying anything. Never rewrite working logic — extend and fix only.

---

## 1. WHAT LUMNIX IS

Lumnix is an AI-powered marketing intelligence platform built by Oltaflock AI. It unifies Google Search Console, Google Analytics 4, Google Ads, and Meta Ads into one dashboard with AI insights, anomaly detection, and competitor ad intelligence.

**Live:** https://lumnix-ai.vercel.app
**Repo:** https://github.com/khush0030/lumnix

**Phase 1 is the only scope right now.** Creative Studio, Campaigns, and Attribution are removed from the UI. Do not add them back.

---

## 2. TECH STACK (never change these)

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Fonts | Plus Jakarta Sans (display) + DM Sans (body) — see Section 3 |
| Charts | Recharts |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Supabase Postgres + Row Level Security |
| AI Chat | OpenAI GPT-4o-mini (streaming) |
| AI Analysis | Anthropic Claude claude-sonnet-4-6 |
| Deployment | Vercel |
| APIs | GSC API, GA4 Data API, Google Ads API v17, Meta Marketing API v19, Meta Ad Library API |

---

## 3. DESIGN SYSTEM — ALWAYS APPLY

> **Cross-reference:** `.claude/skills/ui-ux-pro-max/SKILL.md` — the Lumnix-Specific Design Tokens section at the bottom of that file contains the full token set with usage rules. Apply it to every component written.

### Colors

```
Primary (all CTAs, active nav, interactive):  #FF0066
Primary hover:                                 #FF3385
Chart accent (secondary lines only):           #00D4AA
Success / positive metrics:                    #059669
Warning / caution:                             #F59E0B
Danger / negative metrics:                     #DC2626
Muted / disabled:                              #94A3B8
```

**No blue buttons anywhere.** Blue (`#00D4AA`) is for chart lines only, never UI elements.

### CSS Variables (light/dark)

```css
/* Light mode */
--bg-page:           #F8FAFC
--bg-card:           #FFFFFF
--bg-card-secondary: #F1F5F9
--border-default:    #E2E8F0
--text-primary:      #0F172A
--text-secondary:    #374151
--text-muted:        #6B7280

/* Dark mode */
--bg-page:           #0F172A
--bg-card:           #1E293B
--bg-card-secondary: #273548
--border-default:    rgba(255,255,255,0.10)
--text-primary:      #F1F5F9
--text-secondary:    #CBD5E1   ← minimum for readable text
--text-muted:        #94A3B8
```

Never hardcode hex values for backgrounds, text, or borders — use these variables so light/dark switching works globally.

### Typography

| Element | Font | Weight | Size |
|---|---|---|---|
| Page title (h1) | Plus Jakarta Sans | 700 | 24px |
| Section heading (h2) | Plus Jakarta Sans | 600 | 18px |
| Card title | Plus Jakarta Sans | 600 | 15px |
| Big metric number | Plus Jakarta Sans | 700 | 28–36px |
| Metric label | DM Sans | 500 | 11px uppercase |
| Body / description | DM Sans | 400 | 14px |
| Table header | DM Sans | 600 | 11px uppercase |
| Table cell (primary) | DM Sans | 400 | 14px |
| Table cell (secondary) | DM Sans | 400 | 13px |
| Button text | DM Sans | 600 | 14px |
| Nav item label | DM Sans | 500 | 13px |
| Badge / tag | DM Sans | 600 | 11px |
| Timestamp / metadata | DM Sans | 400 | 12px |

No Inter. No system-ui. No Arial. No fonts other than these two.

### Sidebar

- Always `220px` wide — no collapse, no toggle, ever
- Dark mode background: `#0F172A`
- Light mode background: `#FFFFFF` with `1px solid #E2E8F0` right border
- Nav default text: `#CBD5E1` (dark) / `#374151` (light)
- Nav active state: `3px solid #FF0066` left border + `rgba(255,0,102,0.18)` background + `#FFFFFF` text
- Section labels (ANALYTICS, ADVERTISING, INTELLIGENCE): DM Sans 600 10px uppercase, `#6B7280`

### Charts (global rules)

```
Primary line/bar:     #FF0066
Primary fill area:    rgba(255, 0, 102, 0.06)
Secondary line:       #00D4AA (dashed, strokeDasharray="4 3")
Secondary fill:       rgba(0, 212, 170, 0.04)
Success metric:       #059669
Danger metric:        #DC2626
Neutral:              #94A3B8
Grid lines:           rgba(0,0,0,0.04) light / rgba(255,255,255,0.04) dark
Axis text:            #94A3B8, DM Sans 400 10px
Tooltip:              white bg, 1px solid #E2E8F0, 8px border-radius, DM Sans 400 12px
```

**No dark maroon/crimson anywhere.** No default Recharts colors. Override every chart color explicitly.

### Number Formatting

All currency and large numbers use Indian locale:
```typescript
const formatINR = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
// Result: ₹3,14,735 not ₹314,735

const formatNumber = (v: number) =>
  new Intl.NumberFormat('en-IN').format(v)
```

ROAS: show `—` not `0.00x` when no revenue data exists.
Conversions: always integers, never decimals.

---

## 4. NAVIGATION STRUCTURE (Phase 1 only)

```
ANALYTICS
  Dashboard          /dashboard
  Analytics          /dashboard/analytics
  SEO                /dashboard/seo

ADVERTISING
  Google Ads         /dashboard/google-ads
  Meta Ads           /dashboard/meta-ads

INTELLIGENCE
  AI Assistant       /dashboard/ai-assistant
  Competitors        /dashboard/competitors

  Reports            /dashboard/reports
  Alerts             /dashboard/alerts
  Settings           /dashboard/settings
```

**Permanently removed — do not re-add:**
- Creative Studio
- Campaigns
- Attribution

---

## 5. SPEC FILES — READ BEFORE TOUCHING EACH PAGE

Each page or feature has a dedicated spec. Read the relevant one before starting work.

| Task | Spec file to read |
|---|---|
| **Meta Ads page** | `META_ADS_DASHBOARD_SPEC.md` |
| **Competitor Ad Spy** | `COMPETITOR_AD_SPY_SPEC.md` |
| **Analytics, SEO, Dashboard charts** | `LUMNIX_DATA_VIZ_OVERHAUL.md` |
| **Settings page (all tabs)** | `PHASE1_SETTINGS_OVERHAUL.md` |
| **Sidebar, dark mode toggle, feedback** | `PHASE1_UI_FIXES.md` + `PHASE1_UI_FIXES_R2.md` |
| **Font consistency (all pages)** | `PHASE1_FONT_FIX.md` |
| **Phase 1 overall scope** | `PHASE1_REHAB_PLAN.md` |
| **Product vision + pricing** | `LUMNIX_MASTER_PLAN.md` |

All spec files are in the project outputs directory. Read them completely before writing code.

---

## 6. COMPONENT STANDARDS

### Buttons

```
Primary (Save, Connect, CTA):
  height 40px · padding 0 20px · background #FF0066 · color #fff
  border-radius 8px · DM Sans 600 14px · hover: #FF3385

Secondary/outline (Sync Now, Upload, Copy):
  height 40px · padding 0 16px · transparent bg
  border 1px solid var(--border-default) · color var(--text-secondary)
  border-radius 8px · hover: var(--bg-card-secondary) + border #FF0066

Danger/outline (Disconnect, Remove):
  height 40px · padding 0 16px · transparent bg
  border 1px solid #FECACA · color #EF4444
  border-radius 8px · hover: bg #FEF2F2

Disabled (Current Plan, inactive):
  height 40px · bg var(--bg-card-secondary) · color var(--text-muted)
  border-radius 8px · cursor not-allowed
```

### Cards

```
Standard card:
  background var(--bg-card)
  border 1px solid var(--border-default)
  border-radius 12px
  padding 20px

Metric card:
  background var(--bg-card)
  border 1px solid var(--border-default)
  border-radius 10px
  padding 16px
  label: DM Sans 500 11px uppercase var(--text-muted)
  value: Plus Jakarta Sans 700 24-32px var(--text-primary)
  sub-text: DM Sans 400 12px var(--text-muted)

Top performer strip:
  background rgba(255,0,102,0.04)
  border 1px solid rgba(255,0,102,0.2)
  border-left 3px solid #FF0066
  border-radius 12px
```

### Status Badges (use these everywhere, consistently)

```
Active:       bg #DCFCE7 · text #166534 · "● Active"
Paused:       bg #FEF3C7 · text #92400E · "⏸ Paused"
Error:        bg #FEF2F2 · text #991B1B · "✕ Error"
Connected:    bg #DCFCE7 · text #166534 · "● Connected"
Disconnected: bg #F1F5F9 · text #64748B · "○ Disconnected"

All badges: DM Sans 600 11px · padding 3px 8px · border-radius 20px
```

### Empty States

```
Every page/section must handle:
  Not connected  → icon + title + description + Connect CTA button
  No data        → icon + "No data yet" + Sync Now button
  Loading        → skeleton cards/rows (pulse animation)
  Error          → icon + error summary + Retry button

Empty state layout:
  flex-direction column · align-items center · justify-content center
  min-height 200px · text-align center · padding 40px

Icon container: 72px circle · bg rgba(255,0,102,0.1) · icon 32px color #FF0066
Title: Plus Jakarta Sans 700 20px var(--text-primary) · margin-bottom 8px
Description: DM Sans 400 14px var(--text-secondary) · max-width 360px · line-height 1.6
CTA button: Primary style · margin-top 24px
```

### Skeleton Loaders

```css
/* Use on all data-fetching sections while loading */
background: var(--bg-card-secondary);
border-radius: 6px;
animation: pulse 1.5s ease-in-out infinite;

@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
```

---

## 7. SIDEBAR BOTTOM — EXACT SPEC

> **Cross-reference:** `PHASE1_UI_FIXES.md` Fix 3, `PHASE1_UI_FIXES_R2.md` Fix 1

This is the correct sidebar bottom layout. Build it exactly this way:

```
┌─────────────────────────────────┐
│  [Avatar] Workspace Name  [→]   │  ← border-top 1px solid var(--border-default)
├─────────────────────────────────┤
│  [🌙]              [Give feedback]  │  ← utility row
└─────────────────────────────────┘
```

- **No "Settings" text under workspace name** — remove it entirely
- **Dark/light toggle:** 32px icon button, left side, border 1px solid var(--border-default), Moon/Sun SVG 16px, border-radius 8px
- **Give Feedback:** right side, DM Sans 400 13px var(--text-muted), no border, message-circle icon 14px
- **Feedback mailto handler:**

```typescript
const handleFeedback = () => {
  const subject = encodeURIComponent(`Lumnix Feedback — Workspace: ${workspace?.name}`)
  const body = encodeURIComponent(
`Workspace: ${workspace?.name}
Workspace ID: ${workspace?.id}
User: ${user?.email}

My feedback:

`)
  window.open(`mailto:hello@oltaflock.ai?subject=${subject}&body=${body}`, '_blank')
}
```

---

## 8. DATA SYNC & API RULES

### Sync reliability (apply to all 4 providers)

```typescript
// Token refresh — before every API call
if (token.expires_at < Date.now() + 5 * 60 * 1000) {
  // refresh token, update oauth_tokens table
  // if refresh fails: log to sync_jobs, return gracefully, don't throw
}

// Retry logic — wrap every external API call
// attempt 1 → wait 1s on fail → attempt 2 → wait 2s on fail → attempt 3 → log failure
```

### Cron sync

`/api/cron/sync` must include all 4 providers: GSC, GA4, Google Ads, Meta Ads.

### Sync status in settings

Settings > Integrations shows per-provider: last sync time, success/error status, rows synced, Sync Now button.

---

## 9. COMPETITOR AD SPY — FULL SPEC

> **Cross-reference:** `COMPETITOR_AD_SPY_SPEC.md` — read this completely before touching the Competitors page

Key facts:
- Uses Meta Ad Library API (same token as Meta Ads)
- Brand resolution: 3 paths — website URL → scrape for FB link, facebook.com URL → extract slug, brand name → fuzzy search with visual confirmation modal
- Performance signal: longevity only — 90+ days = Winning, 180+ days = Top Performer
- Claude (claude-sonnet-4-6) analyzes winning ads and generates creative brief
- Re-scrapes every 48h via cron
- DB tables: `competitor_ads`, `competitor_briefs` (extend existing `competitors` table)

---

## 10. SETTINGS PAGE — ALL TABS

> **Cross-reference:** `PHASE1_SETTINGS_OVERHAUL.md` — read completely before touching settings

| Tab | Key rules |
|---|---|
| General | Purple save buttons, not blue |
| Brand | Purple save button, logo preview 64px |
| Integrations | 2×2 grid, Sync Now flex:1, Disconnect auto-width danger style, NO Slack card |
| Team | Send Invite fully opaque purple, Remove is danger/outline red |
| Alerts | Purple active toggles (not blue), no Slack section |
| Billing | 4 plans in `repeat(4, 1fr)` grid, Growth has purple "Most Popular" badge |

---

## 11. PAGE-BY-PAGE DATA DISPLAY STANDARDS

> **Cross-reference:** `LUMNIX_DATA_VIZ_OVERHAUL.md` for full specs

### Dashboard
- Anomaly rows: colored dot + source badge (GSC=green, GA4=orange, Meta=purple, Google=blue)
- Top keywords: show 5 rows, rank badges (#1-3 green, #4-10 purple, #11+ amber)
- Organic vs Paid chart: purple fill line + teal dashed line, custom HTML legend

### Analytics (GA4)
- WoW decline card: red left border 3px + faint red bg
- Sessions trend: purple fill + dashed average reference line
- Traffic sources: horizontal bar chart, Google=#FF0066 CPC=#00D4AA Direct=#059669
- Top pages table: 10 rows, mini progress bar under each page name

### SEO (GSC)
- Ranking bars: green(#1-3) / purple(#4-10) / amber(#11-20) / gray(20+)
- Zero dark maroon anywhere — all chart lines → purple
- Quick Wins: cards with amber border, CTR in red
- Keyword position badges use the 4-color system above

### Google Ads
- ROAS card hero: bg rgba(5,150,105,0.06), border #A7F3D0, value #065F46
- Top performer strip: highest ROAS campaign, green left border
- Active badges: green (#DCFCE7/#166534), not purple
- Conversions: always integer, never decimal

### Meta Ads
- 6 metric cards, account switcher bar, 2 charts side by side (line + donut)
- Top performer strip when spend > 0
- Campaign table sortable, zero-spend rows collapsed after 5
- Full spec in `META_ADS_DASHBOARD_SPEC.md`

### AI Assistant
- Insight cards: 3px left border — WIN=#059669, TIP=#FF0066, OPPORTUNITY=#F59E0B, WARNING=#DC2626
- Chat bubbles: user=purple bg/white text, AI=var(--bg-card-secondary)/var(--text-primary)
- Empty chat: 4 quick-action prompt buttons in 2×2 grid

### Competitor Ad Spy
- Stat cards: icon circle + number + sub-label
- Empty state: proper onboarding with "How it works" 4-step flow
- AD LIBRARY badge: rgba(255,0,102,0.1) bg, #FF0066 text

---

## 12. UI/UX SKILL — QUICK PRIORITY REMINDER

> **Full rules:** `.claude/skills/ui-ux-pro-max/SKILL.md`

Before marking any UI task done, verify these top priorities:

**Priority 1 — Accessibility (CRITICAL)**
- Text contrast minimum 4.5:1 on all backgrounds
- Visible focus rings on all interactive elements
- No color as the only indicator of meaning — always pair with icon or text

**Priority 2 — Touch & Interaction (CRITICAL)**
- All clickable elements minimum 44×44px
- Every button shows loading/disabled state during async operations
- No hover-only interactions

**Priority 3 — Performance (HIGH)**
- Skeleton loaders on all data-fetching sections (never blank screens)
- No layout shift when data loads (reserve space upfront)

**Priority 5 — Layout (HIGH)**
- No horizontal scroll on any viewport
- Mobile: sidebar collapses to hamburger below 768px

**Priority 6 — Typography/Color (MEDIUM)**
- Only Plus Jakarta Sans + DM Sans — verified on every page
- No raw hex values in components — only CSS variables
- Dark mode minimum text: `#CBD5E1`

**Priority 10 — Charts (LOW)**
- Every chart has a visible legend
- Tooltips on hover/tap showing exact values
- No default Recharts colors — all overridden explicitly

---

## 13. DEFINITION OF DONE — PHASE 1

Phase 1 is complete when every item below is checked:

### Data & sync
- [ ] All 4 providers sync automatically via cron (not manual only)
- [ ] Token refresh works reliably for all 4 providers
- [ ] Retry logic (3 attempts, exponential backoff) on all sync routes
- [ ] `unified_metrics` Postgres view normalizes all 4 sources

### Sidebar
- [ ] Always 220px, no collapse
- [ ] No "Settings" text below workspace name
- [ ] Dark/light toggle: 32px icon button, left of utility row
- [ ] Give Feedback: opens pre-filled mailto with workspace ID + user email

### All pages
- [ ] Dashboard: real anomaly data, top 5 keywords, purple+teal chart
- [ ] Analytics: WoW card red border, purple session chart, traffic sources bar chart
- [ ] SEO: 4-color ranking bars, purple clicks trend, quick wins as cards
- [ ] Google Ads: ROAS hero card, green active badges, integer conversions
- [ ] Meta Ads: all 6 sections per META_ADS_DASHBOARD_SPEC.md
- [ ] AI Assistant: colored left borders on insight cards, dark mode chat readable
- [ ] Competitors: proper onboarding empty state, full ad spy flow working
- [ ] Reports: clean placeholder
- [ ] Alerts: real alerts with source badges
- [ ] Settings: all 6 tabs correct, no blue buttons, no Slack card

### UI/UX
- [ ] Zero blue buttons anywhere in the app
- [ ] Zero dark maroon on any chart
- [ ] All page titles: Plus Jakarta Sans 700 24px
- [ ] All body text: DM Sans 400 14px
- [ ] Dark mode text min #CBD5E1 on all pages
- [ ] Light/dark toggle switches entire app correctly
- [ ] Skeleton loaders on all async sections
- [ ] All status badges consistent (Active=green, Paused=amber, Error=red)
- [ ] Indian number formatting throughout (₹3,14,735 not ₹314,735)
- [ ] ROAS shows `—` not `0.00x` when no revenue data
- [ ] All empty states: icon + title + description + CTA

### Onboarding
- [ ] New user → workspace → connect → sync → dashboard in under 5 minutes
- [ ] Persistent banner if no sources connected

---

## 14. PRICING (INR — Current)

| Plan | Price | Key features |
|---|---|---|
| Free | ₹0/mo | 2 integrations, 30-day retention, 2 team members, basic insights |
| Starter | ₹2,499/mo | 4 integrations, 90-day retention, 5 members, AI insights, PDF reports |
| Growth | ₹6,499/mo | All integrations, 1-year retention, 15 members, AI chat, white-label, competitor tracking |
| Agency | ₹16,499/mo | Unlimited everything + multi-workspace, priority support, API access |

Growth card gets "Most Popular" badge in `#FF0066`. All 4 plans on one row: `grid-template-columns: repeat(4, 1fr)`.

---

## 15. WHAT NOT TO TOUCH

- Do not modify Supabase schema unless a spec file explicitly says to
- Do not create new API routes unless an existing one provably doesn't cover the need
- Do not add Creative Studio, Campaigns, or Attribution to the nav
- Do not add Slack integration anywhere
- Do not use any font other than Plus Jakarta Sans and DM Sans
- Do not use blue (#3B82F6 or similar) on any button or interactive element
- Do not hardcode dark-mode colors — use CSS variables only
- Do not add collapse logic to the sidebar
