# Lumnix — The Full-Stack AI Marketing Employee

**Vision Document + Technical Architecture + Phased Roadmap**
*April 2026 | Oltaflock AI*

---

## The One-Liner

Lumnix is the $100–200/mo AI marketing employee that replaces your entire marketing tool stack — from SEO research to ad creative generation to campaign launching to cross-channel attribution — and makes every piece talk to every other piece.

---

## 1. The Problem: Marketing Tool Hell

Today, a D2C brand or small agency running real marketing operations needs 5–8 separate tools:

| Job to be done | Current tool | Monthly cost |
|---|---|---|
| Ad creative inspiration / swipe files | Atria, Foreplay | $129–479 |
| Creative analytics | Motion | $58+ |
| Ad launching & management | Meta Ads Manager (free but painful) | $0 + hours |
| Marketing attribution | Triple Whale, Northbeam | $179–1,000+ |
| SEO analytics | Ahrefs, Semrush | $99–249 |
| Web analytics | GA4 (free but confusing) | $0 + hours |
| AI copywriting | Jasper, Copy.ai | $39–99 |
| Reporting | Google Sheets / manual | $0 + sanity |

**Total: $500–2,000+/mo** and none of it talks to each other.

The SEO team doesn't know which organic keywords are also driving paid conversions. The paid team doesn't know which landing pages are performing in organic. The creative strategist has no idea which ad formats drive actual attributed revenue vs. vanity metrics. Everyone is context-switching between dashboards, exporting CSVs, and stitching together half-truths.

---

## 2. The Lumnix Thesis

**What if one platform did all of it — and the AI connecting the layers was the actual product?**

Not a dashboard that shows you data. A marketing employee that:
1. **Sees everything** — organic search, paid ads, website analytics, creative performance, competitor moves
2. **Thinks about it** — finds patterns humans miss (this SEO keyword is converting via paid too; this ad creative style drives 3x ROAS but only on mobile; your competitor just shifted budget to TikTok)
3. **Acts on it** — generates new creatives, launches campaigns, adjusts budgets, writes the SEO brief, kills underperforming ads
4. **Learns from results** — closes the loop, feeds outcomes back into the next recommendation

This is what makes Lumnix fundamentally different from everything in the market: **the cross-layer intelligence**. Atria can't tell you which ad creatives to make based on your SEO data. Triple Whale can't generate the ad. Northbeam can't launch it. Nobody connects organic and paid in a single decision layer.

---

## 3. Competitive Positioning

### Where everyone else sits

```
                    INSIGHT ONLY ◄──────────────► INSIGHT + ACTION
                         │                              │
    PAID ONLY ───────────┼──────────────────────────────┤
                         │                              │
          Triple Whale   │                    Adsflo    │
          Northbeam      │                    (batch    │
          Motion         │                     launch)  │
                         │                              │
    ORGANIC ONLY ────────┼──────────────────────────────┤
                         │                              │
          Ahrefs         │                    Surfer    │
          Semrush        │                    (writes   │
          GSC            │                     content) │
                         │                              │
    BOTH ────────────────┼──────────────────────────────┤
                         │            ★                 │
                         │          LUMNIX              │
                         │     (see + think + act)      │
```

### Lumnix vs. the field

| Capability | Atria ($129+) | Triple Whale ($179+) | Northbeam ($1K+) | Adsflo | **Lumnix ($100–200)** |
|---|---|---|---|---|---|
| Ad swipe file / inspiration library | 25M+ ads | — | — | ✓ | ✓ (scraped + AI-curated) |
| Creative analytics | Basic | ✓ | ✓ | ✓ | ✓ |
| AI ad copy / image generation | Script gen | — | — | — | **✓ Full gen** |
| Batch ad launching to Meta/Google | Coming soon | — | — | ✓ | **✓** |
| Marketing attribution (MTA) | — | ✓ | ✓ (premium) | — | **✓** |
| SEO / GSC analytics | — | — | — | — | **✓** |
| GA4 / web analytics | — | Partial | Partial | — | **✓** |
| Cross-channel AI recommendations | — | Moby (limited) | — | Raya | **✓ Core product** |
| Agency multi-workspace | — | ✓ | ✓ | — | **✓** |
| Price for full stack | $129 (partial) | $179+ (partial) | $1K+ (partial) | Unknown | **$100–200 (everything)** |

### The pricing wedge

Atria charges $129/mo for just swipe files + creative analytics. Triple Whale charges $179+/mo for just attribution. Northbeam charges $1,000+/mo. A brand using all three is paying $1,300+/mo and still doesn't have SEO data, AI creative generation, or ad launching.

Lumnix at $100–200/mo is not "cheap alternative." It's a category shift: **you're not buying a dashboard, you're hiring a marketing employee that never sleeps.**

---

## 4. Product Architecture: The Five Pillars

Lumnix is built around five pillars. Each is valuable standalone, but the magic is in the connections between them.

### Pillar 1: Intelligence Layer (SEO + Analytics)
*What you already have — the foundation*

- Google Search Console integration (live)
- GA4 integration (live)
- Google Ads integration (in progress)
- Meta Ads integration (in progress)

**What needs to evolve:**
- Unified data model: every metric lives in a single queryable layer, not siloed tables
- Real-time sync via webhooks/scheduled jobs instead of manual "Sync Now"
- Funnel stitching: connect an organic GSC click → GA4 session → conversion event → attributed revenue
- Anomaly detection: "Your top keyword dropped 40% impressions today" — automatically, before you check

### Pillar 2: Creative Studio
*The Atria/Adsflo competitor — but smarter because it knows your data*

**Swipe File Engine:**
- Competitor ad library (scrape Meta Ad Library, TikTok Creative Center)
- Save, tag, organize ads into boards (like Atria)
- AI auto-tagging: hook type, visual style, format, messaging angle, CTA type
- "Show me carousel ads from competitors in my niche that ran for 30+ days" (proxy for performance)

**AI Creative Generation:**
- Ad copy generator trained on your brand voice + what's working in your data
- Image ad mockup generation (integrate with image gen APIs)
- Video script generator (AIDA, PAS, hook-body-CTA frameworks)
- Brief generator: "Based on your top-performing SEO keywords and best Meta ad formats, here's a creative brief for next week"

**The cross-layer magic:**
- "Your keyword 'organic dog food' drives 2,400 clicks/mo in GSC but you have zero paid ads targeting it. Here's a creative brief + 3 ad variations."
- "This ad creative style (UGC testimonial + product close-up) has 2.8x ROAS. Here are 5 new variations in that style."

### Pillar 3: Campaign Launcher
*The action layer — go from creative to live ad without leaving Lumnix*

**Core capabilities:**
- Batch upload creatives to Meta Ads Manager via Marketing API
- Create ad sets, set targeting, budgets, schedules — all from Lumnix
- A/B test variant management: launch 5 variations, auto-kill losers after statistical significance
- Google Ads campaign creation (Search + Display + Performance Max)
- One-click "launch similar" — take a winning ad, generate variations, launch them

**Why this matters:**
- Adsflo's whole pitch is "from assets to live ads in a click." Lumnix does the same thing but with the added intelligence of knowing what *should* be launched based on your data.
- The feedback loop closes: launch → measure → learn → generate next creative → launch again. Fully automated growth loop.

### Pillar 4: Attribution & Insights Engine
*The Triple Whale / Northbeam competitor — but at 10% of the price*

**Attribution model:**
- First-party pixel (lightweight JS snippet on customer's site)
- Multi-touch attribution: first click, last click, linear, time decay, data-driven
- Cross-channel view: "This customer saw your Instagram ad, Googled your brand name, clicked an organic result, then converted"
- Creative-level attribution: which specific ad creative drove revenue, not just which campaign

**Unified reporting:**
- Single dashboard: organic traffic + paid traffic + revenue + creative performance
- Custom report builder (drag-and-drop metrics, date ranges, dimensions)
- Scheduled email/Slack reports
- Client-facing white-label reports (for agencies)

**The cross-layer magic:**
- "Your SEO content about 'best running shoes' is generating the most assisted conversions for your paid campaigns — double down on content in this topic cluster"
- "Creative type A generates clicks but Creative type B generates revenue. Here's why and what to do."

### Pillar 5: AI Marketing Agent ("Lumi")
*The brain that ties everything together*

This is the killer differentiator. Not a chatbot that answers questions about your data. An agent that:

**Proactive recommendations:**
- Daily briefing: "Here's what changed, here's what I'd do about it"
- "Your competitor launched 12 new ads this week focusing on price comparison. Recommendation: launch your own comparison content + ads within 48 hours. Here's a brief."
- "Your Meta CPM increased 23% this week. Recommendation: shift 15% of budget to Google where your brand keywords are converting at 4.2x ROAS."

**Autonomous actions (with approval):**
- Pause underperforming ads when ROAS drops below threshold
- Generate + queue new ad variations when creative fatigue is detected
- Adjust budgets based on attribution data
- Create SEO content briefs based on keyword gaps

**Conversational interface:**
- "Lumi, what should I focus on this week?"
- "Lumi, create 5 ad variations for our spring sale using the UGC style that worked in March"
- "Lumi, why did our ROAS drop last Tuesday?"
- "Lumi, prepare a performance report for my client meeting tomorrow"

---

## 5. Technical Architecture (Evolved)

### Current stack (keep)
- Next.js 16 (App Router) + TypeScript + Tailwind
- Supabase (Auth, Postgres, RLS)
- Vercel deployment
- OpenAI for AI layer

### What needs to be added

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         BROWSER (Next.js 16)                            │
│                                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
│  │ Command    │ │ Creative   │ │ Campaign   │ │   Attribution        │ │
│  │ Center     │ │ Studio     │ │ Launcher   │ │   Dashboard          │ │
│  │ (Home)     │ │            │ │            │ │                      │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────────────┘ │
│                                                                         │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌──────────────────────┐ │
│  │ SEO Hub    │ │ Analytics  │ │ Competitor  │ │   Lumi (AI Agent)    │ │
│  │ (GSC)      │ │ (GA4)      │ │ Intel      │ │   Chat + Actions     │ │
│  └────────────┘ └────────────┘ └────────────┘ └──────────────────────┘ │
│                                                                         │
│  ┌────────────┐ ┌────────────┐                                         │
│  │ Reports    │ │ Settings   │                                         │
│  │ Builder    │ │ & Billing  │                                         │
│  └────────────┘ └────────────┘                                         │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
                   API Routes + Background Jobs
                            │
┌───────────────────────────▼─────────────────────────────────────────────┐
│                        BACKEND SERVICES                                  │
│                                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Data Sync Engine   │  │  AI Orchestration Layer                  │ │
│  │                     │  │                                          │ │
│  │  • GSC sync (cron)  │  │  • OpenAI / Claude for reasoning        │ │
│  │  • GA4 sync (cron)  │  │  • Image gen (DALL-E / Flux / Ideogram) │ │
│  │  • Google Ads sync  │  │  • Ad copy generation pipeline          │ │
│  │  • Meta Ads sync    │  │  • Agent action queue                   │ │
│  │  • Pixel ingestion  │  │  • RAG over workspace data              │ │
│  └─────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Campaign Manager   │  │  Scraping / Intel Engine                 │ │
│  │                     │  │                                          │ │
│  │  • Meta Marketing   │  │  • Meta Ad Library scraper               │ │
│  │    API (create ads) │  │  • TikTok Creative Center scraper        │ │
│  │  • Google Ads API   │  │  • Competitor domain tracker             │ │
│  │    (create camps)   │  │  • Ad longevity tracker                  │ │
│  │  • A/B test engine  │  │  • Auto-tag pipeline (AI vision)         │ │
│  └─────────────────────┘  └──────────────────────────────────────────┘ │
│                                                                         │
│  ┌─────────────────────┐  ┌──────────────────────────────────────────┐ │
│  │  Attribution Engine │  │  Notification / Reporting                │ │
│  │                     │  │                                          │ │
│  │  • First-party      │  │  • Email reports (Resend)                │ │
│  │    pixel (lmnx.js)  │  │  • Slack webhook alerts                  │ │
│  │  • Event collector  │  │  • PDF report generator                  │ │
│  │  • MTA models       │  │  • White-label template engine           │ │
│  │  • Funnel stitching │  │                                          │ │
│  └─────────────────────┘  └──────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────────────┐
        ▼                   ▼                           ▼
┌───────────────┐  ┌────────────────┐  ┌─────────────────────────┐
│   Supabase    │  │  External APIs │  │    Background Jobs      │
│               │  │                │  │                         │
│  • Auth       │  │  • Google APIs │  │  • Vercel Cron          │
│  • Postgres   │  │  • Meta APIs   │  │    (or Inngest/Trigger) │
│  • RLS        │  │  • OpenAI      │  │  • Sync scheduling      │
│  • Storage    │  │  • Image gen   │  │  • Report generation    │
│  (creatives)  │  │  • Scraping    │  │  • Anomaly checks       │
└───────────────┘  └────────────────┘  └─────────────────────────┘
```

### New database tables needed

```sql
-- Creative Studio
creative_assets        -- uploaded/generated creatives (images, videos, copy)
creative_boards        -- organize assets into boards
creative_tags          -- AI-generated tags on assets
swipe_library          -- scraped competitor ads
swipe_saves            -- user-saved swipes

-- Campaign Launcher
campaigns_managed      -- campaigns created/managed through Lumnix
ad_sets_managed        -- ad sets with targeting config
ads_managed            -- individual ads linked to creative_assets
ab_tests               -- test configurations and results

-- Attribution
pixel_events           -- raw event stream from first-party pixel
touchpoints            -- processed touch points per visitor
attribution_results    -- calculated attributed conversions
conversion_events      -- purchase/signup/lead events

-- AI Agent
agent_actions          -- log of Lumi recommendations + actions taken
agent_rules            -- user-configured automation rules
daily_briefings        -- generated daily summaries

-- Reporting
report_templates       -- saved report configurations
scheduled_reports      -- recurring report schedules
```

---

## 6. Phased Roadmap

### Phase 0: Foundation Hardening (Weeks 1–3)
*Make what you have production-solid before building new things*

- Automated data sync (cron jobs instead of manual "Sync Now")
- Unified data model: create a `unified_metrics` view that normalizes GSC, GA4, Google Ads, Meta Ads into comparable dimensions
- Complete Google Ads integration (get developer token approved)
- Complete Meta Ads OAuth + sync
- Error handling, retry logic, token refresh reliability
- Basic onboarding flow for new users

### Phase 1: Creative Studio MVP (Weeks 4–8)
*Start competing with Atria — this is what gets attention*

- Meta Ad Library scraper (public API + supplementary scraping)
- Swipe file: save, board, tag, search
- AI auto-tagging on saved ads (hook type, format, style, CTA)
- AI ad copy generator (feed it brand context + winning patterns)
- AI image ad mockup generator (integrate Ideogram/Flux)
- Video script generator (AIDA, PAS frameworks)
- Creative brief generator powered by your GSC + GA4 data

### Phase 2: Campaign Launcher (Weeks 9–13)
*Go from insight to action — this is the Adsflo killer*

- Meta Marketing API integration: create campaigns, ad sets, ads from Lumnix
- Batch creative upload (select 5 images → launch all as separate ads)
- Google Ads API: create Search + Display campaigns
- Basic A/B test management: launch variants, track, auto-pause losers
- Budget management interface
- "One-click relaunch": take winning ad → generate variations → launch

### Phase 3: Attribution Engine (Weeks 14–19)
*Compete with Triple Whale at 1/10th the price*

- First-party pixel (lightweight JS: `lmnx.js`)
- Event collection endpoint (high-throughput, edge-deployed)
- Multi-touch attribution models (first, last, linear, time-decay)
- Creative-level attribution: which ad creative → which revenue
- Cross-channel funnel view: organic click → paid retarget → conversion
- Shopify integration for revenue data (if targeting ecommerce)

### Phase 4: Lumi AI Agent (Weeks 20–24)
*The brain — this is what nobody else has*

- Daily briefing generator: "Here's what changed, here's what I'd do"
- Proactive recommendations engine (anomaly detection + suggested actions)
- Conversational interface upgrade (from simple chat to agent with tools)
- Action queue: Lumi suggests, you approve, Lumi executes
- Automation rules: "If ROAS < 1.5 for 3 days, pause ad and notify me"
- Cross-pillar intelligence: SEO ↔ Paid ↔ Creative ↔ Attribution insights

### Phase 5: Agency & Scale (Weeks 25–30)
*Multi-tenant, white-label, billing*

- Agency workspace: manage multiple client accounts
- White-label reports with custom branding
- Client-facing read-only dashboards
- Team roles and permissions (already have workspace_members foundation)
- Stripe billing integration (usage-based or tiered)
- Custom domain support for agency dashboards

---

## 7. Pricing Strategy

### Positioning: "Your AI marketing employee"

The framing matters. You're not selling a dashboard. You're selling a team member who works 24/7, costs $100–200/mo, and replaces $500–2,000/mo in tools.

### Proposed tiers

| Plan | Price | Target | What they get |
|---|---|---|---|
| **Starter** | $99/mo | Solo founders, small D2C | All 5 pillars, 1 workspace, 3 ad accounts, 500 AI generations/mo, basic attribution |
| **Growth** | $179/mo | Growing brands, small teams | Everything in Starter + 3 workspaces, 10 ad accounts, 2,000 AI generations/mo, advanced attribution, scheduled reports |
| **Agency** | $299/mo | Agencies, freelancers | Everything in Growth + unlimited workspaces, white-label, client dashboards, 5,000 AI generations/mo, priority support |
| **Enterprise** | Custom | Large brands/agencies | Everything + custom integrations, SLA, dedicated support, API access |

### Why this works

- **Starter at $99** undercuts Atria's $129 for just swipe files — and you get everything
- **Growth at $179** matches Triple Whale's starting price — but includes creative studio + launching + SEO
- **Agency at $299** is a fraction of what agencies pay for Northbeam ($1K+) + Atria ($129+) + Semrush ($249+) separately
- The "AI generations/mo" limit creates natural upgrade pressure without gating core features

---

## 8. Go-to-Market: How Lumnix Gets Its First 100 Users

### Narrative
"Stop paying $1,500/mo for 6 marketing tools that don't talk to each other. Lumnix is your AI marketing employee for $99/mo."

### Channel strategy

**Content-led growth (eat your own cooking):**
- Use Lumnix's own SEO + content tools to rank for "Triple Whale alternative," "Atria alternative," "marketing attribution for small brands"
- Publish weekly "Marketing Intelligence Reports" using Lumnix data to demonstrate the product

**Community + founder-led:**
- Khush builds in public on X/Twitter
- Post comparison teardowns (Lumnix vs. Atria, Lumnix vs. Triple Whale)
- Offer free tier or generous trial to build word-of-mouth

**Agency partnerships:**
- Target 5–10 agencies with the white-label play
- Each agency = 10–50 client workspaces = massive expansion

**Product-led growth hooks:**
- Free competitor ad search (like Atria's free tier but better)
- Free SEO audit tool (captures emails, shows value before paywall)
- Shareable reports (client sees report → "Powered by Lumnix" → signs up)

---

## 9. Technical Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Meta/Google API rate limits | Can't sync or launch at scale | Implement queuing, batch endpoints, exponential backoff. Document limits in workflows. |
| Meta Ad Library scraping gets blocked | Lose swipe file engine | Use official Meta Ad Library API where possible, supplement with multiple scraping strategies, cache aggressively |
| Attribution pixel accuracy | Bad data = bad recommendations | Start with deterministic (click-based) attribution, add probabilistic later. Be transparent about methodology. |
| AI generation quality | Users get generic/bad creatives | Fine-tune on brand context, use RAG over workspace data, always show "here's why I generated this" |
| Google Ads developer token approval | Can't launch Google campaigns | Apply early, maintain compliance, have manual upload fallback |
| Scope creep | Never ship | Phases are strict. Each phase ships a usable product. Don't start Phase N+1 until Phase N is live and working. |

---

## 10. Success Metrics by Phase

| Phase | Ship date target | Key metric | Target |
|---|---|---|---|
| Phase 0 | Week 3 | All 4 data sources syncing automatically | 99% sync success rate |
| Phase 1 | Week 8 | Creative Studio active users | 50 beta users saving swipes |
| Phase 2 | Week 13 | Campaigns launched through Lumnix | 100 campaigns launched |
| Phase 3 | Week 19 | Pixel installed + attributing | 20 sites with pixel, attribution working |
| Phase 4 | Week 24 | Lumi recommendations acted on | 40% action rate on recommendations |
| Phase 5 | Week 30 | Paying customers | 100 paying users, 5 agencies |

---

## 11. The Long-Term Vision

**Year 1:** Full-stack marketing platform for D2C brands and small agencies. All five pillars live and connected.

**Year 2:** Lumi becomes genuinely autonomous — it doesn't just recommend, it runs your marketing with minimal human oversight. "Set your budget, describe your customer, Lumi does the rest."

**Year 3:** Lumnix becomes the operating system for marketing. Brands plug in their products and goals, Lumnix handles the entire funnel — from identifying keyword opportunities, to creating content, to running ads, to optimizing spend, to reporting results.

The end state: **marketing as a service, powered by AI, for the price of a single tool.**

---

*Built by Oltaflock AI — making enterprise-grade marketing accessible to everyone.*
