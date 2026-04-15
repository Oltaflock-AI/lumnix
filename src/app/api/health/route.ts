import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  const checks: Record<string, 'ok' | 'error'> = {};

  // Check Supabase connection
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from('workspaces').select('id').limit(1);
    checks.database = error ? 'error' : 'ok';
  } catch {
    checks.database = 'error';
  }

  // Check services are configured (don't reveal which specific keys are set/missing)
  const servicesConfigured = !!(
    process.env.ANTHROPIC_API_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  checks.services = servicesConfigured ? 'ok' : 'error';

  const allOk = Object.values(checks).every(v => v === 'ok');

  return NextResponse.json(
    { status: allOk ? 'healthy' : 'degraded', checks, timestamp: new Date().toISOString() },
    { status: allOk ? 200 : 503 }
  );
}
