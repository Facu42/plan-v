import type { Context, Next } from 'hono';
import {
  verifyAuthToken as verifySupabaseAuthToken,
  isSupabaseEnabled as supabaseIsEnabled,
  createActorClient,
  bindActorClient,
} from '../db/supabase-client.js';
import { allowsSyntheticDemo } from '../config/runtime.js';
import { resolveRequestAuth } from '../security/contracts.js';
import { isMfaExemptPath, MFA_REQUIRED_MESSAGE, mfaEnforced, tokenAal } from '../security/mfa.js';
import { sbGetProfileRole } from '../db/supabase-repo.js';
import { isAdmin } from '../admin/repository.js';

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
  /** Si hay que exigir el segundo paso, y si la cuenta es de nutricionista o administradora. */
  mfa?: { enforced: () => boolean; needsSecondStep: (userId: string) => Promise<boolean> };
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
      const actorDb = createActorClient(c.req.header('Authorization'));
      if (actorDb) {
        return bindActorClient(actorDb, async () => {
          const mfa = dependencies.mfa;
          if (mfa?.enforced() && !isMfaExemptPath(c.req.path) && tokenAal(c.req.header('Authorization')) !== 'aal2'
            && await mfa.needsSecondStep(decision.userId)) {
            return c.json({ error: MFA_REQUIRED_MESSAGE, code: 'mfa_required' }, 403);
          }
          return next();
        });
      }
      if (!allowsSyntheticDemo()) return c.json({ error: 'Servicio no disponible' }, 503);
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
  mfa: {
    enforced: () => mfaEnforced(),
    needsSecondStep: async (userId) => (await sbGetProfileRole(userId)) === 'nutri' || await isAdmin(true),
  },
});
