# Figma MCP Integration Rules — Lumnix

Rules for translating Figma designs into the Lumnix codebase. Applies to every Figma-driven change.

## Required Flow (do not skip)

1. Run `get_design_context` first for the exact node(s).
2. If response is truncated or too large, call `get_metadata` to map the node tree, then re-fetch only required nodes with `get_design_context`.
3. Run `get_screenshot` for visual reference of the variant being built.
4. Download assets (if any) from the Figma MCP `localhost` URLs in the payload.
5. Translate the React + Tailwind reference into Lumnix conventions — NOT pasted verbatim.
6. Validate 1:1 against screenshot before marking complete.

## Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript 5
- **Styling:** Tailwind v4 (CSS-first, `@theme inline` in `src/app/globals.css`) + CSS custom properties
- **Components:** shadcn/ui + Radix primitives in `src/components/ui/`
- **Icons:** `lucide-react` only
- **Animation:** Framer Motion + CSS keyframes (respect `prefers-reduced-motion`)
- **Charts:** Recharts
- **Import alias:** `@/` → `src/`

## Design Tokens — Single Source of Truth

All tokens live in [src/app/globals.css](../../src/app/globals.css). **Never hardcode values.**

### Colors (CSS vars in `:root` / `.dark`)

- Primary accent: `var(--color-accent)` → `#7C3AED` (hover: `#6D28D9`)
- Secondary accent (charts only, never CTAs): `var(--color-accent-2)` → `#0891B2`
- Success: `var(--color-success)` → `#22C55E`
- Warning: `var(--color-warning)` → `#F59E0B`
- Danger: `var(--color-danger)` → `#EF4444`
- Surface / bg / text tokens: `--bg-page`, `--bg-card`, `--border`, `--text-primary`, `--text-secondary`, `--text-muted`

**IMPORTANT:** Accent `#7C3AED` is hardcoded in 142 places across 30 files (legacy debt). New code MUST use `var(--color-accent)` or the Tailwind mapped class (`bg-accent`, `text-accent`, `ring-accent`). Do not add to the debt.

### Typography

- Display (headings, metrics): `var(--font-display)` → Plus Jakarta Sans
- Body (UI, labels): `var(--font-body)` → DM Sans
- Mono (code): `var(--font-mono)` → JetBrains Mono
- Loaded via `next/font/google` in [src/app/layout.tsx](../../src/app/layout.tsx). Do not add new font sources.

### Motion

- `--ease-out-strong: cubic-bezier(0.23, 1, 0.32, 1)`
- `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`
- Duration baseline: 150–300ms
- Always wrap non-essential motion in `prefers-reduced-motion` guard.

## Component Rules

### Reuse before creating

IMPORTANT: Check [src/components/ui/](../../src/components/ui/) first. Available primitives:
`button`, `input`, `select`, `textarea`, `dialog`, `alert-dialog`, `dropdown-menu`, `sheet`, `tabs`, `popover`, `command`, `badge`, `status-badge`, `avatar`, `table`, `scroll-area`, `separator`, `tooltip`, `label`, `skeleton`, `sonner`.

Top-level shared components: `PageShell`, `DateRangePicker`, `ConfirmDialog`, `FeedbackDialog`.

### When no primitive fits

- New UI primitives → `src/components/ui/<name>.tsx` (kebab-case filename, PascalCase export)
- Feature components → `src/components/<PascalName>.tsx`
- Use `cva` (class-variance-authority) for variant props. Pattern matches existing button.tsx.
- Accept `className` prop + forward ref when composable.

### Utility classes (prefer over inline JS)

Defined in globals.css — use these instead of re-implementing:
- `.lx-card-interactive` — card hover/focus with accent border + 2px lift. Replaces inline `onMouseEnter` handlers.
- `.card-hover`, `.card-accent`, `.card-hero` — card variants
- `.glass`, `.glass-subtle`, `.glass-strong` — backdrop-filter liquid glass
- `.icon-pill`, `.icon-pill-sm` — accent-tinted icon containers
- `.gradient-text`, `.gradient-text-warm` — text gradients
- `.glow-accent` — accent box-shadow

## Styling Rules

- **Tailwind utilities first.** Map Figma output's raw Tailwind to the token-backed equivalents (`bg-accent` not `bg-[#7C3AED]`).
- **No inline `style={{}}`** except for dynamic values (chart widths, progress bars, computed transforms).
- **No CSS Modules.** No styled-components. Project is Tailwind + globals.css only.
- **Dark-first theme.** `<html data-theme="dark">` default; `.dark` class is the active scheme. Light mode overrides live in `:root` of globals.css. Test both.
- **Focus rings:** 2px `var(--color-accent)` with 3px offset — already set globally. Do not override per-component.
- **Breakpoints:** Tailwind defaults (`sm`, `md`, `lg`, `xl`, `2xl`). Mobile-first.

## Icons

- Import from `lucide-react` only. Example:
  ```tsx
  import { AlertTriangle, ChevronDown } from 'lucide-react';
  ```
- **Do not** install new icon packages (heroicons, react-icons, etc.).
- **Do not** inline raw SVG for common glyphs — use lucide.
- Asset-style illustrations that lucide doesn't cover → Figma MCP localhost asset, stored in `public/`.

## Asset Handling

- IMPORTANT: If Figma MCP returns a `localhost:*` source for an image or SVG, use it directly — do not swap for placeholders.
- Downloaded assets → `public/` (keep flat; only nest for large groups).
- All raster images rendered via `next/image` with explicit width/height. No raw `<img>` tags in app code.
- Decorative SVGs inline in the component as `<svg aria-hidden="true">`.

## Accessibility (WCAG AA, non-negotiable)

- Interactive targets ≥ 44×44px (mobile).
- All icons-as-buttons need `aria-label`.
- Modals/dialogs use Radix primitives (`role`, focus trap, Esc close already handled).
- `aria-current="page"` on active nav links (enforce — only sidebar has it today).
- Skip link to `#main-content` already in layout; preserve.
- Respect `prefers-reduced-motion` — animations degrade to opacity-only.
- Color contrast AA minimum; use tokens, they are pre-validated.

## Authoritative Docs (read before major UI work)

- [CLAUDE.md](../../CLAUDE.md) — root project instructions
- [LUMNIX_MASTER_PLAN.md](../../LUMNIX_MASTER_PLAN.md) — product vision, pillars
- `UI:UX-SKILL.md` (if present) — 99 UI rules, pre-delivery checklist
- `CLAUDE_CODE_MASTER.md` (if present) — single source of truth per user memory

## What to Reject from Figma Output

The Figma MCP returns React + Tailwind as a REFERENCE. Before committing:

- ❌ Raw hex in class (`bg-[#7C3AED]`) → ✅ `bg-accent` / `var(--color-accent)`
- ❌ Absolute positioning everywhere → ✅ flex/grid unless layout truly demands absolute
- ❌ New Button/Input/Dialog components → ✅ import from `src/components/ui/`
- ❌ Inline fonts / font-family → ✅ inherits from `--font-body` / `--font-display`
- ❌ Hardcoded pixel spacing → ✅ Tailwind scale (`p-4`, `gap-6`, etc.)
- ❌ New icon imports → ✅ lucide-react
- ❌ `<img>` tags → ✅ `next/image`

## Validation Checklist (before PR)

- [ ] Matches Figma screenshot in light AND dark mode
- [ ] No new hardcoded `#7C3AED` — uses `var(--color-accent)` / `bg-accent`
- [ ] Reuses existing `ui/` components where available
- [ ] Keyboard navigable; focus ring visible
- [ ] Works at 375px, 768px, 1280px widths
- [ ] Reduced-motion fallback renders
- [ ] No console errors / hydration warnings
