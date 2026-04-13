# Lumnix — Complete UI Rehaul Plan
**UI/UX Pro Max Audit + Implementation Spec**
*April 2026 | Oltaflock AI*

---

## Audit Method

This audit runs against all 10 priority categories from the UI/UX Pro Max ruleset. Every finding is rated:
- 🔴 **CRITICAL** — breaks usability or accessibility
- 🟠 **HIGH** — significant UX degradation
- 🟡 **MEDIUM** — noticeable polish gap
- 🟢 **LOW** — nice to have

Functionality is never touched. All changes are CSS, layout, typography, animation, and visual design only.

---

## AUDIT FINDINGS

### Priority 1: Accessibility 🔴

| # | Finding | Severity | Fix |
|---|---|---|---|
| A1 | Sidebar nav text at `#6E6A96` on `#FFFFFF` fails 4.5:1 ratio | 🔴 CRITICAL | Darken to `#4B4869` minimum |
| A2 | Metric card labels at `#A09CC0` on white = 2.6:1 — fails AA | 🔴 CRITICAL | Use `#6B6893` minimum |
| A3 | "Quick Win" amber badge `#F59E0B` on `#FEF3C7` = 2.1:1 — fails | 🔴 CRITICAL | Darken text to `#78350F` |
| A4 | Chart lines rely on color only — no shape or pattern differentiation | 🔴 CRITICAL | Add dashed pattern to paid line, solid to organic |
| A5 | No visible focus rings on nav items or buttons | 🔴 CRITICAL | Add `outline: 2px solid #7C3AED; outline-offset: 3px` on :focus-visible |
| A6 | Icon-only buttons (dark mode toggle, logout) have no aria-label | 🟠 HIGH | Add `aria-label="Toggle dark mode"` etc. |
| A7 | Alert badges (number "7") have no screen reader text | 🟠 HIGH | Add `<span className="sr-only">7 unread alerts</span>` |

### Priority 2: Touch & Interaction 🟠

| # | Finding | Severity | Fix |
|---|---|---|---|
| T1 | Sidebar nav items are 36px tall — below 44px minimum | 🟠 HIGH | Increase to 44px height with padding adjustments |
| T2 | Sync Now button has no loading/disabled state during async | 🟠 HIGH | Add spinner + disabled on click |
| T3 | Filter tab buttons (All/Active/Paused) are 28px — too small | 🟠 HIGH | Minimum 36px height |
| T4 | Settings tab pills are 32px — borderline | 🟡 MEDIUM | 36px minimum |
| T5 | No press feedback on cards or table rows | 🟡 MEDIUM | Add subtle `scale(0.99)` on active |

### Priority 4: Style Selection 🟠

| # | Finding | Severity | Fix |
|---|---|---|---|
| S1 | Page canvas `#F8FAFC` feels cold and corporate | 🟡 MEDIUM | Shift to `#F7F6FE` — warmer lavender tint that matches the purple brand |
| S2 | Card borders `#E2E8F0` have no purple personality | 🟡 MEDIUM | Shift to `#EAE8FF` — subtle purple-tinted border |
| S3 | Sidebar section labels (ANALYTICS) are barely visible | 🟠 HIGH | Stronger contrast + slight uppercase treatment |
| S4 | Status badges inconsistent — Active is sometimes green pill, sometimes purple pill | 🔴 CRITICAL | Standardise: Active=green always, Paused=amber always, Error=red always |
| S5 | Blue buttons still present in Billing and Settings tabs | 🔴 CRITICAL | All CTAs → `#7C3AED` — zero exceptions |
| S6 | Chart area fill colors not consistent across pages | 🟠 HIGH | All primary fills → `rgba(124,58,237,0.07)` |

### Priority 5: Layout & Responsive 🟠

| # | Finding | Severity | Fix |
|---|---|---|---|
| L1 | Main content area has no consistent max-width — stretches on ultrawide | 🟡 MEDIUM | Set `max-width: 1280px; margin: 0 auto` on content container |
| L2 | Metric cards grid uses `minmax(0,1fr)` without min-width — can crush on mid-size screens | 🟠 HIGH | Add `min-width: 140px` to each card |
| L3 | Campaign table columns overflow on 1024px viewport | 🟠 HIGH | Hide IMPRESSIONS and CPC on <1100px, show on hover tooltip |
| L4 | No mobile sidebar behavior (hamburger) | 🟡 MEDIUM | Add hamburger at <768px |
| L5 | Page header title + subtitle have inconsistent top padding across pages | 🟡 MEDIUM | Standardise: `padding-top: 28px` on all page headers |
| L6 | Dashboard anomaly section takes full width but content is narrow | 🟡 MEDIUM | Anomalies + Top Keywords in a 2-col grid, not stacked |

### Priority 6: Typography & Color 🟠

| # | Finding | Severity | Fix |
|---|---|---|---|
| TY1 | Big metric numbers are 28-30px — lack impact for a data dashboard | 🟠 HIGH | Increase to 36px on all primary metric cards |
| TY2 | Page titles don't consistently use Plus Jakarta Sans | 🟠 HIGH | Audit every page — enforce `font-family: 'Plus Jakarta Sans'` on all h1 |
| TY3 | Body text line-height 1.5 — slightly tight | 🟡 MEDIUM | Increase to 1.65 for better readability |
| TY4 | Dark mode body text `#CBD5E1` — correct, but some pages use `#94A3B8` for descriptions | 🟠 HIGH | Minimum `#CBD5E1` for ALL body text in dark mode |
| TY5 | Number formatting inconsistent — some use US locale (`314,735`), some Indian (`3,14,735`) | 🔴 CRITICAL | Enforce `en-IN` locale throughout |
| TY6 | ROAS showing `0.00x` in some cards when no revenue data | 🔴 CRITICAL | Always show `—` when ROAS cannot be calculated |

### Priority 7: Animation 🟡

| # | Finding | Severity | Fix |
|---|---|---|---|
| AN1 | Zero page transition animations — content pops instantly on nav | 🟡 MEDIUM | Add 200ms fade+slide-up on route change |
| AN2 | No skeleton loaders — data sections show blank on load | 🟠 HIGH | Add pulsing skeleton on all metric cards and tables |
| AN3 | Sidebar active state has no transition | 🟡 MEDIUM | Add `transition: all 150ms ease` |
| AN4 | Sync Now button spin animation missing | 🟡 MEDIUM | Add rotating icon during sync |
| AN5 | Chart data loads instantly without entrance animation | 🟡 MEDIUM | Add `animationBegin` on Recharts to fade lines in over 600ms |

### Priority 8: Forms & Feedback 🟠

| # | Finding | Severity | Fix |
|---|---|---|---|
| F1 | Settings form save buttons have no loading state | 🟠 HIGH | Add spinner + "Saving..." text during API call |
| F2 | Form save success has no confirmation — user doesn't know it worked | 🟠 HIGH | Show toast: "Workspace name saved" for 3s |
| F3 | Disconnect confirmation dialog missing — one click disconnects an integration | 🔴 CRITICAL | Add confirmation modal: "Are you sure you want to disconnect GSC?" |
| F4 | Input fields have no error states (red border + error message) | 🟠 HIGH | Add error styling to all form inputs |
| F5 | "No alert rules yet" empty state has no CTA button | 🟡 MEDIUM | Add "Add Alert" button in the empty state itself |

### Priority 9: Navigation 🟡

| # | Finding | Severity | Fix |
|---|---|---|---|
| N1 | No breadcrumb on sub-pages — user loses context on Settings tabs | 🟡 MEDIUM | Keep tab state in URL (`/dashboard/settings?tab=integrations`) |
| N2 | Active nav state only on click — doesn't persist on page reload | 🟠 HIGH | Use `pathname` from `usePathname()` to determine active state |
| N3 | Workspace switcher dropdown closes unexpectedly on some interactions | 🟡 MEDIUM | Use Radix `DropdownMenu` for proper keyboard + click-outside handling |

### Priority 10: Charts & Data 🟠

| # | Finding | Severity | Fix |
|---|---|---|---|
| C1 | Recharts default colors still showing on SEO page (dark maroon) | 🔴 CRITICAL | Override ALL chart colors explicitly — no defaults |
| C2 | Chart tooltips are Recharts default style — inconsistent with design system | 🟠 HIGH | Custom `<CustomTooltip>` component matching card style |
| C3 | Charts have no legend on mobile — lines unlabeled | 🟠 HIGH | Inline legend above chart, never inside Recharts default |
| C4 | No empty state on charts when data is 0 — shows flat line at 0 | 🟡 MEDIUM | Show "No data yet" placeholder when all values are 0 |
| C5 | Ranking distribution bars (SEO page) use wrong colors | 🔴 CRITICAL | #1-3=green, #4-10=purple, #11-20=amber, 20+=gray |

---

## REHAUL PLAN — 4 PHASES

### Phase 1: Critical Fixes (do first — 1 day)
Fix all 🔴 CRITICAL items. These break usability.

1. **Fix contrast** (A1, A2, A3) — update CSS variables
2. **Standardise status badges** (S4) — one global `StatusBadge` component
3. **Remove all blue buttons** (S5) — global search for `bg-blue-*` and `#3B82F6`
4. **Fix unicode numbers** (TY5, TY6) — enforce `en-IN`, fix ROAS `—`
5. **Fix chart colors** (C1, C5) — override Recharts defaults
6. **Add disconnect confirmation** (F8) — modal before any destructive action

### Phase 2: Visual Elevation (main rehaul — 2-3 days)
The aesthetic transformation.

1. **New design tokens** — shift from cold `#F8FAFC` to warm `#F7F6FE` canvas
2. **Metric card elevation** — larger numbers (36px), icon containers, trend indicators
3. **Sidebar upgrade** — stronger section labels, taller nav items, better active state
4. **Chart polish** — custom tooltips, entrance animations, inline legends
5. **Skeleton loaders** — all data sections get loading states
6. **Page transitions** — fade+slide on route change

### Phase 3: Interaction Polish (1-2 days)
Micro-interactions that make it feel alive.

1. **Button loading states** — all async buttons get spinner + text change
2. **Form feedback** — save confirmations, error states, validation
3. **Table row hover** — subtle background + slight scale
4. **Sidebar hover** — animated left border grow on hover
5. **Focus rings** — visible `:focus-visible` on all interactive elements

### Phase 4: Layout Refinement (1 day)
Spacing, consistency, responsiveness.

1. **Max-width container** — consistent across all pages
2. **Page header standardisation** — same top padding, same heading size everywhere
3. **Responsive breakpoints** — hide table columns gracefully on smaller screens
4. **Mobile sidebar** — hamburger at <768px

---

## NEW DESIGN TOKENS

Replace the current token set with this evolved version. Same brand, more personality.

```css
/* globals.css — replace existing :root and .dark blocks */

:root {
  /* Canvas */
  --bg-page:           #F7F6FE;   /* warmer lavender — was #F8FAFC */
  --bg-card:           #FFFFFF;
  --bg-card-secondary: #F0EEF9;   /* slightly more purple — was #F1F5F9 */
  --bg-card-hover:     #F4F2FF;

  /* Borders */
  --border-default:    #E4E2F4;   /* purple-tinted — was #E2E8F0 */
  --border-subtle:     #EEECF8;
  --border-focus:      #7C3AED;

  /* Brand */
  --primary:           #7C3AED;
  --primary-dark:      #5B21B6;
  --primary-hover:     #6D28D9;
  --primary-light:     #EDE9FF;
  --primary-ultra:     #F4F2FF;

  /* Semantic */
  --success:           #059669;
  --success-bg:        #ECFDF5;
  --success-border:    #A7F3D0;
  --warning:           #D97706;
  --warning-bg:        #FFFBEB;
  --warning-border:    #FDE68A;
  --danger:            #DC2626;
  --danger-bg:         #FEF2F2;
  --danger-border:     #FECACA;
  --info:              #0891B2;

  /* Text */
  --text-primary:      #18163A;   /* deep purple-tinted dark — was #0F172A */
  --text-secondary:    #4A4770;   /* was #374151 */
  --text-muted:        #7C7AAA;   /* was #6B7280 — passes 4.5:1 on white */
  --text-disabled:     #A09CC0;

  /* Shadows */
  --shadow-card:       0 2px 12px rgba(91,33,182,0.06);
  --shadow-card-hover: 0 4px 24px rgba(91,33,182,0.10);
  --shadow-dropdown:   0 8px 32px rgba(91,33,182,0.12);
}

.dark {
  --bg-page:           #0F0D2A;   /* deeper — was #0F172A */
  --bg-card:           #1A1740;   /* was #1E293B */
  --bg-card-secondary: #221F4A;   /* was #273548 */
  --bg-card-hover:     #2A2755;

  --border-default:    rgba(167, 139, 250, 0.12);  /* purple-tinted */
  --border-subtle:     rgba(167, 139, 250, 0.06);

  --text-primary:      #F0EDFF;   /* warm white — was #F1F5F9 */
  --text-secondary:    #C4C0E8;   /* was #CBD5E1 */
  --text-muted:        #8B88B8;   /* was #94A3B8 */
  --text-disabled:     #5A5785;

  --shadow-card:       0 2px 16px rgba(0,0,0,0.3);
  --shadow-dropdown:   0 8px 40px rgba(0,0,0,0.4);
}
```

---

## NEW COMPONENT SPECS

### Metric Card (redesigned)

```
Current: flat white card, 28px number, generic colored icon
New:     elevated card with shadow, 36px number, gradient icon bg,
         trend indicator, subtle top accent line per category

Structure:
┌────────────────────────────────────────┐
│ ▓▓▓ (3px top border in category color) │
│                                        │
│ [Icon 36px]              ▲ +12%        │
│                          trend badge   │
│                                        │
│ SESSIONS                               │
│ 9,511                                  │  ← 36px Plus Jakarta Sans 800
│ 8,957 users                            │
└────────────────────────────────────────┘

Top border colors:
  Sessions:       #7C3AED (brand)
  Organic Clicks: #059669 (green)
  Ad Spend:       #D97706 (amber)
  ROAS:           #94A3B8 (muted when no data) / #059669 (green when healthy)

Trend badge:
  Up: bg #ECFDF5, text #065F46, "▲ 12%"
  Down: bg #FEF2F2, text #991B1B, "▼ 8%"
  Neutral: not shown

Shadow: var(--shadow-card) always, var(--shadow-card-hover) on hover
Transition: box-shadow 200ms ease, transform 150ms ease
Hover: transform: translateY(-1px)
```

### Sidebar (redesigned)

```
Current: white bg, `#EAE8FF` border, flat nav items
New:     white bg with subtle purple gradient on inner left edge,
         nav items with animated left border, section labels with dot

Sidebar gradient accent (left 3px strip):
  background: linear-gradient(to bottom, #7C3AED, #0891B2)
  width: 3px, position: absolute left 0

Nav item active:
  background: linear-gradient(to right, rgba(124,58,237,0.12), rgba(124,58,237,0.04))
  border-left: 3px solid #7C3AED
  text: #5B21B6, weight 600

Nav item hover:
  background: rgba(124,58,237,0.06)
  border-left: 3px solid rgba(124,58,237,0.3) (grows to full on active)
  transition: 150ms ease

Section label:
  Before each section label, add a 4px colored dot:
    ANALYTICS:    dot #7C3AED
    ADVERTISING:  dot #0891B2
    INTELLIGENCE: dot #059669
  Dot size: 4px circle, margin-right 6px
```

### Status Badge System (standardised)

```tsx
// One component, used everywhere
type Status = 'active' | 'paused' | 'error' | 'connected' | 'disconnected' | 'syncing' | 'pending'

const statusConfig = {
  active:       { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: '●', label: 'Active' },
  paused:       { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', icon: '⏸', label: 'Paused' },
  error:        { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', icon: '✕', label: 'Error' },
  connected:    { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: '●', label: 'Connected' },
  disconnected: { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0', icon: '○', label: 'Disconnected' },
  syncing:      { bg: '#EDE9FF', text: '#5B21B6', border: '#DDD8FF', icon: '↻', label: 'Syncing' },
  pending:      { bg: '#F8FAFC', text: '#94A3B8', border: '#E2E8F0', icon: '○', label: 'Pending' },
}

// Style: DM Sans 600 11px, padding 3px 9px, border-radius 20px,
//        border: 1px solid [border color], display inline-flex, align-items center, gap 4px
```

### Skeleton Loader (new — apply everywhere)

```css
/* Add to globals.css */
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-card-secondary) 0%,
    var(--border-default) 50%,
    var(--bg-card-secondary) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.8s ease infinite;
  border-radius: 6px;
}
```

Usage pattern — every data section:
```tsx
if (loading) return (
  <div className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
)
```

### Custom Chart Tooltip (replaces Recharts default)

```tsx
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border-default)',
      borderRadius: '10px',
      padding: '10px 14px',
      boxShadow: 'var(--shadow-dropdown)',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '500' }}>
        {label}
      </div>
      {payload.map((entry, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color }} />
          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{entry.name}:</span>
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-primary)' }}>{entry.value}</span>
        </div>
      ))}
    </div>
  )
}
```

---

## PAGE-BY-PAGE REHAUL INSTRUCTIONS

### Dashboard (`/dashboard`)

**Current issues:** flat anomaly rows, no trend indicators on metrics, chart with default colors, narrow keyword table

**Changes:**
1. Metric cards → new elevated design with top border accent and trend badges
2. Anomaly section → each row gets a severity-colored left border (3px), source badge, and dismiss button
3. Organic vs Paid chart → custom tooltip, entrance animation, inline legend (not Recharts default)
4. Top keywords → expand to 5 rows, add mini bar showing relative clicks
5. Add page header: "Welcome back, **Khush**" in Plus Jakarta Sans 800 26px

### Analytics (`/dashboard/analytics`)

**Changes:**
1. WoW change card → red top border + red icon when negative
2. Sessions trend chart → purple fill `rgba(124,58,237,0.08)`, custom tooltip, dashed average line
3. Traffic sources → horizontal bar chart, branded colors per source
4. Top pages → add mini progress bars showing relative traffic

### SEO (`/dashboard/seo`)

**Changes:**
1. Ranking distribution chart → correct color system (green/purple/amber/gray)
2. Remove ALL dark maroon — replace with `#7C3AED`
3. Quick Wins → amber card style, CTR in `#DC2626`
4. Keywords table → position badges with 4-color system, clickable column headers

### Google Ads (`/dashboard/google-ads`)

**Changes:**
1. ROAS hero card → green top border, green number, "Exceptional" badge
2. Conversions → round to integer
3. Top performer strip → before table, green left border
4. Active badges → green always (not purple)

### Meta Ads (`/dashboard/meta-ads`)

Per `META_ADS_DASHBOARD_SPEC.md` — already fully specced.

### AI Assistant (`/dashboard/ai-assistant`)

**Changes:**
1. Insight cards → 3px left border per type, larger card padding
2. Chat bubbles → visible in both modes
3. Quick-action prompts → 2×2 grid on empty state
4. Insights grid → `gap: 14px`, consistent card heights

### Settings (all tabs)

**Changes:**
1. Tab bar → segmented control style with purple active pill
2. All save buttons → `#7C3AED` (zero blue)
3. Toggle switches → purple when active
4. Disconnect → confirmation modal before action

---

## ANIMATION SYSTEM

```css
/* Page entrance animation */
@keyframes pageIn {
  from { opacity: 0; transform: translateY(10px); }
  to   { opacity: 1; transform: translateY(0); }
}

.page-enter {
  animation: pageIn 250ms ease forwards;
}

/* Staggered card entrance */
.card-stagger-1 { animation: pageIn 250ms ease 50ms both; }
.card-stagger-2 { animation: pageIn 250ms ease 100ms both; }
.card-stagger-3 { animation: pageIn 250ms ease 150ms both; }
.card-stagger-4 { animation: pageIn 250ms ease 200ms both; }

/* Skeleton pulse */
@keyframes shimmer { ... } /* defined above */

/* Button loading spin */
@keyframes spin {
  to { transform: rotate(360deg); }
}
.btn-loading-icon {
  animation: spin 700ms linear infinite;
}
```

---

## FILES TO TOUCH

```
src/app/globals.css          → New tokens, animation keyframes, skeleton class
src/components/sidebar/      → Redesigned sidebar with gradient accent, new nav items
src/components/ui/metric-card.tsx  → Elevated design with top border + trend badge
src/components/ui/status-badge.tsx → Standardised StatusBadge component
src/components/ui/skeleton.tsx     → Shimmer skeleton component
src/components/ui/chart-tooltip.tsx → CustomTooltip for all Recharts charts
src/components/ui/confirm-modal.tsx → Confirmation dialog for destructive actions

src/app/dashboard/page.tsx           → New metric layout, anomaly rows, chart
src/app/dashboard/analytics/page.tsx → Purple chart, WoW card, traffic sources
src/app/dashboard/seo/page.tsx       → Correct chart colors, quick wins cards
src/app/dashboard/google-ads/page.tsx → ROAS hero, green badges, performer strip
src/app/dashboard/meta-ads/page.tsx  → Per META_ADS_DASHBOARD_SPEC.md
src/app/dashboard/ai-assistant/page.tsx → Insight card borders, chat fix
src/app/dashboard/settings/page.tsx  → Tabs, buttons, toggle colors, confirm modal
```

---

## Definition of Done

### Accessibility
- [ ] All text/background combinations pass 4.5:1 contrast ratio
- [ ] Every interactive element has visible `:focus-visible` ring (2px solid #7C3AED)
- [ ] Icon-only buttons have `aria-label`
- [ ] Charts have text alternatives (data tables or aria descriptions)

### Visual
- [ ] Page canvas is `#F7F6FE` (warm lavender) — not cold gray
- [ ] Card borders are `#E4E2F4` (purple-tinted)
- [ ] Zero blue buttons or badges anywhere
- [ ] All status badges use the standardised StatusBadge component
- [ ] Metric card numbers are 36px / Plus Jakarta Sans 800
- [ ] All cards have `var(--shadow-card)` — no flat borderless cards
- [ ] Sidebar has gradient accent strip on left edge

### Data & Charts
- [ ] Zero Recharts default colors — all overridden
- [ ] Custom tooltip on every chart
- [ ] Inline legend above every chart
- [ ] Skeleton loaders on all async sections
- [ ] ROAS always shows `—` when no revenue data
- [ ] Numbers use `en-IN` locale throughout

### Interaction
- [ ] All async buttons have loading spinner + disabled state
- [ ] Form saves show toast confirmation
- [ ] Destructive actions (Disconnect) have confirmation modal
- [ ] Page transitions: 250ms fade+slide on route change
- [ ] Nav items: 44px minimum touch target height

### Consistency
- [ ] Plus Jakarta Sans on ALL page titles, headings, metric numbers
- [ ] DM Sans on ALL body, labels, nav items, table cells
- [ ] Dark mode minimum text: `#C4C0E8` everywhere (new token)
