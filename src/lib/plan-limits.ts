import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from './supabase-admin';

export interface PlanLimits {
  competitors: number;
  teamMembers: number;
  integrations: number;
  aiChatsPerDay: number;
  workspaces: number;
}

/**
 * Plan names must match the UI/Stripe product mapping:
 *   free | starter | growth | agency
 * "pro"/"enterprise" are kept as legacy aliases so old DB rows don't break.
 */
export const PLAN_LIMITS: Record<string, PlanLimits> = {
  free:    { competitors: 2,        teamMembers: 2,        integrations: 2,        aiChatsPerDay: 10,       workspaces: 1 },
  starter: { competitors: 5,        teamMembers: 5,        integrations: 4,        aiChatsPerDay: 50,       workspaces: 1 },
  growth:  { competitors: 15,       teamMembers: 15,       integrations: Infinity, aiChatsPerDay: 200,      workspaces: 1 },
  agency:  { competitors: Infinity, teamMembers: Infinity, integrations: Infinity, aiChatsPerDay: Infinity, workspaces: Infinity },
  // Legacy aliases
  pro:        { competitors: 10,       teamMembers: 10,       integrations: 4,        aiChatsPerDay: 100,      workspaces: 1 },
  enterprise: { competitors: Infinity, teamMembers: Infinity, integrations: Infinity, aiChatsPerDay: Infinity, workspaces: Infinity },
};

export function getLimitsForPlan(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

/**
 * Check if adding one more item would exceed the plan limit.
 * Returns null if allowed, or a NextResponse error if limit reached.
 *
 * For `workspaces`, counts across the USER (owned workspaces), not a single workspace.
 * Pass `userId` via the second-to-last argument for workspaces.
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
      .from('competitor_brands')
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
 * Check if the user can create another workspace under their highest plan.
 * Workspace count is scoped to the user, not a single workspace.
 * Returns null if allowed, or a NextResponse error if limit reached.
 */
export async function checkWorkspaceLimit(userId: string): Promise<NextResponse | null> {
  const db = getSupabaseAdmin();

  // Find the user's highest-tier plan across all workspaces they own
  const { data: owned } = await db
    .from('workspaces')
    .select('id, plan')
    .eq('owner_id', userId);

  const ownedCount = owned?.length || 0;

  // Determine highest plan tier across owned workspaces
  const planOrder = ['free', 'starter', 'pro', 'growth', 'agency', 'enterprise'];
  let highestPlan = 'free';
  for (const w of owned || []) {
    const p = (w as any).plan || 'free';
    if (planOrder.indexOf(p) > planOrder.indexOf(highestPlan)) {
      highestPlan = p;
    }
  }

  const limit = getLimitsForPlan(highestPlan).workspaces;
  if (limit === Infinity) return null;

  if (ownedCount >= limit) {
    return NextResponse.json(
      {
        error: 'Multi-workspace is an Agency plan feature. Upgrade to manage multiple workspaces.',
        resource: 'workspaces',
        current: ownedCount,
        limit,
        current_plan: highestPlan,
        required_plan: 'agency',
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
