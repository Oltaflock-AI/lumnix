# Lumnix — 4-Week Sprint Plan

**Goal:** Beta to agency early users by end of Week 1 (April 11). Full v1 in 4 weeks.

---

## The Compressed Timeline

| Week | Focus | What ships |
|---|---|---|
| **Week 1 (Apr 7–11)** | Beta polish | Agencies can sign up, connect accounts, see unified data, get AI insights |
| **Week 2 (Apr 14–18)** | Creative Studio MVP | Swipe file + AI ad copy/script generation |
| **Week 3 (Apr 21–25)** | Campaign Launcher + Attribution v1 | Launch ads from Lumnix + basic pixel |
| **Week 4 (Apr 28–May 2)** | Lumi Agent + Agency features | AI daily briefings + white-label + billing |

---

## WEEK 1: BETA READY (April 7–11)

The goal is simple: an agency signs up, connects their client's GSC + GA4 + Meta Ads + Google Ads, sees everything in one place, and says "holy shit this is useful."

### Day 1–2 (Mon–Tue): Foundation fixes

**Task 1: Reliable automated syncs**
Your cron job at `/api/cron/sync` only handles GSC and GA4. Google Ads and Meta Ads are manual-only.
- Add Google Ads + Meta Ads to the cron sync loop
- Add retry logic (3 attempts with exponential backoff) to all sync routes
- Add proper error notifications (log to `sync_jobs` with detailed error messages)
- Test token refresh flow for all 4 providers end-to-end

**Task 2: Unified data view**
Right now GSC and GA4 have their own normalized tables, but Google Ads and Meta Ads dump JSONB into `analytics_data`. This means you can't query across them easily.
- Create a `unified_metrics` Postgres view that normalizes all 4 sources into: `date, source, metric_name, metric_value, dimension_name, dimension_value`
- Build a single `/api/data/unified` endpoint that queries this view
- Support filtering by: date range, source, metric type

**Task 3: Onboarding flow polish**
- New user → create workspace → connect integrations → first sync → dashboard
- Make sure this flow works end-to-end without errors
- Add loading states and success/error feedback for each connection
- Auto-trigger first sync after OAuth callback completes

### Day 3–4 (Wed–Thu): Dashboard that impresses

**Task 4: Command Center homepage**
Replace/upgrade the current dashboard with a unified "Command Center":
- Top metrics row: total sessions, total clicks, total ad spend, total revenue (all sources combined)
- Trend charts: overlay organic traffic vs paid traffic over time
- Quick insights: "Your organic traffic is up 12% but paid ROAS dropped 8%"
- Integration status: which sources are connected, last sync time, any errors
- This is the first thing an agency sees — it needs to look sharp

**Task 5: Cross-channel insights in AI chat**
Your chat endpoint already pulls GA4 + GSC context. Extend it:
- Add Google Ads and Meta Ads data to the chat context
- Add cross-channel prompts: "Compare my organic vs paid performance this month"
- Add a "Quick insights" button that auto-generates a summary without the user typing

### Day 5 (Fri): Beta launch prep

**Task 6: Beta access flow**
- Landing page or simple signup gate for beta users
- Invitation mechanism: generate invite codes or just whitelist emails
- Welcome email with setup instructions
- Simple feedback mechanism (even just a "Give feedback" link to a Typeform or email)

**Task 7: Test everything end-to-end**
- Create a fresh account, go through full onboarding
- Connect all 4 data sources
- Verify syncs complete and data shows correctly
- Test AI chat with real cross-channel data
- Fix any bugs found

---

## WEEK 2: CREATIVE STUDIO (April 14–18)

### Task 8: Meta Ad Library integration
- Scrape/query Meta Ad Library API for competitor ads
- You already have competitor scraping at `/api/competitors/scrape` — extend it:
  - Store ad creatives (images/videos) in Supabase Storage
  - Track ad longevity (how long it's been running = proxy for performance)
  - AI auto-tag each ad: hook type, format, visual style, CTA, messaging angle

### Task 9: Swipe file UI
- Board-based interface: create boards, save ads to boards, search/filter
- AI-powered search: "show me UGC testimonial ads in the beauty niche"
- One-click save from the competitor ad library to personal boards

### Task 10: AI creative generation
- Ad copy generator: input brand context + choose framework (AIDA, PAS, hook-body-CTA)
- Pull from workspace data: "Your top SEO keyword is X and your best-performing ad angle is Y — here are 5 ad concepts combining both"
- Video script generator with framework templates
- Creative brief generator: auto-generate weekly creative briefs based on performance data

### Task 11: New database tables
```sql
creative_boards (id, workspace_id, name, description, created_at)
creative_saves (id, board_id, workspace_id, source_type, source_id, notes, tags[], created_at)
generated_creatives (id, workspace_id, type, prompt, output, framework, metadata, created_at)
```

---

## WEEK 3: CAMPAIGN LAUNCHER + ATTRIBUTION (April 21–25)

### Task 12: Meta campaign launcher
- Use Meta Marketing API to create campaigns directly from Lumnix
- Flow: select creative(s) → set targeting → set budget → launch
- Batch mode: upload 5 creatives, create 5 ads in one go
- Link to generated/saved creatives from Creative Studio

### Task 13: Google Ads campaign launcher
- Create Search campaigns via Google Ads API
- Pull keyword suggestions from GSC data (cross-layer intelligence!)
- Basic campaign builder: keywords → ad copy → budget → launch

### Task 14: First-party pixel (lmnx.js)
- Lightweight JS snippet users add to their site
- Tracks: page views, UTM parameters, referrer, device, conversions
- Event collection endpoint: `POST /api/pixel/collect`
- Store in `pixel_events` table

### Task 15: Basic attribution
- Stitch touchpoints per visitor: ad click → site visit → conversion
- Multi-touch models: first click, last click, linear
- Creative-level attribution: which ad creative → which conversions
- Simple attribution dashboard

### Task 16: New database tables
```sql
campaigns_managed (id, workspace_id, platform, platform_campaign_id, name, status, budget, created_at)
pixel_events (id, workspace_id, visitor_id, event_type, page_url, referrer, utm_*, device, created_at)
attribution_touchpoints (id, workspace_id, visitor_id, channel, campaign_id, creative_id, timestamp)
attribution_conversions (id, workspace_id, visitor_id, conversion_type, value, attributed_to, model, created_at)
```

---

## WEEK 4: LUMI AGENT + AGENCY + BILLING (April 28–May 2)

### Task 17: Lumi daily briefings
- Cron job: every morning, generate a briefing for each workspace
- "Here's what changed: organic traffic up 12%, Meta CPM up 23%, competitor launched 8 new ads"
- "Here's what I'd do: pause ad set X (ROAS below threshold), create new ads targeting keyword Y"
- Email + in-app notification

### Task 18: Lumi action queue
- Lumi suggests actions → user approves/rejects → Lumi executes
- Actions: pause ad, adjust budget, generate new creative, create content brief
- Action log: track everything Lumi did and the outcome

### Task 19: Agency white-label
- Custom logo + colors on reports and dashboards
- Client-facing read-only dashboards (shareable link, no login needed)
- Multi-workspace management view for agencies

### Task 20: Stripe billing
- Integrate Stripe for subscription management
- Tiers: Starter ($99), Growth ($179), Agency ($299)
- Usage tracking for AI generation limits
- Trial period (14 days free)

### Task 21: Final polish + launch
- Bug fixes from agency feedback during beta
- Performance optimization
- Documentation / help center basics
- Public launch or wider beta

---

## Claude Code Usage Guide

### How to use this with Claude Code

**Before each session, tell Claude Code:**
```
Read LUMNIX_MASTER_PLAN.md and PHASE0_SPRINT_PLAN.md for context.
We're on Week [X], Task [Y]. Here's what I need:
[specific task description]
```

**Example prompts for each task:**

**Task 1:**
"Read the cron sync route at src/app/api/cron/sync/route.ts and the sync routes for all 4 providers. Add Google Ads and Meta Ads to the cron loop. Add retry logic with 3 attempts and exponential backoff to each provider sync. Make sure token refresh failures are logged properly in sync_jobs."

**Task 2:**
"Create a unified_metrics Postgres view that normalizes gsc_data, ga4_data, and analytics_data (Google Ads + Meta Ads JSONB) into a common schema: date, source, metric_name, metric_value, dimension_name, dimension_value. Then create a new API route at /api/data/unified that queries this view with filters for date range, source, and metric type."

**Task 4:**
"Read the current dashboard page and redesign it as a Command Center. Show a top metrics row combining data from all connected sources (sessions from GA4, clicks from GSC, spend from Google/Meta Ads, revenue from Meta Ads). Add a trend chart overlaying organic vs paid traffic. Add an integration status panel showing which sources are connected and last sync time. Use Recharts for charts and match the existing brand system."

**Task 10:**
"Create an AI ad copy generation endpoint at /api/creative/generate. It should accept: brand_context, framework (AIDA/PAS/hook-body-cta), target_audience, and optional workspace_id. When workspace_id is provided, fetch the top GSC keywords and best-performing GA4 pages to inform the generation. Use OpenAI GPT-4o-mini. Store generated creatives in a new generated_creatives table. Return 3-5 variations per request."

### Key principle
Don't give Claude Code the whole plan at once. Give it one task at a time with specific file references and clear acceptance criteria. Let it read the master plan for context, but scope the work tightly.
