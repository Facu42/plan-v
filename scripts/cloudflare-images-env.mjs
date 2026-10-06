import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { homedir } from 'node:os';

/** Local credentials stay outside Git/OneDrive and are passed only to the API. */
export async function localCloudflareImagesEnv(base = process.env) {
  const file = resolve(base.LOCALAPPDATA || resolve(homedir(), '.local/share'), 'PlanV', 'cloudflare-images.env');
  let text; try { text = await readFile(file, 'utf8'); } catch (error) { if (error.code === 'ENOENT') return {}; throw error; }
  const values = Object.fromEntries(text.split(/\r?\n/).filter(line => line.includes('=') && !line.trim().startsWith('#')).map(line => {
    const i = line.indexOf('='); return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  }));
  if (!values.CLOUDFLARE_ACCOUNT_ID && !values.CLOUDFLARE_API_TOKEN) return {};
  if (!/^[a-f0-9]{32}$/i.test(values.CLOUDFLARE_ACCOUNT_ID ?? '') || !values.CLOUDFLARE_API_TOKEN || /\s/.test(values.CLOUDFLARE_API_TOKEN)) throw new Error('Revisá los dos valores del archivo local de Cloudflare.');
  return { IMAGE_PROVIDER: 'cloudflare_free', CLOUDFLARE_FREE_TIER: '1', CLOUDFLARE_ACCOUNT_ID: values.CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN: values.CLOUDFLARE_API_TOKEN };
}
