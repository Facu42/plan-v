/* Plan V shell worker. Never cache /api, Supabase, signed URLs or clinical payloads. */
const SHELL = 'plan-v-shell-v1';
const SHELL_URLS = ['/offline.html', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

function clinicalRequest(url) {
  try {
    const parsed = new URL(url, self.location.origin);
    if (parsed.pathname === '/api' || parsed.pathname.startsWith('/api/')) return true;
    if (parsed.hostname.includes('supabase.co')) return true;
    if (parsed.pathname.includes('/storage/v1')) return true;
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
    await Promise.all(keys.filter((key) => key !== SHELL).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
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
