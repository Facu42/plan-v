import { safePath, writeOpsLog } from './log.js';

export type OpsAlertKind = 'http_5xx' | 'rate_limit' | 'ready_fail' | 'dead_letter';

export type OpsAlert = {
  kind: OpsAlertKind;
  at: string;
  path?: string;
  status?: number;
  detail?: string;
};

const recent: OpsAlert[] = [];
const MAX_RECENT = 20;

export function resetOpsAlerts() {
  recent.length = 0;
}

export function recentOpsAlerts() {
  return [...recent];
}

export function emitOpsAlert(input: Omit<OpsAlert, 'at'> & { at?: string }) {
  const alert: OpsAlert = {
    kind: input.kind,
    at: input.at ?? new Date().toISOString(),
    path: input.path ? safePath(input.path) : undefined,
    status: input.status,
    detail: input.detail ? input.detail.slice(0, 80) : undefined,
  };
  recent.push(alert);
  if (recent.length > MAX_RECENT) recent.shift();
  writeOpsLog('warn', 'ops_alert', { kind: alert.kind, path: alert.path, status: alert.status });
  void deliverOpsAlert(alert);
  return alert;
}

export async function deliverOpsAlert(alert: OpsAlert, env: Record<string, string | undefined> = process.env) {
  const url = env.ALERT_WEBHOOK_URL?.trim();
  if (!url) return { delivered: false as const };
  if (!/^https:\/\//i.test(url)) return { delivered: false as const };
  const payload = {
    source: 'plan-v',
    kind: alert.kind,
    path: alert.path,
    status: alert.status,
    at: alert.at,
  };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { delivered: response.ok };
}
