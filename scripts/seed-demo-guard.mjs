/** NV-SEED fail-closed guard. No SQL runs unless this returns ok. */

export const PLAN_V_APP_REF = 'wvosvlxpfytokwfbcero';
export const SEED_CONFIRM = 'I_UNDERSTAND_SYNTHETIC_EMPTY';

export const SYNTHETIC_ROSTER = {
  nutritionist: {
    displayName: 'Verónica Demo',
    email: 'veronica.demo@planv.test',
  },
  patients: [
    { fullName: 'Sofía Demo', email: 'sofia.demo@planv.test' },
    { fullName: 'Marina Demo', email: 'marina.demo@planv.test' },
    { fullName: 'Luca Demo', email: 'luca.demo@planv.test' },
    { fullName: 'Elena Demo', email: 'elena.demo@planv.test' },
  ],
};

export function decideSeedApply({ databaseUrl, confirm, appMode, patientCount }) {
  if (appMode === 'production') return { ok: false, reason: 'production' };
  if (confirm !== SEED_CONFIRM) return { ok: false, reason: 'confirm' };
  if (!databaseUrl || typeof databaseUrl !== 'string') return { ok: false, reason: 'url' };
  const lower = databaseUrl.toLowerCase();
  if (lower.includes(PLAN_V_APP_REF) || lower.includes('supabase.co') || lower.includes('supabase.com')) {
    return { ok: false, reason: 'hosted' };
  }
  let host = '';
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    return { ok: false, reason: 'url' };
  }
  if (host !== '127.0.0.1' && host !== 'localhost') return { ok: false, reason: 'host' };
  if (patientCount == null || !Number.isFinite(patientCount)) return { ok: false, reason: 'unverified' };
  if (patientCount > 0) return { ok: false, reason: 'patients' };
  return { ok: true, reason: 'empty' };
}
