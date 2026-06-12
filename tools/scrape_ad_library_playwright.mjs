#!/usr/bin/env node
/**
 * Meta Ad Library scraper — own-infrastructure version (no third-party APIs).
 *
 * Loads the PUBLIC facebook.com/ads/library page in headless Chromium and
 * intercepts the internal GraphQL XHR responses. We never parse the DOM for
 * data — we read the JSON data layer, which survives UI redesigns.
 *
 * Drift-proofing: instead of hardcoding the GraphQL response path
 * (data.ad_library_main.search_results_connection...), we recursively walk
 * every GraphQL JSON payload and collect any object carrying `ad_archive_id`.
 * Meta can rename queries/wrappers; the ad node itself is stable.
 *
 * Usage:
 *   node tools/scrape_ad_library_playwright.mjs --q "mamaearth" [--country IN] [--max 50]
 *   node tools/scrape_ad_library_playwright.mjs --page-id 123456 --country ALL
 *   Flags: --headful (debug), --raw (dump raw graphql payloads), --out path.json
 *
 * Output: .tmp/ad_library_<query>_<ts>.json — rows shaped for the
 * `competitor_ads` Supabase table (meta_ad_id, page_name, ad_copy, ...).
 */

import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

// ── args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1];
};
const has = (name) => args.includes(`--${name}`);

const QUERY = flag('q');
const PAGE_ID = flag('page-id');
const COUNTRY = flag('country') || 'ALL';
const MAX_ADS = parseInt(flag('max') || '50', 10);
const HEADFUL = has('headful');
const DUMP_RAW = has('raw');

if (!QUERY && !PAGE_ID) {
  console.error('Usage: node tools/scrape_ad_library_playwright.mjs --q "<brand>" [--country IN] [--max 50]');
  process.exit(1);
}

const label = (QUERY || PAGE_ID).replace(/[^a-z0-9]+/gi, '_').toLowerCase();
const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const OUT = flag('out') || path.join('.tmp', `ad_library_${label}_${ts}.json`);
fs.mkdirSync(path.dirname(OUT), { recursive: true });

// ── build the public Ad Library URL ─────────────────────────────────────
const params = new URLSearchParams({
  active_status: 'active',
  ad_type: 'all',
  country: COUNTRY,
  media_type: 'all',
});
if (PAGE_ID) {
  params.set('view_all_page_id', PAGE_ID);
  params.set('search_type', 'page');
} else {
  params.set('q', QUERY);
  params.set('search_type', 'keyword_unordered');
}
const URL = `https://www.facebook.com/ads/library/?${params.toString()}`;

// ── recursive walker: find every object with ad_archive_id ──────────────
function collectAdNodes(obj, found) {
  if (!obj || typeof obj !== 'object') return;
  if (Array.isArray(obj)) {
    for (const item of obj) collectAdNodes(item, found);
    return;
  }
  if (obj.ad_archive_id && (obj.snapshot || obj.adArchiveID || obj.page_name !== undefined)) {
    found.set(String(obj.ad_archive_id), obj);
  } else if (obj.adArchiveID) {
    found.set(String(obj.adArchiveID), obj);
  }
  for (const v of Object.values(obj)) collectAdNodes(v, found);
}

// Meta sometimes streams multiple JSON objects per response, newline-separated
function parseMultiJson(text) {
  const out = [];
  try {
    out.push(JSON.parse(text));
    return out;
  } catch { /* fall through to line-by-line */ }
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    try { out.push(JSON.parse(t)); } catch { /* skip non-JSON line */ }
  }
  return out;
}

// ── normalize a raw ad node → competitor_ads row shape ──────────────────
function toEpochDate(v) {
  if (v == null) return null;
  if (typeof v === 'number') return new Date(v * 1000).toISOString();
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString();
}

function normalize(node) {
  const snap = node.snapshot || {};
  const body = snap.body?.text ?? snap.body?.markup?.__html ?? (typeof snap.body === 'string' ? snap.body : null);
  const card = snap.cards?.[0] || {};
  const video = snap.videos?.[0] || {};
  const image = snap.images?.[0] || {};
  const start = toEpochDate(node.start_date ?? node.startDate);
  const stop = toEpochDate(node.end_date ?? node.endDate);
  const daysRunning = start
    ? Math.max(0, Math.round(((stop ? new Date(stop) : new Date()) - new Date(start)) / 86400000))
    : null;

  const videoUrl = video.video_hd_url || video.video_sd_url || card.video_hd_url || card.video_sd_url || null;
  const imageUrl =
    image.original_image_url || image.resized_image_url ||
    card.original_image_url || card.resized_image_url ||
    video.video_preview_image_url || null;

  return {
    meta_ad_id: String(node.ad_archive_id ?? node.adArchiveID),
    page_id: String(node.page_id ?? node.pageID ?? snap.page_id ?? '') || null,
    page_name: node.page_name ?? snap.page_name ?? null,
    ad_copy: body ?? card.body ?? null,
    headline: snap.title ?? card.title ?? null,
    description: snap.link_description ?? card.link_description ?? null,
    call_to_action: snap.cta_text ?? card.cta_text ?? snap.cta_type ?? null,
    ad_format: videoUrl ? 'video' : snap.display_format?.toLowerCase?.() ?? (imageUrl ? 'image' : 'unknown'),
    image_url: imageUrl,
    video_url: videoUrl,
    ad_snapshot_url: `https://www.facebook.com/ads/library/?id=${node.ad_archive_id ?? node.adArchiveID}`,
    ad_delivery_start_time: start,
    ad_delivery_stop_time: stop,
    days_running: daysRunning,
    is_active: node.is_active ?? node.isActive ?? true,
    publisher_platforms: node.publisher_platform ?? node.publisherPlatform ?? null,
    scraped_at: new Date().toISOString(),
  };
}

// ── main ─────────────────────────────────────────────────────────────────
const adsById = new Map();
const rawPayloads = [];

console.log(`─── Meta Ad Library scrape ───`);
console.log(`target : ${QUERY ? `q="${QUERY}"` : `page_id=${PAGE_ID}`} country=${COUNTRY} max=${MAX_ADS}`);
console.log(`url    : ${URL}\n`);

const browser = await chromium.launch({
  headless: !HEADFUL,
  args: ['--disable-blink-features=AutomationControlled'],
});
const ctx = await browser.newContext({
  locale: 'en-US',
  timezoneId: 'Asia/Kolkata',
  viewport: { width: 1440, height: 900 },
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
});
const page = await ctx.newPage();

// Intercept every GraphQL response; walk it for ad nodes.
page.on('response', async (res) => {
  const u = res.url();
  if (!u.includes('/api/graphql') && !u.includes('/async/')) return;
  let text;
  try { text = await res.text(); } catch { return; }
  if (!text || !text.includes('ad_archive_id')) return;
  const cleaned = text.replace(/^for\s*\(;;\);/, ''); // FB anti-JSON-hijack prefix
  for (const payload of parseMultiJson(cleaned)) {
    if (DUMP_RAW) rawPayloads.push(payload);
    const before = adsById.size;
    collectAdNodes(payload, adsById);
    if (adsById.size > before) {
      console.log(`  +${adsById.size - before} ads (total ${adsById.size}) from XHR`);
    }
  }
});

try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Dismiss cookie banner if present (region-dependent)
  for (const labelText of ['Decline optional cookies', 'Allow all cookies', 'Only allow essential cookies']) {
    const btn = page.locator(`button:has-text("${labelText}")`).first();
    if (await btn.isVisible({ timeout: 2500 }).catch(() => false)) {
      await btn.click().catch(() => {});
      break;
    }
  }

  // Detect login wall / checkpoint / soft block
  await page.waitForTimeout(4000);
  const pageText = await page.evaluate(() => document.body.innerText.slice(0, 3000));
  if (/log in to continue|checkpoint required/i.test(pageText)) {
    throw new Error('BLOCKED: Facebook served a login wall / checkpoint for this IP. Retry later or from another IP.');
  }
  if (/sorry, something went wrong/i.test(pageText)) {
    console.error('⛔ SOFT BLOCK: Meta is rate-limiting this IP/fingerprint ("Sorry, something went wrong"). Wait 1-6h before retrying. Keep scrape frequency ≤ a few per hour.');
    await browser.close();
    process.exit(3);
  }

  // First batch may be embedded in initial HTML <script> payloads, not XHR
  const inline = await page.evaluate(() =>
    Array.from(document.querySelectorAll('script[type="application/json"]'))
      .map((s) => s.textContent)
      .filter((t) => t && t.includes('ad_archive_id'))
  );
  for (const blob of inline) {
    for (const payload of parseMultiJson(blob)) {
      if (DUMP_RAW) rawPayloads.push(payload);
      collectAdNodes(payload, adsById);
    }
  }
  if (adsById.size) console.log(`  ${adsById.size} ads from initial page payload`);

  // Scroll to paginate until max reached or no growth 3 rounds in a row
  let stale = 0;
  while (adsById.size < MAX_ADS && stale < 3) {
    const before = adsById.size;
    await page.mouse.wheel(0, 2500);
    await page.waitForTimeout(1800 + Math.floor(Math.random() * 1200)); // human-ish pacing
    if (adsById.size === before) stale++;
    else stale = 0;
  }
} finally {
  await browser.close();
}

// ── results ──────────────────────────────────────────────────────────────
const ads = [...adsById.values()].map(normalize).slice(0, MAX_ADS);

if (DUMP_RAW) {
  const rawOut = OUT.replace(/\.json$/, '.raw.json');
  fs.writeFileSync(rawOut, JSON.stringify(rawPayloads, null, 2));
  console.log(`raw payloads → ${rawOut}`);
}

fs.writeFileSync(OUT, JSON.stringify({ query: QUERY || PAGE_ID, country: COUNTRY, scraped_at: new Date().toISOString(), count: ads.length, ads }, null, 2));

console.log(`\n─── Done: ${ads.length} ads → ${OUT} ───`);
if (ads.length === 0) {
  // Drift alert: page loaded but zero ads = selector/shape drift or block
  console.error('⚠️  ZERO ads collected. Either no active ads for this query, an IP block, or GraphQL shape drift. Re-run with --headful --raw to inspect.');
  process.exit(2);
}

const fmt = ads.filter((a) => a.ad_format === 'video').length;
console.log(`videos: ${fmt}  images: ${ads.filter((a) => a.ad_format === 'image').length}  other: ${ads.length - fmt - ads.filter((a) => a.ad_format === 'image').length}`);
console.log(`with copy: ${ads.filter((a) => a.ad_copy).length}  with media url: ${ads.filter((a) => a.video_url || a.image_url).length}`);
console.log('\nsample:');
for (const a of ads.slice(0, 3)) {
  console.log(`  [${a.meta_ad_id}] ${a.page_name} | ${a.ad_format} | ${a.days_running}d running | ${(a.ad_copy || '').slice(0, 80).replace(/\n/g, ' ')}`);
}
