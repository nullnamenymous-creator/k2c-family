const LEGACY_PWA_CACHES = new Set([
  'next-pwa-cache',
  'next-data',
  'next-image',
  'next-font',
  'next-static-js-assets',
  'next-static-image-assets',
  'next-static-font-assets',
  'next-static-style-assets',
  'next-runtime-cache',
]);

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((cacheName) => LEGACY_PWA_CACHES.has(cacheName))
          .map((cacheName) => caches.delete(cacheName))
      )
    )
  );
});

self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;
  let payload: { title?: string; body?: string; roomId?: string; messageId?: string } = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { body: event.data.text() };
  }

  const title = payload.title || 'Family Chat';
  const options = {
    body: payload.body || 'Ada pesan baru.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      roomId: payload.roomId || '',
      messageId: payload.messageId || '',
    },
    tag: payload.roomId ? `room-${payload.roomId}` : 'family-chat',
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const roomId = event.notification.data?.roomId;
  const target = roomId ? `/room/${roomId}` : '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((client) => 'focus' in client);
      if (existing && 'focus' in existing) {
        void existing.focus();
        if ('navigate' in existing) void existing.navigate(target);
        return;
      }
      return self.clients.openWindow(target);
    })
  );
});
