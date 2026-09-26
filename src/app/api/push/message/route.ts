import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createServerClient } from '@supabase/ssr';
import { createFamilyAdminClient } from '@/lib/auth/family-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function configureWebPush() {
  const subject = process.env.WEB_PUSH_SUBJECT;
  const publicKey = process.env.WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  if (!subject || !publicKey || !privateKey) throw new Error('Web Push VAPID belum dikonfigurasi.');
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase belum dikonfigurasi.' }, { status: 500 });

  const session = createServerClient(url, key, {
    cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} },
  });
  const { data: auth } = await session.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await request.json();
  const roomId = typeof body?.roomId === 'string' ? body.roomId : '';
  const messageId = typeof body?.messageId === 'string' ? body.messageId : '';
  if (!roomId || !messageId) return NextResponse.json({ error: 'Data pesan tidak lengkap.' }, { status: 400 });

  const admin = createFamilyAdminClient();
  const { data: membership } = await admin.from('room_participants').select('user_id').eq('room_id', roomId);
  if (!membership?.some((row) => row.user_id === auth.user.id)) {
    return NextResponse.json({ error: 'Bukan anggota room.' }, { status: 403 });
  }

  const { data: message } = await admin.from('messages')
    .select('content, sender_id').eq('id', messageId).eq('room_id', roomId).maybeSingle();
  if (!message || message.sender_id !== auth.user.id) {
    return NextResponse.json({ error: 'Pesan tidak ditemukan.' }, { status: 404 });
  }

  const recipientIds = membership.map((row) => row.user_id).filter((id) => id !== auth.user.id);
  if (!recipientIds.length) return NextResponse.json({ ok: true, sent: 0 });

  const { data: subscriptions } = await admin.from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', recipientIds);
  if (!subscriptions?.length) return NextResponse.json({ ok: true, sent: 0 });

  const { data: sender } = await admin.from('profiles').select('full_name').eq('id', auth.user.id).maybeSingle();
  configureWebPush();

  const payload = JSON.stringify({
    title: sender?.full_name || 'K2C Family',
    body: message.content,
    roomId,
    messageId,
  });

  let sent = 0;
  let failed = 0;
  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification({
        endpoint: subscription.endpoint,
        keys: { p256dh: subscription.p256dh, auth: subscription.auth },
      }, payload);
      sent += 1;
    } catch (error: unknown) {
      failed += 1;
      const statusCode = typeof error === 'object' && error !== null && 'statusCode' in error
        ? Number((error as { statusCode?: number }).statusCode)
        : 0;
      if (statusCode === 404 || statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('id', subscription.id);
      } else {
        console.warn('[WebPush] Delivery failed:', statusCode || error);
      }
    }
  }

  return NextResponse.json({ ok: true, sent, failed });
}
