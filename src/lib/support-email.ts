const MAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseSupportEmail(raw: string | undefined | null): string | null {
  const value = (raw ?? '').trim();
  if (!value || value.length > 200 || /[\r\n]/.test(value) || !MAIL.test(value)) return null;
  return value;
}

type SupportEnv = { VITE_SUPPORT_EMAIL?: string; SUPPORT_EMAIL?: string };

function readSupportEnv(): SupportEnv {
  const vite = (import.meta as { env?: { VITE_SUPPORT_EMAIL?: string } }).env?.VITE_SUPPORT_EMAIL;
  const server = typeof process !== 'undefined' ? process.env.SUPPORT_EMAIL : undefined;
  return { VITE_SUPPORT_EMAIL: vite, SUPPORT_EMAIL: server };
}

export function supportEmailFromEnv(env: SupportEnv = readSupportEnv()): string | null {
  return parseSupportEmail(env.VITE_SUPPORT_EMAIL) ?? parseSupportEmail(env.SUPPORT_EMAIL);
}

export function supportMailto(email: string, subject: string, body = ''): string {
  const params = new URLSearchParams({ subject });
  if (body) params.set('body', body);
  return `mailto:${email}?${params.toString()}`;
}
