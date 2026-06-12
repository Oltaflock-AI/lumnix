#!/usr/bin/env node
// Meta Ad Library API diagnostic.
//
// Usage:
//   node tools/debug_meta_ad_library.mjs
//   node tools/debug_meta_ad_library.mjs --search "nike"    # custom search term
//   node tools/debug_meta_ad_library.mjs --page 123456789   # test a specific page_id
//
// Reads META_APP_ID, META_APP_SECRET, META_ACCESS_TOKEN from .env.local
// and runs a real query against graph.facebook.com/v19.0/ads_archive.
// Decodes Meta's error codes into the specific prerequisite that's missing
// (ToS not accepted, identity not verified, rate limit, bad token, etc.).
//
// This script bypasses Next.js / middleware / Supabase on purpose — it's a
// standalone token-level test so you can isolate "is the token the problem"
// from "is my app code the problem".

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// -------- .env.local loader (no dotenv dependency) --------

function loadEnvFile(path) {
  try {
    const raw = readFileSync(path, 'utf8');
    for (const line of raw.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let val = trimmed.slice(eq + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

loadEnvFile(join(ROOT, '.env.local'));
loadEnvFile(join(ROOT, '.env'));

// -------- CLI args --------

const args = process.argv.slice(2);
function arg(flag, fallback) {
  const i = args.indexOf(flag);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
}

const searchTerm = arg('--search', 'nike');
const pageId = arg('--page', null);

// -------- Token resolution (mirrors src/lib/meta-ad-library-token.ts) --------

function resolveToken() {
  const appId = process.env.META_APP_ID?.trim();
  const appSecret = process.env.META_APP_SECRET?.trim();
  if (appId && appSecret) {
    return { token: `${appId}|${appSecret}`, source: 'app_access_token', appId };
  }
  const userToken = process.env.META_ACCESS_TOKEN?.trim();
  if (userToken) {
    return { token: userToken, source: 'user_access_token', appId: null };
  }
  return { token: null, source: 'none', appId: null };
}

// -------- Error code → human cause map --------

function explainMetaError(err) {
  const code = err.code;
  const type = err.type;
  const msg = err.message || '';
  const subcode = err.error_subcode;

  if (type === 'OAuthException' && (code === 190 || msg.includes('expired'))) {
    return {
      cause: 'Access token is expired or invalid.',
      fix: [
        'If using a user token: it has expired. Remove META_ACCESS_TOKEN from .env.local and rely on META_APP_ID + META_APP_SECRET instead.',
        'If using the app access token (META_APP_ID|META_APP_SECRET): double-check both values in Meta App Dashboard → Settings → Basic.',
      ],
    };
  }
  if (code === 200 || (type === 'OAuthException' && msg.toLowerCase().includes('ads'))) {
    return {
      cause: 'Ad Library API prerequisites not met.',
      fix: [
        '1. Verify your identity at https://www.facebook.com/ID (one-time, ~24h approval).',
        '2. Accept the Ad Library API terms at https://www.facebook.com/ads/library/api/ while logged in as the app owner.',
        '3. Ensure the app owner (not a random FB account) completed both steps.',
      ],
    };
  }
  if (code === 4 || code === 17 || code === 32 || msg.includes('rate')) {
    return {
      cause: 'Rate limited. Meta caps Ad Library calls per hour.',
      fix: ['Wait ~60 minutes and retry. If sustained, reduce scrape frequency in cron/spy-agent.'],
    };
  }
  if (code === 100) {
    return {
      cause: 'Bad parameter — malformed request.',
      fix: [`Raw message: ${msg}`, 'Check the search_terms / search_page_ids / ad_reached_countries values.'],
    };
  }
  if (code === 102 || subcode === 460 || subcode === 463) {
    return {
      cause: 'Session invalid — likely a user token, not an app token.',
      fix: ['Switch to the app access token by unsetting META_ACCESS_TOKEN and relying on META_APP_ID + META_APP_SECRET.'],
    };
  }
  return {
    cause: `Unrecognized Meta error (code=${code}, type=${type}).`,
    fix: [`Raw message: ${msg}`],
  };
}

// -------- Main --------

function redact(str, keep = 4) {
  if (!str) return '(not set)';
  if (str.length <= keep * 2) return '*'.repeat(str.length);
  return str.slice(0, keep) + '…' + str.slice(-keep);
}

function banner(text) {
  const bar = '─'.repeat(Math.max(40, text.length + 4));
  console.log('\n' + bar);
  console.log('  ' + text);
  console.log(bar);
}

async function main() {
  banner('Meta Ad Library API — Token Diagnostic');

  // 1. Report what env vars are set
  const appId = process.env.META_APP_ID?.trim() || '';
  const appSecret = process.env.META_APP_SECRET?.trim() || '';
  const userTok = process.env.META_ACCESS_TOKEN?.trim() || '';

  console.log('\nEnvironment (from .env.local):');
  console.log(`  META_APP_ID         = ${redact(appId)}`);
  console.log(`  META_APP_SECRET     = ${redact(appSecret)}`);
  console.log(`  META_ACCESS_TOKEN   = ${redact(userTok)}`);

  const { token, source, appId: resolvedAppId } = resolveToken();

  if (!token) {
    console.log('\n❌ No credentials available.');
    console.log('   Set META_APP_ID + META_APP_SECRET in .env.local (preferred — never expires).');
    console.log('   Get them from https://developers.facebook.com/apps → your app → Settings → Basic.');
    process.exit(1);
  }

  console.log(`\nResolved token source: ${source}`);
  if (source === 'user_access_token') {
    console.log('⚠️  Using META_ACCESS_TOKEN (user token). These expire. For a never-expiring setup, also set META_APP_ID + META_APP_SECRET — the app will now prefer the app token.');
  } else if (source === 'app_access_token') {
    console.log('✓ Using app access token (never expires).');
  }

  // 2. Probe /debug_token to see what Meta says about this token
  banner('Step 1/2 — Token introspection via /debug_token');
  try {
    const probe = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(token)}&access_token=${encodeURIComponent(token)}`
    );
    const body = await probe.json();
    if (body.data) {
      const d = body.data;
      console.log(`  app_id:           ${d.app_id}`);
      console.log(`  type:             ${d.type}`);
      console.log(`  is_valid:         ${d.is_valid}`);
      console.log(`  expires_at:       ${d.expires_at === 0 ? 'never' : new Date(d.expires_at * 1000).toISOString()}`);
      if (d.scopes) console.log(`  scopes:           ${d.scopes.join(', ')}`);
      if (!d.is_valid && d.error) {
        console.log(`  ❌ error:          ${d.error.message} (code=${d.error.code})`);
      }
    } else if (body.error) {
      console.log(`  ❌ ${body.error.message}`);
    }
  } catch (err) {
    console.log(`  (debug_token call failed: ${err.message})`);
  }

  // 3. Actual Ad Library call
  banner('Step 2/2 — Live query against ads_archive');
  const params = new URLSearchParams({
    access_token: token,
    ad_type: 'ALL',
    ad_reached_countries: JSON.stringify(['US', 'IN', 'GB']),
    fields: 'id,page_name,ad_creative_bodies,ad_delivery_start_time',
    limit: '3',
  });
  if (pageId) {
    params.set('search_page_ids', pageId);
    console.log(`Query: search_page_ids=${pageId}`);
  } else {
    params.set('search_terms', searchTerm);
    console.log(`Query: search_terms="${searchTerm}"`);
  }

  const res = await fetch(`https://graph.facebook.com/v19.0/ads_archive?${params}`);
  const body = await res.json();

  if (body.error) {
    const explained = explainMetaError(body.error);
    console.log(`\n❌ FAILED (HTTP ${res.status})`);
    console.log(`   Meta says:  ${body.error.message}`);
    console.log(`   Code/Type:  code=${body.error.code}, type=${body.error.type}${body.error.error_subcode ? `, subcode=${body.error.error_subcode}` : ''}`);
    console.log(`\n   Cause: ${explained.cause}`);
    console.log('   Fix:');
    for (const step of explained.fix) console.log(`     • ${step}`);
    if (body.error.fbtrace_id) console.log(`\n   fbtrace_id: ${body.error.fbtrace_id} (include this if you open a Meta support case)`);
    process.exit(1);
  }

  const ads = body.data || [];
  console.log(`\n✓ SUCCESS — received ${ads.length} ad(s)`);
  for (const ad of ads.slice(0, 3)) {
    const copy = (ad.ad_creative_bodies?.[0] || '').slice(0, 80).replace(/\s+/g, ' ');
    console.log(`  • [${ad.id}] ${ad.page_name} — started ${ad.ad_delivery_start_time || 'unknown'} — "${copy}${copy.length === 80 ? '…' : ''}"`);
  }
  console.log('\nAd Library API is working. Competitor scrape and cron/spy-agent will now run with this token.');
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(2);
});
