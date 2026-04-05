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
  options?: { workspaceIdParam?: string }
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

  // Get workspace_id from query params or request body
  const paramName = options?.workspaceIdParam || 'workspace_id';
  const workspaceId = req.nextUrl.searchParams.get(paramName);

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
