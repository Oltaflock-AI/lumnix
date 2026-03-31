import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

// Auto-create waitlist table if it doesn't exist
async function ensureTable() {
  const sb = getSupabaseAdmin();
  // Try a simple select — if it fails, create the table
  const { error } = await sb.from('waitlist').select('id').limit(1);
  if (error?.code === '42P01') {
    // Table doesn't exist — create it via raw SQL
    const { error: createErr } = await sb.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.waitlist (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL UNIQUE,
          company TEXT,
          role TEXT,
          team_size TEXT,
          source TEXT DEFAULT 'landing_page',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
        ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
      `,
    });
    // If rpc doesn't work, the table needs to be created manually
    if (createErr) {
      console.warn('Could not auto-create waitlist table:', createErr.message);
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, role, team_size } = await req.json();

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const sb = getSupabaseAdmin();

    // Insert into waitlist
    const { data, error } = await sb
      .from('waitlist')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        company: company?.trim() || null,
        role: role?.trim() || null,
        team_size: team_size || null,
        source: 'landing_page',
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email is already on the waitlist!' }, { status: 409 });
      }
      // If table doesn't exist, try to create it
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Waitlist table not yet created. Please run the migration SQL in Supabase.' },
          { status: 500 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send notification email to admin
    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (resendKey) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Lumnix <notifications@oltaflock.ai>',
            to: ['admin@oltaflock.ai'],
            subject: `🚀 New Waitlist Signup: ${name.trim()}`,
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px;">
                <h2 style="color: #6366F1; margin-bottom: 24px;">New Waitlist Signup</h2>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr><td style="padding: 8px 0; color: #888; width: 120px;">Name</td><td style="padding: 8px 0; font-weight: 600;">${name.trim()}</td></tr>
                  <tr><td style="padding: 8px 0; color: #888;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email.trim()}" style="color: #6366F1;">${email.trim()}</a></td></tr>
                  ${company ? `<tr><td style="padding: 8px 0; color: #888;">Company</td><td style="padding: 8px 0;">${company.trim()}</td></tr>` : ''}
                  ${role ? `<tr><td style="padding: 8px 0; color: #888;">Role</td><td style="padding: 8px 0;">${role.trim()}</td></tr>` : ''}
                  ${team_size ? `<tr><td style="padding: 8px 0; color: #888;">Team Size</td><td style="padding: 8px 0;">${team_size}</td></tr>` : ''}
                </table>
                <hr style="margin: 24px 0; border: none; border-top: 1px solid #eee;" />
                <p style="color: #888; font-size: 13px;">Lumnix Waitlist · ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              </div>
            `,
          }),
        });
      }
    } catch (emailErr) {
      // Don't fail the signup if email fails
      console.error('Failed to send admin notification:', emailErr);
    }

    return NextResponse.json({ success: true, waitlist: data });
  } catch (err) {
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
