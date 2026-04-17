# Lumnix — Marketing Intelligence Platform

> AI-powered unified marketing analytics for growth teams. Built by Oltaflock AI.

**Live:** https://lumnix-ai.vercel.app

---

## What is Lumnix?

Lumnix unifies your Google Search Console, Google Analytics 4, Google Ads, and Meta Ads into one AI-powered dashboard — giving you insights, anomaly alerts, and competitor intelligence that native platforms can't provide.

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROWSER (Next.js 16)                      │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │Dashboard │ │Analytics │ │    SEO     │ │  AI Assistant    │  │
│  │Overview  │ │  GA4     │ │   GSC      │ │  (GPT-4o-mini)   │  │
│  └──────────┘ └──────────┘ └────────────┘ └──────────────────┘  │
│                                                                   │
│  ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────┐  │
│  │ Google   │ │ Meta Ads │ │Competitors │ │    Settings /    │  │
│  │   Ads    │ │          │ │  Spy Agent │ │   Integrations   │  │
│  └──────────┘ └──────────┘ └────────────┘ └──────────────────┘  │
└───────────────────────────┬─────────────────────────────────────┘
                            │ API Routes (/api/*)
┌───────────────────────────▼─────────────────────────────────────┐
│                     NEXT.JS API LAYER                             │
│                                                                   │
│  /api/auth/*          Auth callbacks (Google OAuth, Supabase)    │
│  /api/workspace       Workspace CRUD                             │
│  /api/integrations/*  OAuth connect + token exchange             │
│  /api/sync/gsc        Pull GSC data → gsc_data table             │
│  /api/sync/ga4        Pull GA4 data → ga4_data table             │
│  /api/sync/google-ads Pull Google Ads campaigns                  │
│  /api/sync/meta-ads   Pull Meta Ads insights                     │
│  /api/data/gsc        Serve GSC data to frontend                 │
│  /api/data/ga4        Serve GA4 data to frontend                 │
│  /api/chat            AI chat (OpenAI GPT-4o-mini streaming)     │
│  /api/competitors/*   Competitor management + ad scraping        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌───────────────┐  ┌────────────────┐  ┌───────────────────┐
│   Supabase    │  │  Google APIs   │  │    Meta APIs      │
│               │  │                │  │                   │
│  • Auth       │  │  • GSC API     │  │  • Marketing API  │
│  • Postgres   │  │  • GA4 Data    │  │  • Insights API   │
│  • Row Level  │  │  • Ads API     │  │  • Ad Accounts    │
│    Security   │  │  • OAuth 2.0   │  │  • OAuth 2.0      │
└───────────────┘  └────────────────┘  └───────────────────┘
```

---

## Database Schema

All tables in Supabase Postgres with Row Level Security (RLS).

| Table | Purpose |
|-------|---------|
| `workspaces` | Multi-tenant workspace per user |
| `workspace_members` | Workspace roles (owner/admin/member) |
| `integrations` | Connected providers + status + last sync |
| `oauth_tokens` | Encrypted OAuth access/refresh tokens |
| `gsc_data` | Raw Google Search Console rows (query, page, clicks, impressions, position, date) |
| `ga4_data` | Raw GA4 metric rows (metric_type, dimension, value, date) |
| `analytics_data` | JSONB store for Google Ads + Meta Ads campaign data |
| `sync_jobs` | Audit log of sync runs (status, rows synced, errors) |
| `competitors` | Tracked competitor domains |

### Entity Relationships
```
auth.users
    └── workspaces (owner_id)
            ├── workspace_members
            ├── integrations
            │       └── oauth_tokens
            ├── gsc_data
            ├── ga4_data
            ├── analytics_data
            ├── sync_jobs
            └── competitors
```

---

## Data Flow

### OAuth Connect Flow
```
User clicks "Connect" → /api/integrations/connect (builds OAuth URL)
→ Google/Meta OAuth screen → User approves
→ /api/integrations/callback (exchanges code for tokens)
→ Tokens saved to oauth_tokens table
→ Redirect to /dashboard/settings?connected=gsc
```

### Data Sync Flow
```
User clicks "Sync Now" → /api/sync/[provider]
→ Fetch tokens from oauth_tokens
→ Refresh token if expired
→ Call platform API (GSC/GA4/Google Ads/Meta)
→ Normalize response → Insert into gsc_data / ga4_data / analytics_data
→ Update integrations.last_sync_at
→ Return rows synced count
```

### AI Chat Flow
```
User types message → /api/chat (POST)
→ Fetch workspace context (GA4 totals, top GSC keywords, integrations)
→ Build system prompt with real data
→ Stream response from GPT-4o-mini (OpenAI)
→ Frontend renders streamed text
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS |
| Charts | Recharts |
| Auth | Supabase Auth (email + Google OAuth) |
| Database | Supabase Postgres + RLS |
| AI | OpenAI GPT-4o-mini (streaming) |
| Deployment | Vercel |
| APIs | Google Search Console API, GA4 Data API, Google Ads API v17, Meta Marketing API v19 |

---

## Brand System

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#FF0066` | CTAs, active nav, links |
| Primary Hover | `#FF3385` | Button hover |
| Accent | `#00D4AA` | Charts, info states |
| Sidebar BG | `#0F172A` | Sidebar, header |
| Card BG | `#1E293B` | Cards, panels |
| Page BG | `#F8FAFC` | Light mode canvas |

Fonts: **Plus Jakarta Sans** (display/headings) + **DM Sans** (body)

---

## Getting Started (Local)

```bash
git clone https://github.com/khush0030/lumnix.git
cd lumnix
npm install
cp .env.local.example .env.local   # fill in your keys
npm run dev
```

### Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth (GSC + GA4 + Ads)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Meta OAuth
META_APP_ID=
META_APP_SECRET=

# AI
OPENAI_API_KEY=

# App
NEXT_PUBLIC_APP_URL=https://lumnix-ai.vercel.app
```

### Database Setup

Run migrations in order in Supabase SQL editor:
1. `supabase-migration.sql` — core tables
2. `supabase-migration-day2.sql` — GSC/GA4/sync tables

---

## Integrations Status

| Integration | Status | Notes |
|------------|--------|-------|
| Google Search Console | ✅ Live | OAuth + sync working |
| Google Analytics 4 | ✅ Live | OAuth + sync working |
| Google Ads | 🔧 Partial | Needs developer token approval |
| Meta Ads | 🔧 In progress | OAuth setup in progress |

---

## Roadmap

- [x] Auth (email + Google OAuth)
- [x] Workspace multi-tenancy
- [x] GSC integration + sync + SEO page
- [x] GA4 integration + sync + analytics page
- [x] AI Assistant (GPT-4o-mini + real data context)
- [x] Competitor tracking
- [ ] Google Ads full integration
- [ ] Meta Ads full integration
- [ ] Report builder + PDF export
- [ ] Scheduled alerts (email/Slack)
- [ ] Attribution modeling
- [ ] Team invites
- [ ] White-label / custom domains

---

## Built by

**Oltaflock AI** — AI automation agency building intelligent tools for service businesses.
→ https://oltaflock.ai

---

*Private repository — © 2026 Oltaflock AI. All rights reserved.*
