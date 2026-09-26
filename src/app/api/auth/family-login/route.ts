import { NextRequest, NextResponse } from 'next/server';
import { signInFamily } from '@/lib/auth/family-login';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || current.resetAt <= now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return false;
  }
  current.count += 1;
  return current.count > MAX_ATTEMPTS;
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' }, { status: 429 });
  }

  try {
    const body = await request.json();
    const phone = typeof body?.phone === 'string' ? body.phone : '';
    const pin = typeof body?.pin === 'string' ? body.pin : '';
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const ok = await signInFamily(phone, pin, request, response);

    if (!ok) {
      return NextResponse.json({ error: 'Nomor HP atau PIN salah.' }, { status: 401 });
    }

    response.headers.set('Cache-Control', 'no-store');
    return response;
  } catch (error) {
    console.error('[FamilyAuth] Login failed:', error);
    return NextResponse.json({ error: 'Login gagal. Silakan coba lagi.' }, { status: 500 });
  }
}
