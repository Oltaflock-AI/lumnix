import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

// GET /api/email/unsubscribe?user_id=xxx — unsubscribe from marketing emails
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')

  if (!userId) {
    return new NextResponse(renderPage('Missing user ID', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  try {
    const db = getSupabaseAdmin()

    // Upsert email preference
    const { error } = await db.from('email_preferences').upsert(
      {
        user_id: userId,
        opted_out: true,
        opted_out_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

    if (error) {
      console.error('[email/unsubscribe] Error:', error)
      return new NextResponse(renderPage('Something went wrong. Please try again.', false), {
        status: 500,
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // Mark all pending emails for this user as skipped
    await db
      .from('email_sequences')
      .update({ status: 'skipped', error_message: 'User unsubscribed' })
      .eq('user_id', userId)
      .eq('status', 'pending')

    return new NextResponse(renderPage("You've been unsubscribed from Lumnix marketing emails.", true), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error: any) {
    console.error('[email/unsubscribe] Error:', error)
    return new NextResponse(renderPage('Something went wrong. Please try again.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }
}

function renderPage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${success ? 'Unsubscribed' : 'Error'} — Lumnix</title>
  <style>
    body { font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif; background: #F8F7FC; margin: 0; padding: 40px 20px; }
    .card { max-width: 480px; margin: 80px auto; background: #fff; border-radius: 16px; padding: 40px; text-align: center; border: 1px solid #EAE8FF; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 22px; color: #18163A; font-weight: 700; margin: 0 0 12px; }
    p { font-size: 15px; color: #6B7280; line-height: 1.6; margin: 0 0 24px; }
    a { display: inline-block; padding: 12px 28px; background: #7C3AED; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✅' : '⚠️'}</div>
    <h1>${success ? 'Unsubscribed' : 'Oops'}</h1>
    <p>${message}</p>
    <a href="https://lumnix-ai.vercel.app/dashboard">Back to Lumnix</a>
  </div>
</body>
</html>`
}
