'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { isWebPushSupported, subscribeToWebPush } from '@/lib/web-push';

export function PushNotifications() {
  const { currentUser } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);

  async function register() {
    if (!currentUser || !isWebPushSupported() || busy) return;
    setBusy(true);
    try {
      const subscription = await subscribeToWebPush();
      if (!subscription) return;

      const response = await fetch('/api/push/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: subscription.toJSON() }),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Gagal mendaftarkan push subscription.');
      setEnabled(true);
    } catch (error) {
      console.warn('[WebPush] Registration failed:', error);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!currentUser || !isWebPushSupported()) return;
    if (Notification.permission === 'granted') void register();
  }, [currentUser?.id]);

  if (!currentUser || !isWebPushSupported() || enabled || Notification.permission === 'granted') {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => void register()}
      disabled={busy}
      className="fixed bottom-20 right-4 z-50 rounded-full border border-white/20 bg-black/80 px-4 py-2 text-sm font-medium text-white shadow-lg backdrop-blur disabled:opacity-60"
    >
      {busy ? 'Mengaktifkan…' : 'Aktifkan notifikasi'}
    </button>
  );
}
