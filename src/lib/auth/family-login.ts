import { appendFile } from 'node:fs/promises';
import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import {
  createFamilyAuthClient,
  findFamilyUserByPhone,
  internalFamilyEmail,
  normalizeFamilyPhone,
  deriveFamilyPassword,
} from './family-auth';

async function debugLog(message: string) {
  try {
    await appendFile('D:\\k2c-family\\.login-debug.log', `[${new Date().toISOString()}] ${message}\\n`, 'utf8');
  } catch {}
}

export async function signInFamily(
  rawPhone: string,
  pin: string,
  request: NextRequest,
  response: NextResponse,
): Promise<boolean> {
  const phone = normalizeFamilyPhone(rawPhone);
  if (!phone || !/^\d{4}$/.test(pin)) {
    await debugLog(`input-invalid phoneLast4=${phone?.slice(-4) || 'none'}`);
    return false;
  }

  const user = await findFamilyUserByPhone(phone);
  await debugLog(`lookup phoneLast4=${phone.slice(-4)} found=${Boolean(user)} confirmed=${Boolean(user?.phone_confirmed_at)} email=${Boolean(user?.email)}`);

  if (!user?.email || !user.phone_confirmed_at) return false;

  const authClient = createFamilyAuthClient();
  const email = user.email || internalFamilyEmail(phone);
  const password = deriveFamilyPassword(phone, pin);
  const { data, error } = await authClient.auth.signInWithPassword({
    email,
    password,
  });

  await debugLog(`password-auth success=${Boolean(data.session)} errorCode=${error?.code || 'none'} errorStatus=${error?.status || 'none'} errorMessage=${error?.message || 'none'}`);

  if (error || !data.session) return false;

  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  await sessionClient.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
  await debugLog('session-set success=true');
  return true;
}
