# Week 1 Day 1 — Test Plan

## What Changed

### 1. Cron Sync Upgrade (`src/app/api/cron/sync/route.ts`)
- Now syncs **all 4 providers**: GSC, GA4, Google Ads, Meta Ads (was only GSC + GA4)
- **Retry logic**: 3 attempts with exponential backoff (1s, 2s, 4s delays)
- **Sync job tracking**: creates records in `sync_jobs` table with status, errors, results
- Meta Ads skips Google token refresh (uses long-lived Facebook tokens)

### 2. Unified Data Endpoint (`src/app/api/data/unified/route.ts`) — NEW
- Single endpoint combining all 4 data sources
- Returns: totals, per-source breakdown, daily chart data, integration status
- Falls back to `analytics_data` JSONB when normalized tables are empty

### 3. Dashboard Upgrade (`src/app/dashboard/page.tsx`)
- KPI cards now show: **Sessions, Organic Clicks, Ad Spend, ROAS** (was: Sessions, Clicks, Avg Position, Impressions)
- Traffic chart now overlays **organic vs paid clicks** with color legend
- New `useUnifiedData` hook in `src/lib/hooks.ts`

### 4. Onboarding Flow (`src/app/onboarding/page.tsx`)
- OAuth now redirects back to `/onboarding` (not `/dashboard/settings`)
- Shows **green "Connected" badge** for each connected provider
- **Auto-triggers first sync** immediately after OAuth completes
- Step 3 shows summary of connected sources with pill badges

### 5. CSS Fix (`src/app/globals.css`)
- Removed duplicate `@import url()` for Google Fonts (already loaded via `<link>` in layout.tsx)
- This was causing a PostCSS error with Tailwind v4

### 6. Migrations Cleanup
- All 18 `.sql` files moved to `migrations/` folder
- New consolidated `migrations/supabase-schema.sql` with all tables, indexes, RLS, RPCs

---

## How to Test

### Test 1: Cron Sync (all 4 providers)
1. Go to **Dashboard > Settings > Integrations**
2. Click **"Sync All Now"** button
3. **Expected**: All connected integrations sync (check last sync timestamps update)
4. **Verify in Supabase**: Check `sync_jobs` table — should see new rows with `status: 'completed'` or `status: 'failed'` with error messages

**API test** (replace `YOUR_WORKSPACE_ID`):
```
GET /api/cron/sync?workspace_id=YOUR_WORKSPACE_ID
```
Should return JSON with `synced` count and `results` array for each provider.

### Test 2: Unified Data Endpoint
**API test** (replace `YOUR_WORKSPACE_ID`):
```
GET /api/data/unified?workspace_id=YOUR_WORKSPACE_ID&days=30
```
**Expected response shape:**
```json
{
  "totals": {
    "sessions": 1234,
    "users": 890,
    "organic_clicks": 567,
    "ad_spend": 450.50,
    "ad_revenue": 1200,
    "roas": 2.66,
    "conversions": 23
  },
  "by_source": {
    "gsc": { "clicks": 567, "impressions": 12000 },
    "ga4": { "sessions": 1234, "users": 890, "pageviews": 3400 },
    "google_ads": { "spend": 200, "clicks": 150, ... },
    "meta_ads": { "spend": 250.50, "clicks": 300, ... }
  },
  "daily": [ { "date": "2026-03-08", "organic_clicks": 20, "paid_clicks": 15, "ad_spend": 12.5, "sessions": 45 }, ... ],
  "integrations": [ { "provider": "gsc", "last_sync_at": "..." }, ... ],
  "period": { "start": "2026-03-08", "end": "2026-04-07", "days": 30 }
}
```

### Test 3: Dashboard KPI Cards
1. Go to **Dashboard** (homepage)
2. **If you have Google Ads or Meta Ads connected**: You should see **Ad Spend** and **ROAS** cards with real numbers
3. **If no ads connected**: Cards show "—" with "Connect Ads" subtitle
4. **Traffic chart**: Should show "Organic vs Paid traffic" title with color legend (purple = organic, yellow = paid)

### Test 4: Onboarding Flow
1. Open an **incognito window** and sign up with a new account
2. **Step 1**: Enter brand name, pick color → click Continue
3. **Step 2**: Click **Connect** on any integration (e.g. GSC)
4. Complete OAuth flow
5. **Expected**: You return to `/onboarding` (not `/dashboard/settings`)
6. **Expected**: The integration shows a green **"Connected"** badge
7. **Expected**: Status text shows "Syncing your data..." briefly, then "Data synced successfully"
8. Connect more integrations or click **"Skip for now"**
9. **Step 3**: Should show pill badges for each connected source
10. Click **"Go to Dashboard"** → dashboard loads with real data

### Test 5: Retry Logic
This is harder to test manually. To verify:
1. Check Supabase `sync_jobs` table after a sync
2. If a sync failed, the `error_message` column should say something like: `"GSC sync failed after 3 attempts: [error details]"`
3. The `result` column on successful syncs shows row counts

### Test 6: CSS / Visual
1. Load any page — should render without errors
2. Open browser DevTools console — no CSS errors
3. Fonts (Plus Jakarta Sans, DM Mono) should load correctly

### Test 7: Migrations Folder
Just verify the files exist:
```bash
ls migrations/
# Should show 19 .sql files including supabase-schema.sql
```

---

## Quick Smoke Test Checklist

- [ ] Landing page loads (`/`)
- [ ] Sign in works (`/auth/signin`)
- [ ] Dashboard loads with data (`/dashboard`)
- [ ] KPI cards show Ad Spend + ROAS (if ads connected)
- [ ] Traffic chart shows organic vs paid overlay
- [ ] Settings > Sync All Now works
- [ ] Onboarding flow returns to `/onboarding` after OAuth
- [ ] Connected integrations show green badge in onboarding
- [ ] `/api/data/unified?workspace_id=...` returns combined data
- [ ] No console errors in browser DevTools
- [ ] Vercel deployment succeeds (check dashboard)
