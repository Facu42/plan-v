import type { Context, Next } from 'hono';
import {
  verifyAuthToken as verifySupabaseAuthToken,
  isSupabaseEnabled as supabaseIsEnabled,
  createActorClient,
  bindActorClient,
} from '../db/supabase-client.js';
import { allowsSyntheticDemo } from '../config/runtime.js';
import { resolveRequestAuth } from '../security/contracts.js';
import { hasVerifiedTotp, isMfaExemptPath, MFA_REQUIRED_MESSAGE, tokenAal } from '../security/mfa.js';
import { sbGetActor } from '../db/supabase-repo.js';

export type AuthContext = { userId: string } | { demo: true };

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext;
    preMfaProfessional?: boolean;
  }
}

type AuthDependencies = {
  isSupabaseEnabled: () => boolean;
  verifyAuthToken: (token: string | undefined) => Promise<{ userId: string } | null>;
  allowDemo: () => boolean;
  /**
   * True cuando esta sesión ya tiene un TOTP verificado y todavía está en aal1.
   * No depende de MFA_ENFORCE ni del rol: la nutricionista lo elige al activarlo.
   */
  mfa?: {
    needsSecondStep: (userId: string, authorization: string | undefined) => Promise<boolean>;
  };
};

type ProfessionalBootstrapDependencies = {
  getRole: (userId: string) => Promise<'nutri' | 'paciente' | null>;
  getActor: typeof sbGetActor;
  hasPatients: (nutritionistId: string) => Promise<boolean>;
};

export async function allowPreMfaProfessionalBootstrap(
  userId: string,
  path: string,
  dependencies: ProfessionalBootstrapDependencies,
): Promise<boolean> {
  if (path === '/api/nutritionist/setup') return (await dependencies.getRole(userId)) === 'nutri';
  if (path !== '/api/crm/work-queue') return false;
  const actor = await dependencies.getActor(userId);
  return actor?.role === 'nutri' && !await dependencies.hasPatients(actor.nutritionistId);
}

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
          if (mfa && !isMfaExemptPath(c.req.path) && tokenAal(c.req.header('Authorization')) !== 'aal2'
            && await mfa.needsSecondStep(decision.userId, c.req.header('Authorization'))) {
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
    needsSecondStep: async (_userId, authorization) => hasVerifiedTotp(authorization),
  },
});
