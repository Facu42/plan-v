import type { Context, Next } from 'hono';
import {
  verifyAuthToken as verifySupabaseAuthToken,
  isSupabaseEnabled as supabaseIsEnabled,
  createActorClient,
  bindActorClient,
  getRequestDb,
} from '../db/supabase-client.js';
import { allowsSyntheticDemo } from '../config/runtime.js';
import { resolveRequestAuth } from '../security/contracts.js';
import { isAdminProtectedPath, isMfaExemptPath, isPreMfaProfessionalPath, MFA_REQUIRED_MESSAGE, mfaEnforced, tokenAal } from '../security/mfa.js';
import { sbGetActor, sbGetProfileRole } from '../db/supabase-repo.js';
import { isAdmin } from '../admin/repository.js';

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
  /** Si hay que exigir el segundo paso, y si la cuenta es de nutricionista o administradora. */
  mfa?: {
    enforced: () => boolean;
    needsSecondStep: (userId: string) => Promise<boolean>;
    allowProfessionalBootstrap?: (userId: string, path: string) => Promise<boolean>;
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
          const aal = tokenAal(c.req.header('Authorization'));
          if (isAdminProtectedPath(c.req.path) && aal !== 'aal2') {
            return c.json({ error: MFA_REQUIRED_MESSAGE, code: 'mfa_required' }, 403);
          }
          if (mfa?.enforced() && !isMfaExemptPath(c.req.path) && aal !== 'aal2'
            && await mfa.needsSecondStep(decision.userId)) {
            const bootstrap = isPreMfaProfessionalPath(c.req.path)
              && await mfa.allowProfessionalBootstrap?.(decision.userId, c.req.path);
            if (!bootstrap) return c.json({ error: MFA_REQUIRED_MESSAGE, code: 'mfa_required' }, 403);
            c.set('preMfaProfessional', true);
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
    allowProfessionalBootstrap: (userId, path) => allowPreMfaProfessionalBootstrap(userId, path, {
      getRole: sbGetProfileRole,
      getActor: sbGetActor,
      hasPatients: async (nutritionistId) => {
        const result = await getRequestDb().from('patients').select('id').eq('nutritionist_id', nutritionistId).limit(1);
        return Boolean(result.error) || (result.data?.length ?? 0) > 0;
      },
    }),
  },
});
