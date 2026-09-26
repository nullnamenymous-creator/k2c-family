import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createFamilyAdminClient } from '@/lib/auth/family-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: 'Supabase belum dikonfigurasi.' }, { status: 500 });
  const session = createServerClient(url, key, { cookies: { getAll: () => request.cookies.getAll(), setAll: () => {} } });
  const { data: auth } = await session.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });

  const body = await request.json();
  const targetUserId = typeof body?.userId === 'string' ? body.userId : '';
  if (!targetUserId || targetUserId === auth.user.id) return NextResponse.json({ error: 'Anggota tujuan tidak valid.' }, { status: 400 });

  const admin = createFamilyAdminClient();
  const ids = [auth.user.id, targetUserId].sort();
  const dmKey = ids.join(':');
  const { data: targetProfile } = await admin.from('profiles').select('id').eq('id', targetUserId).maybeSingle();
  if (!targetProfile) return NextResponse.json({ error: 'Anggota tidak ditemukan.' }, { status: 404 });

  const { data: existing } = await admin.from('rooms').select('id').eq('is_group', false).eq('dm_key', dmKey).maybeSingle();
  if (existing) return NextResponse.json({ roomId: existing.id, created: false });

  const { data: room, error: roomError } = await admin.from('rooms').insert({ name: null, is_group: false, dm_key: dmKey }).select('id').single();
  if (roomError) {
    if (roomError.code === '23505') {
      const { data: raced } = await admin.from('rooms').select('id').eq('is_group', false).eq('dm_key', dmKey).maybeSingle();
      if (raced) return NextResponse.json({ roomId: raced.id, created: false });
    }
    console.error('[DM] Failed to create room:', roomError);
    return NextResponse.json({ error: 'Gagal membuat obrolan pribadi.' }, { status: 500 });
  }

  const { error: participantError } = await admin.from('room_participants').insert([
    { room_id: room.id, user_id: auth.user.id },
    { room_id: room.id, user_id: targetUserId },
  ]);
  if (participantError) {
    await admin.from('rooms').delete().eq('id', room.id);
    console.error('[DM] Failed to create participants:', participantError);
    return NextResponse.json({ error: 'Gagal menyiapkan peserta obrolan.' }, { status: 500 });
  }
  return NextResponse.json({ roomId: room.id, created: true });
}
