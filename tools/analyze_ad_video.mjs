#!/usr/bin/env node
/**
 * Ad creative analyzer — Claude vision over video frames.
 *
 * Takes scraped ads (output of scrape_ad_library_playwright.mjs), downloads
 * each video, extracts frames with ffmpeg (dense in the first 3s — the hook —
 * then sparse), and asks Claude to break down WHY the ad works: hook type,
 * pain point, offer structure, emotional triggers, scene-by-scene structure,
 * and a replicable formula a brand can copy.
 *
 * Frame sampling captures burned-in captions (most paid social has them), so
 * spoken-word hooks are usually readable even without an audio transcript.
 * Audio transcription (whisper.cpp) is a planned VPS-side upgrade.
 *
 * Usage:
 *   node tools/analyze_ad_video.mjs --json .tmp/ad_library_mamaearth_*.json [--limit 2]
 *   node tools/analyze_ad_video.mjs --video-url "https://video.f…" --copy "ad text"
 *   Flags: --model <id> (default claude-opus-4-6), --keep-frames
 *
 * Output: .tmp/analysis_<meta_ad_id>.json — includes both the full analysis
 * and a `db` object mapped to competitor_ads ai_* columns.
 */

import Anthropic from '@anthropic-ai/sdk';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── env (load .env.local without dotenv dep) ────────────────────────────
for (const line of fs.readFileSync('.env.local', 'utf8').split('\n')) {
  const m = line.match(/^([A-Z_][A-Z0-9_]*)=["']?(.*?)["']?$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY missing from .env.local');
  process.exit(1);
}

// ── args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const flag = (n) => { const i = args.indexOf(`--${n}`); return i === -1 ? undefined : args[i + 1]; };
const has = (n) => args.includes(`--${n}`);

const MODEL = flag('model') || 'claude-opus-4-6';
const LIMIT = parseInt(flag('limit') || '3', 10);
const KEEP_FRAMES = has('keep-frames');

let targets = [];
if (flag('json')) {
  const file = flag('json');
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  targets = data.ads.filter((a) => a.video_url).slice(0, LIMIT);
  if (!targets.length) { console.error('No video ads in', file); process.exit(1); }
} else if (flag('video-url')) {
  targets = [{ meta_ad_id: 'adhoc', video_url: flag('video-url'), ad_copy: flag('copy') || null, page_name: flag('brand') || 'unknown', days_running: null }];
} else {
  console.error('Usage: --json <scrape.json> [--limit N] | --video-url <url> [--copy "..."]');
  process.exit(1);
}

const client = new Anthropic();

// ── ffmpeg helpers ───────────────────────────────────────────────────────
function videoDuration(file) {
  const out = execFileSync('ffprobe', ['-v', 'quiet', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).toString().trim();
  return parseFloat(out) || 15;
}

function extractFrames(file, dir) {
  const dur = videoDuration(file);
  // Dense in the hook window (first 3s), then spread across the rest. Max 12.
  const times = [0.3, 1.0, 2.0, 3.0];
  const rest = Math.min(8, Math.max(2, Math.floor(dur / 4)));
  for (let i = 1; i <= rest; i++) {
    const t = 3 + ((dur - 3.5) * i) / rest;
    if (t > 3.2 && t < dur) times.push(parseFloat(t.toFixed(1)));
  }
  const frames = [];
  for (const t of times) {
    const out = path.join(dir, `f_${t}.jpg`);
    try {
      execFileSync('ffmpeg', ['-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=720:-2', '-q:v', '4', '-y', out], { stdio: 'pipe' });
      if (fs.existsSync(out) && fs.statSync(out).size > 1000) frames.push({ t, file: out });
    } catch { /* frame beyond EOF — skip */ }
  }
  return { frames, duration: dur };
}

// ── analysis schema (what we ask Claude to fill) ─────────────────────────
const SYSTEM = `You are a world-class direct-response creative strategist who reverse-engineers winning Meta ads for B2C brands. You are given frames from a competitor's ad video (timestamps labeled), plus its metadata (ad copy, CTA, days running — long run time on Meta means the ad is profitable). Captions burned into frames usually carry the spoken script — read them.

Analyze WHY this ad works so a brand can recreate the mechanics (not plagiarize the content). Respond with ONLY a JSON object, no markdown fences, matching exactly:

{
  "hook": {
    "description": "what happens in the first 3 seconds, visually and in text",
    "type": "one of: question | bold_claim | pattern_interrupt | problem_callout | social_proof | curiosity_gap | before_after | demonstration | ugc_testimonial | other",
    "why_it_stops_scroll": "the psychological mechanism"
  },
  "pain_point": "the customer problem the ad targets, in one sentence",
  "offer_structure": "what is being offered and how it is framed (discount/bundle/trial/claim)",
  "emotional_triggers": ["list", "of", "triggers"],
  "structure": [
    {"phase": "hook | problem | agitation | solution | proof | cta", "timestamp": "0-3s", "what_happens": "..."}
  ],
  "visual_style": "format and production style in one sentence (ugc/studio/talking-head/product-demo/text-overlay etc.)",
  "cta_type": "the CTA approach used",
  "target_audience": "who this speaks to",
  "why_it_works": ["3-5 specific reasons, referencing what you see"],
  "replicable_formula": "a step-by-step template (numbered, one line per beat with timing) a brand could follow to make their own version for a different product",
  "summary": "2-3 sentence plain-language verdict for a dashboard card"
}`;

function buildUserContent(ad, frames, duration) {
  const content = [];
  for (const f of frames) {
    content.push({ type: 'text', text: `Frame at ${f.t}s:` });
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: fs.readFileSync(f.file).toString('base64') },
    });
  }
  content.push({
    type: 'text',
    text: `Metadata:
- Brand/page: ${ad.page_name}
- Video duration: ${duration.toFixed(1)}s
- Ad copy (primary text): ${ad.ad_copy || '(none)'}
- Headline: ${ad.headline || '(none)'}
- CTA button: ${ad.call_to_action || '(unknown)'}
- Days running: ${ad.days_running ?? 'unknown'}${ad.days_running > 30 ? ' (long-running = proven profitable)' : ''}
- Platforms: ${(ad.publisher_platforms || []).join(', ') || 'unknown'}

Analyze this ad. JSON only.`,
  });
  return content;
}

function parseJson(text) {
  try { return JSON.parse(text); } catch { /* try to extract */ }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch { /* give up */ } }
  return null;
}

// ── main loop ────────────────────────────────────────────────────────────
fs.mkdirSync('.tmp', { recursive: true });
let totalIn = 0, totalOut = 0;

for (const ad of targets) {
  const id = ad.meta_ad_id;
  console.log(`\n─── Analyzing ad ${id} (${ad.page_name}) ───`);
  const work = fs.mkdtempSync(path.join(os.tmpdir(), `ad_${id}_`));
  const videoFile = path.join(work, 'ad.mp4');

  try {
    // 1. download
    execFileSync('curl', ['-sL', '-m', '120', '-o', videoFile, ad.video_url], { stdio: 'pipe' });
    const size = fs.statSync(videoFile).size;
    if (size < 10000) throw new Error(`download too small (${size}B) — CDN URL may have expired; re-scrape for fresh URLs`);
    console.log(`  downloaded ${(size / 1e6).toFixed(1)} MB`);

    // 2. frames
    const { frames, duration } = extractFrames(videoFile, work);
    if (!frames.length) throw new Error('ffmpeg produced no frames');
    console.log(`  ${frames.length} frames extracted (${duration.toFixed(1)}s video)`);

    // 3. Claude
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: 'adaptive' },
      system: SYSTEM,
      messages: [{ role: 'user', content: buildUserContent(ad, frames, duration) }],
    });
    const msg = await stream.finalMessage();
    totalIn += msg.usage.input_tokens;
    totalOut += msg.usage.output_tokens;

    const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const analysis = parseJson(text);
    if (!analysis) throw new Error('Claude response was not parseable JSON:\n' + text.slice(0, 400));

    // 4. map to competitor_ads ai_* columns + save
    const result = {
      meta_ad_id: id,
      page_name: ad.page_name,
      model: MODEL,
      analyzed_at: new Date().toISOString(),
      usage: { input_tokens: msg.usage.input_tokens, output_tokens: msg.usage.output_tokens },
      analysis,
      db: {
        ai_analyzed: true,
        ai_hook_type: analysis.hook?.type ?? null,
        ai_pain_point: analysis.pain_point ?? null,
        ai_offer_structure: analysis.offer_structure ?? null,
        ai_visual_style: analysis.visual_style ?? null,
        ai_cta_type: analysis.cta_type ?? null,
        ai_summary: analysis.summary ?? null,
        ai_analysis: analysis, // full rich payload — rendered by the dashboard breakdown view
      },
    };
    const out = `.tmp/analysis_${id}.json`;
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.log(`  ✅ ${out}`);
    console.log(`  hook: [${analysis.hook?.type}] ${(analysis.hook?.description || '').slice(0, 90)}`);
    console.log(`  why:  ${(analysis.why_it_works?.[0] || '').slice(0, 110)}`);
  } catch (e) {
    console.error(`  ❌ ${id}: ${e.message}`);
  } finally {
    if (KEEP_FRAMES) console.log(`  frames kept at ${work}`);
    else fs.rmSync(work, { recursive: true, force: true });
  }
}

// Opus 4.6: $5/M in, $25/M out
const cost = (totalIn * 5 + totalOut * 25) / 1e6;
console.log(`\n─── tokens: ${totalIn} in / ${totalOut} out ≈ $${cost.toFixed(3)} ───`);
