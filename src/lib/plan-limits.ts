import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabase-admin';

export interface PlanLimits {
  competitors: number;
  teamMembers: number;
  integrations: number;
  aiChatsPerDay: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  free: { competitors: 2, teamMembers: 2, integrations: 2, aiChatsPerDay: 10 },
  pro: { competitors: 10, teamMembers: 10, integrations: 4, aiChatsPerDay: 100 },
  enterprise: { competitors: Infinity, teamMembers: Infinity, integrations: Infinity, aiChatsPerDay: Infinity },
};

export function getLimitsForPlan(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if adding one more item would exceed the plan limit.
 * Returns null if allowed, or a NextResponse error if limit reached.
 */
export async function checkPlanLimit(
  workspaceId: string,
  plan: string,
  resource: 'competitors' | 'teamMembers' | 'integrations'
): Promise<NextResponse | null> {
  const limits = getLimitsForPlan(plan);
  const limit = limits[resource];
  if (limit === Infinity) return null;

  const db = getSupabaseAdmin();
  let count = 0;

  if (resource === 'competitors') {
    const { count: c } = await db
      .from('competitors')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);
    count = c || 0;
  } else if (resource === 'teamMembers') {
    const { count: c } = await db
      .from('workspace_members')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);
    count = c || 0;
  } else if (resource === 'integrations') {
    const { count: c } = await db
      .from('integrations')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'connected');
    count = c || 0;
  }

  if (count >= limit) {
    return NextResponse.json(
      {
        error: 'Plan limit reached',
        resource,
        current: count,
        limit,
        upgrade_url: '/dashboard/settings?tab=billing',
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Check if daily AI chat limit has been reached.
 * Uses a simple count in the chat_usage table (or falls back to allowing).
 */
export async function checkAIChatLimit(
  workspaceId: string,
  plan: string
): Promise<NextResponse | null> {
  const limits = getLimitsForPlan(plan);
  if (limits.aiChatsPerDay === Infinity) return null;

  const db = getSupabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { count } = await db
    .from('chat_usage')
    .select('*', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .gte('created_at', `${today}T00:00:00Z`);

  if ((count || 0) >= limits.aiChatsPerDay) {
    return NextResponse.json(
      {
        error: 'Daily AI chat limit reached',
        current: count,
        limit: limits.aiChatsPerDay,
        upgrade_url: '/dashboard/settings?tab=billing',
      },
      { status: 429 }
    );
  }

  return null;
}
