# Lumnix — Email Copy & Typography Fixes
**For Claude Code Agent**
*April 2026 | Oltaflock AI*

---

## Context

Read `EMAIL_ONBOARDING_FLOW.md` and `README.md` before starting. This document fixes two problems visible in the email screenshots:

1. **Unicode escape sequences rendering as raw text** — `\u2014` shows instead of `—`, `\u2192` shows instead of `→`, `\u2713` shows instead of `✓`
2. **Typography is too plain** — emails need bolder hierarchy, more visual weight, and a stronger first impression

Do not rewrite the email logic or API routes. Only fix the template files in `src/emails/`.

---

## Fix 1: Unicode Characters — Root Cause & Fix

### Why this happens

React Email renders JSX to HTML strings. When you write `\u2014` inside a JavaScript string literal in JSX, it gets serialised as the literal characters `\u2014` rather than being interpreted as a Unicode escape. This happens inside template literals, string props, and inline text.

### The fix — use the actual Unicode character OR named HTML entity

**Rule:** Never use `\u2014`, `\u2192`, `\u2713`, `\u2192` etc. in JSX content. Replace every occurrence with either:

- The actual character typed directly: `—` `→` `✓` `→`
- Or an HTML entity string in JSX: `&mdash;` `&rarr;` `&check;`

### Global search and replace

Run this across all files in `src/emails/`:

| Find (broken) | Replace with | Character name |
|---|---|---|
| `\u2014` | `—` | Em dash |
| `\u2192` | `→` | Right arrow |
| `\u2013` | `–` | En dash |
| `\u2713` | `✓` | Check mark |
| `\u00B7` | `·` | Middle dot |
| `\\u2014` | `—` | (escaped version) |
| `\\u2192` | `→` | (escaped version) |

In VS Code: Cmd+Shift+H (Find & Replace across files), check "Use Regular Expression" is OFF, replace each one.

### Specific lines to fix per email

**Email 5 (checkin.tsx) — worst offender:**

```tsx
// BROKEN — shows \u2014 literally:
"You've been using Lumnix for a week now \u2014 and I wanted to check in personally."

// FIXED — use actual em dash character:
"You've been using Lumnix for a week now — and I wanted to check in personally."
```

```tsx
// BROKEN:
"\u2713 SEO Quick Wins \u2014 keywords you rank for but have 0 clicks"

// FIXED:
"✓ SEO Quick Wins — keywords you rank for but have 0 clicks"
```

```tsx
// BROKEN:
"Connect in Settings \u2192"

// FIXED — use actual arrow OR split the link text:
"Connect in Settings →"
```

```tsx
// BROKEN:
"\u2014 Khush"

// FIXED:
"— Khush"
```

**Email 4 (feature-spotlight.tsx):**
```tsx
// BROKEN:
"Try it \u2192"
"Chat with Lumi \u2192"
"Open Lumnix \u2192"

// FIXED:
"Try it →"
"Chat with Lumi →"
"Open Lumnix →"
```

**Email 3 (first-insight.tsx):**
```tsx
// BROKEN:
"Your data is in, Khush \u2014 here's what we found"

// FIXED:
"Your data is in, Khush — here's what we found"
```

```tsx
// BROKEN:
"See your full dashboard \u2192"

// FIXED:
"See your full dashboard →"
```

**Email 2 (connect-sources.tsx):**
```tsx
// BROKEN:
"Connect your first source \u2192"
"OAuth only \u2014 we never store your passwords."

// FIXED:
"Connect your first source →"
"OAuth only — we never store your passwords."
```

**Button components:**
```tsx
// Any button with \u2192 in its text:
// BROKEN:
<Button>Open Dashboard \u2192</Button>
<Button>Sync your data now \u2192</Button>

// FIXED:
<Button>Open Dashboard →</Button>
<Button>Sync your data now →</Button>
```

---

## Fix 2: Typography & Visual Hierarchy Upgrade

The current emails are functional but visually flat. Apply these changes across all 5 templates to make them feel premium and bold.

### 2a. Email header — make it taller and more impactful

```tsx
// CURRENT header (too short, too plain):
<Section style={{ backgroundColor: '#5B21B6', padding: '28px 40px' }}>

// UPGRADED header:
<Section style={{
  backgroundColor: '#5B21B6',
  borderRadius: '16px 16px 0 0',
  padding: '32px 40px',
  backgroundImage: 'linear-gradient(135deg, #5B21B6 0%, #4C1D95 100%)',
}}>
```

Add a subtle tagline under the logo in the header:

```tsx
// After the logo row, add:
<Text style={{
  fontSize: '12px',
  color: 'rgba(255,255,255,0.55)',
  margin: '6px 0 0',
  fontFamily: "'DM Sans', Arial, sans-serif",
  letterSpacing: '0.04em',
}}>
  Marketing Intelligence Platform
</Text>
```

### 2b. Main headings — bigger, bolder, tighter

```tsx
// CURRENT:
<Heading style={{ fontSize: '26px', fontWeight: '700', color: '#18163A' }}>

// UPGRADED — all main email headings:
<Heading style={{
  fontSize: '28px',
  fontWeight: '800',
  color: '#18163A',
  letterSpacing: '-0.03em',
  lineHeight: '1.2',
  margin: '0 0 14px',
  fontFamily: "'DM Sans', Arial, sans-serif",
}}>
```

### 2c. Per-email heading rewrites

Replace these headings with bolder, punchier versions:

**Email 1 (welcome):**
```
BEFORE: "Welcome to Lumnix, {name} 🎉"
AFTER:  "Your marketing intelligence is live, {name} 🎉"
```

**Email 2 (connect-sources):**
```
BEFORE: "Your dashboard is ready — but it needs data"
AFTER:  "One connection unlocks everything"
```

Subheading change:
```
BEFORE: "Connect in 2 minutes"
AFTER:  "Takes 2 minutes. Works instantly."
```

**Email 3 (first-insight) — when data exists:**
```
BEFORE: "Your data is in, {name} — here's what we found"
AFTER:  "Your data is in, {name}. Here's what Lumi found."
```

**Email 3 (first-insight) — when NO data:**
```
BEFORE: "Your dashboard is ready — but we haven't seen your data yet"
AFTER:  "Your dashboard is waiting — and so is Lumi"
```

**Email 4 (feature-spotlight):**
```
BEFORE: "{name}, two features most people miss in week one"
AFTER:  "{name}, two features that change how you work"
```

Subheading:
```
BEFORE: "You've had Lumnix for 5 days. Here are 2 features that usually take people a month to discover."
AFTER:  "Most users find these in week 4. You're getting them in week 1."
```

**Email 5 (checkin):**
```
BEFORE: (no heading — starts with "Hey {name},")
AFTER:  Add a bold heading before the greeting:
        "One week in — honest question"
        
        Then the body starts: "Hey {name}, you've been on Lumnix for a week..."
```

### 2d. Metric stat boxes — Email 3 (first-insight)

The 3 stat boxes (Total clicks, Total sessions, Top ranking) need more visual weight:

```tsx
// CURRENT stat box:
<td style={{ padding: '16px', border: '1px solid #EAE8FF', textAlign: 'center' }}>

// UPGRADED:
<td style={{
  padding: '20px 16px',
  background: '#F8F7FC',
  border: '1px solid #EAE8FF',
  borderRadius: '10px',
  textAlign: 'center',
  verticalAlign: 'middle',
}}>

// Stat number inside:
<Text style={{
  fontSize: '36px',       // was 28px
  fontWeight: '800',      // was 700
  color: '#18163A',
  letterSpacing: '-0.03em',
  margin: '0',
  lineHeight: '1',
  fontFamily: "'DM Sans', Arial, sans-serif",
}}>
  342
</Text>

// Stat label:
<Text style={{
  fontSize: '12px',
  color: '#9CA3AF',
  margin: '5px 0 0',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  fontWeight: '600',
}}>
  Total clicks
</Text>
```

### 2e. Lumi's Insight box — Email 3

Make this more visually distinct with a stronger left border:

```tsx
<Section style={{
  backgroundColor: '#F4F2FF',
  border: '1px solid #DDD8FF',
  borderLeft: '4px solid #7C3AED',   // thicker accent
  borderRadius: '0 10px 10px 0',     // flush on left, rounded on right
  padding: '20px 22px',
  margin: '20px 0',
}}>
  <Text style={{
    fontSize: '10px',
    fontWeight: '700',
    color: '#7C3AED',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    margin: '0 0 8px',
  }}>
    LUMI'S INSIGHT
  </Text>
  <Text style={{
    fontSize: '15px',
    color: '#18163A',
    lineHeight: '1.65',
    margin: '0',
    fontWeight: '500',   // slightly bolder than body
  }}>
    {insightText}
  </Text>
</Section>
```

### 2f. Feature cards — Email 4 (feature-spotlight)

The feature cards need a more premium feel:

```tsx
// CURRENT feature card:
<Section style={{
  backgroundColor: '#F8F7FC',
  borderRadius: '12px',
  padding: '20px 24px',
  borderLeft: '3px solid #7C3AED',
}}>

// UPGRADED:
<Section style={{
  backgroundColor: '#FAFAFE',
  border: '1px solid #EAE8FF',
  borderLeft: '4px solid #7C3AED',
  borderRadius: '0 12px 12px 0',
  padding: '22px 26px',
  marginBottom: '14px',
}}>

// Feature number label:
<Text style={{
  fontSize: '10px',
  fontWeight: '800',
  color: '#7C3AED',
  textTransform: 'uppercase',
  letterSpacing: '0.12em',   // more spaced out
  margin: '0 0 8px',
}}>
  FEATURE 01
</Text>

// Feature title:
<Heading as="h2" style={{
  fontSize: '20px',
  fontWeight: '800',
  color: '#18163A',
  letterSpacing: '-0.02em',
  margin: '0 0 10px',
  lineHeight: '1.2',
}}>
  Competitor Ad Spy
</Heading>
```

For the chat bubble mockup in the Lumi feature card:

```tsx
// User bubble — make more obvious it's a chat:
<div style={{
  background: '#7C3AED',
  color: '#FFFFFF',
  padding: '10px 16px',
  borderRadius: '18px 18px 4px 18px',
  fontSize: '14px',
  lineHeight: '1.5',
  display: 'inline-block',
  maxWidth: '85%',
  float: 'right',
  clear: 'both',
  marginBottom: '10px',
}}>
  What should I focus on this week?
</div>

// AI bubble:
<div style={{
  background: '#F4F2FF',
  color: '#18163A',
  padding: '10px 16px',
  borderRadius: '18px 18px 18px 4px',
  fontSize: '13px',
  lineHeight: '1.6',
  display: 'inline-block',
  maxWidth: '90%',
  clear: 'both',
  marginTop: '4px',
}}>
  Based on your data, I'd focus on optimizing your meta titles...
</div>
```

**Note:** Float-based layout is used because many email clients don't support flex. Add `<div style={{clear:'both'}}></div>` after both bubbles.

### 2g. CTA buttons — make them bolder

```tsx
// CURRENT button style:
style={{
  backgroundColor: '#7C3AED',
  padding: '14px 32px',
  borderRadius: '10px',
  fontSize: '15px',
  fontWeight: '600',
}}

// UPGRADED — all primary buttons:
style={{
  backgroundColor: '#7C3AED',
  color: '#FFFFFF',
  padding: '16px 36px',
  borderRadius: '12px',
  fontSize: '16px',
  fontWeight: '700',
  letterSpacing: '-0.01em',
  fontFamily: "'DM Sans', Arial, sans-serif",
  textDecoration: 'none',
  display: 'inline-block',
}}
```

Hover color (for email clients that support it, add as a separate style block):
```html
<style>
  .btn-primary:hover { background-color: #5B21B6 !important; }
</style>
```

### 2h. Body text — improve readability

```tsx
// All body paragraphs:
<Text style={{
  fontSize: '15px',     // was 14-15px — keep at 15
  color: '#374151',     // was #6B7280 — darker for better readability
  lineHeight: '1.7',    // was 1.6 — slightly more air
  margin: '0 0 16px',
}}>
```

### 2i. Footer — clean it up

```tsx
// UPGRADED footer:
<Section style={{
  backgroundColor: '#F8F7FC',
  borderRadius: '0 0 16px 16px',
  padding: '24px 40px',
  border: '1px solid #EAE8FF',
  borderTop: '1px solid #EAE8FF',
  textAlign: 'center',
}}>
  <Text style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 8px', lineHeight: '1.5' }}>
    You're receiving this because you signed up for Lumnix.
  </Text>
  <Text style={{ fontSize: '12px', color: '#9CA3AF', margin: '0' }}>
    <Link href={unsubscribeUrl} style={{ color: '#7C3AED', textDecoration: 'underline' }}>
      Unsubscribe
    </Link>
    {' · '}
    Oltaflock AI
    {' · '}
    <Link href="https://oltaflock.ai" style={{ color: '#7C3AED', textDecoration: 'none' }}>
      oltaflock.ai
    </Link>
  </Text>
</Section>
```

---

## Fix 3: Email 5 (Check-in) — Plain Text Style

The check-in email should look intentionally simpler than the others — more like a real person wrote it. But it still needs the unicode fixes and the bold heading.

```tsx
// Add this heading at the top of the body (before "Hey {name}"):
<Heading style={{
  fontSize: '26px',
  fontWeight: '800',
  color: '#18163A',
  letterSpacing: '-0.02em',
  margin: '0 0 20px',
}}>
  One week in — honest question
</Heading>

// Body copy — fix all unicode AND rewrite the checklist section:
// BEFORE (broken):
"\u2713 SEO Quick Wins \u2014 keywords you rank for but have 0 clicks..."

// AFTER (fixed + formatted as actual list):
```

Replace the flat checklist text with styled bullet rows:

```tsx
{[
  { icon: '✓', text: 'SEO Quick Wins', desc: 'keywords you rank for but get 0 clicks — free traffic you\'re missing' },
  { icon: '✓', text: 'Competitor Ad Spy', desc: 'see which ads your rivals have been running for 90+ days' },
  { icon: '✓', text: 'AI Assistant', desc: 'ask Lumi to summarize your week in 30 seconds' },
].map((item, i) => (
  <Row key={i} style={{ marginBottom: '10px' }}>
    <Column style={{ width: '24px', verticalAlign: 'top', paddingTop: '2px' }}>
      <Text style={{ fontSize: '14px', color: '#059669', margin: 0, fontWeight: '700' }}>{item.icon}</Text>
    </Column>
    <Column>
      <Text style={{ fontSize: '14px', margin: 0 }}>
        <span style={{ fontWeight: '700', color: '#18163A' }}>{item.text}</span>
        <span style={{ color: '#6B7280' }}> — {item.desc}</span>
      </Text>
    </Column>
  </Row>
))}
```

---

## Fix 4: Preview Text (shown in inbox before opening)

Every email should have a `<Preview>` component with compelling copy — this is what shows in the inbox list next to the subject line.

```tsx
// In each email, after <Head> and before <Body>:

// Email 1:
<Preview>Your AI marketing intelligence is live — here's how to get started in 3 minutes</Preview>

// Email 2:
<Preview>Connect Google Search Console in 2 minutes and see your keyword rankings instantly</Preview>

// Email 3 (has data):
<Preview>Your top keyword is ranking at position {position} — and Lumi found 5 quick wins</Preview>

// Email 3 (no data):
<Preview>Your dashboard is waiting — one click to connect and start seeing your data</Preview>

// Email 4:
<Preview>Competitor Ad Spy + AI Assistant — the two features that save most users hours per week</Preview>

// Email 5:
<Preview>Quick check — is Lumnix actually useful for you? Reply with one word</Preview>
```

---

## Files to Edit

```
src/emails/welcome.tsx
src/emails/connect-sources.tsx
src/emails/first-insight.tsx
src/emails/feature-spotlight.tsx
src/emails/checkin.tsx
src/emails/components/email-header.tsx  (gradient upgrade)
src/emails/components/email-footer.tsx  (Unsubscribe · oltaflock.ai format)
src/emails/components/cta-button.tsx    (larger padding, bolder weight)
```

---

## Definition of Done

- [ ] Zero instances of `\u2014`, `\u2192`, `\u2013`, `\u2713` as literal text in any rendered email
- [ ] All em dashes render as `—` (the actual character)
- [ ] All right arrows render as `→`
- [ ] All checkmarks render as `✓`
- [ ] All email headings are 28px / font-weight 800 / letter-spacing -0.03em
- [ ] Header has gradient background `linear-gradient(135deg, #5B21B6, #4C1D95)`
- [ ] Header has "Marketing Intelligence Platform" tagline in faint white
- [ ] Stat boxes in Email 3 show 36px / 800 weight numbers
- [ ] Lumi insight box has 4px solid left border and #F4F2FF background
- [ ] Feature cards in Email 4 have 4px left border + rounded right corners
- [ ] Chat bubbles in Email 4 use float layout (user right, AI left)
- [ ] Email 5 starts with "One week in — honest question" heading
- [ ] Email 5 checklist renders as styled rows (not a flat paragraph)
- [ ] All buttons are 16px / font-weight 700 / padding 16px 36px
- [ ] Body text is #374151 (not #6B7280) for better readability
- [ ] All 5 emails have meaningful `<Preview>` text
- [ ] Footer shows "Unsubscribe · Oltaflock AI · oltaflock.ai" in one clean line
- [ ] Test all 5 emails in React Email dev server (`npx email dev --dir src/emails`) before pushing
