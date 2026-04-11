# Lumnix — Marketing Intelligence Platform
**Product Vision + Architecture + Phase 1 Roadmap**
*April 2026 | Oltaflock AI*

---

## The One-Liner

Lumnix is the AI-powered marketing intelligence platform that unifies your Google Search Console, Google Analytics 4, Google Ads, and Meta Ads into one dashboard — with AI insights, anomaly detection, and competitor ad intelligence that native platforms can't provide.

---

## 1. The Problem

Today, a D2C brand or small agency running real marketing operations needs 5–8 separate tools:

| Job to be done | Current tool | Monthly cost |
|---|---|---|
| Ad competitor intelligence / swipe files | Atria, Foreplay | $129–479 |
| SEO analytics | Ahrefs, Semrush | $99–249 |
| Web analytics | GA4 (free but confusing) | $0 + hours |
| Paid ads analytics | Native dashboards (fragmented) | $0 + hours |
| AI marketing insights | Jasper, Copy.ai | $39–99 |
| Reporting | Google Sheets / manual | $0 + sanity |

**Total: $300–900+/mo** across tools that don't talk to each other. Nobody connects organic and paid data in a single view. Nobody tells you what your competitors are running and why it's working.

---

## 2. What Lumnix Does (Phase 1 Scope)

Lumnix Phase 1 is a focused, production-ready marketing intelligence platform with eight core feature areas:

### Feature 1: Unified Analytics Dashboard
- All data sources in one Command Center
- Sessions (GA4), Organic Clicks (GSC), Ad Spend (Google Ads + Meta Ads), ROAS — in a single row
- Organic vs Paid traffic trend chart overlaid
- Top keywords from GSC
- AI Anomaly detection: automatically surfaces when something meaningful changes (traffic drops, sync failures, spend spikes)

### Feature 2: SEO Intelligence (Google Search Console)
- Full GSC data sync — queries, pages, clicks, impressions, CTR, position
- Performance over time charts
- Top queries + top pages tables (sortable)
- Device breakdown
- Keyword gap opportunities

### Feature 3: Web Analytics (Google Analytics 4)
- Full GA4 sync — sessions, users, pageviews, bounce rate, session duration
- Traffic source breakdown: organic, paid, direct, referral
- Top pages by sessions
- Conversion tracking

### Feature 4: Paid Ads Analytics (Google Ads + Meta Ads)
- Google Ads: campaigns, spend, clicks, impressions, CTR, CPC, ROAS
- Meta Ads: campaigns, spend, impressions, CPM, CTR, conversions, ROAS
- Spend over time charts per platform
- Campaign-level performance tables

### Feature 5: Competitor Ad Spy
- User enters a competitor's name, website URL, or Facebook page URL
- Smart brand resolution: searches Meta Ad Library, shows visual confirmation modal (profile picture + ad count) before saving
- Pulls all active ads for confirmed competitors via Meta Ad Library API
- Longevity-based performance signal: ads running 90+ days = Winning, 180+ days = Top Performer
- AI-powered creative brief: Claude analyzes all winning ads and outputs hook patterns, pain points, offer structures, and 5 specific content angles to test
- Auto re-scrapes every 48 hours via cron job

### Feature 6: AI Assistant (Lumi)
- Chat interface powered by Claude (claude-sonnet-4-6)
- Full cross-channel context: pulls live data from GA4, GSC, Google Ads, Meta Ads before every response
- Quick-action prompts on empty state: "Summarize my performance this week", "What should I focus on today?", "Compare organic vs paid this month", "What are my top performing keywords?"
- Streaming responses
- Understands your actual workspace data — not generic advice

### Feature 7: Reports
- Client-ready marketing performance reports
- PDF export
- White-label reports (Growth + Agency plans)

### Feature 8: Alerts
- Traffic alerts (spike or drop detection)
- Ad alerts (budget exhaustion, CPC spikes, ROAS drops)
- Weekly digest email
- Monthly report delivery
- Custom alert rules with metric thresholds

---

## 3. Current App State (April 2026)

### What is live

| Feature | Status |
|---|---|
| Auth (email + Google OAuth) | ✅ Live |
| Workspace multi-tenancy | ✅ Live |
| GSC integration + sync | ✅ Live |
| GA4 integration + sync | ✅ Live |
| Meta Ads OAuth + sync | ✅ Live |
| Google Ads integration | 🔧 Awaiting developer token approval |
| Dashboard Command Center | ✅ Live |
| SEO page | ✅ Live |
| Analytics page | ✅ Live |
| Google Ads page | ✅ Live |
| Meta Ads page | ✅ Live |
| AI Assistant | ✅ Live |
| Competitor Ad Spy | 🔧 In progress |
| Reports | 🔧 Placeholder |
| Alerts | ✅ Live |
| Settings (all tabs) | ✅ Live |
| Billing page | ✅ Live |
| Light / Dark mode | ✅ Live |

---

## 4. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Fonts | Plus Jakarta Sans (display/headings) + DM Sans (body) |
| Charts | Recharts |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Supabase Postgres + Row Level Security |
| AI — Chat | OpenAI GPT-4o-mini (streaming) |
| AI — Competitor Analysis | Anthropic Claude claude-sonnet-4-6 |
| Deployment | Vercel |
| APIs | GSC API, GA4 Data API, Google Ads API v17, Meta Marketing API v19, Meta Ad Library API |

---

## 5. Database Schema

All tables in Supabase Postgres with RLS.

| Table | Purpose |
|---|---|
| `workspaces` | Multi-tenant workspace per user |
| `workspace_members` | Workspace roles (owner / admin / member) |
| `integrations` | Connected providers + status + last sync |
| `oauth_tokens` | OAuth access / refresh tokens |
| `gsc_data` | Raw GSC rows (query, page, clicks, impressions, position, date) |
| `ga4_data` | Raw GA4 metric rows (metric_type, dimension, value, date) |
| `analytics_data` | JSONB store for Google Ads + Meta Ads campaign data |
| `sync_jobs` | Audit log of all sync runs (status, rows synced, errors) |
| `competitors` | Tracked competitor domains + Meta page IDs + scrape status |
| `competitor_ads` | Scraped ads from Meta Ad Library with longevity classification |
| `competitor_briefs` | Claude-generated creative briefs per competitor |

---

## 6. Brand System

| Token | Value | Usage |
|---|---|---|
| Primary | `#7C3AED` | All CTAs, active nav, links, badges, interactive elements |
| Primary Hover | `#6D28D9` | Button hover state |
| Accent | `#0891B2` | Chart accent line only — not used on buttons |
| Sidebar BG (dark) | `#0F172A` | Sidebar background in dark mode |
| Card BG (dark) | `#1E293B` | Cards, panels in dark mode |
| Page BG (light) | `#F8FAFC` | Light mode page canvas |
| Page BG (dark) | `#0F172A` | Dark mode page canvas |

### Font rules (enforced globally)
- **Plus Jakarta Sans**: page titles, section headings, card titles, metric numbers
- **DM Sans**: body text, descriptions, table cells, nav items, button labels, metadata, form inputs
- No Inter, no system-ui on any visible text element
- `-webkit-font-smoothing: antialiased` applied globally

### Dark mode text minimums
- Nav item text: minimum `#CBD5E1`
- Body / description text: minimum `#CBD5E1`
- Muted / metadata text: minimum `#94A3B8`
- Never use below `#475569` for any visible text in dark mode

---

## 7. Pricing (INR)

| Plan | Price | Integrations | Data Retention | Team Members | AI Features |
|---|---|---|---|---|---|
| **Free** | ₹0/mo | 2 | 30 days | 2 | Basic insights |
| **Starter** | ₹2,499/mo | 4 | 90 days | 5 | AI insights, PDF reports |
| **Growth** | ₹6,499/mo | All | 1 year | 15 | AI insights + chat, White-label reports, Competitor tracking |
| **Agency** | ₹16,499/mo | Unlimited | Unlimited | Unlimited | Everything in Growth + Multi-workspace, Priority support, API access |

### Billing page rules
- All 4 plans display in a single horizontal row on desktop (`grid-template-columns: repeat(4, 1fr)`)
- Growth card has "Most Popular" badge in brand purple `#7C3AED`
- Free plan → "Free" button (disabled/outline)
- Starter / Growth → "Upgrade" button (primary purple)
- Current plan → "Current Plan" button (disabled gray)
- Coupon code input + "Redeem" button at bottom of billing page
- All prices in ₹ INR with `/mo` suffix

---

## 8. Navigation Structure

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

**Not in Phase 1 nav:** Creative Studio, Campaigns, Attribution. These are removed from the UI entirely. Database tables may be retained for future use.

---

## 9. Settings Page Structure

| Tab | Contents |
|---|---|
| General | Workspace name + ID, Profile (name, email, company) |
| Brand | Brand name, logo upload, brand color picker |
| Integrations | GSC, GA4, Google Ads, Meta Ads — status, last sync, Sync Now, Connect/Disconnect |
| Team | Plan seat usage, invite by email, member list with role management |
| Alerts | Traffic / Ad / Weekly / Monthly toggles, custom alert rules |
| Billing | Plan cards (4-column), coupon code |

**No Slack integration in Phase 1.**

---

## 10. Sidebar Spec

- Always expanded — `220px` fixed width, never collapses
- Dark mode background: `#0F172A`
- Light mode background: `#FFFFFF` with `1px solid #E2E8F0` right border
- Nav item default text: `#CBD5E1` (dark) / `#374151` (light)
- Nav item active: left border `3px solid #7C3AED`, background `rgba(124,58,237,0.18)`, text `#FFFFFF`
- Section labels (ANALYTICS, ADVERTISING, INTELLIGENCE): `10px` uppercase, `#6B7280`

---

## 11. Phase 1 Definition of Done

Every item below must be complete before Phase 2 begins.

### Data & sync
- [ ] All 4 providers sync automatically via cron
- [ ] Token refresh works reliably for all 4 providers
- [ ] Retry logic (3 attempts, exponential backoff) on all sync routes
- [ ] Sync errors logged to `sync_jobs` with readable messages
- [ ] `unified_metrics` Postgres view normalizes all 4 sources

### Dashboard
- [ ] Metric cards show real data — Sessions, Organic Clicks, Ad Spend, ROAS
- [ ] ROAS shows `—` not `0.00x` when no revenue data exists
- [ ] Anomaly detection runs on real data (not hardcoded placeholder text)
- [ ] Organic vs Paid chart renders correctly with labeled lines
- [ ] Top keywords pulls from live GSC data

### Feature pages
- [ ] Analytics (GA4): metrics, chart, top pages, traffic sources
- [ ] SEO (GSC): metrics, chart, top queries, top pages
- [ ] Google Ads: connected state shows campaign data, disconnected shows connect CTA
- [ ] Meta Ads: same as Google Ads
- [ ] AI Assistant: chat bubbles visible in dark mode, quick-action prompts on empty state, cross-channel context works
- [ ] Competitor Ad Spy: full flow (add → resolve → scrape → display ads → generate brief) works end to end
- [ ] Reports: clean placeholder with "coming soon" message
- [ ] Alerts: real anomaly alerts, mark as read/dismiss
- [ ] Settings: all 6 tabs work correctly, all buttons are purple, no blue anywhere

### UI / UX
- [ ] Sidebar always 220px, no collapse
- [ ] Dark mode text minimum `#CBD5E1` across all pages
- [ ] All page titles: Plus Jakarta Sans 700
- [ ] All body text: DM Sans 400
- [ ] No blue buttons anywhere (`#7C3AED` only for all CTAs)
- [ ] Light/dark mode toggle switches entire app
- [ ] Billing: 4 pricing plans in one row on desktop
- [ ] All integration cards have properly spaced buttons (no overflow)
- [ ] Empty states consistent across all unconnected integration pages

### Onboarding
- [ ] New user → workspace → connect integrations → first sync → dashboard works in under 5 minutes
- [ ] At least 1 source connected before "Go to Dashboard" is available

---

## 12. Phase 2 Preview

After Phase 1 ships and reaches 20 paying users:

- **Creative Studio**: AI ad copy generator, video script generator, creative brief generator powered by GSC + GA4 data + Competitor Ad Spy insights
- **Campaign Launcher**: Create and launch Meta + Google Ads campaigns directly from Lumnix. Batch creative upload. A/B test management.
- **Attribution Engine**: First-party pixel (`lmnx.js`), multi-touch attribution models, creative-level revenue attribution, cross-channel funnel view
- **Lumi Agent v2**: Daily briefings, proactive recommendations, automated actions with approval queue, automation rules

---

## 13. Long-Term Vision

**Year 1:** Full-stack marketing platform for D2C brands and agencies. All five pillars live. 100 paying customers.

**Year 2:** Lumi runs your marketing autonomously. "Set your budget, describe your customer, Lumi does the rest."

**Year 3:** Lumnix is the operating system for marketing. Plug in your product, Lumnix handles the entire funnel — keyword research → content → ads → optimization → reporting.

**The end state: marketing as a service, powered by AI, for the price of a single tool.**

---

*Built by Oltaflock AI — making enterprise-grade marketing accessible to everyone.*
*Live: https://lumnix-ai.vercel.app*
*GitHub: https://github.com/khush0030/lumnix*
