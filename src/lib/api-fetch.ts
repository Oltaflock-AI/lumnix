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

export async function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const session = await getSessionCached();
  const headers = new Headers(init.headers || {});
  if (session?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  }
  return fetch(input, { ...init, headers });
}
