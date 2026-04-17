'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from './supabase';
import { useTheme } from './theme';

interface WorkspaceCtx {
  workspace: any;
  workspaces: { id: string; name: string; logo_url?: string | null; brand_color?: string | null }[];
  loading: boolean;
  refetch: () => void;
  setWorkspace: (w: any) => void;
  switchWorkspace: (id: string) => void;
}

const Ctx = createContext<WorkspaceCtx>({
  workspace: null,
  workspaces: [],
  loading: true,
  refetch: () => {},
  setWorkspace: () => {},
  switchWorkspace: () => {},
});

const WS_KEY = 'lumnix-active-workspace';

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspaceState] = useState<any>(null);
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string; logo_url?: string | null; brand_color?: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);
  const { setAccentColor } = useTheme();

  const setWorkspace = useCallback((w: any) => {
    setWorkspaceState(w);
    if (w?.brand_color) setAccentColor(w.brand_color);
    if (w?.id) {
      try { localStorage.setItem(WS_KEY, w.id); } catch {}
    }
  }, [setAccentColor]);

  const switchWorkspace = useCallback(async (id: string) => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoading(false); return; }
    try {
      const res = await fetch(`/api/workspace?workspace_id=${id}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspace(data.workspace);
        if (data.workspaces) setWorkspaces(data.workspaces);
      }
    } catch {}
    setLoading(false);
  }, [setWorkspace]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        // Check if user had a previously selected workspace
        let savedId = '';
        try { savedId = localStorage.getItem(WS_KEY) || ''; } catch {}

        const url = savedId ? `/api/workspace?workspace_id=${savedId}` : '/api/workspace';
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWorkspace(data.workspace);
          if (data.workspaces) setWorkspaces(data.workspaces);
        }
      } catch {}
      setLoading(false);
    }
    load();
  }, [tick]);

  const refetch = useCallback(() => setTick(t => t + 1), []);

  const value = useMemo(
    () => ({ workspace, workspaces, loading, refetch, setWorkspace, switchWorkspace }),
    [workspace, workspaces, loading, refetch, setWorkspace, switchWorkspace]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspaceCtx() {
  return useContext(Ctx);
}
