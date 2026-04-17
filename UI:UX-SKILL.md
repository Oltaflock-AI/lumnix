---
name: ui-ux-pro-max
description: UI/UX design intelligence for web and mobile. Includes 50+ styles, 161 color palettes, 57 font pairings, 161 product types, 99 UX guidelines, and 25 chart types across 10 stacks (React, Next.js, Vue, Svelte, SwiftUI, React Native, Flutter, Tailwind, shadcn/ui, and HTML/CSS). Actions: plan, build, create, design, implement, review, fix, improve, optimize, enhance, refactor, and check UI/UX code. Projects: website, landing page, dashboard, admin panel, e-commerce, SaaS, portfolio, blog, and mobile app. Elements: button, modal, navbar, sidebar, card, table, form, and chart. Styles: glassmorphism, claymorphism, minimalism, brutalism, neumorphism, bento grid, dark mode, responsive, skeuomorphism, and flat design. Topics: color systems, accessibility, animation, layout, typography, font pairing, spacing, interaction states, shadow, and gradient. Integrations: shadcn/ui MCP for component search and examples.
---

# UI/UX Pro Max - Design Intelligence

Comprehensive design guide for web and mobile applications. Contains 50+ styles, 161 color palettes, 57 font pairings, 161 product types with reasoning rules, 99 UX guidelines, and 25 chart types across 10 technology stacks. Searchable database with priority-based recommendations.

## When to Apply

This Skill should be used when the task involves **UI structure, visual design decisions, interaction patterns, or user experience quality control**.

### Must Use

* Designing new pages (Landing Page, Dashboard, Admin, SaaS, Mobile App)
* Creating or refactoring UI components (buttons, modals, forms, tables, charts, etc.)
* Choosing color schemes, typography systems, spacing standards, or layout systems
* Reviewing UI code for user experience, accessibility, or visual consistency
* Implementing navigation structures, animations, or responsive behavior
* Making product-level design decisions (style, information hierarchy, brand expression)
* Improving perceived quality, clarity, or usability of interfaces

### Recommended

* UI looks "not professional enough" but the reason is unclear
* Receiving feedback on usability or experience
* Pre-launch UI quality optimization
* Aligning cross-platform design (Web / iOS / Android)
* Building design systems or reusable component libraries

### Skip

* Pure backend logic development
* Only involving API or database design
* Performance optimization unrelated to the interface
* Infrastructure or DevOps work
* Non-visual scripts or automation tasks

**Decision criteria**: If the task will change how a feature **looks, feels, moves, or is interacted with**, this Skill should be used.

---

## Rule Categories by Priority

| Priority | Category | Impact | Key Checks (Must Have) | Anti-Patterns (Avoid) |
| --- | --- | --- | --- | --- |
| 1 | Accessibility | CRITICAL | Contrast 4.5:1, Alt text, Keyboard nav, Aria-labels | Removing focus rings, Icon-only buttons without labels |
| 2 | Touch & Interaction | CRITICAL | Min size 44×44px, 8px+ spacing, Loading feedback | Reliance on hover only, Instant state changes (0ms) |
| 3 | Performance | HIGH | WebP/AVIF, Lazy loading, Reserve space (CLS < 0.1) | Layout thrashing, Cumulative Layout Shift |
| 4 | Style Selection | HIGH | Match product type, Consistency, SVG icons (no emoji) | Mixing flat & skeuomorphic randomly, Emoji as icons |
| 5 | Layout & Responsive | HIGH | Mobile-first breakpoints, Viewport meta, No horizontal scroll | Horizontal scroll, Fixed px container widths, Disable zoom |
| 6 | Typography & Color | MEDIUM | Base 16px, Line-height 1.5, Semantic color tokens | Text < 12px body, Gray-on-gray, Raw hex in components |
| 7 | Animation | MEDIUM | Duration 150–300ms, Motion conveys meaning, Spatial continuity | Decorative-only animation, Animating width/height, No reduced-motion |
| 8 | Forms & Feedback | MEDIUM | Visible labels, Error near field, Helper text, Progressive disclosure | Placeholder-only label, Errors only at top, Overwhelm upfront |
| 9 | Navigation Patterns | HIGH | Predictable back, Bottom nav ≤5, Deep linking | Overloaded nav, Broken back behavior, No deep links |
| 10 | Charts & Data | LOW | Legends, Tooltips, Accessible colors | Relying on color alone to convey meaning |

---

## Quick Reference

### 1. Accessibility (CRITICAL)

* `color-contrast` — Minimum 4.5:1 ratio for normal text (large text 3:1)
* `focus-states` — Visible focus rings on interactive elements (2–4px)
* `alt-text` — Descriptive alt text for meaningful images
* `aria-labels` — aria-label for icon-only buttons
* `keyboard-nav` — Tab order matches visual order; full keyboard support
* `form-labels` — Use label with for attribute
* `skip-links` — Skip to main content for keyboard users
* `heading-hierarchy` — Sequential h1→h6, no level skip
* `color-not-only` — Don't convey info by color alone (add icon/text)
* `dynamic-type` — Support system text scaling; avoid truncation as text grows
* `reduced-motion` — Respect prefers-reduced-motion; reduce/disable animations when requested
* `voiceover-sr` — Meaningful accessibilityLabel/accessibilityHint; logical reading order
* `escape-routes` — Provide cancel/back in modals and multi-step flows
* `keyboard-shortcuts` — Preserve system and a11y shortcuts

### 2. Touch & Interaction (CRITICAL)

* `touch-target-size` — Min 44×44pt (Apple) / 48×48dp (Material); extend hit area beyond visual bounds if needed
* `touch-spacing` — Minimum 8px/8dp gap between touch targets
* `hover-vs-tap` — Use click/tap for primary interactions; don't rely on hover alone
* `loading-buttons` — Disable button during async operations; show spinner or progress
* `error-feedback` — Clear error messages near problem
* `cursor-pointer` — Add cursor-pointer to clickable elements (Web)
* `gesture-conflicts` — Avoid horizontal swipe on main content; prefer vertical scroll
* `tap-delay` — Use touch-action: manipulation to reduce 300ms delay (Web)
* `press-feedback` — Visual feedback on press (ripple/highlight)
* `haptic-feedback` — Use haptic for confirmations and important actions; avoid overuse
* `safe-area-awareness` — Keep primary touch targets away from notch, Dynamic Island, gesture bar and screen edges

### 3. Performance (HIGH)

* `image-optimization` — Use WebP/AVIF, responsive images (srcset/sizes), lazy load non-critical assets
* `image-dimension` — Declare width/height or use aspect-ratio to prevent layout shift (CLS)
* `font-loading` — Use font-display: swap/optional to avoid invisible text (FOIT)
* `font-preload` — Preload only critical fonts
* `critical-css` — Prioritize above-the-fold CSS
* `lazy-loading` — Lazy load non-hero components via dynamic import / route-level splitting
* `bundle-splitting` — Split code by route/feature to reduce initial load and TTI
* `reduce-reflows` — Avoid frequent layout reads/writes; batch DOM reads then writes
* `content-jumping` — Reserve space for async content to avoid layout jumps
* `virtualize-lists` — Virtualize lists with 50+ items
* `progressive-loading` — Use skeleton screens / shimmer instead of long blocking spinners for >1s operations
* `debounce-throttle` — Use debounce/throttle for high-frequency events (scroll, resize, input)

### 4. Style Selection (HIGH)

* `style-match` — Match style to product type
* `consistency` — Use same style across all pages
* `no-emoji-icons` — Use SVG icons (Heroicons, Lucide), not emojis
* `color-palette-from-product` — Choose palette from product/industry
* `effects-match-style` — Shadows, blur, radius aligned with chosen style
* `platform-adaptive` — Respect platform idioms (iOS HIG vs Material)
* `state-clarity` — Make hover/pressed/disabled states visually distinct
* `elevation-consistent` — Use a consistent elevation/shadow scale for cards, sheets, modals
* `dark-mode-pairing` — Design light/dark variants together
* `icon-style-consistent` — Use one icon set/visual language across the product
* `primary-action` — Each screen should have only one primary CTA

### 5. Layout & Responsive (HIGH)

* `viewport-meta` — width=device-width initial-scale=1 (never disable zoom)
* `mobile-first` — Design mobile-first, then scale up
* `breakpoint-consistency` — Use systematic breakpoints (375 / 768 / 1024 / 1440)
* `readable-font-size` — Minimum 16px body text on mobile
* `line-length-control` — Mobile 35–60 chars per line; desktop 60–75 chars
* `horizontal-scroll` — No horizontal scroll on mobile
* `spacing-scale` — Use 4pt/8dp incremental spacing system
* `container-width` — Consistent max-width on desktop (max-w-6xl / 7xl)
* `z-index-management` — Define layered z-index scale (0 / 10 / 20 / 40 / 100 / 1000)
* `scroll-behavior` — Avoid nested scroll regions
* `visual-hierarchy` — Establish hierarchy via size, spacing, contrast — not color alone

### 6. Typography & Color (MEDIUM)

* `line-height` — Use 1.5-1.75 for body text
* `line-length` — Limit to 65-75 characters per line
* `font-pairing` — Match heading/body font personalities
* `font-scale` — Consistent type scale (e.g. 12 14 16 18 24 32)
* `contrast-readability` — Darker text on light backgrounds
* `weight-hierarchy` — Bold headings (600–700), Regular body (400), Medium labels (500)
* `color-semantic` — Define semantic color tokens (primary, secondary, error, surface) not raw hex
* `color-dark-mode` — Dark mode uses desaturated / lighter tonal variants, not inverted colors
* `color-accessible-pairs` — Foreground/background pairs must meet 4.5:1 (AA) or 7:1 (AAA)
* `number-tabular` — Use tabular figures for data columns, prices, and timers
* `whitespace-balance` — Use whitespace intentionally to group related items

### 7. Animation (MEDIUM)

* `duration-timing` — Use 150–300ms for micro-interactions; complex transitions ≤400ms
* `transform-performance` — Use transform/opacity only; avoid animating width/height/top/left
* `loading-states` — Show skeleton or progress indicator when loading exceeds 300ms
* `excessive-motion` — Animate 1-2 key elements per view max
* `easing` — Use ease-out for entering, ease-in for exiting
* `motion-meaning` — Every animation must express a cause-effect relationship
* `state-transition` — State changes should animate smoothly, not snap
* `spring-physics` — Prefer spring/physics-based curves over linear for natural feel
* `exit-faster-than-enter` — Exit animations shorter than enter (~60–70% of enter duration)
* `stagger-sequence` — Stagger list/grid item entrance by 30–50ms per item
* `interruptible` — Animations must be interruptible by user tap/gesture
* `scale-feedback` — Subtle scale (0.95–1.05) on press for tappable cards/buttons

### 8. Forms & Feedback (MEDIUM)

* `input-labels` — Visible label per input (not placeholder-only)
* `error-placement` — Show error below the related field
* `submit-feedback` — Loading then success/error state on submit
* `required-indicators` — Mark required fields (e.g. asterisk)
* `empty-states` — Helpful message and action when no content
* `toast-dismiss` — Auto-dismiss toasts in 3-5s
* `confirmation-dialogs` — Confirm before destructive actions
* `input-helper-text` — Provide persistent helper text below complex inputs
* `disabled-states` — Disabled elements use reduced opacity (0.38–0.5) + cursor change
* `progressive-disclosure` — Reveal complex options progressively
* `inline-validation` — Validate on blur (not keystroke)
* `password-toggle` — Provide show/hide toggle for password fields
* `undo-support` — Allow undo for destructive or bulk actions
* `success-feedback` — Confirm completed actions with brief visual feedback
* `error-recovery` — Error messages must include a clear recovery path
* `error-clarity` — Error messages must state cause + how to fix

### 9. Navigation Patterns (HIGH)

* `bottom-nav-limit` — Bottom navigation max 5 items; use labels with icons
* `drawer-usage` — Use drawer/sidebar for secondary navigation
* `back-behavior` — Back navigation must be predictable and consistent
* `deep-linking` — All key screens must be reachable via deep link / URL
* `nav-label-icon` — Navigation items must have both icon and text label
* `nav-state-active` — Current location must be visually highlighted
* `modal-escape` — Modals and sheets must offer a clear close/dismiss affordance
* `state-preservation` — Navigating back must restore previous scroll position and filter state
* `tab-badge` — Use badges on nav items sparingly; clear after user visits
* `navigation-consistency` — Navigation placement must stay the same across all pages
* `persistent-nav` — Core navigation must remain reachable from deep pages

### 10. Charts & Data (LOW)

* `chart-type` — Match chart type to data type (trend→line, comparison→bar, proportion→pie/donut)
* `color-guidance` — Use accessible color palettes; avoid red/green only pairs for colorblind users
* `legend-visible` — Always show legend; position near the chart
* `tooltip-on-interact` — Provide tooltips/data labels on hover (Web) or tap (mobile) showing exact values
* `axis-labels` — Label axes with units and readable scale
* `responsive-chart` — Charts must reflow or simplify on small screens
* `empty-data-state` — Show meaningful empty state when no data exists
* `loading-chart` — Use skeleton or shimmer placeholder while chart data loads
* `large-dataset` — For 1000+ data points, aggregate or sample; provide drill-down
* `number-formatting` — Use locale-aware formatting for numbers, dates, currencies
* `no-pie-overuse` — Avoid pie/donut for >5 categories; switch to bar chart
* `contrast-data` — Data lines/bars vs background ≥3:1
* `legend-interactive` — Legends should be clickable to toggle series visibility
* `direct-labeling` — For small datasets, label values directly on the chart
* `gridline-subtle` — Grid lines should be low-contrast (e.g. gray-200)
* `trend-emphasis` — Emphasize data trends over decoration
* `export-option` — For data-heavy products, offer CSV/image export
* `time-scale-clarity` — Time series charts must clearly label time granularity and allow switching

---

## Lumnix-Specific Design Tokens (Apply These Always)

When working on the Lumnix codebase, these design decisions are already locked in and must be respected:

**Colors:**
- Primary/CTA: `#FF0066` (hover: `#FF3385`) — all buttons, active nav, interactive elements
- Chart accent: `#00D4AA` — chart secondary lines only, never on buttons
- Success/positive: `#059669`
- Warning/caution: `#F59E0B`
- Danger/negative: `#DC2626`

**Typography:**
- Display/headings/metrics: `Plus Jakarta Sans` (`font-display`)
- Body/labels/UI: `DM Sans` (`font-sans`)
- No Inter, no system-ui on visible text

**Light mode palette:**
- Page bg: `#F8FAFC`
- Card bg: `#FFFFFF`
- Border: `#E2E8F0`
- Text primary: `#0F172A`
- Text secondary: `#374151`
- Text muted: `#6B7280`

**Dark mode palette:**
- Page bg: `#0F172A`
- Card bg: `#1E293B`
- Card secondary: `#273548`
- Border: `rgba(255,255,255,0.10)`
- Text primary: `#F1F5F9`
- Text secondary: `#CBD5E1` (minimum for readable text)
- Text muted: `#94A3B8`

**Sidebar:** Always `220px` wide, never collapses. Dark bg `#0F172A`, light bg `#FFFFFF`.

**Charts:** All primary lines `#FF0066` with fill `rgba(255,0,102,0.08)`. No dark maroon anywhere.

---

## Pre-Delivery Checklist (Lumnix)

Before delivering any UI work on Lumnix:

* [ ] No blue buttons anywhere — all CTAs use `#FF0066`
* [ ] All chart primary lines are `#FF0066` — no default Recharts colors
* [ ] No dark maroon/crimson on charts (replace with purple/green/amber/gray system)
* [ ] Plus Jakarta Sans on all page titles, section headings, metric numbers
* [ ] DM Sans on all body text, table cells, nav items, labels
* [ ] Dark mode text minimum `#CBD5E1` — never below this for readable content
* [ ] ROAS shows `—` not `0.00x` when no revenue data
* [ ] Numbers use Indian locale formatting (`3,14,735` not `314,735`)
* [ ] Active nav items have left border `3px solid #FF0066` + background `rgba(255,0,102,0.18)`
* [ ] Sidebar is always `220px` — no collapse button
* [ ] Skeleton loaders on all data-fetching sections (not spinners)
* [ ] Empty states have icon + title + description + CTA button
* [ ] All status badges: Active=green, Paused=amber, Error=red — consistent across all pages
