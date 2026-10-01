import { getConnInfo } from '@hono/node-server/conninfo';
import { isIP } from 'node:net';
import type { Context } from 'hono';

// Railway's public edge supplies X-Real-IP. Enable only for services whose public
// ingress is Railway; arbitrary forwarded chains are never an identity source.
// https://docs.railway.com/networking/public-networking/specs-and-limits
export function clientAddress(c: Context, env: Record<string, string | undefined> = process.env): string {
  if (env.TRUST_PROXY === 'railway' && env.RAILWAY_ENVIRONMENT_ID) {
    const address = c.req.header('X-Real-IP')?.trim();
    if (address && isIP(address)) return address;
  }
  try { return getConnInfo(c).remote.address ?? 'unknown'; }
  catch { return 'unknown'; }
}
