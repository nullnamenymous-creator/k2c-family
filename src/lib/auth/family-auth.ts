import { createHmac } from 'node:crypto';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';

export function normalizeFamilyPhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
  if (digits.startsWith('62')) return `+${digits}`;
  if (input.trim().startsWith('+')) return `+${digits}`;
  return null;
}

function getAuthPepper(): string {
  const pepper = process.env.FAMILY_AUTH_PEPPER || process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!pepper) throw new Error('Family auth pepper is not configured.');
  return pepper;
}

export function deriveFamilyPassword(phone: string, pin: string): string {
  return createHmac('sha256', getAuthPepper()).update(`${phone}:${pin}`).digest('hex');
}

function getServerKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('Server auth secret is not configured.');
  return key;
}

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('Supabase URL is not configured.');
  return url;
}

export function createFamilyAdminClient(): SupabaseClient {
  return createClient(getSupabaseUrl(), getServerKey(), {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export function createFamilyAuthClient(): SupabaseClient {
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('Supabase publishable key is not configured.');
  return createClient(getSupabaseUrl(), key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

export async function findFamilyUserByPhone(phone: string): Promise<User | null> {
  const normalizedPhone = normalizeFamilyPhone(phone);
  if (!normalizedPhone) return null;

  const admin = createFamilyAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;

  return data.users.find((user) => {
    if (user.deleted_at || !user.phone) return false;
    return normalizeFamilyPhone(user.phone) === normalizedPhone;
  }) ?? null;
}

export function internalFamilyEmail(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return `family-${digits}@k2c-family.internal`;
}
