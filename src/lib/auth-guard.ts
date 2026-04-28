import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabase-admin';

function getUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: authHeader } } }
  );
}

export interface AuthContext {
  userId: string;
  workspaceId: string;
  workspacePlan: string;
  role: string;
}

/**
 * Authenticate request and verify workspace membership.
 * Returns AuthContext on success, or a NextResponse error on failure.
 */
export async function authenticateRequest(
  req: NextRequest,
  options?: { workspaceIdParam?: string; body?: Record<string, unknown> }
): Promise<AuthContext | NextResponse> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getUserClient(authHeader);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get workspace_id from query params first, then from pre-parsed body
  const paramName = options?.workspaceIdParam || 'workspace_id';
  const workspaceId =
    req.nextUrl.searchParams.get(paramName) ||
    (options?.body?.[paramName] as string | undefined) ||
    null;

  if (!workspaceId) {
    return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });
  }

  // Verify user is a member of the workspace
  const db = getSupabaseAdmin();
  const { data: member } = await db
    .from('workspace_members')
    .select('role, workspaces(plan)')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  return {
    userId: user.id,
    workspaceId,
    workspacePlan: (member as any).workspaces?.plan || 'free',
    role: member.role,
  };
}

/** Type guard to check if result is an error response */
export function isAuthError(result: AuthContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse;
}

/**
 * Verify an integration belongs to the workspace the caller claims. Use this
 * in sync + provider-account routes where the caller supplies both
 * `integration_id` AND `workspace_id`. Without this check, an attacker can
 * pair their own workspace_id with another workspace's integration_id and
 * exfiltrate tokens / data via the route.
 */
export async function verifyIntegrationInWorkspace(
  integrationId: string,
  workspaceId: string
): Promise<NextResponse | null> {
  if (!integrationId || !workspaceId) {
    return NextResponse.json({ error: 'integration_id and workspace_id required' }, { status: 400 });
  }
  const { data } = await getSupabaseAdmin()
    .from('integrations')
    .select('id')
    .eq('id', integrationId)
    .eq('workspace_id', workspaceId)
    .single();
  if (!data) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
  }
  return null;
}

/**
 * Verify a user (from middleware x-user-id header) has membership in a workspace.
 * Use this in POST/PATCH routes that get workspace_id from request body.
 * Returns null if allowed, or a NextResponse error if denied.
 */
export async function verifyWorkspaceAccess(
  req: NextRequest,
  workspaceId: string | null | undefined
): Promise<NextResponse | { userId: string; role: string }> {
  const userId = req.headers.get('x-user-id');
  if (!userId) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (!workspaceId) {
    return NextResponse.json({ error: 'Missing workspace_id' }, { status: 400 });
  }
  const { data: member } = await getSupabaseAdmin()
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();
  if (!member) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }
  return { userId, role: member.role };
}
