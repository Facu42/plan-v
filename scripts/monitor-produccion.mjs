// Monitor gratis de producción: lo corre GitHub Actions cada 15 minutos (.github/workflows/monitor.yml).
// Solo lee las direcciones públicas; no usa claves ni toca la base.
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const TIMEOUT_MS = 15_000;

export const TARGETS = [
  {
    name: 'API (Railway)',
    url: 'https://api-production-aad6.up.railway.app/api/health',
    healthy(body) {
      let data;
      try { data = JSON.parse(body); } catch { return 'no devolvió el estado esperado'; }
      if (data?.status !== 'ok') return 'no devolvió el estado esperado';
      return data.supabase === true ? null : 'responde sin la base de datos conectada';
    },
  },
  { name: 'Web (Vercel)', url: 'https://plan-v-eight.vercel.app/', healthy: () => null },
];

export async function checkTarget(target, fetcher = fetch) {
  let res;
  try {
    res = await fetcher(target.url, { signal: AbortSignal.timeout(TIMEOUT_MS), headers: { 'user-agent': 'plan-v-monitor' } });
  } catch (error) {
    return { ok: false, reason: `no respondió (${error instanceof Error ? error.message : 'error'})` };
  }
  if (!res.ok) return { ok: false, reason: `respondió ${res.status}` };
  const problem = target.healthy(await res.text());
  return problem ? { ok: false, reason: problem } : { ok: true };
}

export async function runMonitor({ targets = TARGETS, fetcher = fetch, attempts = 3, waitMs = 20_000 } = {}) {
  const failures = [];
  for (const target of targets) {
    let result;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      result = await checkTarget(target, fetcher);
      if (result.ok) break;
      if (attempt < attempts && waitMs > 0) await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    if (!result.ok) failures.push({ name: target.name, url: target.url, reason: result.reason });
  }
  return { ok: failures.length === 0, failures };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const result = await runMonitor();
  const summary = result.ok
    ? 'Todo responde bien.'
    : result.failures.map((item) => `- **${item.name}** ${item.reason} (${item.url})`).join('\n');
  console.log(summary);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `ok=${result.ok}\nsummary<<FIN\n${summary}\nFIN\n`);
  }
}
