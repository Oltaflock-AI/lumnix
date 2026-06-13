# Lumnix Ad-Spy Worker — Windows Setup (easy mode)

Turn a spare Windows PC into the server that scrapes competitor ads and runs
the AI analysis. You do this **once**. After that, you just double-click one
file whenever you want it running.

You do **not** copy files by hand — you clone the repo and it brings
everything. The only thing you create by hand is one small settings file
(`.env.local`) with 3 values.

---

## Before you start — have these 3 values ready

Open your existing `.env.local` (on your Mac) and copy these three lines —
you'll paste them on the Windows PC in Step 4:

1. `NEXT_PUBLIC_SUPABASE_URL=...`
2. `SUPABASE_SERVICE_ROLE_KEY=...`
3. `ANTHROPIC_API_KEY=...`

You also need a **GitHub Personal Access Token** (PAT) to clone the private
repo: github.com → Settings → Developer settings → Personal access tokens →
Fine-grained token → give it read access to the `Oltaflock-AI/lumnix` repo →
copy the token (starts with `github_pat_...`).

---

## Step 1 — Install the tools

Open **PowerShell** (press Start, type "PowerShell", hit Enter) and paste:

```powershell
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install Gyan.FFmpeg
```

Say "yes" to any prompts. When it finishes, **close PowerShell and open a new
one** (so it picks up the new tools), then check they all work:

```powershell
node -v
ffmpeg -version
git --version
curl --version
```

Each should print a version. If `ffmpeg` says "not recognized", restart the PC
and try again (the installer needs a fresh session to update PATH).

---

## Step 2 — Download the project

In PowerShell, paste this — **replace `YOUR_TOKEN`** with your GitHub PAT:

```powershell
cd $HOME
git clone https://YOUR_TOKEN@github.com/Oltaflock-AI/lumnix.git
cd lumnix
```

This creates a `lumnix` folder in your user home (e.g. `C:\Users\You\lumnix`).

---

## Step 3 — Install the project's pieces

Still in PowerShell, inside the `lumnix` folder:

```powershell
npm ci
npx playwright install chromium
```

`npm ci` takes a few minutes. `npx playwright install chromium` downloads the
browser the scraper drives. Wait for both to finish.

---

## Step 4 — Create the settings file

In PowerShell, inside the `lumnix` folder, open Notepad on a new file:

```powershell
notepad .env.local
```

Click **Yes** to create it, then paste this and fill in your 3 values:

```
NEXT_PUBLIC_SUPABASE_URL=paste-your-url-here
SUPABASE_SERVICE_ROLE_KEY=paste-your-key-here
ANTHROPIC_API_KEY=paste-your-key-here
SCRAPER_PROXY=
```

Leave `SCRAPER_PROXY` **empty** — your home internet is already a residential
connection, which is exactly what Meta doesn't block. Save (Ctrl+S) and close.

> ⚠️ Keep this file private. It has secret keys. It's already git-ignored so it
> won't get uploaded.

---

## Step 5 — Turn the server on

In File Explorer, go to `C:\Users\You\lumnix\tools` and **double-click
`win_worker.bat`**.

A black window opens and says it's polling for jobs. **Leave this window
open** — that's the server running. The moment you add a brand in the Lumnix
dashboard, this window scrapes it, runs the AI analysis, and pushes the
results back to the cloud. You'll see it working in the window.

To stop the server: close the window. Jobs you add while it's off just wait in
the queue and get picked up next time you turn it on.

---

## Daily use (after setup)

- **Want it running?** Double-click `tools\win_worker.bat`. Leave it open.
- **Done?** Close the window.
- **Updated the code?** In PowerShell inside `lumnix`: `git pull` then re-run
  `npm ci` only if it tells you dependencies changed.

---

## If something breaks

- **`win_worker.bat` flashes and closes instantly** → open PowerShell in the
  `lumnix` folder and run `node tools\spy_pipeline.mjs queue --once` to see the
  real error.
- **"Supabase env missing"** → your `.env.local` is missing a value or has a
  typo. Re-check Step 4.
- **Scrape says "soft block / something went wrong"** → Meta rate-limited you;
  wait an hour. Keep it to a few brands per hour.
- **`ffmpeg not recognized`** → restart the PC so PATH updates.

---

## What has to be true on the cloud side (one-time, on Supabase)

For the dashboard "add brand" to create jobs this worker can pick up:
1. Supabase dashboard → Database → Extensions → enable **pg_cron**.
2. Run the migration `supabase/migrations/20260613_scrape_jobs_queue.sql`
   (Supabase SQL editor → paste → run).

That creates the `scrape_jobs` queue the worker reads. Done once.
