import type { Context, Next } from 'hono';
import {
  verifyAuthToken as verifySupabaseAuthToken,
  isSupabaseEnabled as supabaseIsEnabled,
} from '../db/supabase-client.js';
import { allowsSyntheticDemo } from '../config/runtime.js';
import { resolveRequestAuth } from '../security/contracts.js';

export type AuthContext = { userId: string } | { demo: true };

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

type AuthDependencies = {
  isSupabaseEnabled: () => boolean;
  verifyAuthToken: (token: string | undefined) => Promise<{ userId: string } | null>;
  allowDemo: () => boolean;
};

export function createAuthMiddleware(dependencies: AuthDependencies) {
  return async function middleware(c: Context, next: Next) {
    const supabaseEnabled = dependencies.isSupabaseEnabled();
    const allowDemo = dependencies.allowDemo();
    const verified = supabaseEnabled
      ? await dependencies.verifyAuthToken(c.req.header('Authorization'))
      : null;
    const decision = resolveRequestAuth({
      supabaseEnabled,
      path: c.req.path,
      verifiedUserId: verified?.userId ?? null,
      allowDemo,
    });

    if (decision.kind === 'public') {
      return next();
    }

    if (decision.kind === 'demo') {
      c.set('auth', { demo: true });
      return next();
    }

    if (decision.kind === 'user') {
      c.set('auth', { userId: decision.userId });
      return next();
    }

    if (decision.kind === 'unavailable') {
      return c.json({ error: 'Servicio no disponible' }, 503);
    }

    return c.json({ error: 'No autorizado' }, 401);
  };
}

export const authMiddleware = createAuthMiddleware({
  isSupabaseEnabled: supabaseIsEnabled,
  verifyAuthToken: verifySupabaseAuthToken,
  allowDemo: () => allowsSyntheticDemo(),
});
