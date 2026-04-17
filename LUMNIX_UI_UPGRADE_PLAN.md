# Lumnix — UI Upgrade Plan
**Based on actual app audit — April 15, 2026**
*For Claude Code: Read CLAUDE_CODE_MASTER.md first, then execute this plan page by page*

---

## Audit Summary — What I Actually See

After reviewing every page of the live app, here are the specific issues grouped by severity.

### 🔴 CRITICAL — Fix immediately (breaks brand consistency)

| ID | Page | Issue | What to fix |
|---|---|---|---|
| C1 | Settings > Brand | "Save Brand Settings" button is BLUE (#3b82f6) | Change to `bg-[#FF0066]` |
| C2 | Settings > Security | "Update Password" and "Send Password Reset Email" buttons are BLUE | Change all to `#FF0066` |
| C3 | Settings > Brand | Brand color picker shows #3b82f6 as selected/default | The default brand color should be `#FF0066`, not blue |
| C4 | Reports | "Generate & Download" full-width button is BLUE | Change to `#FF0066` |
| C5 | Dashboard | AI Anomalies shows 13 items all at once — overwhelming and repetitive | Collapse to 3 visible + "Show 10 more" |
| C6 | Meta Ads | 24 campaigns at ₹0 spend listed one by one — unreadable clutter | Collapse zero-spend rows behind "Show 24 inactive campaigns ↓" |

### 🟠 HIGH — Visual hierarchy and readability

| ID | Page | Issue | What to fix |
|---|---|---|---|
| H1 | Dashboard | Metric cards show "0" in 28px — the number "zero" communicates nothing at this size. Needs visual differentiation for zero vs actual data | Add muted color + "No data yet" sub-label when value is 0 |
| H2 | Dashboard | AI Anomalies: all 13 are "WARNING" with near-identical text — no hierarchy | Group by severity: Critical first, then Warning, then Info |
| H3 | Dashboard | "Quick win opportunities will appear here when data is available" empty state is a bare italic line in the middle of a white card | Replace with proper empty state: icon + title + description |
| H4 | Analytics | Sessions Trend chart has barely any data (30 sessions) — flat line doesn't communicate growth well | Add avg reference line + annotate the trend direction clearly |
| H5 | Analytics | Traffic Sources bar chart uses generic gray for both "(direct)" and "(none)" bars — no color differentiation | Apply distinct colors: Google=#FF0066, direct=#00D4AA, organic=#059669, none=#94A3B8 |
| H6 | SEO | Ranking Distribution bars look correct (green for #1-3) but the `#4-10` bar is missing — shows 0 but still renders space | Show a "0" placeholder bar with a light fill when count is zero |
| H7 | SEO | "No quick wins found — your CTRs look healthy!" empty state is just text. Positive feedback deserves a better visual treatment | Green success state with checkmark icon |
| H8 | AI Assistant > Insights | Cards look good but the "action" text at bottom (purple italic) is too small and easily missed | Make action text 13px, add arrow icon, increase contrast |
| H9 | Alerts | Only 1 warning shown, Wins tab is empty — the page feels empty and abandoned | Improve empty state for Wins: icon + "No wins detected yet — keep syncing data" |
| H10 | Reports | Report type selector cards are plain text rows — no visual differentiation between report types | Add category icon (larger), description in muted text, and section chips as tags not bullet points |

### 🟡 MEDIUM — Polish and consistency

| ID | Page | Issue | What to fix |
|---|---|---|---|
| M1 | All pages | Section labels in sidebar (ANALYTICS, ADVERTISING, INTELLIGENCE) render correctly but the section dot colors don't match the design spec | ANALYTICS=`#FF0066`, ADVERTISING=`#00D4AA`, INTELLIGENCE=`#059669` |
| M2 | Dashboard | "Data Sources" section shows 3 sources with green dots and timestamps — compact and useful but visual style is too plain | Add source logo color circles, show "Healthy" vs "Stale" status more clearly |
| M3 | Dashboard | "Cross-Channel" section just says "Connect 1 more source for deeper cross-channel insights" with no visual interest | Add a subtle illustrated state showing what cross-channel looks like when active |
| M4 | Dashboard | "AI Insights" section at the bottom uses red dot (●) for all items — the dot color should match insight severity | Red=WARNING, Amber=OPPORTUNITY, Purple=TIP |
| M5 | Meta Ads | Account switcher dropdown (Vippy Soya / Khush Mutha) is styled correctly but the dropdown shadow and border need the purple-tinted border style | Border: `#E4E2F4`, shadow: `0 8px 32px rgba(91,33,182,0.12)` |
| M6 | Billing | Plan cards look correct but the "Included" button on Free/Starter/Growth plans is extremely low contrast (near-white on white) | Change "Included" to a muted text label, not a button |
| M7 | Billing | The "Current Plan" button on Agency card is disabled gray — hard to distinguish from normal state | Add "✓ Current Plan" with a green checkmark |
| M8 | Settings > General | "Save Workspace Name" button style is purple but washed out (looks like opacity 0.6) | Ensure full `#FF0066` opacity on Save buttons |
| M9 | AI Assistant > Chat | Empty state shows "What can I help you with?" with 4 prompt chips — chips look OK but feel small | Make prompt chips 44px height minimum, add icon left of each chip |
| M10 | AI Assistant > Chat | "AI has access to: META ADS · GA4 · GSC" info bar at top is visually disconnected | Style as colored pills per source (Meta=blue, GA4=orange, GSC=green) |

---

## Page-by-Page Fix Instructions

### PAGE 1: Dashboard (`/dashboard/page.tsx`)

**Issue 1: Metric cards showing zero data**

When a metric value is 0 or "—", the card should communicate this differently:

```tsx
// Current: shows "0" in large black number — confusing
// Fix: muted color + helpful sub-text when zero

const MetricCard = ({ value, label, sub, ...props }) => {
  const isEmpty = value === 0 || value === '—' || value === null
  
  return (
    <div className="metric-card">
      {/* existing top border */}
      <div className="metric-label">{label}</div>
      <div className={`metric-value ${isEmpty ? 'text-[#A09CC0]' : 'text-[#18163A]'}`}>
        {isEmpty ? '—' : formatValue(value)}
      </div>
      <div className="metric-sub">
        {isEmpty ? 'No data yet' : sub}
      </div>
    </div>
  )
}
```

**Issue 2: AI Anomalies — collapse and prioritise**

The section currently shows ALL 13 anomalies stacked. Fix:

```tsx
// Show only first 3 by default
// Group: Critical (red) first → Warning (amber) → Info (blue)
// "Show 10 more →" button at bottom

const [expanded, setExpanded] = useState(false)
const visibleAnomalies = expanded ? anomalies : anomalies.slice(0, 3)

// Each row: left border color = severity color
// ● CRITICAL = 3px solid #DC2626
// ● WARNING  = 3px solid #F59E0B
// ● INFO     = 3px solid #00D4AA
```

**Issue 3: AI Insights section at bottom — semantic dot colors**

```tsx
// Map insight type to dot color:
const dotColor = {
  'WARNING': '#DC2626',
  'OPPORTUNITY': '#F59E0B', 
  'TIP': '#FF0066',
  'WIN': '#059669',
}

// Replace the single red dot with: <div style={{ background: dotColor[insight.type] }} />
```

**Issue 4: Empty state for Quick Win Opportunities**

```tsx
// Replace:
<p className="text-center text-muted italic">Quick win opportunities will appear here...</p>

// With:
<div className="empty-state">
  <div className="empty-icon">⚡</div>
  <h3>No quick wins yet</h3>
  <p>Quick wins appear when a keyword ranks on page 1 but has a low CTR. Connect GSC and sync data to see them.</p>
  <Button variant="primary" size="sm">Sync GSC data</Button>
</div>
```

**Issue 5: Data Sources section — improve visual status**

```tsx
// Replace plain text row with: source logo color + name + status badge + timestamp

const SOURCE_COLORS = {
  'Google Search Console': '#34A853',
  'Meta Ads': '#1877F2', 
  'Google Analytics': '#E37400',
  'Google Ads': '#4285F4',
}

// Each source row:
// [● Colored circle 10px] [Source name] [StatusBadge status="connected"] [timestamp muted]
```

---

### PAGE 2: Analytics (`/dashboard/analytics/page.tsx`)

**Issue 1: Traffic Sources bar chart — differentiate colors**

```tsx
// Current: all bars are gray/same color
// Fix: map source names to brand colors

const sourceColors = {
  '(direct)': '#00D4AA',
  'google': '#FF0066',
  'organic': '#059669',
  '(none)': '#94A3B8',
  'referral': '#F59E0B',
}

// In the Recharts BarChart, use a custom Cell per bar:
<Bar dataKey="sessions">
  {data.map((entry, i) => (
    <Cell key={i} fill={sourceColors[entry.source] || '#94A3B8'} />
  ))}
</Bar>
```

**Issue 2: WoW card — make positive change feel positive**

```tsx
// Current: "+31%" text on pale green bg looks decent but the card feels lightweight
// Fix: add the value in large type, with directional context

// WoW card when positive:
// - 3px solid #059669 left border
// - bg: rgba(5,150,105,0.04)
// - Large "▲ 31%" in #059669 Plus Jakarta Sans 800 32px
// - Sub: "Traffic growing week-over-week"
// - Small sparkline or up arrow decoration

// WoW card when negative:
// - 3px solid #DC2626 left border  
// - bg: rgba(220,38,38,0.04)
// - "▼ X%" in #DC2626
```

**Issue 3: Sessions Trend chart — add visual reference lines**

```tsx
// Add to Recharts chart:
<ReferenceLine 
  y={avgSessions} 
  stroke="#A09CC0" 
  strokeDasharray="4 3" 
  label={{ value: 'Avg', position: 'right', fill: '#A09CC0', fontSize: 11 }}
/>
```

---

### PAGE 3: SEO Intelligence (`/dashboard/seo/page.tsx`)

**Issue 1: Ranking Distribution — missing visual for empty buckets**

```tsx
// When a bucket has 0 keywords, show a minimal placeholder bar (height: 4px, color: #E4E2F4)
// with the count "0" above it in muted gray

// Current: #4-10 shows no bar at all
// Fix: always render all 4 buckets, use muted fill for empty ones
const barFill = count === 0 ? '#E4E2F4' : bucketColors[bucket]
const barHeight = count === 0 ? 4 : `${(count / maxCount) * 100}%`
```

**Issue 2: Quick Wins empty state — celebrate when CTRs are healthy**

```tsx
// Current: "No quick wins found — your CTRs look healthy!" as plain text
// Fix: proper success state

<div className="success-state">
  <div style={{ 
    width: 48, height: 48, 
    background: '#ECFDF5', 
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 12px' 
  }}>
    <svg>// checkmark icon</svg>
  </div>
  <h3 style={{ color: '#065F46', fontWeight: 700 }}>CTRs look healthy!</h3>
  <p style={{ color: '#6B7280' }}>No keywords are in position 4-10 with low CTR. Keep it up.</p>
</div>
```

---

### PAGE 4: Meta Ads (`/dashboard/meta-ads/page.tsx`)

**Issue 1: Zero-spend campaign clutter — this is the biggest data readability problem**

The campaign table has 1 active campaign (₹4,516 spend) and 24 inactive ones (₹0 spend). The inactive ones clutter the table completely.

```tsx
// Split campaigns into: active (spend > 0) and inactive (spend === 0)
const activeCampaigns = campaigns.filter(c => c.spend > 0)
const inactiveCampaigns = campaigns.filter(c => c.spend === 0)

const [showInactive, setShowInactive] = useState(false)

// Render:
// 1. Table header
// 2. Active campaigns rows (normal styling)
// 3. If activeCampaigns.length === 0: empty state
// 4. Divider row: "── 24 inactive campaigns (₹0 spend) ──"
//    with a toggle button "Show all ↓" / "Hide ↑"
// 5. Only show inactive rows when showInactive === true

// The divider row:
<tr>
  <td colSpan={8}>
    <button 
      onClick={() => setShowInactive(!showInactive)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '10px 0',
        fontSize: 12, color: '#A09CC0',
        background: 'none', border: 'none', cursor: 'pointer',
      }}
    >
      <div style={{ flex: 1, height: 1, background: '#E4E2F4' }} />
      <span>{showInactive ? '↑ Hide' : '↓ Show'} {inactiveCampaigns.length} inactive campaigns (₹0 spend)</span>
      <div style={{ flex: 1, height: 1, background: '#E4E2F4' }} />
    </button>
  </td>
</tr>
```

**Issue 2: Top performer callout**

When one campaign drives all the spend/clicks (like "20 Jan Carousel Campaign"), highlight it:

```tsx
// Before the table, when 1 campaign has >90% of total spend:
<div style={{
  background: 'rgba(5,150,105,0.04)',
  border: '1px solid #A7F3D0',
  borderLeft: '3px solid #059669',
  borderRadius: '0 10px 10px 0',
  padding: '12px 16px',
  marginBottom: 12,
  display: 'flex', alignItems: 'center', gap: 12,
}}>
  <span style={{ fontSize: 13, fontWeight: 600, color: '#065F46' }}>
    ⭐ Top performer: "20 Jan Carousel Campaign"
  </span>
  <span style={{ fontSize: 12, color: '#6B7280' }}>
    ₹4,516 spend · 3,20,730 impressions · 3.97% CTR
  </span>
</div>
```

---

### PAGE 5: AI Assistant (`/dashboard/ai-assistant/page.tsx`)

**Issue 1: Insight cards — action text visibility**

The purple italic action text at bottom of each insight card is too small (looks ~12px). These are the most actionable parts of the UI.

```tsx
// Current: small italic purple text
// Fix: styled action block at bottom of each card

<div style={{
  borderTop: `1px solid ${T.border}`,
  marginTop: 12,
  paddingTop: 10,
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
}}>
  <svg // arrow-right icon, 14px, color matches card type />
  <span style={{
    fontSize: 13,
    fontWeight: 500,
    color: cardTypeColor,
    lineHeight: 1.5,
  }}>
    {insight.action}
  </span>
</div>
```

**Issue 2: Chat empty state — prompt chip sizing**

```tsx
// Current: chips are ~40px height and feel small on desktop
// Fix: increase to 48px min-height, add left icon

<button style={{
  minHeight: 48,
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  border: '1px solid #E4E2F4',
  borderRadius: 12,
  cursor: 'pointer',
  fontSize: 13,
  fontWeight: 500,
  color: '#18163A',
  textAlign: 'left',
  background: '#fff',
  transition: 'all 150ms',
}}>
  <span style={{ fontSize: 18 }}>{promptIcon}</span>
  {promptText}
</button>
```

**Issue 3: Data sources info bar**

```tsx
// Current: "AI has access to: META ADS · GA4 · GSC" plain text bar
// Fix: colored source pills per source

const sources = [
  { name: 'META ADS', color: '#1877F2', bg: '#EFF6FF' },
  { name: 'GA4', color: '#E37400', bg: '#FFF7ED' },
  { name: 'GSC', color: '#34A853', bg: '#F0FDF4' },
]

// Each pill: bg + text color + 6px dot + name
```

---

### PAGE 6: Alerts (`/dashboard/alerts/page.tsx`)

**Issue 1: Wins tab empty state**

```tsx
// Current: empty white area
// Fix:

<div style={{ textAlign: 'center', padding: '60px 40px' }}>
  <div style={{ 
    width: 56, height: 56,
    background: '#ECFDF5',
    borderRadius: '50%',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    margin: '0 auto 16px',
    fontSize: 24,
  }}>
    🏆
  </div>
  <h3 style={{ fontFamily: 'Plus Jakarta Sans', fontSize: 17, fontWeight: 700, color: '#18163A', marginBottom: 8 }}>
    No wins detected yet
  </h3>
  <p style={{ fontSize: 14, color: '#7C7AAA', maxWidth: 320, margin: '0 auto' }}>
    Wins appear when Lumi detects positive signals — ranking improvements, traffic spikes, or campaigns beating their benchmarks.
  </p>
</div>
```

**Issue 2: Single warning alert visual treatment**

The one alert showing ("Average keyword position is below page 2") looks too plain. Apply the same anomaly row treatment as Dashboard:

```tsx
// Warning alert card:
// bg: #FFFBEB (amber-50)
// border: 1px solid #FDE68A
// border-left: 3px solid #F59E0B
// border-radius: 0 10px 10px 0

// Source badge: "GSC" pill in green
// Dismiss button: ✕ top-right
```

---

### PAGE 7: Reports (`/dashboard/reports/page.tsx`)

**Issue 1: CRITICAL — Blue CTA button**

```tsx
// Current: "Generate & Download (4 sections)" is a full-width BLUE button
// This is the worst blue button violation in the app

// Fix:
<button style={{
  width: '100%',
  background: '#FF0066',  // NOT BLUE
  color: '#fff',
  padding: '14px 24px',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 600,
  fontFamily: "'DM Sans', sans-serif",
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
}}>
  <svg // download icon />
  Generate & Download (4 sections)
</button>
```

**Issue 2: Report type selector — improve visual hierarchy**

```tsx
// Current: each report type is a plain card with text rows
// Fix: add visual weight to distinguish report complexity

// SEO Performance Report card:
// Left: large magnifying glass icon (36px, bg #EDE9FF)
// Right: title + description + section chips as colored tags

// Section tags instead of dot + text:
<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
  {sections.map(s => (
    <span style={{
      fontSize: 11,
      fontWeight: 600,
      color: '#5B21B6',
      background: '#EDE9FF',
      padding: '3px 8px',
      borderRadius: 6,
    }}>
      {s}
    </span>
  ))}
</div>
```

---

### PAGE 8: Billing (`/dashboard/billing/page.tsx`)

**Issue 1: "Included" buttons are barely visible**

```tsx
// Current: "Included" as a near-invisible disabled button
// Fix: replace with a text label

// Instead of:
<Button disabled>Included</Button>

// Use:
<div style={{
  width: '100%',
  textAlign: 'center',
  padding: '10px 0',
  fontSize: 13,
  fontWeight: 500,
  color: '#A09CC0',
  borderTop: '1px solid #E4E2F4',
  marginTop: 12,
}}>
  ✓ Your current access
</div>
```

**Issue 2: "Current Plan" button on Agency tier**

```tsx
// Current: disabled gray button — looks broken
// Fix: green "Current Plan" indicator

<div style={{
  width: '100%',
  textAlign: 'center',
  padding: '11px 0',
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 600,
  color: '#065F46',
  background: '#ECFDF5',
  border: '1px solid #A7F3D0',
}}>
  ✓ Current Plan
</div>
```

---

### PAGE 9: Settings (`/dashboard/settings/page.tsx`)

**Issue 1: ALL blue buttons — fix every one**

Global search across all settings tab components:
```
Find: bg-blue-600, bg-blue-500, #3b82f6, #2563eb, bg-[#3b82f6]
Replace with: bg-[#FF0066] or style={{ background: '#FF0066' }}
```

Specific buttons to fix:
- Settings > General: "Save Workspace Name" → already purple but check opacity
- Settings > Security: "Update Password" → change from blue to `#FF0066`
- Settings > Security: "Send Password Reset Email" → change from blue to outline style with `#FF0066` border
- Settings > Brand: "Save Brand Settings" → change from blue to `#FF0066`
- Settings > Brand: default brand color should be `#FF0066` not `#3b82f6`

**Issue 2: Brand color picker default**

```tsx
// In the Brand settings component, find the default/initial color value
// Change from: '#3b82f6' (or 'blue' or any hex blue)
// To: '#FF0066'

// The color swatches also include a blue one — that's fine to keep as an option
// But the SELECTED state should default to purple
```

**Issue 3: Tab active state**

Looking at the screenshots, the active tab (General, Security, Brand) uses a purple pill — this is correct. But on the Brand tab screenshot, the "Save Brand Settings" button at the bottom is clearly blue. This is the most visible bug.

---

## GLOBAL FIXES (apply across all pages)

### Fix 1: Number formatting across all metric displays

```typescript
// Add to lib/format.ts or lib/utils.ts

export const formatINR = (value: number) => {
  if (value === 0) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export const formatNumber = (value: number) => {
  if (value === 0) return '—'
  return new Intl.NumberFormat('en-IN').format(value)
}

export const formatROAS = (value: number | null) => {
  if (!value || value === 0) return '—'
  return `${value.toFixed(1)}x`
}
```

### Fix 2: StatusBadge component — one component for all pages

```tsx
// src/components/ui/status-badge.tsx
// Use this EVERYWHERE — not inline styles scattered across pages

type StatusBadgeProps = {
  status: 'active' | 'paused' | 'error' | 'connected' | 'disconnected' | 'syncing' | 'warning' | 'stale'
}

const config = {
  active:       { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: '●', label: 'Active' },
  connected:    { bg: '#ECFDF5', text: '#065F46', border: '#A7F3D0', icon: '●', label: 'Connected' },
  paused:       { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', icon: '⏸', label: 'Paused' },
  warning:      { bg: '#FFFBEB', text: '#92400E', border: '#FDE68A', icon: '⚠', label: 'Warning' },
  stale:        { bg: '#FFF7ED', text: '#9A3412', border: '#FED7AA', icon: '●', label: 'Stale' },
  error:        { bg: '#FEF2F2', text: '#991B1B', border: '#FECACA', icon: '✕', label: 'Error' },
  disconnected: { bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0', icon: '○', label: 'Disconnected' },
  syncing:      { bg: '#EDE9FF', text: '#5B21B6', border: '#DDD8FF', icon: '↻', label: 'Syncing' },
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const c = config[status]
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, fontWeight: 600,
      color: c.text, background: c.bg,
      border: `1px solid ${c.border}`,
      padding: '3px 9px', borderRadius: 20,
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {c.icon} {c.label}
    </span>
  )
}
```

### Fix 3: Empty state component

```tsx
// src/components/ui/empty-state.tsx
// Use this for all empty sections instead of bare italic text

type EmptyStateProps = {
  icon: string        // emoji or component
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  variant?: 'default' | 'success' | 'warning'
}

export function EmptyState({ icon, title, description, action, variant = 'default' }: EmptyStateProps) {
  const bgColor = {
    default: '#EDE9FF',
    success: '#ECFDF5',
    warning: '#FFFBEB',
  }[variant]

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', textAlign: 'center',
      minHeight: 180,
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: bgColor,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 24, marginBottom: 16,
      }}>
        {icon}
      </div>
      <h3 style={{
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        fontSize: 16, fontWeight: 700,
        color: '#18163A', marginBottom: 8,
      }}>
        {title}
      </h3>
      <p style={{
        fontSize: 13, color: '#7C7AAA',
        maxWidth: 320, lineHeight: 1.6,
        marginBottom: action ? 20 : 0,
      }}>
        {description}
      </p>
      {action && (
        <button style={{
          background: '#FF0066', color: '#fff',
          border: 'none', borderRadius: 9,
          padding: '10px 20px',
          fontSize: 13, fontWeight: 600,
          fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer',
        }}
        onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
```

### Fix 4: Page header — standardise across all pages

```tsx
// src/components/layout/page-header.tsx
// Every page should use this component for the title area

type PageHeaderProps = {
  icon: React.ReactNode
  iconBg?: string
  title: string
  description: string
  badge?: string
  action?: React.ReactNode
}

export function PageHeader({ icon, iconBg = '#EDE9FF', title, description, badge, action }: PageHeaderProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 44, height: 44,
          background: iconBg,
          borderRadius: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 22, fontWeight: 800,
              color: '#18163A', letterSpacing: '-0.02em',
            }}>
              {title}
            </h1>
            {badge && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: '#5B21B6', background: '#EDE9FF',
                padding: '3px 8px', borderRadius: 20,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {badge}
              </span>
            )}
          </div>
          <p style={{ fontSize: 13, color: '#7C7AAA', marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>
            {description}
          </p>
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  )
}
```

---

## Execution Order for Claude Code

Execute in this exact order to avoid breaking changes:

### Phase 1: Critical bug fixes (1 session, ~45 mins)
1. Fix ALL blue buttons across all settings tabs → `#FF0066`
2. Fix brand color default from `#3b82f6` to `#FF0066`
3. Fix Reports "Generate & Download" button → `#FF0066`
4. Fix Billing "Included" text and "Current Plan" states

### Phase 2: Data readability (1 session, ~90 mins)
1. Build `StatusBadge` component → replace all inline status styles
2. Build `EmptyState` component → replace all bare italic empty messages
3. Meta Ads: collapse zero-spend campaigns behind toggle
4. Dashboard: collapse AI Anomalies to 3 visible + "Show more"
5. Dashboard: zero-value metric cards → muted treatment

### Phase 3: Chart & visualization polish (1 session, ~60 mins)
1. Traffic Sources chart: apply distinct colors per source type
2. Sessions Trend: add average reference line
3. SEO Ranking Distribution: always render all 4 buckets
4. AI Insights: fix action text styling at bottom of insight cards

### Phase 4: Component standardisation (1 session, ~45 mins)
1. Build `PageHeader` component → roll out to all pages
2. Alerts page: proper empty states for Wins and Critical tabs
3. Reports: section chips as colored tags
4. AI Chat: source pills, larger prompt chips
5. Dashboard: Data Sources section visual upgrade

---

## Files to Touch

```
src/components/ui/status-badge.tsx          (CREATE NEW)
src/components/ui/empty-state.tsx           (CREATE NEW)
src/components/layout/page-header.tsx       (CREATE NEW)
src/lib/format.ts                           (UPDATE — add formatINR, formatNumber, formatROAS)

src/app/dashboard/page.tsx                  (anomalies collapse, metric zeros, AI insights dots)
src/app/dashboard/analytics/page.tsx        (traffic source colors, WoW card, reference line)
src/app/dashboard/seo/page.tsx              (ranking bars, quick wins empty state)
src/app/dashboard/meta-ads/page.tsx         (zero-spend collapse, top performer strip)
src/app/dashboard/ai-assistant/page.tsx     (action text, chat chips, source pills)
src/app/dashboard/alerts/page.tsx           (empty states, alert card styling)
src/app/dashboard/reports/page.tsx          (blue button fix, section chips)
src/app/dashboard/billing/page.tsx          (included text, current plan badge)
src/app/dashboard/settings/
  general/page.tsx                          (button color check)
  security/page.tsx                         (blue → purple buttons)
  brand/page.tsx                            (blue → purple, default color fix)
```

---

## What NOT to Touch

- Never modify API routes or Supabase queries
- Never change the sidebar structure (it's correct)
- Never touch authentication flows
- Never modify the ROAS "—" logic (it's already correct)
- Don't change chart data fetching — only visual presentation
- Don't change the table column structure — only add/hide rows
