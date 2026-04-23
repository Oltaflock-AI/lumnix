#!/usr/bin/env node
// Refresh the app-wide Meta Ad Library user token.
//
// Why this exists:
//   The Ad Library API (graph.facebook.com/*/ads_archive) only accepts USER
//   tokens, not App Access Tokens (subcode 2332004 "App role required").
//   So we store a long-lived user token in META_ACCESS_TOKEN. Long-lived
//   tokens last 60 days — but they can be re-exchanged for another 60 days
//   as long as you do it BEFORE the current one expires.
//
// Cadence:
//   Run this every ~30-45 days. Easiest: add a calendar reminder, or set up
//   a scheduled task in Cowork.
//
// Usage:
//   node tools/refresh_meta_app_token.mjs            # interactive: shows summary, asks to confirm write
//   node tools/refresh_meta_app_token.mjs --write    # write silently
//   node tools/refresh_meta_app_token.mjs --check    # just show expiry, no exchange
//
// The script:
//   1. Loads current META_ACCESS_TOKEN, META_APP_ID, META_APP_SECRET from .env.local
//   2. Introspects the token via /debug_token
//   3. If expired → tells you to run the OAuth flow (Graph API Explorer) again
//   4. If still valid → exchanges for a fresh 60-day token via fb_exchange_token
//   5. Writes the new token back to .env.local (only with --write)
//
// Vercel: after running locally, copy the new token to Vercel Env Vars
//         (Project Settings → Environment Variables → META_ACCESS_TOKEN).

import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ENV_PATH = join(ROOT, '.env.local');

const args = process.argv.slice(2);
const writeMode = args.includes('--write');
const checkOnly = args.includes('--check');

function readEnv() {
  const raw = readFileSync(ENV_PATH, 'utf8');
  const env = {};
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq < 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v;
  }
  return { raw, env };
}

function writeEnv(rawBefore, newToken) {
  const updated = rawBefore.match(/^META_ACCESS_TOKEN=.*$/m)
    ? rawBefore.replace(/^META_ACCESS_TOKEN=.*$/m, `META_ACCESS_TOKEN=${newToken}`)
    : rawBefore.trimEnd() + `\nMETA_ACCESS_TOKEN=${newToken}\n`;
  writeFileSync(ENV_PATH, updated);
}

function redact(s, keep = 6) {
  if (!s) return '(empty)';
  if (s.length <= keep * 2) return '*'.repeat(s.length);
  return s.slice(0, keep) + '…' + s.slice(-keep);
}

function fmtDate(ms) {
  if (!ms) return 'never';
  const d = new Date(ms);
  const now = Date.now();
  const daysLeft = Math.round((ms - now) / (24 * 3600 * 1000));
  return `${d.toISOString()} (${daysLeft} days from now)`;
}

async function main() {
  const { raw, env } = readEnv();
  const appId = env.META_APP_ID?.trim();
  const appSecret = env.META_APP_SECRET?.trim();
  const currentToken = env.META_ACCESS_TOKEN?.trim();

  if (!appId || !appSecret) {
    console.error('❌ META_APP_ID and META_APP_SECRET must be set in .env.local');
    process.exit(1);
  }
  if (!currentToken) {
    console.error('❌ META_ACCESS_TOKEN is empty. Get a fresh user token from Graph API Explorer');
    console.error('   with ads_read + ads_management scopes, paste into .env.local, then rerun this.');
    process.exit(1);
  }

  console.log(`Current token: ${redact(currentToken)} (len=${currentToken.length})`);

  // Step 1: introspect
  const appToken = `${appId}|${appSecret}`;
  const probe = await fetch(
    `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(currentToken)}&access_token=${encodeURIComponent(appToken)}`,
  );
  const pb = await probe.json();
  if (pb.error) {
    console.error('❌ /debug_token failed:', pb.error);
    process.exit(1);
  }
  if (!pb.data) {
    console.error('❌ Unexpected /debug_token response:', pb);
    process.exit(1);
  }
  const expiresAtMs = pb.data.expires_at === 0 ? 0 : pb.data.expires_at * 1000;
  console.log(`  type:    ${pb.data.type}`);
  console.log(`  user:    ${pb.data.user_id}`);
  console.log(`  valid:   ${pb.data.is_valid}`);
  console.log(`  expires: ${expiresAtMs === 0 ? 'never' : fmtDate(expiresAtMs)}`);
  console.log(`  scopes:  ${(pb.data.scopes || []).join(', ')}`);

  if (!pb.data.is_valid) {
    console.error('\n❌ Token is already invalid. You need to re-run the OAuth flow:');
    console.error('   1. Open https://developers.facebook.com/tools/explorer/');
    console.error('   2. Pick the Lumnix app, User Token, add ads_read + ads_management');
    console.error('   3. Click "Generate Access Token" → paste it into META_ACCESS_TOKEN in .env.local');
    console.error('   4. Rerun this script — it will exchange the short-lived token for a 60-day one');
    process.exit(1);
  }

  if (checkOnly) {
    console.log('\n✓ --check: token looks healthy. Re-run without --check to refresh.');
    return;
  }

  // Step 2: exchange for a fresh 60-day window
  console.log('\nExchanging for a fresh 60-day long-lived token...');
  const exParams = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: currentToken,
  });
  const exRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${exParams}`);
  const ex = await exRes.json();
  if (ex.error) {
    console.error('❌ fb_exchange_token failed:', ex.error);
    process.exit(1);
  }
  if (!ex.access_token) {
    console.error('❌ No access_token in response:', ex);
    process.exit(1);
  }

  const ttlSec = ex.expires_in || 0;
  const newExpiryMs = Date.now() + ttlSec * 1000;
  console.log(`  new token: ${redact(ex.access_token)} (len=${ex.access_token.length})`);
  console.log(`  new expiry: ${fmtDate(newExpiryMs)}`);

  // Step 3: confirm write
  if (!writeMode) {
    const rl = readline.createInterface({ input, output });
    const answer = await rl.question('\nWrite new token to .env.local? [y/N] ');
    rl.close();
    if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
      console.log('Aborted. No changes made.');
      return;
    }
  }

  writeEnv(raw, ex.access_token);
  console.log('✓ Wrote new long-lived token to .env.local');
  console.log('\nNext step (prod): paste this token into Vercel Env Vars as META_ACCESS_TOKEN.');
  console.log('Expires: ' + new Date(newExpiryMs).toISOString());
  console.log('\nFull new token (for Vercel copy):');
  console.log(ex.access_token);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(2);
});
