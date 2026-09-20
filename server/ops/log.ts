const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const BEARER = /Bearer\s+\S+/gi;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
const QUERY_TOKEN = /(?:token|signature|key|apikey)=([^&\s]+)/gi;

export function redactText(value: string) {
  return value
    .replace(BEARER, 'Bearer [redacted]')
    .replace(JWT, '[jwt-redacted]')
    .replace(EMAIL, '[email-redacted]')
    .replace(QUERY_TOKEN, (match, _token) => `${match.slice(0, match.indexOf('=') + 1)}[redacted]`)
    .replace(UUID, '[id-redacted]');
}

export function safePath(path: string) {
  return redactText(path.split('?')[0] ?? path);
}

export function writeOpsLog(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
) {
  const safe: Record<string, unknown> = { event };
  for (const [key, value] of Object.entries(fields)) {
    if (value == null) continue;
    if (/authorization|cookie|password|token|body|email|payload/i.test(key)) {
      safe[key] = '[redacted]';
      continue;
    }
    safe[key] = typeof value === 'string' ? redactText(value) : value;
  }
  const line = JSON.stringify(safe);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
