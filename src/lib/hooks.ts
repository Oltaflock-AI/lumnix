"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { apiFetch as authFetch } from "./api-fetch";

// Get current user's workspace
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }

      try {
        const res = await fetch("/api/workspace", {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWorkspace(data.workspace);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [tick]);

  const refetch = () => setTick(t => t + 1);

  return { workspace, loading, refetch };
}

// Get integrations for workspace
export function useIntegrations(workspaceId: string | undefined) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    async function load() {
      try {
        const res = await authFetch(`/api/integrations/list?workspace_id=${workspaceId}`);
        if (res.ok) {
          const data = await res.json();
          setIntegrations(data.integrations || []);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [workspaceId]);

  return { integrations, loading, refetch: () => {
    if (!workspaceId) return;
    authFetch(`/api/integrations/list?workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(d => setIntegrations(d.integrations || []))
      .catch(() => {});
  }};
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

// Fetch GSC data
export function useGSCData(workspaceId: string | undefined, type = "keywords", daysOrRange: number | DateRangeParams = 28) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const rangeKey = typeof daysOrRange === 'number'
    ? `days=${daysOrRange}`
    : daysOrRange.startDate
      ? `start_date=${daysOrRange.startDate}&end_date=${daysOrRange.endDate}`
      : `days=${daysOrRange.days || 28}`;

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    setLoading(true);
    authFetch(`/api/data/gsc?workspace_id=${workspaceId}&type=${type}&${rangeKey}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, type, rangeKey]);

  return { data, loading };
}

// Fetch GA4 data
export function useGA4Data(workspaceId: string | undefined, type = "overview", daysOrRange: number | DateRangeParams = 30) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const rangeKey = typeof daysOrRange === 'number'
    ? `days=${daysOrRange}`
    : daysOrRange.startDate
      ? `start_date=${daysOrRange.startDate}&end_date=${daysOrRange.endDate}`
      : `days=${daysOrRange.days || 30}`;

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    setLoading(true);
    authFetch(`/api/data/ga4?workspace_id=${workspaceId}&type=${type}&${rangeKey}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, type, rangeKey]);

  return { data, loading };
}

// Fetch Google Ads data
export function useGoogleAdsData(workspaceId: string | undefined, days = 30) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    setLoading(true);
    authFetch(`/api/data/google-ads?workspace_id=${workspaceId}&days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, days]);

  return { data, loading, refetch: () => {
    if (!workspaceId) return;
    setLoading(true);
    authFetch(`/api/data/google-ads?workspace_id=${workspaceId}&days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }};
}

// Fetch Meta Ads data
export function useMetaAdsData(workspaceId: string | undefined, days = 30) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    setLoading(true);
    authFetch(`/api/data/meta-ads?workspace_id=${workspaceId}&days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, days]);

  return { data, loading, refetch: () => {
    if (!workspaceId) return;
    setLoading(true);
    authFetch(`/api/data/meta-ads?workspace_id=${workspaceId}&days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }};
}

// Fetch unified data across all 4 sources
export function useUnifiedData(workspaceId: string | undefined, days = 30) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    setLoading(true);
    authFetch(`/api/data/unified?workspace_id=${workspaceId}&days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, days]);

  return { data, loading };
}

// Fetch competitors list for a workspace
export function useCompetitors(workspaceId: string | undefined) {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    setLoading(true);
    authFetch(`/api/competitors/list?workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(d => { setCompetitors(d.competitors || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, tick]);

  return { competitors, loading, refetch: () => setTick(t => t + 1) };
}

// Fetch ads for a competitor
export function useCompetitorAds(workspaceId: string | undefined, competitorId: string | null) {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!workspaceId || !competitorId) { setAds([]); return; }
    setLoading(true);
    authFetch(`/api/competitors/ads?workspace_id=${workspaceId}&competitor_id=${competitorId}`)
      .then(r => r.json())
      .then(d => { setAds(d.ads || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, competitorId, tick]);

  return { ads, loading, refetch: () => setTick(t => t + 1) };
}
