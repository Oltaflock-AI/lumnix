# Apply Landing Copy V2 — Implementation Spec for Claude Code

> **STATUS — APPLIED (2026-04-21):** All six component edits below have been applied to the live code. Hero was subsequently tightened by ~4 lines of vertical space — the "compact hero" version now lives in `Hero.tsx` and the updated copy is reflected in `LANDING_COPY_V2.md`. **Do not re-run this spec as-is** — the `old_string` blocks below no longer match file state. Kept here for reference and commit-message context only.

**Purpose:** Apply the approved copy rewrite from `LANDING_COPY_V2.md` into the live landing page components. This is a pure copy change — no design, animation, or component-structure edits.

**How to use this doc:**
1. Read `LANDING_COPY_V2.md` first for positioning context and rationale.
2. Open this file and execute the edits section by section in the order listed.
3. Every edit below gives you the exact `old_string` and `new_string` ready for the `Edit` tool.
4. Run the validation checklist at the bottom before committing.

---

## Ground rules

1. **Text-only changes.** Do not touch component props, animations, Framer Motion, IntelCard logic, ScrollReveal, or any layout/style code. If you're tempted to "improve" styling while you're in there, don't.
2. **Preserve JSX entities.** HTML entities (`&apos;`, `&rdquo;`, `&mdash;`) must stay correctly escaped. Don't introduce raw apostrophes inside JSX.
3. **Preserve the shimmer/accent treatments.** Any `<span className="wr-shimmer">`, `<span className="wr-text-accent">`, `<span className="wr-text-danger">`, `<span className="wr-text-green">` classes stay on the right words. Move the classes to the new emphasis word if the emphasis shifts.
4. **No new components or imports.** All changes are within existing JSX text. No new icons, no new utility components.
5. **Do NOT add the "For agencies" nav link yet** — that's a follow-up, not this pass.
6. **Do NOT touch the `₹2,499/mo` plan price in `PricingSection.tsx`** — prices are unchanged. Only taglines and the section headline/sub-headline change.
7. **Keep the existing testimonial block exactly as-is** — it's been fact-checked and the math is correct.

---

## Edit 1 — Hero.tsx

**File:** `src/app/(landing)/components/Hero.tsx`

### 1a. Eyebrow badge (add ICP)

```
OLD:
          <span className="wr-badge">
            <span className="wr-pulse-dot" />
            Now in early access
          </span>

NEW:
          <span className="wr-badge">
            <span className="wr-pulse-dot" />
            For D2C brands and marketing agencies · Now in early access
          </span>
```

### 1b. Headline (H1) — the big change

```
OLD:
          <h1 className="wr-hero-headline" style={{ marginBottom: 28 }}>
            Your competitors
            <br />know something
            <br /><span className="wr-shimmer">you don&apos;t.</span>
          </h1>

NEW:
          <h1 className="wr-hero-headline" style={{ marginBottom: 28 }}>
            Your marketing data
            <br />lives in 5 tools.
            <br />Your decisions should
            <br />live in <span className="wr-shimmer">one.</span>
          </h1>
```

### 1c. Sub-headline — "what is Lumnix" (new)

```
OLD:
          <p className="wr-sub-headline" style={{ marginBottom: 20, maxWidth: 540 }}>
            While you&apos;re switching between 5 dashboards,
            they&apos;re making decisions in <strong style={{ color: '#fff' }}>one.</strong>
          </p>

NEW:
          <p className="wr-sub-headline" style={{ marginBottom: 20, maxWidth: 540 }}>
            Lumnix is the AI marketing platform for D2C brands and agencies. <strong style={{ color: '#fff' }}>SEO, analytics, paid ads, competitor intel, and creative</strong> — in one place, with an AI that reads your data and tells you what to do next.
          </p>
```

### 1d. Pain line (body)

```
OLD:
          <p className="wr-body-large" style={{ marginBottom: 36, maxWidth: 480 }}>
            Your team wastes <span className="wr-text-danger">14 hours/week</span> stitching data across tools that don&apos;t talk to each other.
          </p>

NEW:
          <p className="wr-body-large" style={{ marginBottom: 36, maxWidth: 480 }}>
            Your team is losing <span className="wr-text-danger">14 hours a week</span> stitching GSC, GA4, Meta Ads, Google Ads, and a shared sheet nobody trusts. Your competitors aren&apos;t.
          </p>
```

### 1e. Tagline

```
OLD:
          <p className="wr-hero-tagline">
            Lumnix ends that. Today.
          </p>

NEW:
          <p className="wr-hero-tagline">
            One stack. One AI. One place to make decisions.
          </p>
```

### 1f. Secondary CTA anchor label

```
OLD:
            <a href="#features" className="wr-cta-ghost">
              See how it works ↓
            </a>

NEW:
            <a href="#features" className="wr-cta-ghost">
              See how it replaces your stack ↓
            </a>
```

### 1g. Savings line — the ₹75k fact-check fix

```
OLD:
          <p className="wr-hero-savings">
            <span className="wr-text-danger">₹75,000/mo</span> in tools → replaced by <span className="wr-text-green">₹2,499/mo</span>
          </p>

NEW:
          <p className="wr-hero-savings">
            Your stack today: <span className="wr-text-danger">₹17,000–₹55,000/mo</span> → Lumnix: <span className="wr-text-green">from ₹2,499/mo</span>
          </p>
```

### 1h. Proof line

```
OLD:
          <div className="wr-hero-proof">
            <p className="wr-hero-proof-text">Join the waitlist — limited early access spots</p>
          </div>

NEW:
          <div className="wr-hero-proof">
            <p className="wr-hero-proof-text">Built for D2C brands doing ₹50L–₹50Cr ARR and agencies managing 3–30 clients.</p>
          </div>
```

---

## Edit 2 — VillainSection.tsx

**File:** `src/app/(landing)/components/VillainSection.tsx`

### 2a. GSC tool card — fix the brand-keyword-bidding inaccuracy

Find the tool object whose `category: 'SEO'` and replace the `knows`, `blind`, and `cost` JSX.

```
OLD:
    knows: (
      <>Your keyword <strong>&ldquo;promunch&rdquo;</strong> ranks <strong>#1</strong></>
    ),
    blind: (
      <>Has no idea you&rsquo;re paying <strong>₹4,200/mo</strong> to bid on the same keyword in Google Ads</>
    ),
    cost: <><span className="wr-tool-cost-dot" />₹0/mo spent here</>,

NEW:
    knows: (
      <>You rank <strong>#1</strong> for <strong>&ldquo;promunch&rdquo;</strong> with 3,400 monthly impressions</>
    ),
    blind: (
      <>That <strong>3 of your top-10 keywords have a 0% CTR</strong> — meta titles haven&rsquo;t been touched in a year, and the click is going to whoever owns the SERP snippet</>
    ),
    cost: <><span className="wr-tool-cost-dot" />~200 organic clicks/month, gone</>,
```

### 2b. Meta Ads tool card — reframe to "you spent 8k and still don't know what's working"

Find the tool object whose `category: 'Paid Ads'` and replace the `blind` and `cost` JSX (the `knows` line stays).

```
OLD:
    blind: (
      <>Doesn&rsquo;t know your competitors are spending <strong>10×</strong> and stealing your audience with hooks you&rsquo;ve never seen</>
    ),
    cost: <><span className="wr-tool-cost-dot" />₹8,159/mo and climbing</>,

NEW:
    blind: (
      <>Which of <strong>your</strong> ads is actually driving orders (Meta&rsquo;s attribution is optimistic) — and which <strong>hooks and offers</strong> are working for your competitors right now</>
    ),
    cost: <><span className="wr-tool-cost-dot" />₹8,159/mo spent blind — nothing to double down on, nothing to kill</>,
```

### 2c. Section eyebrow

```
OLD:
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>THE PROBLEM</span>

NEW:
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>THE REAL COST OF YOUR STACK</span>
```

### 2d. Section headline

```
OLD:
            <h2 className="wr-section-headline" style={{ marginBottom: 24 }}>
              You&apos;re paying for{' '}
              <span className="wr-text-danger">5 tools</span>
              <br />that can&apos;t see each other.
            </h2>

NEW:
            <h2 className="wr-section-headline" style={{ marginBottom: 24 }}>
              You&apos;re paying <span className="wr-text-danger">5 tools</span>
              <br />to tell you 5 different stories.
            </h2>
```

### 2e. Section sub-headline

```
OLD:
            <p className="wr-sub-headline" style={{ maxWidth: 620, margin: '0 auto' }}>
              Every tool knows <em>something</em>. None of them know <strong style={{ color: '#fff' }}>everything</strong>.
              <br />That gap is where you&apos;re losing money.
            </p>

NEW:
            <p className="wr-sub-headline" style={{ maxWidth: 620, margin: '0 auto' }}>
              Every tool knows one slice. None of them know <strong style={{ color: '#fff' }}>the full picture</strong>.
              <br />That gap is where campaigns go wrong, budgets get wasted, and agencies lose retainers.
            </p>
```

### 2f. Gut-punch closing line

```
OLD:
            <p className="wr-gut-punch-cta">
              <span className="wr-shimmer">Until now.</span>
            </p>

NEW:
            <p className="wr-gut-punch-cta">
              <span className="wr-shimmer">Lumnix does.</span>
            </p>
```

---

## Edit 3 — AdSpySection.tsx

**File:** `src/app/(landing)/components/AdSpySection.tsx`

### 3a. Section eyebrow

```
OLD:
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>COMPETITOR AD SPY</span>

NEW:
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>PILLAR 1 · COMPETITOR INTEL</span>
```

### 3b. Section headline — sharpen "every single one" → "every winner"

```
OLD:
            <h2 className="wr-section-headline" style={{ marginBottom: 28 }}>
              They&apos;ve been testing ads
              <br />for <span style={{ color: '#F87171' }}>6 months.</span>
              <br /><span className="wr-text-accent">You&apos;re about to see every single one.</span>
            </h2>

NEW:
            <h2 className="wr-section-headline" style={{ marginBottom: 28 }}>
              They&apos;ve been A/B testing ads
              <br />for <span style={{ color: '#F87171' }}>6 months.</span>
              <br /><span className="wr-text-accent">You&apos;re about to see every winner.</span>
            </h2>
```

### 3c. Body copy

```
OLD:
            <p className="wr-body-large" style={{ marginBottom: 20 }}>
              Who has time to check <span style={{ color: '#fff', fontWeight: 600 }}>500 ads per competitor</span>? Nobody.
            </p>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
              Ad running <span style={{ color: '#34D399', fontWeight: 700 }}>90+ days</span> = Meta kept serving it = <strong style={{ color: '#fff' }}>it works.</strong> Our AI tells you exactly why.
            </p>

NEW:
            <p className="wr-body-large" style={{ marginBottom: 20 }}>
              Nobody has time to scroll <span style={{ color: '#fff', fontWeight: 600 }}>500 ads per competitor</span> in the Meta Ad Library. Lumnix does — and tells you which ones are worth stealing.
            </p>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.55)', marginBottom: 28, lineHeight: 1.6 }}>
              Rule of thumb: an ad running <span style={{ color: '#34D399', fontWeight: 700 }}>90+ days</span> is an ad Meta keeps serving because <strong style={{ color: '#fff' }}>it converts.</strong> Those are the only ones worth your attention.
            </p>
```

### 3d. Points array (feature checklist)

```
OLD:
const points = [
  'Add competitor by name, website, or Facebook URL',
  '90-day longevity = proven winner signal',
  'AI brief: exactly what hooks, pain points, and offers they use',
];

NEW:
const points = [
  'Add any competitor — by brand name, website, or Facebook Page URL',
  'We filter to the top 10% of winners — longevity, engagement, ad frequency',
  'AI brief on every ad: hook, pain point, offer, format, and why it works',
  'Your swipe file, always current — new winners land weekly',
];
```

---

## Edit 4 — LumiSection.tsx

**File:** `src/app/(landing)/components/LumiSection.tsx`

### 4a. Section eyebrow

```
OLD:
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>AI ASSISTANT — LUMI</span>

NEW:
            <span className="wr-label" style={{ display: 'inline-block', marginBottom: 20 }}>PILLAR 5 · LUMI, YOUR AI MARKETER</span>
```

### 4b. Body copy under headline

```
OLD:
            <p className="wr-body-large" style={{ marginBottom: 28 }}>
              Not a chatbot. Lumi reads <strong style={{ color: '#fff' }}>your actual data</strong> — keywords, campaigns, competitors — and tells you what to do next.
            </p>

NEW:
            <p className="wr-body-large" style={{ marginBottom: 28 }}>
              Lumi isn&apos;t a chatbot. It&apos;s plugged into <strong style={{ color: '#fff' }}>your</strong> GSC, GA4, Meta Ads, Google Ads, and competitor feeds. Ask anything — get answers with your actual numbers, not generic advice.
            </p>
```

### 4c. Example question 2 — slightly sharper phrasing

```
OLD:
  { q: 'What should I focus on this week?', a: "3 quick wins on page 1: 'soya mini chunks' (190 impressions, 0% CTR), 'soya munch' (8 impressions, 0% CTR), 'peri peri soya' (1 impression, 1 click). Fixing meta titles on these 3 pages could add ~20 organic clicks/week at zero cost.", Icon: Clock },

NEW:
  { q: 'What are my 3 quickest wins this week?', a: "Three pages rank on page 1 with a 0% CTR — 'soya mini chunks' (190 impressions), 'soya munch' (8 impressions), 'peri peri soya' (1 click on 1 impression). Rewriting the meta titles could add ~20 organic clicks/week at zero ad spend.", Icon: Clock },
```

### 4d. Example question 3 — sharper, ends with action

```
OLD:
  { q: 'Compare my organic vs paid this month', a: 'Organic: 214 clicks, ₹0 spend, estimated ₹6,200 value at avg CPC. Paid: 18,038 clicks, ₹8,159 spend, ₹0.45 CPC. Organic CTR 26% vs paid CTR 3.87%. Your organic is significantly more efficient — consider doubling down on content.', Icon: BarChart3 },

NEW:
  { q: 'Is my organic or paid channel more efficient right now?', a: 'Organic: 214 clicks, ₹0 spend, ~₹6,200 equivalent value. Paid: 18,038 clicks, ₹8,159 spend, ₹0.45 CPC. Your organic CTR is 26% vs paid 3.87% — shift ₹15k of next month\'s ad budget into content and you\'ll likely net more traffic for the same spend.', Icon: BarChart3 },
```

---

## Edit 5 — PricingSection.tsx

**File:** `src/app/(landing)/components/PricingSection.tsx`

### 5a. Plan taglines — ARR/client-count anchors

```
OLD:
const plans = [
  { name: 'Free', tagline: 'Get your bearings', price: '₹0', period: '/mo', features: ['2 integrations', '30-day data retention', '2 team members', 'Basic insights'], cta: 'Get started', primary: false },
  { name: 'Starter', tagline: 'For early-stage brands', price: '₹2,499', period: '/mo', features: ['4 integrations', '90-day retention', '5 team members', 'AI insights', 'PDF reports'], cta: 'Try Starter free', primary: false },
  { name: 'Growth', tagline: 'For scaling brands', price: '₹6,499', period: '/mo', features: ['All integrations', '1-year retention', '15 team members', 'AI chat + insights', 'White-label reports', 'Competitor tracking'], cta: 'Try Growth free →', primary: true, popular: true },
  { name: 'Agency', tagline: 'For multi-brand agencies', price: '₹16,499', period: '/mo', features: ['Unlimited everything', 'Unlimited retention', 'Unlimited team', 'Everything in Growth', 'Multi-workspace', 'Priority support', 'API access'], cta: 'Try Agency free', primary: false },
];

NEW:
const plans = [
  { name: 'Free', tagline: 'See if Lumnix fits', price: '₹0', period: '/mo', features: ['2 integrations', '30-day data retention', '2 team members', 'Basic insights'], cta: 'Get started', primary: false },
  { name: 'Starter', tagline: 'Early-stage D2C · ₹50L–₹2Cr ARR', price: '₹2,499', period: '/mo', features: ['4 integrations', '90-day retention', '5 team members', 'AI insights', 'PDF reports'], cta: 'Try Starter free', primary: false },
  { name: 'Growth', tagline: 'Scaling D2C · ₹2Cr–₹50Cr ARR', price: '₹6,499', period: '/mo', features: ['All integrations', '1-year retention', '15 team members', 'AI chat + insights', 'White-label reports', 'Competitor tracking'], cta: 'Try Growth free →', primary: true, popular: true },
  { name: 'Agency', tagline: 'Agencies managing 3–30 client brands', price: '₹16,499', period: '/mo', features: ['Unlimited everything', 'Unlimited retention', 'Unlimited team', 'Everything in Growth', 'Multi-workspace', 'Priority support', 'API access'], cta: 'Try Agency free', primary: false },
];
```

### 5b. Section headline

```
OLD:
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
              Less than the cost of one bad ad.
            </h2>

NEW:
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(32px, 4vw, 56px)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 12 }}>
              Less than the cost of one bad ad week.
            </h2>
```

### 5c. Sub-headline — ₹75k → range

```
OLD:
            <p style={{ fontSize: 18, color: '#9CA3AF', maxWidth: 480, margin: '0 auto 12px' }}>
              The tools you&apos;re replacing cost ₹75,000/mo combined.
            </p>

NEW:
            <p style={{ fontSize: 18, color: '#9CA3AF', maxWidth: 480, margin: '0 auto 12px' }}>
              Replace ₹17,000–₹55,000/mo of disconnected tools with one platform.
            </p>
```

### 5d. Leave the Starter price callout and testimonial block as-is

No changes below line ~29. The testimonial already math-checks (Ahrefs ₹8k + Atria ₹10.8k ≈ ₹18.7k saved).

---

## Edit 6 — FinalCTA.tsx

**File:** `src/app/(landing)/components/FinalCTA.tsx`

### 6a. Body copy — add ICP callout

```
OLD:
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.6 }}>
            Join the <strong style={{ color: 'rgba(255,255,255,0.85)' }}>early-access waitlist</strong> of marketers who stopped
            exporting CSVs and started making decisions.
          </p>

NEW:
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.55)', marginBottom: 32, lineHeight: 1.6 }}>
            Join the <strong style={{ color: 'rgba(255,255,255,0.85)' }}>early-access waitlist</strong> of D2C brands and agencies who stopped exporting CSVs and started making decisions. Setup takes 3 minutes. Your stack takes 3 hours to build every month.
          </p>
```

### 6b. Badge — sharper

```
OLD:
          <span className="wr-label" style={{ display: 'inline-block', marginBottom: 28, background: 'rgba(255,0,102,0.12)', border: '1px solid rgba(255,0,102,0.25)', padding: '8px 16px', borderRadius: 24 }}>STOP GUESSING</span>

NEW:
          <span className="wr-label" style={{ display: 'inline-block', marginBottom: 28, background: 'rgba(255,0,102,0.12)', border: '1px solid rgba(255,0,102,0.25)', padding: '8px 16px', borderRadius: 24 }}>STOP GUESSING. START KNOWING.</span>
```

### 6c. Headline — leave as-is

The existing "Marketing that guesses is expensive. Marketing that knows is unstoppable." stays. It's the strongest line on the page. Do not change.

---

## Validation checklist (run before committing)

Execute these in order. Don't skip steps.

1. **Typecheck + lint**
   ```bash
   pnpm typecheck
   pnpm lint
   ```
   Expect zero new errors. If a typo in `new_string` breaks a JSX fragment, fix it now.

2. **Run dev server and visit the landing page**
   ```bash
   pnpm dev
   ```
   Open `http://localhost:3000/` in a browser.

3. **Visual smoke test — above the fold**
   - Badge reads: "For D2C brands and marketing agencies · Now in early access"
   - Headline reads: "Your marketing data lives in 5 tools. Your decisions should live in one." (with shimmer on "one")
   - Sub-headline says "Lumnix is the AI marketing platform for D2C brands and agencies..."
   - Savings line shows ₹17,000–₹55,000/mo → from ₹2,499/mo
   - No ₹75,000 figure visible anywhere on the page

4. **Visual smoke test — below the fold**
   - Villain section eyebrow reads "THE REAL COST OF YOUR STACK"
   - GSC card "BLIND TO" mentions meta titles and 0% CTR (NOT brand-keyword bidding)
   - Meta Ads card "BLIND TO" mentions "Which of your ads is actually driving orders"
   - AdSpy section eyebrow reads "PILLAR 1 · COMPETITOR INTEL"
   - Lumi section eyebrow reads "PILLAR 5 · LUMI, YOUR AI MARKETER"
   - Pricing sub-headline shows ₹17,000–₹55,000/mo
   - Starter plan tagline reads "Early-stage D2C · ₹50L–₹2Cr ARR"
   - Final CTA body mentions "D2C brands and agencies"

5. **Theme check**
   - Dark mode (default) — all text readable, shimmer works
   - Light mode — pricing section still renders (it's on `wr-light-section`)

6. **Responsive check**
   - 375px (mobile) — hero headline wraps correctly, CTAs stack
   - 768px (tablet) — intel card renders alongside copy
   - 1280px (desktop) — hero grid is 2-col

7. **No hydration warnings in console**
   - Open DevTools console. A clean reload should produce zero warnings. If Framer Motion throws a warning that was already there before, that's pre-existing — leave it.

8. **Search for stragglers**
   ```bash
   grep -rn "75,000" src/app/\(landing\)
   grep -rn "competing with yourself" src/app/\(landing\)
   grep -rn "Until now" src/app/\(landing\)
   grep -rn "Now in early access" src/app/\(landing\)   # should only match inside Navbar or the new badge text
   ```
   Each `grep` should return either zero results or only expected matches.

---

## Commit + PR

Once validation passes:

1. **Commit** — one commit for the whole pass.
   ```bash
   git add src/app/\(landing\)/components/
   git commit -m "Rewrite landing page copy for D2C + agency ICP

   - Hero: lead with fragmented-stack pain, name ICP and product in first 3 seconds
   - Villain: fix GSC blind-spot example (meta titles, not brand-keyword bidding)
   - Villain: reframe Meta Ads card around unknown ROI + competitor blindness
   - Pricing: replace inflated ₹75k figure with fact-checked ₹17k–₹55k range
   - Pricing: anchor plan taglines to ARR bands and client counts
   - Lumi/AdSpy: add 'Pillar N' framing to reinforce full-stack positioning
   - Final CTA: name ICP explicitly before CTA

   See LANDING_COPY_V2.md for positioning rationale and the pricing claims
   appendix with sourced tool prices."
   ```

2. **Push and open PR**
   ```bash
   git push -u origin <branch>
   gh pr create --title "Landing page copy V2 — D2C + agency ICP" --body "$(cat <<'EOF'
   ## Summary
   - Rewrites landing page copy to speak directly to D2C brands and marketing agencies
   - Fixes two accuracy issues called out by the founder: brand-keyword-bidding example and inflated ₹75k/mo stack claim
   - All pricing figures fact-checked against live 2026 tool pricing (see LANDING_COPY_V2.md appendix)

   ## Files changed
   - src/app/(landing)/components/Hero.tsx
   - src/app/(landing)/components/VillainSection.tsx
   - src/app/(landing)/components/AdSpySection.tsx
   - src/app/(landing)/components/LumiSection.tsx
   - src/app/(landing)/components/PricingSection.tsx
   - src/app/(landing)/components/FinalCTA.tsx

   ## Test plan
   - [ ] Typecheck and lint pass
   - [ ] Dev server renders landing page with no hydration warnings
   - [ ] Hero above-fold matches LANDING_COPY_V2.md
   - [ ] No ₹75,000 figure appears anywhere in /src/app/(landing)
   - [ ] Pricing page renders in both dark and light sections
   - [ ] Responsive: 375px / 768px / 1280px all render correctly
   EOF
   )"
   ```

---

## If something goes wrong

- **Edit tool says `old_string` not unique** — re-read the file, grab more surrounding context, retry the Edit with a longer `old_string`.
- **Typecheck breaks on a JSX fragment** — most likely an unescaped apostrophe. Find the new copy you just pasted and replace raw `'` inside JSX with `&apos;`.
- **Page renders blank in dev** — check the browser console. Almost always a JSX syntax error from a dropped closing tag during the copy edit. Revert that one file and re-apply more carefully.
- **Copy doesn't match the V2 doc** — fall back to `LANDING_COPY_V2.md` as the source of truth, not this file. This doc translates V2 into exact edits; if they disagree, V2 wins.

---

## Out of scope for this PR

These are follow-ups, not this pass:

1. Adding a "For agencies" link to the navbar
2. Adding a dedicated agency testimonial block
3. The `/for-agencies` route
4. Any design/animation polish
5. Replacing the 142 hardcoded `#FF0066` instances with `var(--color-accent)` (legacy debt tracked elsewhere)

Flag each of these as separate follow-up tickets after this PR ships.
