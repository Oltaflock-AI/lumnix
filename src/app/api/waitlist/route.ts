import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { rateLimit } from '@/lib/rate-limit';

// NOTE: the waitlist table is provisioned via supabase migrations
// (see migrations/waitlist.sql). We used to auto-create it here via a
// dangerous `exec_sql` RPC — that was removed because exposing an
// arbitrary-SQL RPC on a public route is an RCE-equivalent primitive.

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP: 5 signups per hour. Light anti-spam without captcha.
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || 'unknown';
    const limited = rateLimit(`waitlist:${ip}`, 5, 60 * 60 * 1000);
    if (limited) return limited;

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
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
