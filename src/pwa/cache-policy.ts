const SIGNED = /X-Amz-Signature|sig=/i;

export function isClinicalUrl(url: string, origin = 'http://127.0.0.1'): boolean {
  try {
    const parsed = new URL(url, origin);
    if (parsed.pathname === '/api' || parsed.pathname.startsWith('/api/')) return true;
    if (parsed.hostname.includes('supabase.co')) return true;
    if (parsed.pathname.includes('/storage/v1')) return true;
    if (parsed.searchParams.has('token')) return true;
    if (SIGNED.test(parsed.search)) return true;
    return false;
  } catch {
    return true;
  }
}

export function isShellAsset(url: string, origin = 'http://127.0.0.1'): boolean {
  try {
    const parsed = new URL(url, origin);
    if (parsed.origin !== new URL(origin).origin) return false;
    if (isClinicalUrl(parsed.href, origin)) return false;
    return parsed.pathname === '/offline.html'
      || parsed.pathname === '/manifest.webmanifest'
      || parsed.pathname.startsWith('/icons/')
      || parsed.pathname.startsWith('/assets/');
  } catch {
    return false;
  }
}
