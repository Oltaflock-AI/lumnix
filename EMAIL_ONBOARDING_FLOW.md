# Lumnix — Email Onboarding Flow
**Complete Spec for Claude Code Agent**
*April 2026 | Oltaflock AI*

---

## Context

Read `README.md` and `CLAUDE_CODE_MASTER.md` before starting. This document covers the complete email onboarding sequence for new Lumnix users — 5 emails across 7 days, sent via Resend, with full HTML templates branded in Lumnix colors.

---

## Tech Stack for Email

- **Email provider:** Resend (https://resend.com) — install with `npm install resend`
- **React Email:** Use `@react-email/components` for HTML email templates — `npm install @react-email/components`
- **Trigger:** Supabase Auth webhook on `user.created` event OR a server-side call after signup
- **Scheduling:** Vercel Cron jobs for delayed emails (Day 2, 3, 5, 7)
- **Tracking:** Store email send status in a new `email_sequences` table

### Environment variables to add
```env
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=lumnix@oltaflock.ai
EMAIL_FROM_NAME=Khush from Lumnix
```

---

## Database Schema

Add this table to Supabase:

```sql
CREATE TABLE IF NOT EXISTS email_sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  -- email_type values:
  -- 'welcome'           Day 0 — sent immediately on signup
  -- 'connect_sources'   Day 1 — connect your first integration
  -- 'first_insight'     Day 2 — your data is ready, here's what we found
  -- 'feature_spotlight' Day 5 — competitor ad spy + AI assistant spotlight
  -- 'checkin'           Day 7 — are you getting value? + tips

  status TEXT DEFAULT 'pending',
  -- 'pending' | 'sent' | 'failed' | 'skipped'

  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON email_sequences(user_id, email_type);
CREATE INDEX ON email_sequences(status, scheduled_for);

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
-- Only service role can read/write this table — no user-facing RLS needed
```

---

## Email Sequence Schedule

| # | Email | Trigger | Send time |
|---|---|---|---|
| 1 | Welcome to Lumnix | User signs up | Immediately (Day 0) |
| 2 | Connect your first data source | Day 1 | 24h after signup |
| 3 | Your data is ready — here's what we found | Day 2 | 48h after signup |
| 4 | Two features most people miss | Day 5 | 5 days after signup |
| 5 | Quick check-in — are you getting value? | Day 7 | 7 days after signup |

---

## API Routes to Build

### 1. Trigger on signup
`POST /api/email/welcome`
Called immediately after user is created (from the signup route or Supabase Auth hook).

```typescript
// src/app/api/email/welcome/route.ts
import { Resend } from 'resend'
import { WelcomeEmail } from '@/emails/welcome'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: Request) {
  const { user_id, email, name, workspace_id } = await req.json()
  const resend = new Resend(process.env.RESEND_API_KEY)
  const now = new Date()

  // Schedule all 5 emails
  const schedule = [
    { type: 'welcome',           delay: 0 },
    { type: 'connect_sources',   delay: 24 * 60 * 60 * 1000 },
    { type: 'first_insight',     delay: 48 * 60 * 60 * 1000 },
    { type: 'feature_spotlight', delay: 5 * 24 * 60 * 60 * 1000 },
    { type: 'checkin',           delay: 7 * 24 * 60 * 60 * 1000 },
  ]

  for (const item of schedule) {
    await supabaseAdmin.from('email_sequences').insert({
      user_id,
      workspace_id,
      email_type: item.type,
      status: 'pending',
      scheduled_for: new Date(now.getTime() + item.delay).toISOString()
    })
  }

  // Send welcome email immediately
  await resend.emails.send({
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: "Welcome to Lumnix — your marketing intelligence is ready",
    react: WelcomeEmail({ name, workspace_id })
  })

  await supabaseAdmin.from('email_sequences')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('user_id', user_id)
    .eq('email_type', 'welcome')

  return Response.json({ ok: true })
}
```

### 2. Cron job — process scheduled emails
`GET /api/cron/emails`
Runs every hour via Vercel Cron.

Add to `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/emails", "schedule": "0 * * * *" }
  ]
}
```

```typescript
// src/app/api/cron/emails/route.ts
export async function GET() {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const now = new Date()

  // Find all pending emails due to be sent
  const { data: pending } = await supabaseAdmin
    .from('email_sequences')
    .select('*, auth.users!inner(email, raw_user_meta_data)')
    .eq('status', 'pending')
    .lte('scheduled_for', now.toISOString())
    .limit(50)

  for (const record of pending ?? []) {
    const email = record.users.email
    const name = record.users.raw_user_meta_data?.full_name || 'there'

    try {
      const { subject, component } = getEmailComponent(record.email_type, { name, workspace_id: record.workspace_id })

      await resend.emails.send({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM}>`,
        to: email,
        subject,
        react: component
      })

      await supabaseAdmin.from('email_sequences')
        .update({ status: 'sent', sent_at: now.toISOString() })
        .eq('id', record.id)

    } catch (err: any) {
      await supabaseAdmin.from('email_sequences')
        .update({ status: 'failed', error_message: err.message })
        .eq('id', record.id)
    }
  }

  return Response.json({ processed: pending?.length ?? 0 })
}

function getEmailComponent(type: string, props: any) {
  const map: Record<string, any> = {
    connect_sources:   { subject: "Connect your first data source — takes 2 minutes", component: ConnectSourcesEmail(props) },
    first_insight:     { subject: "Your Lumnix data is ready — here's what we found", component: FirstInsightEmail(props) },
    feature_spotlight: { subject: "Two features most Lumnix users miss in week one", component: FeatureSpotlightEmail(props) },
    checkin:           { subject: "Quick check-in — is Lumnix working for you?", component: CheckinEmail(props) },
  }
  return map[type]
}
```

---

## Design System for Emails

All emails share the same brand identity. Use these exact values:

```
Background (outer):    #F8F7FC  (lavender page bg)
Email container:       #FFFFFF  max-width 600px, border-radius 16px
Header bar:            #5B21B6  (deep brand purple)
Primary CTA button:    #FF0066  bg, #FFFFFF text
Secondary text:        #6B7280
Border:                #EAE8FF
Accent purple light:   #EDE9FF
Font:                  System stack — 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif
  (React Email supports Google Fonts via <Font> component if needed)

Heading:     24px, font-weight 700, color #18163A
Sub-heading: 18px, font-weight 600, color #18163A
Body:        15px, font-weight 400, color #374151, line-height 1.6
Muted:       13px, color #9CA3AF
CTA button:  padding 14px 28px, border-radius 10px, font-size 15px, font-weight 600
```

---

## Email Templates

Create all templates in `src/emails/` directory.

---

### Email 1: Welcome (Day 0)
**File:** `src/emails/welcome.tsx`
**Subject:** `Welcome to Lumnix — your marketing intelligence is ready`

```tsx
import {
  Html, Head, Body, Container, Section, Row, Column,
  Heading, Text, Button, Img, Hr, Link, Font
} from '@react-email/components'

interface WelcomeEmailProps {
  name: string
  workspace_id: string
}

export function WelcomeEmail({ name, workspace_id }: WelcomeEmailProps) {
  const dashboardUrl = `https://lumnix-ai.vercel.app/dashboard`

  return (
    <Html>
      <Head>
        <Font
          fontFamily="DM Sans"
          fallbackFontFamily="Arial"
          webFont={{ url: 'https://fonts.gstatic.com/s/dmsans/v11/rP2Hp2ywxg089UriCZOIHQ.woff2', format: 'woff2' }}
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Body style={{ backgroundColor: '#F8F7FC', margin: '0', padding: '40px 0', fontFamily: "'DM Sans', Arial, sans-serif" }}>
        <Container style={{ maxWidth: '600px', margin: '0 auto' }}>

          {/* HEADER */}
          <Section style={{ backgroundColor: '#5B21B6', borderRadius: '16px 16px 0 0', padding: '28px 40px' }}>
            <Row>
              <Column>
                <table cellPadding={0} cellSpacing={0}>
                  <tr>
                    <td>
                      <div style={{ width: '32px', height: '32px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '9px', display: 'inline-block', textAlign: 'center', lineHeight: '32px', fontSize: '16px', fontWeight: '700', color: '#FFFFFF', marginRight: '10px', verticalAlign: 'middle' }}>L</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '18px', fontWeight: '700', color: '#FFFFFF', verticalAlign: 'middle' }}>Lumnix</span>
                    </td>
                  </tr>
                </table>
              </Column>
            </Row>
          </Section>

          {/* BODY */}
          <Section style={{ backgroundColor: '#FFFFFF', padding: '40px 40px 32px', borderLeft: '1px solid #EAE8FF', borderRight: '1px solid #EAE8FF' }}>
            <Heading style={{ fontSize: '26px', fontWeight: '700', color: '#18163A', margin: '0 0 12px', lineHeight: '1.3' }}>
              Welcome to Lumnix, {name} 🎉
            </Heading>
            <Text style={{ fontSize: '15px', color: '#374151', lineHeight: '1.7', margin: '0 0 24px' }}>
              Your marketing intelligence platform is ready. You're about to stop switching between 5 different dashboards and start seeing your entire marketing picture in one place.
            </Text>

            {/* FEATURE LIST */}
            <Section style={{ backgroundColor: '#F8F7FC', borderRadius: '12px', padding: '20px 24px', marginBottom: '28px' }}>
              <Text style={{ fontSize: '13px', fontWeight: '600', color: '#5B21B6', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px' }}>WHAT'S WAITING FOR YOU</Text>

              {[
                { icon: '📊', title: 'Unified Analytics', desc: 'GA4 + GSC + Google Ads + Meta Ads in one view' },
                { icon: '🤖', title: 'AI Assistant (Lumi)', desc: 'Ask anything about your marketing data' },
                { icon: '🕵️', title: 'Competitor Ad Spy', desc: 'See what ads your competitors are running — and why they work' },
                { icon: '🚨', title: 'Smart Alerts', desc: 'Get notified when traffic drops or anomalies are detected' },
              ].map((item, i) => (
                <Row key={i} style={{ marginBottom: '12px' }}>
                  <Column style={{ width: '36px', verticalAlign: 'top', paddingTop: '2px' }}>
                    <Text style={{ fontSize: '18px', margin: '0' }}>{item.icon}</Text>
                  </Column>
                  <Column>
                    <Text style={{ fontSize: '14px', fontWeight: '600', color: '#18163A', margin: '0 0 2px' }}>{item.title}</Text>
                    <Text style={{ fontSize: '13px', color: '#6B7280', margin: '0' }}>{item.desc}</Text>
                  </Column>
                </Row>
              ))}
            </Section>

            {/* CTA */}
            <Section style={{ textAlign: 'center', marginBottom: '28px' }}>
              <Button
                href={dashboardUrl}
                style={{ backgroundColor: '#FF0066', color: '#FFFFFF', padding: '14px 32px', borderRadius: '10px', fontSize: '15px', fontWeight: '600', textDecoration: 'none', display: 'inline-block' }}
              >
                Open Your Dashboard →
              </Button>
            </Section>

            <Text style={{ fontSize: '14px', color: '#6B7280', lineHeight: '1.6', margin: '0 0 8px' }}>
              Your first step: connect at least one data source in <Link href={`${dashboardUrl}/settings?tab=integrations`} style={{ color: '#FF0066' }}>Settings → Integrations</Link>. It takes about 2 minutes and unlocks everything.
            </Text>
          </Section>

          {/* FOOTER */}
          <Section style={{ backgroundColor: '#F8F7FC', borderRadius: '0 0 16px 16px', padding: '24px 40px', border: '1px solid #EAE8FF', borderTop: 'none', textAlign: 'center' }}>
            <Text style={{ fontSize: '12px', color: '#9CA3AF', margin: '0 0 6px' }}>
              You're receiving this because you signed up for Lumnix.
            </Text>
            <Text style={{ fontSize: '12px', color: '#9CA3AF', margin: '0' }}>
              Oltaflock AI · <Link href="https://oltaflock.ai" style={{ color: '#FF0066' }}>oltaflock.ai</Link>
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
```

---

### Email 2: Connect Sources (Day 1)
**File:** `src/emails/connect-sources.tsx`
**Subject:** `Connect your first data source — takes 2 minutes`

Structure:
- Header: same purple bar
- Hero text: "Your dashboard is ready — but it needs data"
- Bold subheading: "Connect in 2 minutes"
- 4 integration cards in a 2×2 grid, each showing:
  - Integration logo placeholder (colored square with initial)
  - Integration name
  - What it unlocks
  - "Connect →" link to /dashboard/settings?tab=integrations
- Priority order: GSC first (free, easy), then GA4, then Meta Ads, then Google Ads
- CTA button: "Connect your first source →"
- Reassurance text: "OAuth only — we never store your passwords. Disconnect anytime."

```tsx
// Integration cards data
const integrations = [
  {
    initial: 'G',
    bg: '#34A853',
    name: 'Google Search Console',
    what: 'See which keywords bring you traffic, your rankings, and quick win opportunities',
    priority: '⭐ Start here'
  },
  {
    initial: 'GA',
    bg: '#E37400',
    name: 'Google Analytics 4',
    what: 'Sessions, users, traffic sources, top pages, and conversion data',
    priority: 'Most popular'
  },
  {
    initial: 'M',
    bg: '#1877F2',
    name: 'Meta Ads',
    what: 'Campaign spend, ROAS, impressions, CTR across Facebook & Instagram',
    priority: ''
  },
  {
    initial: 'G',
    bg: '#4285F4',
    name: 'Google Ads',
    what: 'Keyword campaigns, spend, conversions, and ROAS tracking',
    priority: ''
  },
]

// Each card style:
// border: 1px solid #EAE8FF, border-radius 10px, padding 16px
// Logo: 36px circle with bg color, white initial letter
// Name: 14px 600 #18163A
// What: 13px #6B7280
// Priority badge: "⭐ Start here" in bg #FEF3C7 color #92400E, or "Most popular" in bg #EDE9FF color #5B21B6
```

---

### Email 3: First Insight (Day 2)
**File:** `src/emails/first-insight.tsx`
**Subject:** `Your Lumnix data is ready — here's what we found`

This email is dynamic — it pulls real data from the user's workspace and includes actual numbers.

```typescript
// In the cron route, before sending this email, fetch:
const { data: gscData } = await supabaseAdmin
  .from('gsc_data')
  .select('clicks, impressions, position')
  .eq('workspace_id', record.workspace_id)
  .order('clicks', { ascending: false })
  .limit(5)

const { data: ga4Data } = await supabaseAdmin
  .from('ga4_data')
  .select('metric_type, value')
  .eq('workspace_id', record.workspace_id)
  .eq('metric_type', 'sessions')

const topKeyword = gscData?.[0]
const totalSessions = ga4Data?.reduce((sum, r) => sum + (r.value || 0), 0) ?? 0
const hasData = (gscData?.length ?? 0) > 0 || totalSessions > 0
```

Structure:
- If `hasData = true`: Show real numbers prominently
  - Hero stat: "Your top keyword '[keyword]' is ranking at position [X]"
  - Stat cards: Total clicks this month, Total sessions, Top keyword
  - Each stat in a styled box: Plus Jakarta Sans 700 28px number, muted label
  - AI insight blurb: "Based on your data, here's what Lumi sees: [generated insight text]"
    - Keep this template-based for now, not actual AI — use conditional logic:
      - If position < 5: "You're already ranking on page 1 for key terms. Focus on CTR optimization."
      - If sessions > 1000: "Strong organic traffic. Your paid and organic data are now unified."
      - Default: "Your data pipeline is healthy. Check your dashboard for full insights."

- If `hasData = false` (user hasn't synced yet):
  - Friendly nudge: "Your dashboard is ready but we haven't seen your data yet"
  - Single CTA: "Sync your data now →" → /dashboard/settings?tab=integrations
  - Reassurance: "It takes about 30 seconds once you've connected"

- Footer CTA: "See your full dashboard →"

---

### Email 4: Feature Spotlight (Day 5)
**File:** `src/emails/feature-spotlight.tsx`
**Subject:** `Two features most Lumnix users miss in week one`

Structure:
- Opening: "You've had Lumnix for 5 days. Here are 2 features that usually take people a month to discover."

- Feature 1: Competitor Ad Spy
  ```
  Section bg: #F8F7FC, border-radius 12px, padding 20px, border-left 3px solid #FF0066
  
  Label: "FEATURE 01" — 10px uppercase #FF0066 letter-spacing .07em
  Title: "Competitor Ad Spy" — 18px 700 #18163A
  Body: "Add any competitor's name or website and we'll pull every Meta ad they're running.
         We flag ads that have been running 90+ days — those are their winners.
         Then our AI tells you exactly what hooks, pain points, and offers they're using,
         so you know what to make before you spend a rupee on creative."
  CTA link: "Try it → lumnix-ai.vercel.app/dashboard/competitors"
  ```

- Divider: thin #EAE8FF line

- Feature 2: AI Assistant (Lumi)
  ```
  Same section style but border-left 3px solid #059669
  
  Label: "FEATURE 02" — 10px uppercase #059669
  Title: "Ask Lumi anything"
  Body: "Lumi knows your GA4, GSC, Google Ads, and Meta Ads data.
         Try asking: 'What should I focus on this week?'
         Or: 'Why did my traffic drop last Tuesday?'
         Or: 'Compare my organic vs paid performance this month.'
         It's not a generic AI — it knows YOUR numbers."
  CTA link: "Chat with Lumi → lumnix-ai.vercel.app/dashboard/ai-assistant"
  
  Chat bubble mockup (HTML table):
    User bubble (right): bg #FF0066, color white, 13px, border-radius 18px 18px 4px 18px, padding 10px 14px
    Text: "What should I focus on this week?"
    
    Lumi bubble (left): bg #F4F2FF, color #18163A, same border-radius mirrored
    Text: "Based on your data, I'd focus on optimizing your meta titles for 'soya mini chunks' — 190 impressions and 0% CTR is a big opportunity sitting on page 1..."
  ```

- Main CTA: "Open Lumnix →"

---

### Email 5: Check-in (Day 7)
**File:** `src/emails/checkin.tsx`
**Subject:** `Quick check-in — is Lumnix working for you?`

This is a personal-feeling, plain-text-style email. Less designed, more human.

Structure:
- Keep it short. One column, minimal styling.
- Header: same purple bar with logo
- Body (plain conversational tone):

  ```
  Hey {name},

  You've been using Lumnix for a week now — and I wanted to check in personally.

  Are you getting value? Are there features you can't find? Is anything confusing?

  Here's what most people find most useful in week one:
  
  ✓ SEO Quick Wins — keywords you rank for but have 0 clicks (free traffic sitting there)
  ✓ Competitor Ad Spy — see which ads your competitors have been running for 90+ days
  ✓ AI Assistant — ask Lumi to summarize your week in 30 seconds
  
  If you haven't connected your data sources yet, here's a direct link:
  [Connect in Settings →]
  
  And if you've run into any issues, or just want to share feedback, 
  just reply to this email — I read every response personally.

  — Khush
  Founder, Lumnix / Oltaflock AI
  ```

- Signature block:
  ```
  Khush Mutha
  Founder, Lumnix
  📧 khush@oltaflock.ai
  🌐 lumnix-ai.vercel.app
  ```

- Two CTAs side by side:
  - "Open Dashboard →" (purple button)
  - "Give feedback" (outline button, mailto:khush@oltaflock.ai)

---

## Email Component Shared Layout

Create a shared layout component used by all emails:

**File:** `src/emails/components/email-layout.tsx`

```tsx
interface EmailLayoutProps {
  children: React.ReactNode
  previewText?: string
}

// Structure:
// <Html> → <Head> (fonts) → <Preview> (previewText) → <Body>
//   → outer bg #F8F7FC, padding 40px 0
//   → <Container> maxWidth 600px
//     → Purple header bar (always same)
//     → White content section (children go here)
//     → Gray footer (always same)
```

**File:** `src/emails/components/email-header.tsx`
```tsx
// Purple bar: bg #5B21B6, border-radius 16px 16px 0 0, padding 28px 40px
// Logo: "L" in semi-transparent white box + "Lumnix" text white
// Always identical across all 5 emails
```

**File:** `src/emails/components/email-footer.tsx`
```tsx
// bg #F8F7FC, border 1px solid #EAE8FF, border-top none
// border-radius 0 0 16px 16px, padding 24px 40px, text-align center
// "You're receiving this because you signed up for Lumnix."
// "Unsubscribe" link (add unsubscribe functionality)
// "Oltaflock AI · oltaflock.ai"
// All text: 12px #9CA3AF
```

**File:** `src/emails/components/cta-button.tsx`
```tsx
// Primary: bg #FF0066, color #FFF, padding 14px 32px, border-radius 10px, 15px 600
// Secondary/outline: bg transparent, border 2px solid #FF0066, color #FF0066, same sizing
```

---

## Unsubscribe Handling

Add an unsubscribe endpoint and track it:

```typescript
// src/app/api/email/unsubscribe/route.ts
// GET /api/email/unsubscribe?user_id=xxx&token=xxx
// Add an 'email_preferences' table or a column on auth.users metadata
// Set email_opted_out = true
// Show a simple confirmation page: "You've been unsubscribed from Lumnix marketing emails."
// Check this flag in the cron route before sending any email
```

Add to email footer:
```tsx
<Link href={`https://lumnix-ai.vercel.app/api/email/unsubscribe?user_id=${userId}`}>
  Unsubscribe
</Link>
```

---

## Testing Emails Locally

Use React Email's dev server:
```bash
npm install -D @react-email/cli
npx email dev --dir src/emails
```

This opens http://localhost:3000 showing all email templates with a live preview.

To send a test email:
```bash
curl -X POST http://localhost:3000/api/email/welcome \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test","email":"khush@oltaflock.ai","name":"Khush","workspace_id":"test"}'
```

---

## Signup Flow Integration

In the existing signup/auth route, add the welcome email trigger after workspace creation:

```typescript
// Wherever the workspace is created after OAuth or email signup:
await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/welcome`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'there',
    workspace_id: workspace.id
  })
})
```

---

## Sequence Summary

```
Day 0 — WELCOME
  Subject: "Welcome to Lumnix — your marketing intelligence is ready"
  Goal: Delight, orient, drive first login
  CTA: Open your dashboard

Day 1 — CONNECT
  Subject: "Connect your first data source — takes 2 minutes"
  Goal: Activation — get at least 1 integration connected
  CTA: Connect your first source

Day 2 — FIRST INSIGHT
  Subject: "Your Lumnix data is ready — here's what we found"
  Goal: Show value from their actual data
  CTA: See your full dashboard
  Dynamic: Shows real keyword/session data if available

Day 5 — FEATURES
  Subject: "Two features most Lumnix users miss in week one"
  Goal: Drive Competitor Ad Spy + AI Assistant usage
  CTA: Try Competitor Ad Spy / Chat with Lumi

Day 7 — CHECK-IN
  Subject: "Quick check-in — is Lumnix working for you?"
  Goal: Feedback collection + re-engagement
  CTA: Open dashboard + Give feedback (reply to email)
```

---

## Definition of Done

- [ ] `email_sequences` table created with correct columns and RLS
- [ ] `RESEND_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME` added to env vars
- [ ] `POST /api/email/welcome` creates all 5 sequence records + sends Email 1 immediately
- [ ] `GET /api/cron/emails` processes pending emails, marks sent/failed
- [ ] Vercel cron configured to run `/api/cron/emails` every hour
- [ ] All 5 email templates built in `src/emails/`
- [ ] Shared layout, header, footer, and CTA button components created
- [ ] Email 3 (First Insight) fetches real workspace data before rendering
- [ ] Unsubscribe endpoint built and linked in every email footer
- [ ] Unsubscribe flag checked before sending any scheduled email
- [ ] All emails tested via React Email dev server
- [ ] Sender name shows "Khush from Lumnix" not a no-reply address
- [ ] All email brand colors match: header #5B21B6, CTA #FF0066, bg #F8F7FC, card bg #FFFFFF
