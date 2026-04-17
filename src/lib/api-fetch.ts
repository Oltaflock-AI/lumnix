"use client";
import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

/**
 * Authenticated fetch for /api/* routes.
 * Caches the Supabase session in memory and keeps it fresh via onAuthStateChange,
 * so we don't pay a getSession() round-trip on every call.
 */

let cachedSession: Session | null = null;
let sessionPromise: Promise<Session | null> | null = null;
let subscribed = false;

function ensureSubscribed() {
  if (subscribed) return;
  subscribed = true;
  supabase.auth.onAuthStateChange((_event, session) => {
    cachedSession = session;
  });
}

async function getSessionCached(): Promise<Session | null> {
  ensureSubscribed();
  if (cachedSession) return cachedSession;
  if (!sessionPromise) {
    sessionPromise = supabase.auth.getSession().then(({ data }) => {
      cachedSession = data.session;
      sessionPromise = null;
      return cachedSession;
    }).catch(() => {
      sessionPromise = null;
      return null;
    });
  }
  return sessionPromise;
}

const inflight = new Map<string, Promise<Response>>();

function dedupeKey(input: RequestInfo | URL, init: RequestInit): string | null {
  const method = (init.method || 'GET').toUpperCase();
  if (method !== 'GET') return null;
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
  return url;
}

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const session = await getSessionCached();
  const headers = new Headers(init.headers || {});
  if (session?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }

  const key = dedupeKey(input, init);
  if (key) {
    const pending = inflight.get(key);
    if (pending) return pending.then(r => r.clone());
    const p = fetch(input, { ...init, headers });
    inflight.set(key, p);
    p.finally(() => inflight.delete(key));
    return p.then(r => r.clone());
  }

  return fetch(input, { ...init, headers });
}
