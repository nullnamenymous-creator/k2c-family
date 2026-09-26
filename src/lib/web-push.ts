'use client';

export function isWebPushSupported() {
  return typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window;
}

export async function subscribeToWebPush(): Promise<PushSubscription | null> {
  if (!isWebPushSupported()) return null;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return null;

  const registration = await navigator.serviceWorker.ready;
  const existing = await registration.pushManager.getSubscription();
  if (existing) return existing;

  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error('VAPID public key belum dikonfigurasi.');

  const padding = '='.repeat((4 - vapidKey.length % 4) % 4);
  const base64 = (vapidKey + padding).replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const applicationServerKey = Uint8Array.from(binary, (char) => char.charCodeAt(0));

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });
}
