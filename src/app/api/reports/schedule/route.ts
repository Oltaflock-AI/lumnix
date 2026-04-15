import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { authenticateRequest, isAuthError } from '@/lib/auth-guard';

function getNextSendDate(frequency: string): string {
  const now = new Date();
  if (frequency === 'daily') {
    now.setDate(now.getDate() + 1);
    now.setHours(8, 0, 0, 0);
  } else if (frequency === 'weekly') {
    now.setDate(now.getDate() + (7 - now.getDay() + 1)); // next Monday
    now.setHours(8, 0, 0, 0);
  } else {
    // monthly — first of next month
    now.setMonth(now.getMonth() + 1, 1);
    now.setHours(8, 0, 0, 0);
  }
  return now.toISOString();
}

// GET /api/reports/schedule?workspace_id=xxx
export async function GET(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (isAuthError(auth)) return auth;

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('report_schedules')
    .select('*')
    .eq('workspace_id', auth.workspaceId)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ schedules: data || [] });
}

// POST /api/reports/schedule — create a new schedule
export async function POST(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (isAuthError(auth)) return auth;

  const { name, frequency, recipients, report_config } = await req.json();

  if (!name || !frequency || !recipients?.length) {
    return NextResponse.json({ error: 'name, frequency, and recipients are required' }, { status: 400 });
  }

  if (!['daily', 'weekly', 'monthly'].includes(frequency)) {
    return NextResponse.json({ error: 'frequency must be daily, weekly, or monthly' }, { status: 400 });
  }

  // Validate + cap recipients to block free-tier spam / sender-reputation harm.
  if (!Array.isArray(recipients) || recipients.length > 50) {
    return NextResponse.json({ error: 'recipients must be an array of at most 50 emails' }, { status: 400 });
  }
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const cleanedRecipients = recipients
    .filter((e: unknown) => typeof e === 'string')
    .map((e: string) => e.trim().toLowerCase())
    .filter((e) => emailRe.test(e));
  if (cleanedRecipients.length === 0 || cleanedRecipients.length !== recipients.length) {
    return NextResponse.json({ error: 'one or more recipient emails are invalid' }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from('report_schedules')
    .insert({
      workspace_id: auth.workspaceId,
      name,
      frequency,
      recipients: cleanedRecipients,
      report_config: report_config || {},
      next_send_at: getNextSendDate(frequency),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ schedule: data });
}

// PATCH /api/reports/schedule — update a schedule
export async function PATCH(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (isAuthError(auth)) return auth;

  const { id, enabled, name, frequency, recipients } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = getSupabaseAdmin();
  const update: any = {};
  if (typeof enabled === 'boolean') update.enabled = enabled;
  if (name) update.name = name;
  if (frequency && ['daily', 'weekly', 'monthly'].includes(frequency)) {
    update.frequency = frequency;
    update.next_send_at = getNextSendDate(frequency);
  }
  if (recipients !== undefined) {
    if (!Array.isArray(recipients) || recipients.length === 0 || recipients.length > 50) {
      return NextResponse.json({ error: 'recipients must be an array of 1-50 emails' }, { status: 400 });
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const cleaned = recipients
      .filter((e: unknown) => typeof e === 'string')
      .map((e: string) => e.trim().toLowerCase())
      .filter((e) => emailRe.test(e));
    if (cleaned.length !== recipients.length) {
      return NextResponse.json({ error: 'one or more recipient emails are invalid' }, { status: 400 });
    }
    update.recipients = cleaned;
  }

  const { data, error } = await db
    .from('report_schedules')
    .update(update)
    .eq('id', id)
    .eq('workspace_id', auth.workspaceId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ schedule: data });
}

// DELETE /api/reports/schedule?workspace_id=xxx&id=yyy
export async function DELETE(req: NextRequest) {
  const auth = await authenticateRequest(req);
  if (isAuthError(auth)) return auth;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const db = getSupabaseAdmin();
  const { error } = await db
    .from('report_schedules')
    .delete()
    .eq('id', id)
    .eq('workspace_id', auth.workspaceId);

  if (error) return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  return NextResponse.json({ success: true });
}
