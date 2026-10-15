export function productionContentSecurityPolicy(supabaseUrl?: string): string {
  const connect = ["'self'"];
  if (supabaseUrl) {
    const url = new URL(supabaseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
      throw new Error('VITE_SUPABASE_URL must be an HTTPS service origin');
    }
    connect.push(url.origin, `wss://${url.host}`);
  }
  return [
    "default-src 'self'", "script-src 'self'", "style-src 'self' 'unsafe-inline'",
    "font-src 'self'", "img-src 'self' data: blob: https:",
    `connect-src ${connect.join(' ')}`, "object-src 'none'", "base-uri 'self'",
    "form-action 'self'", "frame-src 'none'", "upgrade-insecure-requests",
  ].join('; ');
}
