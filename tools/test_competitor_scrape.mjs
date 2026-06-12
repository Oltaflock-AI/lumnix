#!/usr/bin/env node
// End-to-end test for the competitor-ads feature:
//   1. Pick a real workspace + its owner from Supabase (service role).
//   2. Mint a magic link for that user and verify it to obtain a real
//      session JWT (bypasses the middleware the same way a browser login
//      would — we just do it programmatically).
//   3. POST /api/competitors/search with a brand name (default: "nike").
//   4. Pick the top result, insert a competitor_brands row, then POST
//      /api/competitors/scrape to pull its ads through the live route.
//   5. Report counts back.
//
// This proves the entire pipeline works through the running Next.js app:
//   middleware → route → Meta Ad Library API → Supabase upsert.
//
// Usage:
//   node tools/test_competitor_scrape.mjs                # brand=nike, cleanup=true
//   node tools/test_competitor_scrape.mjs patagonia       # custom brand
//   node tools/test_competitor_scrape.mjs nike --keep     # don't delete the test competitor after

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ---- load .env.local (we're running outside Next.js) ---------------------
const envRaw = readFileSync(join(ROOT, '.env.local'), 'utf8');
for (const line of envRaw.split('\n')) {
  const t = line.trim();
  if (!t || t.startsWith('#')) continue;
  const eq = t.indexOf('=');
  if (eq < 0) continue;
  const k = t.slice(0, eq).trim();
  let v = t.slice(eq + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(k in process.env)) process.env[k] = v;
}

const args = process.argv.slice(2);
const brand = (args.find((a) => !a.startsWith('--')) || 'nike').trim();
const keep = args.includes('--keep');
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function log(title, payload) {
  console.log(`\n─── ${title} ─────────────────────────────────────────`);
  if (payload !== undefined) console.log(payload);
}

async function pickWorkspaceAndUser() {
  // Find a workspace + its owner (an actual human account we can sign in as).
  const { data: members, error } = await admin
    .from('workspace_members')
    .select('workspace_id, user_id, role')
    .eq('role', 'owner')
    .limit(5);
  if (error) throw error;
  if (!members || members.length === 0) throw new Error('No owner rows in workspace_members.');

  for (const m of members) {
    const { data: u } = await admin.auth.admin.getUserById(m.user_id);
    if (u?.user?.email) {
      return { workspace_id: m.workspace_id, user_id: m.user_id, email: u.user.email };
    }
  }
  throw new Error('Could not find an owner user with an email.');
}

async function mintSessionJwt(email) {
  // generateLink returns an 8-digit email_otp we can verify with type=email.
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error) throw error;
  const emailOtp = data?.properties?.email_otp;
  if (!emailOtp) throw new Error('No email_otp in generateLink response');

  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!anonKey) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY missing — required to verify OTP');

  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', apikey: anonKey },
    body: JSON.stringify({ type: 'email', token: emailOtp, email }),
  });
  const body = await verifyRes.json();
  if (!verifyRes.ok || !body.access_token) {
    throw new Error(`Verify failed: ${JSON.stringify(body)}`);
  }
  return body.access_token;
}

async function searchThroughApp(jwt, workspace_id, query) {
  const res = await fetch(`${BASE_URL}/api/competitors/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ query, workspace_id }),
  });
  const json = await res.json();
  return { status: res.status, body: json };
}

async function insertCompetitor(workspace_id, result) {
  const { data, error } = await admin
    .from('competitor_brands')
    .insert({
      workspace_id,
      name: result.page_name,
      facebook_page_id: result.page_id,
      fb_page_id: result.page_id, // scrape route reads either field
      facebook_page_url: result.page_url,
      logo_url: result.picture_url || null,
      scrape_status: 'idle',
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function scrapeThroughApp(jwt, workspace_id, competitor_id) {
  const res = await fetch(`${BASE_URL}/api/competitors/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({ workspace_id, competitor_id }),
  });
  const json = await res.json();
  return { status: res.status, body: json };
}

async function countAds(workspace_id, competitor_id) {
  const { count } = await admin
    .from('competitor_ads')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspace_id)
    .eq('competitor_id', competitor_id);
  return count || 0;
}

async function cleanup(competitor_id, workspace_id) {
  await admin.from('competitor_ads').delete().eq('competitor_id', competitor_id).eq('workspace_id', workspace_id);
  await admin.from('competitor_brands').delete().eq('id', competitor_id).eq('workspace_id', workspace_id);
}

async function main() {
  log(`Starting end-to-end test: brand="${brand}" @ ${BASE_URL}`);

  const { workspace_id, user_id, email } = await pickWorkspaceAndUser();
  log('Selected workspace/user', { workspace_id, user_id, email });

  const jwt = await mintSessionJwt(email);
  log('Session JWT minted', { len: jwt.length, preview: jwt.slice(0, 32) + '…' });

  log('POST /api/competitors/search');
  const search = await searchThroughApp(jwt, workspace_id, brand);
  console.log(`  status: ${search.status}`);
  console.log(`  results: ${search.body?.results?.length ?? 0}`);
  if (!search.body?.results?.length) {
    console.error('❌ No results. Body:', JSON.stringify(search.body));
    process.exit(2);
  }
  const top = search.body.results[0];
  console.log(`  top: ${top.page_name} (${top.page_id}) — ~${top.ad_count} ads`);

  log('INSERT competitor_brands row (service role)');
  const competitor = await insertCompetitor(workspace_id, top);
  console.log(`  competitor_id: ${competitor.id}`);

  log('POST /api/competitors/scrape');
  const scrape = await scrapeThroughApp(jwt, workspace_id, competitor.id);
  console.log(`  status: ${scrape.status}`);
  console.log(`  body: ${JSON.stringify(scrape.body)}`);

  const stored = await countAds(workspace_id, competitor.id);
  log('competitor_ads rows written', stored);

  if (!keep) {
    await cleanup(competitor.id, workspace_id);
    log('cleanup complete', 'test competitor + ads removed');
  } else {
    log('cleanup skipped (--keep)');
  }

  if (scrape.status !== 200 || !stored) {
    console.error('\n❌ TEST FAILED');
    process.exit(3);
  }
  console.log('\n✅ TEST PASSED — end-to-end scrape works through the live Next.js app.');
}

main().catch((err) => {
  console.error('\n❌ Unhandled error:', err?.message || err);
  if (err?.stack) console.error(err.stack);
  process.exit(2);
});
