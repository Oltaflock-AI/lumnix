# Ad-Spy VPS Setup (zero-cost compute)

How to stand up the competitor ad-spy worker off your local machine. Supabase
holds all state; a free VPS does the Chromium scrape + ffmpeg analyze.

## Why a VPS at all

Scrape needs Chromium; analyze needs ffmpeg/ffprobe + `child_process`. Neither
runs in Supabase Edge Functions. Meta also soft-blocks datacenter IPs, so the
worker scrapes through a residential proxy. Split: **Supabase = brain/state,
VPS = hands, Vercel = the app UI (already deployed).**

## 1. Apply the Supabase migration

`supabase/migrations/20260613_scrape_jobs_queue.sql` adds:
- `scrape_jobs` queue table
- `claim_scrape_job()` RPC (atomic, multi-worker safe)
- `ad-creatives` storage bucket
- nightly `pg_cron` enqueue (02:00 UTC) — needs the **pg_cron** extension

Steps:
1. Supabase Dashboard → Database → Extensions → enable **pg_cron**.
2. Run the migration (Dashboard SQL editor, or `supabase db push`).
3. The `do $$ … $$` block schedules the nightly job once pg_cron is on.

## 2. (Preferred) Use a spare Windows PC — residential IP, no proxy

A home PC's residential IP is exactly what Meta does *not* soft-block, so this
beats a cloud VPS: leave `SCRAPER_PROXY` empty and there's no proxy cost. Good
for on-demand ("turn it on when we need it") — jobs wait in `scrape_jobs` while
the PC is off and drain when it's on. During testing, leave the nightly pg_cron
**unscheduled** so jobs don't pile up while the PC sleeps; enqueue manually.

Native Windows (simplest — Win10+ ships `curl`, Chromium bundles its libs):

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Gyan.FFmpeg
# reopen PowerShell, then verify: node -v ; ffmpeg -version ; curl --version

cd $HOME
git clone https://<PAT>@github.com/Oltaflock-AI/lumnix.git
cd lumnix
npm ci
npx playwright install chromium      # no --with-deps on Windows
```

Create `lumnix\.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ANTHROPIC_API_KEY=...
SCRAPER_PROXY=          # leave empty — home IP is residential
```

Run on-demand: double-click `tools\win_worker.bat` (drains the queue once and
exits), or `node tools\spy_pipeline.mjs queue --once`. For always-on, run
`...queue` (no `--once`) under Task Scheduler or pm2, and set Windows power
options to not sleep.

WSL2 alternative: `wsl --install -d Ubuntu-22.04`, then run `vps_bootstrap.sh`
as in §3 — WSL2 still exits via the host's residential IP.

## 3. (Alternative) Oracle Cloud Always Free

1. Create an **Ampere A1 (ARM)** Compute instance, Ubuntu 22.04, 1–4 OCPU /
   6–24 GB. (If ARM capacity is unavailable, retry or pick a quieter region;
   or fall back to Hetzner CX22 ~€3.79/mo x86.)
2. Add an SSH key, allow it, note the public IP.
3. SSH in: `ssh ubuntu@<ip>`.

## 3. Provision the worker

```bash
# repo is public — no PAT needed
curl -fsSL https://raw.githubusercontent.com/Oltaflock-AI/lumnix/main/tools/vps_bootstrap.sh | bash
```

The script installs Node 20, ffmpeg, Chromium (+system libs), clones the repo,
writes a systemd service `lumnix-spy`, and drops a `.env.local` template.

## 4. Fill secrets + start

```bash
nano /opt/lumnix/.env.local
#   NEXT_PUBLIC_SUPABASE_URL=...
#   SUPABASE_SERVICE_ROLE_KEY=...
#   ANTHROPIC_API_KEY=...
#   SCRAPER_PROXY=http://user:pass@host:port   # residential proxy
sudo systemctl restart lumnix-spy
journalctl -u lumnix-spy -f      # watch it claim + drain jobs
```

## 5. Residential proxy

Buy pay-as-you-go residential bandwidth (IPRoyal / Rayobyte — **not** Apify).
Ad Library pages are light, so a few competitors nightly costs cents. Put the
proxy URL in `SCRAPER_PROXY`. Without it, the scraper hits Meta's soft block
(`exit 3`).

## Operating

- **On-demand scrape**: insert a row into `scrape_jobs`
  (`workspace_id`, optional `competitor_id`) — the worker picks it up within
  the poll interval. Wire this to a dashboard button later via a service-role
  API route.
- **Manual one-off on the VPS**: `node tools/spy_pipeline.mjs run`
- **Drain once then exit** (e.g. external cron): `... queue --once`
- Crashed worker mid-job: the stale `running` lock (>30 min) is re-claimable
  automatically; errored jobs retry up to `max_attempts` (3).

## Cost

| Piece | Cost |
|---|---|
| Oracle ARM compute | $0 (always free) |
| Supabase | existing free/Pro tier |
| Residential proxy | ~cents–$3/mo at light volume |
