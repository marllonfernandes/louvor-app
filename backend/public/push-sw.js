// Service Worker handler para Web Push Notifications (Louvor App)
// Funciona em segundo plano mesmo com o aplicativo fechado no Android e iOS (PWA)

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Louvor App',
    body: 'Uma escala de louvor foi atualizada.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: 'louvor-event-update',
    url: '/',
    eventId: undefined
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = { ...payload, ...parsed };
    } catch {
      try {
        payload.body = event.data.text();
      } catch {
        // Mantém fallback padrão
      }
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-192x192.png',
    tag: payload.tag || `louvor-${payload.eventId || Date.now()}`,
    renotify: true,
    vibrate: [200, 100, 200],
    data: {
      url: payload.url || '/',
      eventId: payload.eventId
    }
  };

  event.waitUntil(
    self.registration.showNotification(payload.title || 'Louvor App', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url || '/';
  const eventId = event.notification.data?.eventId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já houver uma aba/janela do Louvor App aberta, foca nela e avisa qual evento abrir
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (eventId) {
            client.postMessage({
              type: 'OPEN_EVENT_FROM_NOTIFICATION',
              eventId
            });
          }
          return;
        }
      }
      // Caso o app estivesse fechado, abre a janela na URL do evento
      if (self.clients.openWindow) {
        const urlWithParam = eventId ? `/?eventId=${encodeURIComponent(eventId)}` : targetUrl;
        return self.clients.openWindow(urlWithParam);
      }
    })
  );
});
