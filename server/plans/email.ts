import { getAuthAccount, getRequestDb, privilegedDb } from '../db/supabase-client.js';
import { mailTransportConfig, sendOperationalMail } from '../mail/transport.js';
import { stableUuid } from '../mail/brevo.js';
import { siteUrl } from '../admin/accounts.js';
import { CareError } from '../care/errors.js';
import { getProfessionalMealPlan, mealPlanDbError } from './repository.js';

type Recipient = { email: string; userId: string };
export type PlanEmailDeps = {
  recipient(owner: string, patient: string): Promise<Recipient | null>;
  claim(id: string, version: number): Promise<{ token: string | null; state: string }>;
  finish(token: string, state: 'accepted' | 'uncertain'): Promise<void>;
  send: typeof sendOperationalMail;
};
async function recipient(owner: string, patient: string): Promise<Recipient | null> {
  const db = privilegedDb();
  const eligible = await db.rpc('ops_email_eligible_patients', { p_nutritionist: owner });
  mealPlanDbError(eligible.error);
  if (!Array.isArray(eligible.data) || !eligible.data.includes(patient)) return null;
  const row = await db.from('patients').select('user_id').eq('id', patient).eq('nutritionist_id', owner).maybeSingle();
  mealPlanDbError(row.error);
  if (!row.data?.user_id) return null;
  const account = await getAuthAccount(row.data.user_id);
  if (!account?.email || !account.emailConfirmed) return null;
  return { email: account.email, userId: row.data.user_id };
}
const defaultDeps: PlanEmailDeps = {
  recipient,
  async claim(id, version) {
    const result = await getRequestDb().rpc('claim_meal_plan_email', { target_plan: id, expected_version: version });
    mealPlanDbError(result.error); return result.data;
  },
  async finish(token, state) {
    const result = await privilegedDb().rpc('finish_meal_plan_email', { p_token: token, p_state: state });
    mealPlanDbError(result.error);
  },
  send: sendOperationalMail,
};

/** Authenticated link only: no clinical text or public/share tokens in mail. Never publishes. */
export async function emailMealPlan(owner: string, patientId: string, id: string, version: number, persistent: boolean, deps = defaultDeps) {
  if (!persistent) throw new CareError(503, 'La demo no envía correos. No se mandó ningún mail.');
  const config = mailTransportConfig(), site = siteUrl();
  if (!config || !site) throw new CareError(503, 'El correo no está configurado. No se mandó ningún mail.');
  const current = await getProfessionalMealPlan(owner, patientId, true);
  if (current?.id !== id || current.published?.version !== version) throw new CareError(409, 'Primero publicá el plan. El correo comparte solo la versión vigente y no publica el borrador.');
  const to = await deps.recipient(owner, patientId);
  if (!to) throw new CareError(422, 'La paciente no tiene un mail confirmado o no habilitó los correos. No se mandó ningún mail.');
  const claim = await deps.claim(id, version);
  if (!claim.token) {
    if (claim.state === 'accepted') return { status: 'already_accepted' as const };
    throw new CareError(409, 'Este envío ya está en curso o requiere revisión. No se repetirá para evitar duplicados.');
  }
  const token = claim.token;
  const canSend = async () => {
    const recipient = await deps.recipient(owner, patientId);
    const plan = await getProfessionalMealPlan(owner, patientId, true);
    return recipient?.email === to.email && recipient?.userId === to.userId && plan?.id === id && plan.published?.version === version;
  };
  const link = `${site}/app/plan`;
  try {
    await deps.send(config, {
      to: { email: to.email }, subject: 'Tu plan en Plan V',
      text: `Tu nutricionista compartió el acceso a tu plan publicado. Entrá con tu cuenta para verlo. Este enlace muestra la versión vigente; no incluye un PDF adjunto.\n\n${link}\n`,
      html: `<div style="font-family:Inter,Arial,sans-serif"><p>Tu nutricionista compartió el acceso a tu plan publicado.</p><p>Entrá con tu cuenta para verlo. El enlace muestra la versión vigente; no incluye un PDF adjunto.</p><p><a href="${link}">Ver mi plan</a></p></div>`,
      idempotencyKey: stableUuid(`plan-email:${id}:${version}`),
    }, canSend);
  } catch {
    await deps.finish(token, 'uncertain');
    throw new CareError(503, 'No se pudo confirmar el envío. Requiere revisión y no se repetirá automáticamente.');
  }
  await deps.finish(token, 'accepted');
  return { status: 'accepted' as const };
}
