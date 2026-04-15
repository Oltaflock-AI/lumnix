"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { apiFetch as authFetch } from "./api-fetch";

// Get current user's workspace
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        const res = await fetch("/api/workspace", {
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: ctrl.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (!ctrl.signal.aborted) setWorkspace(data.workspace);
        }
      } catch {}
      if (!ctrl.signal.aborted) setLoading(false);
    }
    load();
    return () => ctrl.abort();
  }, [tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);
  return { workspace, loading, refetch };
}

// Generic hook: fetch a URL whenever `enabled` toggles true or deps change.
// Cancels inflight requests on unmount/dep change to prevent stale setState.
function useJsonFetch<T = any>(url: string | null): { data: T | null; loading: boolean; refetch: () => void } {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!url) { setLoading(false); return; }
    const ctrl = new AbortController();
    setLoading(true);
    authFetch(url, { signal: ctrl.signal })
      .then(r => r.json())
      .then(d => { if (!ctrl.signal.aborted) { setData(d); setLoading(false); } })
      .catch(() => { if (!ctrl.signal.aborted) setLoading(false); });
    return () => ctrl.abort();
  }, [url, tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);
  return { data, loading, refetch };
}

// Get integrations for workspace
export function useIntegrations(workspaceId: string | undefined) {
  const url = workspaceId ? `/api/integrations/list?workspace_id=${workspaceId}` : null;
  const { data, loading, refetch } = useJsonFetch<{ integrations: any[] }>(url);
  return { integrations: data?.integrations || [], loading, refetch };
}

// Connect an integration
export async function connectIntegration(provider: string, workspaceId: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { alert('Please sign in first'); return; }
    const res = await fetch("/api/integrations/connect", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ provider, workspace_id: workspaceId }),
    });
    const data = await res.json();
    if (res.ok && data.url) {
      window.location.href = data.url;
    } else {
      alert(`Connect failed: ${data.error || JSON.stringify(data)}`);
    }
  } catch (err) {
    alert(`Connect error: ${err}`);
  }
}

// Sync data for an integration
export async function syncIntegration(integrationId: string, workspaceId: string, provider: string, extra?: { ad_account_id?: string }) {
  const endpointMap: Record<string, string> = {
    gsc: "/api/sync/gsc",
    ga4: "/api/sync/ga4",
    google_ads: "/api/sync/google-ads",
    meta_ads: "/api/sync/meta-ads",
  };
  const endpoint = endpointMap[provider];
  if (!endpoint) return null;

  const res = await authFetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ integration_id: integrationId, workspace_id: workspaceId, ...extra }),
  });
  return res.json();
}

export interface DateRangeParams {
  days?: number;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

function rangeQuery(daysOrRange: number | DateRangeParams, fallbackDays: number): string {
  if (typeof daysOrRange === 'number') return `days=${daysOrRange}`;
  if (daysOrRange.startDate) return `start_date=${daysOrRange.startDate}&end_date=${daysOrRange.endDate}`;
  return `days=${daysOrRange.days || fallbackDays}`;
}

// Fetch GSC data
export function useGSCData(workspaceId: string | undefined, type = "keywords", daysOrRange: number | DateRangeParams = 28) {
  const url = workspaceId ? `/api/data/gsc?workspace_id=${workspaceId}&type=${type}&${rangeQuery(daysOrRange, 28)}` : null;
  const { data, loading } = useJsonFetch<any>(url);
  return { data, loading };
}

// Fetch GA4 data
export function useGA4Data(workspaceId: string | undefined, type = "overview", daysOrRange: number | DateRangeParams = 30) {
  const url = workspaceId ? `/api/data/ga4?workspace_id=${workspaceId}&type=${type}&${rangeQuery(daysOrRange, 30)}` : null;
  const { data, loading } = useJsonFetch<any>(url);
  return { data, loading };
}

// Fetch Google Ads data
export function useGoogleAdsData(workspaceId: string | undefined, days = 30) {
  const url = workspaceId ? `/api/data/google-ads?workspace_id=${workspaceId}&days=${days}` : null;
  const { data, loading, refetch } = useJsonFetch<any>(url);
  return { data, loading, refetch };
}

// Fetch Meta Ads data
export function useMetaAdsData(workspaceId: string | undefined, days = 30) {
  const url = workspaceId ? `/api/data/meta-ads?workspace_id=${workspaceId}&days=${days}` : null;
  const { data, loading, refetch } = useJsonFetch<any>(url);
  return { data, loading, refetch };
}

// Fetch unified data across all 4 sources
export function useUnifiedData(workspaceId: string | undefined, days = 30) {
  const url = workspaceId ? `/api/data/unified?workspace_id=${workspaceId}&days=${days}` : null;
  const { data, loading } = useJsonFetch<any>(url);
  return { data, loading };
}

// Fetch competitors list for a workspace
export function useCompetitors(workspaceId: string | undefined) {
  const url = workspaceId ? `/api/competitors/list?workspace_id=${workspaceId}` : null;
  const { data, loading, refetch } = useJsonFetch<{ competitors: any[] }>(url);
  return { competitors: data?.competitors || [], loading, refetch };
}

// Fetch ads for a competitor
export function useCompetitorAds(workspaceId: string | undefined, competitorId: string | null) {
  const url = workspaceId && competitorId
    ? `/api/competitors/ads?workspace_id=${workspaceId}&competitor_id=${competitorId}`
    : null;
  const { data, loading, refetch } = useJsonFetch<{ ads: any[] }>(url);
  return { ads: data?.ads || [], loading, refetch };
}
