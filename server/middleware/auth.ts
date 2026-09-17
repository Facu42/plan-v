import type { Context, Next } from 'hono';
import {
  verifyAuthToken as verifySupabaseAuthToken,
  isSupabaseEnabled as supabaseIsEnabled,
} from '../db/supabase-client.js';
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
};

export function createAuthMiddleware(dependencies: AuthDependencies) {
  return async function middleware(c: Context, next: Next) {
    const supabaseEnabled = dependencies.isSupabaseEnabled();

    if (c.req.path === '/api/health') {
      return next();
    }

    if (!supabaseEnabled) {
      c.set('auth', { demo: true });
      return next();
    }

    const verified = await dependencies.verifyAuthToken(c.req.header('Authorization'));
    const decision = resolveRequestAuth({
      supabaseEnabled,
      path: c.req.path,
      verifiedUserId: verified?.userId ?? null,
    });

    if (decision.kind === 'user') {
      c.set('auth', { userId: decision.userId });
      return next();
    }

    return c.json({ error: 'No autorizado' }, 401);
  };
}

export const authMiddleware = createAuthMiddleware({
  isSupabaseEnabled: supabaseIsEnabled,
  verifyAuthToken: verifySupabaseAuthToken,
});
