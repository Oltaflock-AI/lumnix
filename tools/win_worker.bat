@echo off
REM Lumnix ad-spy worker (live server). Double-click to keep it running while
REM you test: it polls scrape_jobs every 15s, so the moment you add a brand in
REM the dashboard it scrapes + analyzes and pushes results back to Supabase.
REM Close this window to stop. Jobs added while it's off just wait in the queue.
REM For a one-shot drain-then-exit instead, use:  queue --once
cd /d "%~dp0.."
echo === Lumnix ad-spy worker — live (Ctrl+C or close window to stop) ===
node tools\spy_pipeline.mjs queue --interval 15
