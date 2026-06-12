#!/usr/bin/env node
/**
 * Competitor ad spy pipeline — scrape → upsert → analyze. Runs on VPS cron.
 *
 * Reads tracked competitors from `competitor_brands` (rows with a
 * facebook_page_id), scrapes each one's active ads from the public Ad
 * Library (scrape_ad_library_playwright.mjs), upserts into `competitor_ads`,
 * then Claude-analyzes the longest-running unanalyzed videos (run duration =
 * profitability proxy) and fills the ai_* columns.
 *
 * Commands:
 *   add  — register a competitor:
 *     node tools/spy_pipeline.mjs add --workspace <uuid> --name "Mamaearth" --page-id 619181354927737 [--domain mamaearth.in]
 *   run  — scrape + analyze everything trackable:
 *     node tools/spy_pipeline.mjs run [--workspace <uuid>] [--country IN] [--max-ads 60] [--analyze 5] [--no-analyze]
 *   list — show tracked competitors:
 *     node tools/spy_pipeline.mjs list [--workspace <uuid>]
 *
 * Env: .env.local — NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

// ── env ──────────────────────────────────────────────────────────────────
const ENV_FILE = fs.existsSync('.env.local') ? '.env.local' : '.env';
for (const line of fs.readFileSync(ENV_FILE, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.*?)["']?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
const SB_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SB_URL || !SB_KEY) { console.error('Supabase env missing'); process.exit(1); }

const HEADERS = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' };

async function sb(pathQ, opts = {}) {
  const { headers: extraHeaders, ...rest } = opts;
  const res = await fetch(`${SB_URL}/rest/v1/${pathQ}`, { ...rest, headers: { ...HEADERS, ...(extraHeaders || {}) } });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status} on ${pathQ.split('?')[0]}: ${text.slice(0, 300)}`);
  return text ? JSON.parse(text) : null;
}

// ── args ──────────────────────────────────────────────────────────────────
const [cmd, ...rest] = process.argv.slice(2);
const flag = (n) => { const i = rest.indexOf(`--${n}`); return i === -1 ? undefined : rest[i + 1]; };
const has = (n) => rest.includes(`--${n}`);
const TOOLS_DIR = path.dirname(new URL(import.meta.url).pathname);

// ── commands ──────────────────────────────────────────────────────────────
if (cmd === 'add') {
  const workspace_id = flag('workspace'), name = flag('name'), page_id = flag('page-id');
  if (!workspace_id || !name || !page_id) { console.error('add requires --workspace --name --page-id'); process.exit(1); }
  const row = await sb('competitor_brands?on_conflict=workspace_id,facebook_page_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify([{ workspace_id, name, facebook_page_id: page_id, domain: flag('domain') || null, scrape_status: 'pending' }]),
  }).catch(async (e) => {
    // no unique constraint on (workspace_id, facebook_page_id) — fall back to plain insert
    if (!/on_conflict|conflict/i.test(e.message)) throw e;
    return sb('competitor_brands', { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify([{ workspace_id, name, facebook_page_id: page_id, domain: flag('domain') || null, scrape_status: 'pending' }]) });
  });
  console.log('✅ tracked:', JSON.stringify(row[0], null, 1));
  process.exit(0);
}

if (cmd === 'list') {
  const ws = flag('workspace');
  const rows = await sb(`competitor_brands?select=id,workspace_id,name,facebook_page_id,active_ads_count,winning_ads_count,last_scraped_at,scrape_status${ws ? `&workspace_id=eq.${ws}` : ''}&order=created_at.desc`);
  console.table(rows.map((r) => ({ name: r.name, page_id: r.facebook_page_id, active: r.active_ads_count, winning: r.winning_ads_count, last: r.last_scraped_at?.slice(0, 16), status: r.scrape_status })));
  process.exit(0);
}

if (cmd !== 'run') {
  console.error('Usage: spy_pipeline.mjs <add|run|list> ...');
  process.exit(1);
}

// ── run ───────────────────────────────────────────────────────────────────
const COUNTRY = flag('country') || 'IN';
const MAX_ADS = flag('max-ads') || '60';
const ANALYZE_N = has('no-analyze') ? 0 : parseInt(flag('analyze') || '5', 10);
const WS_FILTER = flag('workspace') ? `&workspace_id=eq.${flag('workspace')}` : '';
const WINNING_DAYS = 30;

const competitors = await sb(`competitor_brands?select=*&facebook_page_id=not.is.null${WS_FILTER}&order=last_scraped_at.asc.nullsfirst`);
if (!competitors.length) { console.log('No competitors with facebook_page_id set. Use the add command first.'); process.exit(0); }
console.log(`─── spy pipeline: ${competitors.length} competitor(s), country=${COUNTRY} ───`);

let failures = 0;
for (const c of competitors) {
  console.log(`\n■ ${c.name} (page ${c.facebook_page_id})`);
  await sb(`competitor_brands?id=eq.${c.id}`, { method: 'PATCH', body: JSON.stringify({ scrape_status: 'running' }) });

  try {
    // 1. scrape
    const outFile = `.tmp/pipeline_${c.facebook_page_id}.json`;
    execFileSync('node', [path.join(TOOLS_DIR, 'scrape_ad_library_playwright.mjs'), '--page-id', c.facebook_page_id, '--country', COUNTRY, '--max', MAX_ADS, '--out', outFile], { stdio: 'pipe', timeout: 300000 });
    const { ads } = JSON.parse(fs.readFileSync(outFile, 'utf8'));
    console.log(`  scraped ${ads.length} active ads`);

    // 2. upsert ads
    const rows = ads.map((a) => ({
      workspace_id: c.workspace_id,
      competitor_id: c.id,
      meta_ad_id: a.meta_ad_id,
      page_id: a.page_id,
      page_name: a.page_name,
      ad_copy: a.ad_copy,
      headline: a.headline,
      description: a.description,
      call_to_action: a.call_to_action,
      ad_format: a.ad_format,
      image_url: a.image_url,
      video_url: a.video_url,
      ad_snapshot_url: a.ad_snapshot_url,
      ad_delivery_start_time: a.ad_delivery_start_time,
      ad_delivery_stop_time: a.ad_delivery_stop_time,
      days_running: a.days_running,
      is_active: a.is_active,
      performance_tier: a.days_running >= 90 ? 'champion' : a.days_running >= WINNING_DAYS ? 'winning' : 'testing',
      scraped_at: a.scraped_at,
    }));
    for (let i = 0; i < rows.length; i += 200) {
      await sb('competitor_ads?on_conflict=workspace_id,meta_ad_id', {
        method: 'POST',
        headers: { Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify(rows.slice(i, i + 200)),
      });
    }
    console.log(`  upserted ${rows.length} rows into competitor_ads`);

    // 3. analyze longest-running unanalyzed videos (cost-capped per run)
    let analyzed = 0;
    if (ANALYZE_N > 0) {
      const pending = await sb(
        `competitor_ads?select=meta_ad_id,page_name,ad_copy,headline,call_to_action,days_running,video_url&workspace_id=eq.${c.workspace_id}&competitor_id=eq.${c.id}&ad_format=eq.video&ai_analyzed=not.is.true&video_url=not.is.null&order=days_running.desc.nullslast&limit=${ANALYZE_N}`
      );
      // fresh CDN urls from this scrape beat possibly-expired stored ones
      const freshById = new Map(ads.map((a) => [a.meta_ad_id, a]));
      const targets = pending.map((p) => ({ ...p, ...(freshById.get(p.meta_ad_id) || {}) }));
      if (targets.length) {
        const tmpJson = `.tmp/pipeline_analyze_${c.id}.json`;
        fs.writeFileSync(tmpJson, JSON.stringify({ ads: targets }));
        execFileSync('node', [path.join(TOOLS_DIR, 'analyze_ad_video.mjs'), '--json', tmpJson, '--limit', String(ANALYZE_N)], { stdio: 'inherit', timeout: 600000 });
        for (const t of targets) {
          const f = `.tmp/analysis_${t.meta_ad_id}.json`;
          if (!fs.existsSync(f)) continue; // analysis failed for this one — retried next run
          const { db } = JSON.parse(fs.readFileSync(f, 'utf8'));
          await sb(`competitor_ads?workspace_id=eq.${c.workspace_id}&meta_ad_id=eq.${t.meta_ad_id}`, {
            method: 'PATCH',
            body: JSON.stringify(db),
          });
          analyzed++;
        }
        console.log(`  analyzed ${analyzed} videos with Claude`);
      } else {
        console.log('  no unanalyzed videos pending');
      }
    }

    // 4. competitor stats
    const winning = rows.filter((r) => (r.days_running ?? 0) >= WINNING_DAYS).length;
    await sb(`competitor_brands?id=eq.${c.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        scrape_status: 'completed',
        last_scraped_at: new Date().toISOString(),
        active_ads_count: rows.length,
        ad_count: rows.length,
        total_ads_found: rows.length,
        winning_ads_count: winning,
      }),
    });
    console.log(`  ✅ done — ${winning} winning ads (≥${WINNING_DAYS}d)`);
  } catch (e) {
    failures++;
    console.error(`  ❌ ${c.name}: ${e.message.slice(0, 400)}`);
    await sb(`competitor_brands?id=eq.${c.id}`, { method: 'PATCH', body: JSON.stringify({ scrape_status: 'error' }) }).catch(() => {});
  }

  // pace between competitors — keep Meta happy
  await new Promise((r) => setTimeout(r, 5000 + Math.random() * 10000));
}

console.log(`\n─── pipeline finished: ${competitors.length - failures}/${competitors.length} ok ───`);
process.exit(failures && failures === competitors.length ? 1 : 0);
