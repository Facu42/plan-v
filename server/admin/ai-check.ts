import { generateText } from 'ai';
import { resolveAiMode } from '../ai/mode.js';
import { getAiModel, resolveAiProvider } from '../ai/provider.js';
import { generateCoverFromPrompt, recipeCoverEnabled, type RecipeCoverResult } from '../ai/recipe-cover.js';
import { CareError } from '../care/errors.js';

export type AiCheckStatus = 'ok' | 'failed' | 'off' | 'demo';
export type AiCheckPart = { status: AiCheckStatus; detail: string; ms: number };
export type AiCheckResult = {
  text: AiCheckPart & { model: string | null };
  image: AiCheckPart & { preview: string | null };
};

/** Cada foto gasta cuota gratuita de Cloudflare: una verificación por tanda alcanza. */
export const AI_CHECK_MIN_INTERVAL_MS = 30_000;
const TEXT_TIMEOUT_MS = 30_000;
const SAMPLE_IMAGE_PROMPT = 'Studio food photograph of cooked lentils, a single ingredient shown on its own. Clean light cream-white background, soft natural daylight, three-quarter overhead view, centered square composition.';
const SAMPLE_IMAGE_ALT = 'Lentejas · imagen de verificación';

export type AiCheckDeps = {
  now: () => number;
  textMode: () => string;
  textModel: () => string | null;
  runText: () => Promise<string>;
  imageEnabled: () => boolean;
  runImage: () => Promise<RecipeCoverResult>;
};

const realDeps: AiCheckDeps = {
  now: () => Date.now(),
  textMode: () => { try { return resolveAiMode(); } catch { return 'disabled'; } },
  textModel: () => resolveAiProvider()?.model ?? null,
  runText: async () => (await generateText({
    model: getAiModel(),
    prompt: 'Respondé solo con la palabra OK.',
    maxOutputTokens: 16,
    abortSignal: AbortSignal.timeout(TEXT_TIMEOUT_MS),
  })).text,
  imageEnabled: recipeCoverEnabled,
  runImage: () => generateCoverFromPrompt(SAMPLE_IMAGE_PROMPT, SAMPLE_IMAGE_ALT),
};

let lastRunAt = 0;

async function timed(run: () => Promise<Omit<AiCheckPart, 'ms'>>, now: () => number): Promise<AiCheckPart> {
  const start = now();
  try {
    return { ...await run(), ms: now() - start };
  } catch {
    return { status: 'failed', detail: 'El proveedor no respondió a tiempo o rechazó el pedido.', ms: now() - start };
  }
}

async function checkText(deps: AiCheckDeps): Promise<AiCheckResult['text']> {
  const model = deps.textModel();
  const mode = deps.textMode();
  if (mode !== 'live') return { status: 'off', detail: 'La IA de texto está apagada en este servidor.', ms: 0, model };
  if (!model) return { status: 'off', detail: 'Falta la clave de OpenRouter o el modelo no es gratuito.', ms: 0, model };
  const part = await timed(async () => {
    const answer = await deps.runText();
    return answer.trim()
      ? { status: 'ok' as const, detail: 'Respondió bien con un modelo gratuito.' }
      : { status: 'failed' as const, detail: 'Respondió vacío. Suele pasar cuando el modelo gratuito está saturado: reintentá en unos minutos.' };
  }, deps.now);
  return { ...part, model };
}

async function checkImage(deps: AiCheckDeps): Promise<AiCheckResult['image']> {
  if (!deps.imageEnabled()) {
    return { status: 'off', detail: 'Faltan variables de Cloudflare en Railway (IMAGE_PROVIDER, CLOUDFLARE_FREE_TIER, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN).', ms: 0, preview: null };
  }
  let preview: string | null = null;
  const part = await timed(async () => {
    const result = await deps.runImage();
    if (result.status === 'ready') {
      preview = `data:${result.mime};base64,${result.bytes.toString('base64')}`;
      return { status: 'ok' as const, detail: 'Generó una foto de ejemplo con Cloudflare.' };
    }
    return {
      status: 'failed' as const,
      detail: result.blocked
        ? 'Cloudflare rechazó la clave o se agotó la cuota gratuita de hoy. Probá de nuevo mañana o revisá el token.'
        : 'Cloudflare no devolvió la foto. Reintentá en un minuto.',
    };
  }, deps.now);
  return { ...part, preview };
}

/** Prueba texto y una foto de ejemplo. No toca cuentas ni datos de pacientes, y no guarda nada. */
export async function runAiCheck(deps: AiCheckDeps = realDeps): Promise<AiCheckResult> {
  const now = deps.now();
  if (now - lastRunAt < AI_CHECK_MIN_INTERVAL_MS) {
    throw new CareError(429, 'Esperá unos segundos antes de volver a verificar.');
  }
  lastRunAt = now;
  const [text, image] = await Promise.all([checkText(deps), checkImage(deps)]);
  return { text, image };
}

export function demoAiCheck(): AiCheckResult {
  const demo = { status: 'demo' as const, detail: 'En modo demo no hay proveedores reales.', ms: 0 };
  return { text: { ...demo, model: null }, image: { ...demo, preview: null } };
}

/** Sólo para pruebas: reinicia el límite entre verificaciones. */
export function resetAiCheckLimit() { lastRunAt = 0; }
