import type { Context, Next } from 'hono';
import { verifyAuthToken, isSupabaseEnabled } from '../db/supabase-client.js';

export type AuthContext = { userId: string } | { demo: true };

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

export async function authMiddleware(c: Context, next: Next) {
  if (!isSupabaseEnabled()) {
    c.set('auth', { demo: true });
    return next();
  }

  const token = c.req.header('Authorization');
  const verified = await verifyAuthToken(token);
  if (verified) {
    c.set('auth', { userId: verified.userId });
    return next();
  }

  // Allow read-only health without auth; demo fallback for dev
  if (c.req.path === '/api/health') {
    c.set('auth', { demo: true });
    return next();
  }

  // Unauthenticated requests fall back to demo mode (memory store)
  c.set('auth', { demo: true });
  return next();
}
