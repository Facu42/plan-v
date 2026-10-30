export function billingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return ['1', 'true', 'on'].includes((env.PLATFORM_BILLING_ENABLED ?? '').trim().toLowerCase());
}
