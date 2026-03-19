import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

function createSafeClient() {
  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch {
    // Return minimal mock if createClient fails (e.g. invalid URL in some envs)
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signOut: async () => ({}),
      },
    } as any;
  }
}

export const supabase = createSafeClient();
