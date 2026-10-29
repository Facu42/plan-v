/* Nutridash shell worker. Never cache /api, Supabase, signed URLs or clinical payloads. */
const SHELL = 'plan-v-shell-v2';
const SHELL_URLS = ['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];

function clinicalRequest(url) {
  try {
    const parsed = new URL(url, self.location.origin);
    if (parsed.pathname === '/api' || parsed.pathname.startsWith('/api/')) return true;
    if (parsed.hostname.includes('supabase.co') || parsed.hostname.includes('supabase.in')) return true;
    if (parsed.pathname.includes('/storage/v1') || parsed.pathname.startsWith('/functions/v1')) return true;
    if (parsed.searchParams.has('token')) return true;
    if (/X-Amz-Signature|sig=/i.test(parsed.search)) return true;
    return false;
  } catch {
    return true;
  }
}

function shellAsset(url) {
  try {
    const parsed = new URL(url, self.location.origin);
    if (parsed.origin !== self.location.origin) return false;
    if (clinicalRequest(parsed.href)) return false;
    return SHELL_URLS.includes(parsed.pathname)
      || parsed.pathname.startsWith('/icons/')
      || parsed.pathname.startsWith('/assets/');
  } catch {
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    const stale = keys.filter((key) => key.startsWith('plan-v-shell-') && key !== SHELL);
    await Promise.all(stale.map((key) => caches.delete(key)));
    await self.clients.claim();
    if (stale.length) {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) client.postMessage({ type: 'SHELL_UPDATED', cache: SHELL });
    }
  })());
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (clinicalRequest(request.url)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cached = await caches.match('/offline.html');
        return cached || new Response('Sin conexión. Todavía no se guardó.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  if (!shellAsset(request.url)) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) {
      const copy = response.clone();
      const cache = await caches.open(SHELL);
      await cache.put(request, copy);
    }
    return response;
  })());
});

/* Avisos al teléfono: el servidor manda solo un título, un texto genérico y la pantalla a abrir. */
self.addEventListener('push', (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const title = typeof data.title === 'string' ? data.title : 'Nutridash';
  const url = typeof data.url === 'string' && data.url.startsWith('/app/') ? data.url : '/app';
  event.waitUntil(self.registration.showNotification(title, {
    body: typeof data.body === 'string' ? data.body : 'Tenés un aviso nuevo.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: typeof data.tag === 'string' ? data.tag : 'plan-v',
    data: { url },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || '/app', self.location.origin).href;
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if (new URL(client.url).origin === self.location.origin && 'focus' in client) {
        await client.focus();
        if ('navigate' in client) await client.navigate(target).catch(() => undefined);
        return;
      }
    }
    await self.clients.openWindow(target);
  })());
});
