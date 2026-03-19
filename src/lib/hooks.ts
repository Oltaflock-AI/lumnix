"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase";

// Get current user's workspace
export function useWorkspace() {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

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
  }, []);

  return { workspace, loading };
}

// Get integrations for workspace
export function useIntegrations(workspaceId: string | undefined) {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    async function load() {
      try {
        const res = await fetch(`/api/integrations/list?workspace_id=${workspaceId}`);
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
    fetch(`/api/integrations/list?workspace_id=${workspaceId}`)
      .then(r => r.json())
      .then(d => setIntegrations(d.integrations || []))
      .catch(() => {});
  }};
}

// Connect an integration
export async function connectIntegration(provider: string, workspaceId: string) {
  const res = await fetch("/api/integrations/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ provider, workspace_id: workspaceId }),
  });
  if (res.ok) {
    const { url } = await res.json();
    window.location.href = url;
  }
}

// Sync data for an integration
export async function syncIntegration(integrationId: string, workspaceId: string, provider: string) {
  const endpoint = provider === "gsc" ? "/api/sync/gsc" : provider === "ga4" ? "/api/sync/ga4" : null;
  if (!endpoint) return null;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ integration_id: integrationId, workspace_id: workspaceId }),
  });
  return res.json();
}

// Fetch GSC data
export function useGSCData(workspaceId: string | undefined, type = "keywords", days = 28) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    fetch(`/api/data/gsc?workspace_id=${workspaceId}&type=${type}&days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, type, days]);

  return { data, loading };
}

// Fetch GA4 data
export function useGA4Data(workspaceId: string | undefined, type = "overview", days = 30) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) { setLoading(false); return; }
    fetch(`/api/data/ga4?workspace_id=${workspaceId}&type=${type}&days=${days}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, type, days]);

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
    fetch(`/api/competitors/list?workspace_id=${workspaceId}`)
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
    fetch(`/api/competitors/ads?workspace_id=${workspaceId}&competitor_id=${competitorId}`)
      .then(r => r.json())
      .then(d => { setAds(d.ads || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [workspaceId, competitorId, tick]);

  return { ads, loading, refetch: () => setTick(t => t + 1) };
}
