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
  // Dense across the hook (first 5s — capture every caption/scene change), then
  // sample the rest. Up to ~18 frames so Claude can read the on-screen script
  // and track every scene transition.
  const times = [0.3, 0.8, 1.5, 2.2, 3.0, 4.0, 5.0];
  const rest = Math.min(11, Math.max(3, Math.floor((dur - 5) / 3)));
  for (let i = 1; i <= rest; i++) {
    const t = 5 + ((dur - 5.5) * i) / rest;
    if (t > 5.2 && t < dur) times.push(parseFloat(t.toFixed(1)));
  }
  const frames = [];
  for (const t of times) {
    if (t >= dur) continue;
    const out = path.join(dir, `f_${t}.jpg`);
    try {
      execFileSync('ffmpeg', ['-ss', String(t), '-i', file, '-frames:v', '1', '-vf', 'scale=768:-2', '-q:v', '3', '-y', out], { stdio: 'pipe' });
      if (fs.existsSync(out) && fs.statSync(out).size > 1000) frames.push({ t, file: out });
    } catch { /* frame beyond EOF — skip */ }
  }
  return { frames, duration: dur };
}

// ── analysis schema (what we ask Claude to fill) ─────────────────────────
const SYSTEM = `You are a world-class direct-response creative strategist and performance-marketing analyst who reverse-engineers winning Meta/Instagram ads for B2C brands. You are given timestamped frames from a competitor's ad video plus metadata (ad copy, CTA, days running — a long run on Meta means the ad is profitable and worth copying). Burned-in captions usually carry the spoken script — read them carefully and reconstruct the script.

Produce a DEEP, SPECIFIC teardown — not generic marketing platitudes. Reference exactly what you see in the frames (expressions, products, text, scenes). The goal: a brand reads this and can shoot their own version for a DIFFERENT product without guessing.

Respond with ONLY a JSON object (no markdown fences) matching this exact shape. Fill every field; use null/empty array only if truly not inferable:

{
  "one_liner": "one punchy sentence: what kind of ad this is and its core mechanic",
  "summary": "3-4 sentence verdict a strategist would give — what it is, why it converts, who it's for",
  "scores": {
    "hook_strength": 0, "scroll_stop_power": 0, "message_clarity": 0,
    "emotional_pull": 0, "cta_strength": 0, "overall": 0,
    "_note": "each 1-10 integer; overall is your weighted judgment, not an average"
  },
  "hook": {
    "first_3s": "literally what happens in the first 3 seconds",
    "visual_hook": "the visual that stops the scroll",
    "verbal_hook": "the exact spoken/caption line that opens (quote it if visible)",
    "text_overlay_hook": "on-screen text in the opening, or null",
    "type": "one of: question | bold_claim | pattern_interrupt | problem_callout | social_proof | curiosity_gap | before_after | demonstration | ugc_testimonial | shock | relatable_moment | other",
    "why_it_stops_scroll": "the precise psychological mechanism, 1-2 sentences"
  },
  "content_format": {
    "format": "e.g. UGC talking-head, product demo, founder story, testimonial montage, unboxing, before/after, listicle, skit",
    "production_style": "raw/iphone-shot vs studio-polished etc., described specifically",
    "talent": "who's on camera (influencer/creator/founder/actor/none) and their vibe",
    "shot_types": ["e.g. selfie close-up", "product macro", "mirror demo"],
    "pacing": "cut frequency / energy — slow & calm vs fast jump-cuts",
    "editing_tricks": ["zooms", "text pop-ups", "trending audio", "captions", ...],
    "audio": "voiceover / on-camera talking / trending music / VO + music — what you can infer",
    "captions_style": "describe the burned-in caption style, or null",
    "aspect_ratio": "vertical 9:16 | square | horizontal — infer from frames"
  },
  "script": {
    "framework": "the copy framework used: PAS | AIDA | BAB | PASTOR | star-story-solution | hook-retain-reward | other",
    "reconstructed_script": "your best reconstruction of the spoken+text script, as flowing text",
    "beats": [
      {"timestamp": "0-3s", "label": "Hook", "spoken_or_text": "what is said/shown", "purpose": "what this beat does for the sale"}
    ]
  },
  "messaging": {
    "core_value_prop": "the single biggest promise",
    "value_props": ["all distinct benefits claimed"],
    "claims": ["specific product claims made"],
    "objections_handled": ["objections the ad preempts"],
    "key_phrases": ["memorable lines worth swiping"]
  },
  "psychology": {
    "pain_point": "the customer problem targeted",
    "desire": "the end-state the viewer wants",
    "emotional_triggers": ["specific emotions evoked"],
    "persuasion_principles": ["social_proof | authority | scarcity | reciprocity | liking | commitment | loss_aversion ..."],
    "awareness_level": "unaware | problem_aware | solution_aware | product_aware | most_aware",
    "target_audience": "the specific avatar this speaks to"
  },
  "offer": {
    "what_is_offered": "the product/offer as framed",
    "pricing_or_discount": "any price/discount/bundle shown, or null",
    "urgency_or_scarcity": "any urgency device, or null",
    "risk_reversal": "guarantee/free-trial/return, or null",
    "cta_text": "the exact call to action",
    "cta_type": "soft (learn more) vs hard (shop now / comment X)"
  },
  "why_it_works": ["4-6 SPECIFIC reasons referencing the actual creative — each a full sentence"],
  "strengths": ["what's excellent about this ad"],
  "weaknesses": ["honest gaps / what a brand could do better when copying it"],
  "replicable_playbook": {
    "steps": ["numbered, one line per beat WITH timing — a shoot-this checklist for a different product"],
    "script_template": "a fill-in-the-blank script with [BRACKETS] the brand swaps for their product, mirroring this ad's structure and pacing"
  }
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
      max_tokens: 8000,
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
        ai_pain_point: analysis.psychology?.pain_point ?? null,
        ai_offer_structure: analysis.offer?.what_is_offered ?? null,
        ai_visual_style: analysis.content_format?.format ?? null,
        ai_cta_type: analysis.offer?.cta_type ?? null,
        ai_summary: analysis.summary ?? null,
        ai_analysis: analysis, // full rich payload — rendered by the dashboard breakdown view
      },
    };
    const out = `.tmp/analysis_${id}.json`;
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.log(`  ✅ ${out}`);
    console.log(`  hook: [${analysis.hook?.type}] ${(analysis.hook?.first_3s || '').slice(0, 90)}`);
    console.log(`  scores: hook ${analysis.scores?.hook_strength}/10 · overall ${analysis.scores?.overall}/10`);
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
