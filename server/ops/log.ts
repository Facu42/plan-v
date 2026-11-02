const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const JWT = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
const BEARER = /Bearer\s+\S+/gi;
const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/gi;
const QUERY_TOKEN = /(?:token|signature|key|apikey)=([^&\s]+)/gi;
const PHOTO_PATH = /(?<!\/api\/)patients\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}(?:\/[^\s'"\\]*)?/gi;

export function redactText(value: string) {
  return value
    .replace(BEARER, 'Bearer [redacted]')
    .replace(JWT, '[jwt-redacted]')
    .replace(EMAIL, '[email-redacted]')
    .replace(QUERY_TOKEN, (match, _token) => `${match.slice(0, match.indexOf('=') + 1)}[redacted]`)
    .replace(PHOTO_PATH, '[foto-redacted]')
    .replace(UUID, '[id-redacted]');
}

export function safePath(path: string) {
  return redactText(path.split('?')[0] ?? path);
}

const SECRET_KEY = /authorization|cookie|password|token|body|email|payload|note|photo|clinical/i;

function redactValue(value: unknown): unknown {
  if (typeof value === 'string') return redactText(value);
  if (Array.isArray(value)) return value.map((item) => redactValue(item));
  if (!value || typeof value !== 'object') return value;
  const safe: Record<string, unknown> = {};
  for (const [key, inner] of Object.entries(value)) {
    if (inner == null) continue;
    safe[key] = SECRET_KEY.test(key) ? '[redacted]' : redactValue(inner);
  }
  return safe;
}

export function writeOpsLog(
  level: 'info' | 'warn' | 'error',
  event: string,
  fields: Record<string, unknown> = {},
) {
  const safe = redactValue({ event, ...fields }) as Record<string, unknown>;
  const line = JSON.stringify(safe);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
