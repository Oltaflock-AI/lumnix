'use client';
import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from './supabase';

interface WorkspaceCtx {
  workspace: any;
  loading: boolean;
  refetch: () => void;
  setWorkspace: (w: any) => void;
}

const Ctx = createContext<WorkspaceCtx>({
  workspace: null,
  loading: true,
  refetch: () => {},
  setWorkspace: () => {},
});

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [workspace, setWorkspace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      try {
        const res = await fetch('/api/workspace', {
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

  const refetch = useCallback(() => setTick(t => t + 1), []);

  return (
    <Ctx.Provider value={{ workspace, loading, refetch, setWorkspace }}>
      {children}
    </Ctx.Provider>
  );
}

export function useWorkspaceCtx() {
  return useContext(Ctx);
}
