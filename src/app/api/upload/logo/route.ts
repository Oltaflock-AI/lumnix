import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

function getUserClient(authHeader: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { global: { headers: { Authorization: authHeader } } }
  );
}

// POST /api/upload/logo — upload logo using service role (bypasses RLS)
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify the user is authenticated
    const userClient = getUserClient(authHeader);
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get file from form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 2MB)' }, { status: 400 });
    }
    if (file.size < 8) {
      return NextResponse.json({ error: 'Invalid file' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const header = new Uint8Array(bytes.slice(0, 12));

    // Verify magic bytes — don't trust client-reported MIME type
    const isPng = header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47;
    const isJpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
    const isGif = header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46;
    const isWebp = header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46
      && header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50;
    const isSvg = false; // Reject SVG — stored XSS risk

    let ext: string;
    let contentType: string;
    if (isPng) { ext = 'png'; contentType = 'image/png'; }
    else if (isJpeg) { ext = 'jpg'; contentType = 'image/jpeg'; }
    else if (isGif) { ext = 'gif'; contentType = 'image/gif'; }
    else if (isWebp) { ext = 'webp'; contentType = 'image/webp'; }
    else {
      return NextResponse.json({ error: 'Only PNG, JPEG, GIF, or WebP allowed' }, { status: 400 });
    }

    const path = `${user.id}/logo.${ext}`;

    // Upload using service role key — bypasses RLS
    const admin = getSupabaseAdmin();
    const { error: uploadError } = await admin.storage
      .from('brand-assets')
      .upload(path, bytes, {
        contentType,
        upsert: true,
      });

    if (uploadError) {
      console.error('Logo upload error:', uploadError);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage
      .from('brand-assets')
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrl });
  } catch (err: any) {
    console.error('Logo upload error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
