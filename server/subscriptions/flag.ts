/** Apagado salvo que PATIENT_SUBSCRIPTIONS_ENABLED sea 1, true u on. */
export function subscriptionsEnabled(env: Record<string, string | undefined> = process.env): boolean {
  const raw = env.PATIENT_SUBSCRIPTIONS_ENABLED?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on';
}

/** Lista vacía: todas las nutricionistas, cuando la bandera está prendida. */
export function subscriptionsAllowed(nutritionistId: string, env: Record<string, string | undefined> = process.env): boolean {
  if (!subscriptionsEnabled(env)) return false;
  const list = env.PATIENT_SUBSCRIPTIONS_ALLOWLIST?.split(',').map(item => item.trim()).filter(Boolean) ?? [];
  return list.length === 0 || list.includes(nutritionistId);
}
