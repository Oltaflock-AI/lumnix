import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (!url || !key) {
    return NextResponse.json({ error: 'Missing Supabase credentials' }, { status: 500 });
  }

  const sb = createClient(url, key);

  // Create table using raw SQL via rpc
  const { error } = await sb.rpc('_exec_sql' as any, {
    _sql: `
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
      DROP POLICY IF EXISTS "Service role full access on waitlist" ON public.waitlist;
      CREATE POLICY "Service role full access on waitlist" ON public.waitlist FOR ALL USING (true) WITH CHECK (true);
      CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist (email);
    `,
  });

  if (error) {
    // rpc might not exist - return the SQL for manual execution
    return NextResponse.json({ 
      error: 'Auto-migration failed. Run this SQL manually in Supabase SQL Editor:',
      sql: `CREATE TABLE IF NOT EXISTS public.waitlist (
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
DROP POLICY IF EXISTS "Service role full access on waitlist" ON public.waitlist;
CREATE POLICY "Service role full access on waitlist" ON public.waitlist FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON public.waitlist (email);`,
      supabase_error: error.message,
    }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Waitlist table created' });
}
