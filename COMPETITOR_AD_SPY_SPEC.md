# Lumnix — Competitor Ad Spy
**Complete Feature Spec for Claude Code Agent**
*April 2026 | Oltaflock AI*

---

## Context

Read `README.md` and `LUMNIX_MASTER_PLAN.md` before starting. This document is the complete implementation spec for the **Competitor Ad Spy** feature. Build everything in this document top to bottom. Do not skip sections. Read every existing file before modifying it.

---

## What This Feature Does

Competitor Ad Spy lets users track what ads their competitors are running on Meta, automatically identifies which ads are winning (using ad longevity as a performance signal), and uses Claude AI to analyze those winning ads and generate creative briefs — telling the user exactly what content angles and hooks to test in their own campaigns.

**End-to-end user journey:**
1. User enters a competitor's name, website URL, or Facebook page URL
2. Lumnix resolves this to the correct Meta Page ID via a visual confirmation step
3. Lumnix scrapes all their Meta ads via the Ad Library API
4. Ads running 90+ days are flagged as "winners"
5. Claude analyzes all winning ads and outputs a structured creative brief
6. User sees winning ads + AI brief in a clean UI

---

## Performance Signal: Longevity

Meta's Ad Library API does not expose engagement metrics, view counts, or reach. The proxy used by every major competitor intelligence tool (Atria, Foreplay, Minea) is **ad longevity**:

- Any ad that has been running for 90+ days = Meta's algorithm kept serving it = it's performing
- Filter logic: `days_running >= 90` AND ad is still active (`ad_delivery_stop_time` is null)
- Ads running 30–89 days = "Active" (show but don't mark as winner)
- Ads running 90–179 days = "Winning" (one trophy icon)
- Ads running 180+ days = "Top Performer" (two trophy icons, highlight these)

---

## Brand Resolution Strategy

The hardest UX problem is finding the exact right brand in Meta's system. Use a smart input that handles three cases:

### Path A: Website URL
User enters `mamaearth.in` or `https://mamaearth.in`
- Fetch the website HTML (server-side via API route to avoid CORS)
- Search for Facebook page links in the HTML: `facebook.com/` patterns in `<a>` tags, meta tags, or footer
- Extract page slug (e.g. `mamaearth`)
- Resolve slug to Page ID via Graph API: `GET /{page-slug}?fields=id,name,picture&access_token={token}`
- If found → go to confirmation modal
- If not found → fall back to Path C (fuzzy search)

### Path B: Facebook URL
User pastes `https://www.facebook.com/mamaearth` or `facebook.com/mamaearth`
- Detect that input contains `facebook.com/`
- Extract the slug after the last `/`
- Resolve to Page ID same as Path A
- Go directly to confirmation modal

### Path C: Brand Name Search
User types "Mamaearth" (no URL detected)
- Call Meta Ad Library API: `GET /ads_archive?search_terms=Mamaearth&ad_type=ALL&ad_reached_countries=IN,US&fields=page_id,page_name&limit=20`
- De-duplicate results by page_id
- Return top 5 unique pages
- Show confirmation modal with results

### Confirmation Modal
All three paths end at this modal before saving anything:

```
┌─────────────────────────────────────────────────────┐
│  Select the correct brand                           │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ [profile pic 40px]  Mamaearth          ✓    │   │
│  │                     12,847 ads               │   │
│  │                     facebook.com/mamaearth   │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ [profile pic 40px]  Mamaearth India          │   │
│  │                     342 ads                  │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Can't find the right brand?                        │
│  [Try a different name]                             │
│                                                     │
│  [Cancel]                    [Track This Brand →]   │
└─────────────────────────────────────────────────────┘
```

- Show profile picture, page name, total ad count, page URL
- User selects one (radio-style selection)
- On confirm → save `facebook_page_id` to database → trigger first scrape
- "Try a different name" → closes modal, resets input

---

## Database Schema

Run these in Supabase SQL editor in order.

```sql
-- Extend existing competitors table
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS facebook_page_id TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS facebook_page_name TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS facebook_page_url TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS total_ads_found INTEGER DEFAULT 0;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS winning_ads_count INTEGER DEFAULT 0;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ;
ALTER TABLE competitors ADD COLUMN IF NOT EXISTS scrape_status TEXT DEFAULT 'pending';

-- scraped ads from Meta Ad Library
CREATE TABLE IF NOT EXISTS competitor_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,

  meta_ad_id TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT,

  -- ad content
  ad_copy TEXT,
  headline TEXT,
  description TEXT,
  call_to_action TEXT,
  ad_format TEXT, -- 'video' | 'image' | 'carousel'
  image_url TEXT,
  video_url TEXT, -- temporary signed URL, used at analysis time only

  -- performance signal
  ad_delivery_start_time TIMESTAMPTZ,
  ad_delivery_stop_time TIMESTAMPTZ,
  days_running INTEGER,
  is_active BOOLEAN DEFAULT true,
  performance_tier TEXT, -- 'active' | 'winning' | 'top_performer'

  -- ai analysis
  ai_analyzed BOOLEAN DEFAULT false,
  ai_hook_type TEXT,
  ai_pain_point TEXT,
  ai_offer_structure TEXT,
  ai_visual_style TEXT,
  ai_cta_type TEXT,
  ai_summary TEXT,

  scraped_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(workspace_id, meta_ad_id)
);

-- ai-generated creative briefs per competitor
CREATE TABLE IF NOT EXISTS competitor_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,

  -- brief content (Claude output)
  hook_patterns TEXT,          -- what hooks they use repeatedly
  pain_points TEXT,            -- pain points they target
  offer_structures TEXT,       -- how they frame offers
  visual_themes TEXT,          -- visual/creative patterns
  top_performing_formats TEXT, -- video vs image vs carousel patterns
  content_angles JSONB,        -- array of 5 suggested content angles
  raw_brief TEXT,              -- full Claude response

  ads_analyzed INTEGER,
  generated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies
ALTER TABLE competitor_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation_ads" ON competitor_ads
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "workspace_isolation_briefs" ON competitor_briefs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );
```

---

## Environment Variables

Add to `.env.local`:

```env
# Already exists — used for Meta Ads, reused here
META_ACCESS_TOKEN=your_meta_user_access_token
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
```

The Meta Ad Library API uses the same access token as Meta Ads. No new credentials needed if Meta Ads is already connected. However, this feature also works WITHOUT the user connecting Meta Ads — use a long-lived app access token (`APP_ID|APP_SECRET`) as fallback for read-only Ad Library access.

---

## API Routes to Build

### 1. Brand Search / Resolution
```
POST /api/competitors/search
```
Body: `{ query: string, workspace_id: string }`

Logic:
- Detect if `query` is a URL containing `facebook.com` → extract slug → resolve via Graph API
- Detect if `query` looks like a domain (contains `.`) → fetch website HTML → look for Facebook link
- Otherwise → search Meta Ad Library by `search_terms`
- Return: array of `{ page_id, page_name, page_url, picture_url, ad_count }` (max 5)

```typescript
// Meta Ad Library search endpoint
const url = `https://graph.facebook.com/v19.0/ads_archive?` + new URLSearchParams({
  search_terms: query,
  ad_type: 'ALL',
  ad_reached_countries: '["IN","US","GB"]',
  fields: 'page_id,page_name',
  limit: '50',
  access_token: process.env.META_ACCESS_TOKEN
})
```

After getting page_ids, fetch profile pictures:
```typescript
// For each unique page_id
const pageUrl = `https://graph.facebook.com/v19.0/${page_id}?fields=id,name,picture,fan_count&access_token=${token}`
```

### 2. Add Competitor
```
POST /api/competitors/add
```
Body: `{ workspace_id, facebook_page_id, facebook_page_name, facebook_page_url, logo_url, website_url }`

Logic:
- Insert into `competitors` table
- Immediately trigger scrape (call `/api/competitors/scrape` internally)
- Return the new competitor record

### 3. Scrape Competitor Ads
```
POST /api/competitors/scrape
```
Body: `{ competitor_id, workspace_id }`

Logic:
```typescript
// 1. Get competitor record
const competitor = await supabase
  .from('competitors')
  .select('*')
  .eq('id', competitor_id)
  .single()

// 2. Update status to 'scraping'
await supabase.from('competitors').update({ scrape_status: 'scraping' }).eq('id', competitor_id)

// 3. Fetch ads from Meta Ad Library
const adsUrl = `https://graph.facebook.com/v19.0/ads_archive?` + new URLSearchParams({
  search_page_ids: competitor.facebook_page_id,
  ad_type: 'ALL',
  ad_reached_countries: '["IN","US","GB","AU","CA"]',
  fields: [
    'id',
    'page_id',
    'page_name',
    'ad_creative_bodies',
    'ad_creative_link_titles',
    'ad_creative_link_descriptions',
    'ad_delivery_start_time',
    'ad_delivery_stop_time',
    'call_to_action_type',
    'ad_snapshot_url'
  ].join(','),
  limit: '100',
  access_token: process.env.META_ACCESS_TOKEN
})

// 4. Paginate through ALL results (Meta returns cursor-based pagination)
// Keep fetching while response.paging.next exists
// Collect all ads into array

// 5. For each ad, calculate days_running and performance_tier
const today = new Date()
for (const ad of allAds) {
  const startDate = new Date(ad.ad_delivery_start_time)
  const stopDate = ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : today
  const daysRunning = Math.floor((stopDate - startDate) / (1000 * 60 * 60 * 24))
  const isActive = !ad.ad_delivery_stop_time
  
  let performanceTier = 'active'
  if (daysRunning >= 180) performanceTier = 'top_performer'
  else if (daysRunning >= 90) performanceTier = 'winning'

  // 6. Upsert into competitor_ads
  await supabase.from('competitor_ads').upsert({
    workspace_id,
    competitor_id,
    meta_ad_id: ad.id,
    page_id: ad.page_id,
    page_name: ad.page_name,
    ad_copy: ad.ad_creative_bodies?.[0] || null,
    headline: ad.ad_creative_link_titles?.[0] || null,
    description: ad.ad_creative_link_descriptions?.[0] || null,
    call_to_action: ad.call_to_action_type || null,
    ad_delivery_start_time: ad.ad_delivery_start_time,
    ad_delivery_stop_time: ad.ad_delivery_stop_time || null,
    days_running: daysRunning,
    is_active: isActive,
    performance_tier: performanceTier,
    scraped_at: new Date().toISOString()
  }, { onConflict: 'workspace_id,meta_ad_id' })
}

// 7. Update competitor stats
const winningCount = allAds.filter(a => a.performanceTier !== 'active').length
await supabase.from('competitors').update({
  scrape_status: 'complete',
  last_scraped_at: new Date().toISOString(),
  total_ads_found: allAds.length,
  winning_ads_count: winningCount
}).eq('id', competitor_id)

// 8. Trigger AI analysis if there are winning ads
if (winningCount > 0) {
  await triggerAIAnalysis(competitor_id, workspace_id)
}
```

### 4. AI Analysis — Generate Creative Brief
```
POST /api/competitors/analyze
```
Body: `{ competitor_id, workspace_id }`

Logic:
```typescript
// 1. Fetch all winning + top_performer ads for this competitor
const { data: winningAds } = await supabase
  .from('competitor_ads')
  .select('*')
  .eq('competitor_id', competitor_id)
  .in('performance_tier', ['winning', 'top_performer'])
  .order('days_running', { ascending: false })
  .limit(30) // analyze top 30 max to keep prompt manageable

// 2. Build the prompt payload — only text content, no images/video needed
const adsPayload = winningAds.map((ad, i) => `
Ad #${i + 1} (Running ${ad.days_running} days — ${ad.performance_tier === 'top_performer' ? 'TOP PERFORMER' : 'WINNING'})
Format: ${ad.ad_format || 'unknown'}
Headline: ${ad.headline || 'none'}
Body Copy: ${ad.ad_copy || 'none'}
CTA: ${ad.call_to_action || 'none'}
`).join('\n---\n')

// 3. Call Claude API
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY,
    'anthropic-version': '2023-06-01'
  },
  body: JSON.stringify({
    model: 'claude-opus-4-5',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are a senior creative strategist analyzing competitor ads to find winning patterns.

Here are ${winningAds.length} ads from ${competitor.facebook_page_name} that have been running for 90+ days on Meta — meaning they are proven performers.

${adsPayload}

Analyze these ads and provide:

1. HOOK PATTERNS: What hooks do they use repeatedly? (fear, curiosity, social proof, direct benefit, etc.)
2. PAIN POINTS: What customer pain points do they target most?
3. OFFER STRUCTURE: How do they frame their offer? (discount, urgency, guarantee, free trial, etc.)
4. VISUAL THEMES: What visual/creative patterns appear across their best ads?
5. MESSAGING TONE: How do they speak to their audience?

Then provide EXACTLY 5 CONTENT ANGLES we should create to compete with or complement these patterns. For each angle include:
- Angle name (3-5 words)
- Hook line (the first line of the ad)
- Core message (1-2 sentences)
- Suggested format (video/image/carousel)
- Why this will work given what you saw

Be specific and actionable. Reference actual patterns from the ads above.`
    }]
  })
})

const result = await response.json()
const briefText = result.content[0].text

// 4. Parse and store
await supabase.from('competitor_briefs').upsert({
  workspace_id,
  competitor_id,
  raw_brief: briefText,
  ads_analyzed: winningAds.length,
  generated_at: new Date().toISOString()
}, { onConflict: 'competitor_id' })

// 5. Mark ads as analyzed
await supabase.from('competitor_ads')
  .update({ ai_analyzed: true })
  .eq('competitor_id', competitor_id)
```

### 5. Fetch Competitor Data
```
GET /api/competitors/[id]/ads?workspace_id=&filter=winning&page=1
GET /api/competitors/[id]/brief?workspace_id=
```

### 6. Delete Competitor
```
DELETE /api/competitors/[id]
```
Cascade deletes `competitor_ads` and `competitor_briefs` via FK constraints.

### 7. Cron — Re-scrape All Competitors
Add to existing `/api/cron/sync`:
```typescript
// Re-scrape all competitors with last_scraped_at > 48 hours ago
const { data: staleCompetitors } = await supabase
  .from('competitors')
  .select('id, workspace_id')
  .lt('last_scraped_at', new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
  .not('facebook_page_id', 'is', null)

for (const competitor of staleCompetitors) {
  await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/competitors/scrape`, {
    method: 'POST',
    body: JSON.stringify({ competitor_id: competitor.id, workspace_id: competitor.workspace_id })
  })
}
```

---

## Frontend Pages

### Page: `/dashboard/competitors`

This is the main Competitor Ad Spy page. Replace any existing placeholder with this complete layout.

#### Layout structure

```
┌─────────────────────────────────────────────────────────────────┐
│  [Eye icon]  Competitor Ad Spy   [AD LIBRARY badge]             │
│  Track what your competitors are running                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Stat: X Competitors]  [Stat: X Winning Ads]  [Stat: X Briefs]│
│                                                                 │
├──────────────────┬──────────────────────────────────────────────┤
│  COMPETITORS     │                                             │
│  [+ Add]         │   (ad grid / brief panel)                  │
│                  │                                             │
│  [Mamaearth   ▶] │                                             │
│  [WOW Skin    ▶] │                                             │
│  [Minimalist  ▶] │                                             │
│                  │                                             │
└──────────────────┴──────────────────────────────────────────────┘
```

#### Left panel — Competitor list

```
Width: 260px, fixed
Background: var(--bg-card)
Border-right: 1px solid var(--border-default)
Padding: 16px

Section header:
  "COMPETITORS" — DM Sans 600 11px uppercase, var(--text-muted)
  "+ Add" button — Primary style, height 32px, padding 0 12px, font-size 13px

Each competitor row:
  Height: 56px
  Padding: 10px 12px
  Border-radius: 8px
  Cursor: pointer
  Display: flex, align-items center, gap 10px

  Active state:
    Background: rgba(124, 58, 237, 0.10)
    Left border: 2px solid #7C3AED

  Hover state:
    Background: var(--bg-card-secondary)

  Content:
    [Logo/Avatar 32px circle]
    [Name — DM Sans 500 14px var(--text-primary)]
    [Winning ads count badge — small, right side]
    [Scraping spinner if status === 'scraping']

  Scrape status indicators:
    'complete' → green dot
    'scraping' → animated blue spinner
    'error'    → red dot with tooltip
    'pending'  → gray dot
```

#### Right panel — Ad grid + Brief tabs

When a competitor is selected, show two tabs at the top of the right panel:

**Tab 1: Winning Ads**
**Tab 2: AI Creative Brief**

---

#### Winning Ads Tab

Filter bar above the grid:
```
[All] [Winning 90d+] [Top Performer 180d+]   Sort: [Longest Running ▼]
```

Ad card grid — `grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))`, gap `16px`

Each ad card:
```
┌─────────────────────────────────────┐
│                                     │
│   [Ad creative preview area]        │
│   Background: var(--bg-card-secondary)│
│   Height: 160px                     │
│   If image_url: show image          │
│   If no image: show ad format icon  │
│   centered on muted background      │
│                                     │
│   [🏆 TOP PERFORMER badge]  [180d]  │
├─────────────────────────────────────┤
│  Headline text                      │
│  DM Sans 600 14px, --text-primary   │
│  (truncate at 2 lines)              │
│                                     │
│  Ad copy preview                    │
│  DM Sans 400 13px, --text-secondary │
│  (truncate at 3 lines)              │
│                                     │
│  [Video] [Learn More]  ↗ View Ad    │
└─────────────────────────────────────┘
```

Badge styles:
- "TOP PERFORMER": background `#7C3AED`, text white, DM Sans 600 11px
- "WINNING": background `#059669`, text white
- Days counter: DM Sans 500 12px, `var(--text-muted)`, right side of badge row

"↗ View Ad" links to `ad_snapshot_url` from Meta (opens the real ad in a new tab)

Empty state (no winning ads yet):
```
[Clock icon, 48px, muted]
"Scraping ads..."
"We're pulling ads for this competitor. Check back in a few minutes."
[Refresh button]
```

Empty state (scrape complete, 0 winning ads):
```
[Trophy icon, 48px, muted]
"No winning ads found yet"
"None of this competitor's ads have been running for 90+ days. 
 We'll keep checking as they run longer."
```

---

#### AI Creative Brief Tab

This tab shows the Claude-generated analysis. If no brief exists yet (analysis still running), show a loading state.

Layout:
```
┌─────────────────────────────────────────────────────────┐
│  🤖  AI Creative Brief                [Regenerate]      │
│  Based on X winning ads from [Competitor Name]          │
│  Generated [timestamp]                                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  HOOK PATTERNS                                          │
│  [text from Claude]                                     │
│                                                         │
│  PAIN POINTS THEY TARGET                                │
│  [text from Claude]                                     │
│                                                         │
│  HOW THEY FRAME OFFERS                                  │
│  [text from Claude]                                     │
│                                                         │
│  VISUAL & CREATIVE THEMES                               │
│  [text from Claude]                                     │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  5 CONTENT ANGLES TO TEST                               │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  1. [Angle Name]              [Video] badge     │   │
│  │  Hook: "[hook line]"                            │   │
│  │  [core message]                                 │   │
│  │  Why it works: [reasoning]                      │   │
│  └─────────────────────────────────────────────────┘   │
│  (repeat for all 5 angles)                              │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

Section heading style: Plus Jakarta Sans 600 13px, `#7C3AED`, uppercase, letter-spacing 0.06em
Section content: DM Sans 400 14px, `var(--text-secondary)`, line-height 1.6

Content angle cards:
- Background: `var(--bg-card-secondary)`
- Border: `1px solid var(--border-default)`
- Border-radius: `10px`
- Padding: `16px`
- Gap between cards: `10px`
- Angle name: Plus Jakarta Sans 600 15px, `var(--text-primary)`
- Format badge: DM Sans 600 11px, background `rgba(124,58,237,0.1)`, text `#7C3AED`
- Hook line: DM Sans 400 14px italic, `var(--text-secondary)`
- Core message + reasoning: DM Sans 400 13px, `var(--text-muted)`

"Regenerate" button: Secondary/outline style, triggers fresh Claude analysis call

Loading state (brief being generated):
```
[Animated sparkle icon]
"Analyzing X winning ads..."
"Claude is identifying patterns and building your creative brief."
[Progress bar that increments over ~30 seconds]
```

---

### Component: Add Competitor Modal

Triggered by "+ Add" button in left panel.

```
┌───────────────────────────────────────────────────────┐
│  Add Competitor                               [✕]     │
│                                                       │
│  Enter brand name, website, or Facebook URL           │
│                                                       │
│  [___________________________________________]        │
│   e.g. "Mamaearth", "mamaearth.in",                   │
│        "facebook.com/mamaearth"                       │
│                                                       │
│                              [Search Brand →]         │
└───────────────────────────────────────────────────────┘
```

On search → show loading state → then show results:

```
┌───────────────────────────────────────────────────────┐
│  Select the correct brand                     [✕]     │
│                                                       │
│  ◉ [pic] Mamaearth                   12,847 ads      │
│          facebook.com/mamaearth                       │
│                                                       │
│  ○ [pic] Mamaearth India                342 ads      │
│          facebook.com/mamaearth.india                 │
│                                                       │
│  ○ [pic] Mamaearth Official              89 ads      │
│          facebook.com/mamaearth.official              │
│                                                       │
│  Can't find it? [Try a different name]                │
│                                                       │
│  [Back]                  [Track This Brand →]         │
└───────────────────────────────────────────────────────┘
```

- Radio selection, default selects the first/highest ad count result
- "Track This Brand →" is disabled until a selection is made
- On confirm → POST to `/api/competitors/add` → close modal → select new competitor in left panel → show scraping state

---

## Error Handling

### Meta API errors

| Error | Handle |
|---|---|
| Token expired | Refresh token, retry once. If refresh fails: show "Reconnect Meta Ads in Settings" banner |
| Rate limited (429) | Wait 60 seconds, retry. Log to `sync_jobs`. |
| Page not found | Show "This brand's Facebook page could not be found. Try a different search." |
| No ads returned | Show "This brand has no active ads in the Meta Ad Library." |
| Network timeout | Retry once after 5s, then mark scrape_status as 'error' |

### Claude API errors

| Error | Handle |
|---|---|
| Timeout | Retry once. If fails again, show "Brief generation failed — try regenerating." |
| No winning ads | Don't call Claude. Show "No winning ads to analyze yet." |
| API error | Log error, show retry button in brief tab |

---

## Visual Design Rules

- All new components follow the same CSS variable system as the rest of the app
- Ad cards use `var(--bg-card)` background, `var(--border-default)` border
- Left panel uses `var(--bg-card)` with border-right separator
- All buttons follow the button standards from `PHASE1_SETTINGS_OVERHAUL.md`
- Fonts: Plus Jakarta Sans for headings and badge labels, DM Sans for all body text
- Brand purple `#7C3AED` for all interactive elements and badges
- No blue buttons anywhere

---

## Cron Schedule

Add competitor re-scraping to the existing cron job at `/api/cron/sync`:

- Re-scrape competitors where `last_scraped_at` is older than 48 hours
- Re-run Claude analysis if new winning ads have been found since last brief
- Process maximum 10 competitors per cron run to avoid timeout
- Log each scrape to `sync_jobs` table with `source: 'competitor_spy'`

---

## Definition of Done

- [ ] User can type a brand name, website, or Facebook URL and get back matching pages
- [ ] Confirmation modal shows profile picture, page name, and ad count for each result
- [ ] Confirmed competitor is saved and scrape triggers immediately
- [ ] Scraping pulls all ads from Meta Ad Library for that page
- [ ] Ads are classified as active / winning (90d+) / top performer (180d+)
- [ ] Winning ads display in a grid with correct badges and days-running counter
- [ ] "View Ad" link opens the real Meta ad snapshot in a new tab
- [ ] Claude generates a creative brief for competitors with 1+ winning ads
- [ ] Brief shows hook patterns, pain points, offer structures, and 5 content angles
- [ ] "Regenerate" button triggers a fresh Claude analysis
- [ ] Cron job re-scrapes all competitors every 48 hours
- [ ] All error states handled gracefully (rate limits, missing data, API failures)
- [ ] UI is consistent with the rest of the app (fonts, colors, card styles, button styles)
- [ ] No Slack references anywhere in the codebase
- [ ] RLS policies ensure workspace data isolation
