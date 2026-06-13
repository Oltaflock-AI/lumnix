-- Ad-spy job queue. Supabase is the brain/state; a cheap VPS worker is the
-- hands (Chromium + ffmpeg can't run in Edge Functions, and Meta soft-blocks
-- datacenter IPs anyway). pg_cron enqueues jobs nightly; the VPS worker
-- (`node tools/spy_pipeline.mjs queue`) claims them atomically and writes
-- results back. The dashboard can also enqueue a job for an on-demand scrape.

-- ── queue table ────────────────────────────────────────────────────────────
create table if not exists public.scrape_jobs (
  id            uuid primary key default gen_random_uuid(),
  workspace_id  uuid not null,
  competitor_id uuid,                         -- null = scrape whole workspace
  country       text not null default 'IN',
  max_ads       int  not null default 60,
  analyze_n     int  not null default 5,
  status        text not null default 'queued'
                  check (status in ('queued','running','completed','error')),
  attempts      int  not null default 0,
  max_attempts  int  not null default 3,
  locked_by     text,
  locked_at     timestamptz,
  error         text,
  result        jsonb,
  created_at    timestamptz not null default now(),
  started_at    timestamptz,
  finished_at   timestamptz
);

create index if not exists scrape_jobs_status_created_idx
  on public.scrape_jobs (status, created_at);
create index if not exists scrape_jobs_workspace_idx
  on public.scrape_jobs (workspace_id);

comment on table public.scrape_jobs is
  'Ad-spy scrape queue. Enqueued by pg_cron / dashboard, drained by the VPS worker (spy_pipeline.mjs queue).';

-- ── atomic claim (FOR UPDATE SKIP LOCKED → multi-worker safe) ───────────────
-- Picks the oldest job that is queued, a crashed 'running' (stale lock >30m),
-- or an 'error' with retries left. Marks it running and bumps attempts.
create or replace function public.claim_scrape_job(p_worker text)
returns setof public.scrape_jobs
language plpgsql
as $$
begin
  return query
  update public.scrape_jobs j
     set status     = 'running',
         locked_by  = p_worker,
         locked_at  = now(),
         started_at = coalesce(j.started_at, now()),
         attempts   = j.attempts + 1
   where j.id = (
     select id from public.scrape_jobs
      where status = 'queued'
         or (status = 'running' and locked_at < now() - interval '30 minutes')
         or (status = 'error' and attempts < max_attempts)
      order by created_at
      limit 1
      for update skip locked
   )
  returning j.*;
end;
$$;

-- Worker authenticates with the service role; lock the function down to it.
revoke all on function public.claim_scrape_job(text) from public, anon, authenticated;
grant execute on function public.claim_scrape_job(text) to service_role;

-- ── RLS: worker uses the service role (bypasses RLS). Dashboard reads jobs
--    for its own workspace; writes go through the service role only. ─────────
alter table public.scrape_jobs enable row level security;

drop policy if exists scrape_jobs_select_own_ws on public.scrape_jobs;
create policy scrape_jobs_select_own_ws on public.scrape_jobs
  for select to authenticated
  using (
    workspace_id in (
      select workspace_id from public.workspace_members where user_id = auth.uid()
    )
  );

-- ── storage bucket for downloaded creatives (videos/frames outlive a run) ───
insert into storage.buckets (id, name, public)
values ('ad-creatives', 'ad-creatives', true)
on conflict (id) do nothing;

-- ── nightly enqueue (02:00 UTC): one job per workspace that has trackables ──
-- Requires the pg_cron extension (enable in Supabase: Database → Extensions).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule('nightly-ad-spy')
      where exists (select 1 from cron.job where jobname = 'nightly-ad-spy');
    perform cron.schedule(
      'nightly-ad-spy',
      '0 2 * * *',
      $cron$
        insert into public.scrape_jobs (workspace_id, country)
        select distinct workspace_id, 'IN'
          from public.competitor_brands
         where facebook_page_id is not null
      $cron$
    );
  else
    raise notice 'pg_cron not enabled — enable it then re-run the cron.schedule block, or enqueue jobs from the dashboard.';
  end if;
end
$$;
