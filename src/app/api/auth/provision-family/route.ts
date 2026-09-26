import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import {
  createFamilyAdminClient,
  findFamilyUserByPhone,
  internalFamilyEmail,
  normalizeFamilyPhone,
  deriveFamilyPassword,
} from '@/lib/auth/family-auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type FamilyAccountInput = {
  phone: string;
  pin: string;
  fullName: string;
  role?: string;
};

function secretMatches(request: NextRequest): boolean {
  const expected = process.env.FAMILY_BOOTSTRAP_SECRET || '';
  const supplied = request.headers.get('x-family-bootstrap-secret') || '';
  if (!expected || !supplied) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: NextRequest) {
  if (!secretMatches(request)) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const accounts = (Array.isArray(body?.accounts) ? body.accounts : []) as FamilyAccountInput[];
    if (accounts.length !== 5) {
      return NextResponse.json({ error: 'Provisioning membutuhkan tepat 5 akun keluarga.' }, { status: 400 });
    }

    const normalized = accounts.map((account) => ({
      phone: normalizeFamilyPhone(typeof account?.phone === 'string' ? account.phone : ''),
      pin: typeof account?.pin === 'string' ? account.pin : '',
      fullName: typeof account?.fullName === 'string' ? account.fullName.trim() : '',
      role: typeof account?.role === 'string' ? account.role.trim() : 'Anggota Keluarga',
    }));
    const phones = normalized.map((account) => account.phone).filter(Boolean);
    if (normalized.some((account) => !account.phone || !/^\d{4}$/.test(account.pin) || !account.fullName) || new Set(phones).size !== 5) {
      return NextResponse.json({ error: 'Data akun keluarga tidak valid.' }, { status: 400 });
    }

    const admin = createFamilyAdminClient();
    const results: Array<{ fullName: string; phone: string; userId: string }> = [];

    for (const account of normalized) {
      const phone = account.phone!;
      const existing = await findFamilyUserByPhone(phone);
      let userId = existing?.id;

      if (existing) {
        const { error } = await admin.auth.admin.updateUserById(existing.id, {
          email: existing.email || internalFamilyEmail(phone),
          password: deriveFamilyPassword(phone, account.pin),
          phone,
          phone_confirm: true,
          email_confirm: true,
          user_metadata: { full_name: account.fullName, family_auth: true },
        });
        if (error) throw error;
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: internalFamilyEmail(phone),
          password: deriveFamilyPassword(phone, account.pin),
          email_confirm: true,
          phone,
          phone_confirm: true,
          user_metadata: { full_name: account.fullName, family_auth: true },
        });
        if (error || !data.user) throw error || new Error('Gagal membuat akun keluarga.');
        userId = data.user.id;
      }

      const { error: profileError } = await admin.from('profiles').upsert({
        id: userId,
        full_name: account.fullName,
        role: account.role,
        is_online: false,
      });
      if (profileError) throw profileError;
      results.push({ fullName: account.fullName, phone, userId: userId! });
    }

    return NextResponse.json({ ok: true, accounts: results });
  } catch (error) {
    console.error('[FamilyAuth] Provisioning failed:', error);
    return NextResponse.json({ error: 'Provisioning akun keluarga gagal.' }, { status: 500 });
  }
}
