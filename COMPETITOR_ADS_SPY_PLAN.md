# Competitor Ads Spy — Implementation Plan

> Hand this whole doc to Claude Code. It captures everything you need to
> turn the current half-built competitor-ads feature into the "search a
> brand → see every real creative → AI reads every image & video and tells
> me what's working" product described in LUMNIX_MASTER_PLAN.md.

---

## 1. What the user wants (acceptance demo)

A user opens the Lumnix dashboard, types `nike` in the competitor search.

1. The top result **is Nike** (not "skate." or a random low-ad page).
2. They click "Track", the pipeline scrapes every active and historical ad.
3. Within a minute or two, they see a gallery of **real creatives** —
   thumbnails for images, autoplay-on-hover loops for videos — not a list
   of text snippets with links to Facebook.
4. Each creative has an AI insight chip: *"UGC talking-head hook, pain
   point = sore feet, primary color #FF6B00, likely audience 35–55
   women, running 127 days"* — written by a vision model that actually
   looked at the image/video.
5. Above the grid, a strategic brief auto-summarizes the competitor:
   *"Nike leans heavily on athlete endorsement videos with slow-motion
   B-roll and a single-word headline. Their winning cluster is 'comeback
   stories' (12 ads, avg 180 days running)."*

Everything below is how we get there.

---

## 2. Current state (don't re-investigate, it's already mapped)

### What works today

| Piece | State | File |
|---|---|---|
| Meta Ad Library token | ✅ 60-day user token in `META_ACCESS_TOKEN`, auto-refresh in-route | `src/lib/meta-ad-library-token.ts`, `src/lib/meta-oauth.ts`, `tools/refresh_meta_app_token.mjs` |
| Brand search route | 🟡 Works, but ranks badly | `src/app/api/competitors/search/route.ts` |
| Ad scrape route | ✅ Pulls ad metadata + text into `competitor_ads`, paginates up to 10 pages of 100 | `src/app/api/competitors/scrape/route.ts` |
| AI analysis (text-only) | 🟡 Works, writes to `competitor_briefs`, **no vision** | `src/app/api/competitors/analyze/route.ts` |
| UI — competitors dashboard | 🟡 Text + "View on Facebook" external link only | `src/app/dashboard/competitors/page.tsx` |
| End-to-end test harness | ✅ Middleware-auth-safe, runs the full scrape pipeline | `tools/test_competitor_scrape.mjs` |
| Middleware auth | ✅ Session JWT required on all `/api/*` except cron + PUBLIC_ROUTES | `src/middleware.ts` |

### What's broken or missing

1. **Search ranking.** `searchAdLibrary()` sorts result pages by the count
   of ads found *in the first 50 ads of the search*, not by name
   relevance. `nike` → `skate.` is the proof.
2. **No media URLs.** `competitor_ads.image_url` and `video_url` columns
   exist (migration: `migrations/supabase-adspy-v2-migration.sql` lines
   17–56) but are never populated. The Meta Ad Library API does not
   return direct media URLs — you only get `ad_snapshot_url`, a URL to
   an HTML page.
3. **No vision.** `src/app/api/competitors/analyze/route.ts` sends only
   `headline`, `ad_copy`, `call_to_action`, `ad_format`, `days_running`
   to `claude-sonnet-4-5-20250514` as text. It never looks at the
   actual creatives.
4. **UI never renders creatives.** `page.tsx` (line ~810) shows
   `image_url` in an `<img>` tag — but it's always null, so every card
   falls through to the "FB" text placeholder.

### Already installed (do NOT reinstall)

Added during the planning session:

- `playwright-core` — browser automation (prod + dev)
- `@sparticuz/chromium` — x86-64 Chromium for Vercel serverless
- `playwright` (devDependency) — downloads ARM64/x86 Chromium for local dev

### Non-obvious gotchas (already discovered, save yourself the debugging)

1. **The `ad_snapshot_url` from the API returns HTTP 400 to plain fetch.**
   It's a `/ads/archive/render_ad/?id=X&access_token=Y` URL — the token
   only works for FB's own render pipeline. Use
   `https://www.facebook.com/ads/library/?id=<AD_ID>` instead. That URL
   is the public Ad Library page users click to.
2. **Plain `fetch` gets 403 + a JS challenge** on the public library URL
   (`__rd_verify_*` endpoint). Headless browser is not optional; it's
   the only path.
3. **Our sandbox is ARM64, Vercel is x86-64.** `@sparticuz/chromium`
   bundles an x86-64 binary — it will fail to execute locally. In
   local dev, use `playwright`'s auto-downloaded Chromium. In prod,
   use `@sparticuz/chromium`. Branch on `process.env.VERCEL` or
   `process.platform` + `process.arch`.
4. **`competitor_brands` has `ad_count` column in prod** even though no
   migration file adds it (added via Supabase dashboard). Trust the live
   schema, not the SQL files. The brand-logo column is `logo_url`
   (not `picture_url`), and both `facebook_page_id` and `fb_page_id`
   exist — scrape route reads either.
5. **`/ads_archive` with `ad_type=ALL` works globally** (IN/US/GB/AU/CA
   all return ads). Do not restrict countries further.
6. **Middleware requires a session JWT** on every `/api/*` route (except
   `/api/cron/*` and PUBLIC_ROUTES). For Node-side tests, mint a session
   via `supabase.auth.admin.generateLink` → `email_otp` → POST
   `/auth/v1/verify {type:'email', token:<email_otp>, email}`. Pattern
   already lives in `tools/test_competitor_scrape.mjs`.

### Relevant tables (live schema, verified 2026-04-21)

`competitor_brands` columns: `id, workspace_id, name, domain, fb_page_id,
facebook_page_id, facebook_page_name_resolved, facebook_page_url,
website_url, logo_url, scrape_status, spy_score, total_ads_found,
winning_ads_count, active_ads_count, ad_count, last_scraped_at, created_at`.

`competitor_ads` columns (all already defined — no new migration
needed for media): `id, workspace_id, competitor_id, meta_ad_id,
page_id, page_name, ad_copy, headline, description, call_to_action,
ad_format, image_url, video_url, ad_snapshot_url,
ad_delivery_start_time, ad_delivery_stop_time, days_running, is_active,
performance_tier, ai_analyzed, ai_hook_type, ai_pain_point,
ai_offer_structure, ai_visual_style, ai_cta_type, ai_summary,
scraped_at, created_at`.

`competitor_briefs` exists for strategic rollup (already written to by
`analyze/route.ts`).

---

## 3. What to build (four deliverables)

### 3.1 — Fix brand search ranking

**File:** `src/app/api/competitors/search/route.ts`

**Problem.** `searchAdLibrary(query, token)` currently:

1. Calls `/ads_archive?search_terms=<query>&limit=50`.
2. Groups by `page_id`, counts occurrences *in the first 50 results*.
3. Sorts by that count, returns top 5.

This is why `nike` → `skate.` — skate. had 12 of its 50 sampled ads
matching "nike" (because it ran a co-branded ad), Nike itself had 4.

**Fix.** Rank by *page name relevance to the query*, then break ties
on actual ad volume. Algorithm:

```ts
function scorePage(page: { page_name: string }, query: string): number {
  const q = query.toLowerCase().trim();
  const n = page.page_name.toLowerCase().trim();
  if (n === q) return 1000;                 // exact match
  if (n.startsWith(q)) return 500;          // prefix
  if (n.split(/\s+/).includes(q)) return 300; // exact word
  if (n.includes(q)) return 100;            // substring
  // fallback: simple token overlap
  const qTokens = new Set(q.split(/\s+/));
  const nTokens = n.split(/\s+/);
  const overlap = nTokens.filter(t => qTokens.has(t)).length;
  return overlap * 20;
}
```

Then: `sort by scorePage desc, then by ad_count desc`. Keep top 5.

**Also:** Widen the initial fetch from `limit=50` to `limit=100` so
rare but relevant brand matches aren't missed. Cost: one extra API
call at most.

**Acceptance:** POST `/api/competitors/search` with `{query:"nike"}`
returns Nike (any Nike-branded page, e.g. "Nike", "Nike Women",
"Nike Running") as result #1. Test:

```bash
node tools/test_competitor_scrape.mjs nike
# Expect: top result's page_name contains "Nike"
```

Also try `patagonia`, `allbirds`, `glossier`, `huel` — each should
return the brand, not a derivative page.

---

### 3.2 — Build the Playwright media extractor

**New file:** `src/lib/meta-snapshot-scraper.ts`

**Responsibilities:**

- Launch Chromium (local: `playwright`'s download; prod: `@sparticuz/chromium`).
- Navigate to `https://www.facebook.com/ads/library/?id=<meta_ad_id>`.
- Pass the FB JS challenge (real-browser nav does this automatically).
- Dismiss cookie banner if it appears.
- Wait for the ad preview to mount.
- Return `{ image_url, video_url, ad_format, thumbnail_url, carousel_urls[] }`.

**Sketch:**

```ts
// src/lib/meta-snapshot-scraper.ts
import type { Browser } from 'playwright-core';

export type ExtractedMedia = {
  image_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  carousel_urls: string[];
  ad_format: 'image' | 'video' | 'carousel' | 'unknown';
};

export async function launchBrowser(): Promise<Browser> {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    const chromium = (await import('@sparticuz/chromium')).default;
    const { chromium: pw } = await import('playwright-core');
    return pw.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    });
  }
  // local
  const { chromium: pw } = await import('playwright');
  return pw.launch({ headless: true });
}

export async function extractMediaFromSnapshot(
  browser: Browser,
  metaAdId: string,
): Promise<ExtractedMedia> {
  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
    locale: 'en-US',
  });
  const page = await ctx.newPage();

  // Collect network media as fallback/confirmation
  const netImages = new Set<string>();
  const netVideos = new Set<string>();
  page.on('response', (resp) => {
    const url = resp.url();
    const ct = resp.headers()['content-type'] || '';
    if (ct.startsWith('image/') && url.includes('fbcdn')) netImages.add(url);
    if (ct.startsWith('video/') || url.includes('.mp4')) netVideos.add(url);
  });

  try {
    await page.goto(`https://www.facebook.com/ads/library/?id=${metaAdId}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    try {
      await page.getByRole('button', { name: /allow all|accept|only allow essential/i }).first().click({ timeout: 2500 });
    } catch { /* no banner */ }

    await page.waitForTimeout(3500); // let the ad preview mount

    const dom = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
        .map((i) => ({ src: (i as HTMLImageElement).src, w: (i as HTMLImageElement).naturalWidth, h: (i as HTMLImageElement).naturalHeight }))
        .filter((x) => x.src && x.w > 150 && !x.src.startsWith('data:'));
      const vids = Array.from(document.querySelectorAll('video'))
        .map((v) => ({ src: (v as HTMLVideoElement).currentSrc || (v as HTMLVideoElement).src, poster: (v as HTMLVideoElement).poster }))
        .filter((x) => x.src || x.poster);
      return { imgs, vids };
    });

    const video = dom.vids[0] || null;
    const image = dom.imgs.sort((a, b) => b.w * b.h - a.w * a.h)[0] || null;
    const carousel = dom.imgs.slice(1, 10).map((i) => i.src);

    if (video?.src) {
      return {
        image_url: null,
        video_url: video.src,
        thumbnail_url: video.poster || image?.src || null,
        carousel_urls: [],
        ad_format: 'video',
      };
    }
    if (dom.imgs.length >= 2) {
      return {
        image_url: image?.src || null,
        video_url: null,
        thumbnail_url: image?.src || null,
        carousel_urls: carousel,
        ad_format: 'carousel',
      };
    }
    return {
      image_url: image?.src || null,
      video_url: null,
      thumbnail_url: image?.src || null,
      carousel_urls: [],
      ad_format: image ? 'image' : 'unknown',
    };
  } finally {
    await ctx.close();
  }
}
```

**Probe it first.** `tools/_probe_playwright.mjs` already exists and
tries to render a Nike ad. Get it passing before wiring into anything.
If the DOM-based selectors don't find images, fall back to the
network-capture approach (the `page.on('response', ...)` listener
already buffers all fbcdn image / mp4 video URLs for that page load).

**Dependency on prod:** `@sparticuz/chromium` only ships x86-64. Vercel
runs x86-64 by default. Specify `runtime = 'nodejs'` (not edge) and
`maxDuration = 300` on the route (Pro plan).

---

### 3.3 — Per-ad vision analysis route

**New file:** `src/app/api/competitors/analyze-creative/route.ts`

**Why new route (not edit `analyze/route.ts`):** the existing route
does strategic *rollup*. This new one does *per-ad enrichment*. Keep
them separate; the rollup route can keep calling Claude text-only
against richer data after we fill in the per-ad AI fields.

**Flow per ad:**

1. Select a batch of `competitor_ads` rows where
   `ai_analyzed = false AND (image_url IS NOT NULL OR video_url IS NOT NULL)`.
2. For each ad: fetch the image bytes (or a video thumbnail — use the
   `thumbnail_url` captured by the scraper).
3. Send to Claude Sonnet 4.5 (`claude-sonnet-4-5-20250514`) with a
   vision message: the image (base64) + the text fields we already
   have (headline, ad_copy, CTA).
4. Ask Claude for strict JSON:
   ```
   {
     "hook_type": "problem-agitate | social-proof | direct-benefit | curiosity | ugc-authority | comparison | before-after",
     "pain_point": "short noun phrase",
     "offer_structure": "discount | bundle | free-trial | no-offer | gift | limited-time",
     "visual_style": "studio-product | lifestyle | ugc-selfie | talking-head | motion-graphic | before-after | bold-typography",
     "cta_type": "shop-now | learn-more | sign-up | download | book-now | install",
     "summary": "one sentence explaining why this specific creative is winning/failing"
   }
   ```
5. Upsert into `competitor_ads.ai_*` fields and set `ai_analyzed = true`.

**Use the existing `src/lib/anthropic.ts` `callClaude` helper**, but
extend it to support vision input. Or just use the official SDK
directly (`@anthropic-ai/sdk` is already in deps).

**Budget.** 144 ads × ~2K tokens (image ~1600, prompt ~400) ≈ $1.50
per competitor with Sonnet 4.5. Acceptable.

**Test. **

```bash
node tools/test_competitor_scrape.mjs nike --keep
# then manually POST /api/competitors/analyze-creative
#   { workspace_id, competitor_id, limit: 10 }
# expect: 10 rows with ai_analyzed=true and ai_* fields populated
```

---

### 3.4 — Wire the pipeline & update the UI

#### 3.4.1 Pipeline orchestration

Edit `src/app/api/competitors/scrape/route.ts`. At the end, it already
uses `after()` to trigger `/api/competitors/analyze`. Change that to
trigger a new **orchestrator endpoint** that does:

1. Call `/api/competitors/extract-media` in chunks until all new ads
   have `image_url` OR `video_url` filled (or 3 retries per ad).
2. Call `/api/competitors/analyze-creative` in chunks until all ads
   with media have `ai_analyzed = true`.
3. Finally call `/api/competitors/analyze` (the existing route) to
   regenerate the strategic brief — now with richer per-ad context.

Because each Vercel invocation is bounded by `maxDuration`, the
orchestrator should be a self-recursive endpoint: each invocation
does a chunk and, if more work remains, POSTs itself again (via
`after()` so the HTTP response returns immediately). Update
`competitor_brands.scrape_status` as it moves through phases:
`scraping → extracting_media → analyzing → idle`.

New file: `src/app/api/competitors/extract-media/route.ts`.

#### 3.4.2 UI — render real creatives

Edit `src/app/dashboard/competitors/page.tsx`. The ad grid around
line ~800 currently shows a flex row with an `<img src={image_url}>`
that's always null.

Replace each ad card with a component that renders:

- If `ad_format === 'video'` and `video_url` exists: `<video>` tag
  with `poster={thumbnail_url}`, `muted loop playsinline`, `autoPlay`
  on hover via a state hook. Falls back to `<img src={thumbnail_url}>`.
- If `ad_format === 'image'`: `<img src={image_url}>` with
  `loading="lazy"`.
- If `ad_format === 'carousel'`: small horizontal scroll strip of the
  carousel_urls thumbnails.
- Overlay chip on hover: the `ai_summary`, with `ai_hook_type` and
  `ai_visual_style` as small badges below.
- Click → open a modal (`src/components/ui/dialog.tsx`) showing the
  full creative + all AI insights + a "View on Facebook" link.

**Design system rules** (from `.claude/rules/figma-design-system.md`):

- Dark-first theme. Do not hardcode `#7C3AED` — use
  `var(--color-accent)` or Tailwind's `bg-accent`.
- Use existing `src/components/ui/` primitives (`Card`, `Badge`,
  `Dialog`, `ScrollArea`, `Tooltip`).
- All raster imgs via `next/image` with explicit `width`/`height`
  unless it's a user-uploaded creative where dimensions are unknown —
  then `<img loading="lazy">` is fine.
- `prefers-reduced-motion` must disable video autoplay.

#### 3.4.3 UI — strategic brief card

Above the grid, render a "Strategic Summary" card reading from
`competitor_briefs`. Already exists visually elsewhere; check
`src/app/dashboard/competitors/page.tsx` around the brief display
and plug the richer data in.

---

## 4. Execution order

Do in this order. Don't skip; later steps depend on earlier ones.

1. **Fix search ranking (§3.1).** ~30 min. Self-contained; unblocks
   the rest because every subsequent step starts from "search the
   right brand."
2. **Get `tools/_probe_playwright.mjs` passing.** It's already in the
   repo. Fix any remaining issues (local ARM Chromium path, waits,
   selectors). Don't move on until it extracts real image/video URLs
   for a Nike ad.
3. **Extract the scraper into `src/lib/meta-snapshot-scraper.ts`.**
   Ship a unit test that calls it against 3 known ad IDs and asserts
   non-null media.
4. **Build `src/app/api/competitors/extract-media/route.ts`.** Process
   batches of 10 ads per invocation. Concurrency 2. Test via the
   end-to-end harness.
5. **Build `src/app/api/competitors/analyze-creative/route.ts`.**
   Vision-backed per-ad enrichment. Test.
6. **Write the orchestrator** and wire it into `scrape/route.ts`'s
   `after()` block. Status-stage the brand row.
7. **UI updates (§3.4.2, §3.4.3).** Render creatives + AI chips + brief.
8. **End-to-end smoke.** Run the test script against `nike`,
   `patagonia`, `huel`. Each should land in the DB with media, AI
   fields, and a populated brief.
9. **Deploy to Vercel.** Set `maxDuration=300` on the long routes;
   pin `runtime='nodejs'`. Verify `@sparticuz/chromium` executes in
   prod (x86-64 is the default).

---

## 5. Testing — what "done" looks like

Run from repo root. All of these must pass.

```bash
# 1. Search returns Nike, not "skate."
node tools/test_competitor_scrape.mjs nike --keep
# Expect: top result.page_name matches /nike/i

# 2. Scrape populates media for ≥80% of ads
# (check after extract-media orchestration finishes)
#   SELECT count(*) FROM competitor_ads
#   WHERE competitor_id = <X> AND (image_url IS NOT NULL OR video_url IS NOT NULL);
# Expect: ≥ 0.8 × total_ads_found

# 3. AI analysis: ≥80% of ads with media have ai_analyzed = true
# and ai_hook_type/ai_visual_style non-null.

# 4. Brief is populated in competitor_briefs after orchestration.

# 5. Visit /dashboard/competitors, click Nike. Grid shows actual images
# and video thumbnails. Hover a card — AI summary appears. Click — modal
# with full insights.

# 6. npm run build — clean production build. No type errors.
```

Keep `tools/_probe_playwright.mjs`, `tools/_probe_snapshot.mjs`,
`tools/test_competitor_scrape.mjs` up to date. They are the fastest
path back to confidence when something breaks.

---

## 6. Out of scope (save for next iteration)

- **Video content analysis.** Claude vision currently analyzes a
  single frame (thumbnail). Full video understanding would require
  either Gemini 2.0 Flash (native video) or frame-sampling + stitching.
  Ship v1 with thumbnail analysis.
- **Historical backfill of existing brands.** Only newly-scraped ads
  run through the new pipeline. A one-off migration script can
  backfill later.
- **Long-term creative storage.** fbcdn URLs expire. To keep creatives
  forever, copy to Supabase Storage on first fetch. Phase 2.
- **Per-creative performance estimation.** We tier by `days_running`
  for now. Actual spend/reach modeling is a separate research project.
- **Monitoring and alerts.** When a competitor launches a new ad,
  fire a change_alert. The `change_alerts` table already exists.
  Wire it up in Phase 2.

---

## 7. Notes for Claude Code

- **Read `CLAUDE.md` and `.claude/rules/figma-design-system.md` first.**
  The WAT framework and design-system rules are load-bearing.
- **Don't delete or rewrite the existing analyze route** (`src/app/api/competitors/analyze/route.ts`).
  It's called by the orchestrator for the strategic rollup. Add
  the new per-ad `analyze-creative` route alongside it.
- **Auth pattern for testing:** never curl the routes directly. Use
  `tools/test_competitor_scrape.mjs` as the template for any new
  smoke test — it already handles the Supabase magic-link/session
  dance.
- **Never hardcode `#7C3AED`.** Use `var(--color-accent)` or
  `bg-accent`. 142 places across 30 files already have the old
  hex — don't add to the debt.
- **Cron/scheduled scraping is already wired** via `/api/cron/spy-agent`.
  If you touch the scrape route, re-verify the cron path still works.

Good hunting.
