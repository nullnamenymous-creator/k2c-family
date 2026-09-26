import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createFamilyAdminClient } from '@/lib/auth/family-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase belum dikonfigurasi.' }, { status: 500 });

  const session = createServerClient(url, key, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  });
  const { data } = await session.auth.getUser();
  if (!data.user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await request.json();
  const subscription = body?.subscription;
  const endpoint = typeof subscription?.endpoint === 'string' ? subscription.endpoint : '';
  const p256dh = typeof subscription?.keys?.p256dh === 'string' ? subscription.keys.p256dh : '';
  const auth = typeof subscription?.keys?.auth === 'string' ? subscription.keys.auth : '';
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Push subscription tidak valid.' }, { status: 400 });
  }

  const admin = createFamilyAdminClient();
  const { error } = await admin.from('push_subscriptions').upsert({
    user_id: data.user.id,
    endpoint,
    p256dh,
    auth,
    platform: request.headers.get('user-agent') || 'web',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'endpoint' });

  if (error) {
    console.error('[WebPush] Subscription registration failed:', error);
    return NextResponse.json({ error: 'Gagal menyimpan subscription.' }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
