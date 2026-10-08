import { inspectPrivateFile } from '../assets/inspect.js';
import { logProviderFailure } from './mode.js';

export type RecipeCoverContext = { title: string; items: Array<{ name: string; quantity?: number; unit?: string }>; steps?: string[] };
export type RecipeCoverResult =
  | { status: 'ready'; bytes: Buffer; mime: 'image/png' | 'image/jpeg' | 'image/webp'; alt: string }
  /** `blocked`: el proveedor no atendió (clave, permisos o cuota): no es culpa del pedido y no debe gastar intentos. */
  | { status: 'failed'; retry_after_ms?: number; blocked?: true };

// The provider and model are fixed: no paid router or fallback. The account must
// remain on Workers Free, which refuses requests after the daily free quota.
export function recipeCoverEnabled(): boolean {
  return process.env.IMAGE_PROVIDER === 'cloudflare_free' && process.env.CLOUDFLARE_FREE_TIER === '1'
    && /^[a-f0-9]{32}$/i.test(process.env.CLOUDFLARE_ACCOUNT_ID ?? '') && Boolean(process.env.CLOUDFLARE_API_TOKEN?.trim());
}
// FLUX follows English food names more reliably. Translate common culinary
// vocabulary only; retain unfamiliar names and never infer missing ingredients.
export function culinaryEnglish(value: string): string {
  let text = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const words: Record<string, string> = {
    'yogur griego': 'Greek yogurt', 'aceite de oliva': 'olive oil', 'al horno': 'baked',
    'merluza': 'rectangular portion of flaky white fish meat', 'pescado': 'rectangular portion of cooked fish meat',
    'ensalada': 'salad', 'lentejas': 'lentils', 'vegetales': 'vegetables', 'verduras': 'vegetables',
    'tortilla': 'frittata', 'espinaca': 'spinach', 'espinacas': 'spinach', 'huevo': 'egg', 'huevos': 'eggs',
    'pollo': 'chicken', 'papas': 'potatoes', 'papa': 'potato', 'patatas': 'potatoes',
    'arroz': 'rice', 'avena': 'oats', 'tomate': 'tomato', 'tomates': 'tomatoes',
    'zanahoria': 'carrot', 'cebolla': 'onion', 'zapallito': 'zucchini', 'zapallo': 'squash',
    'lechuga': 'lettuce', 'garbanzos': 'chickpeas', 'porotos': 'beans', 'quinoa': 'quinoa',
    'frutas': 'fruit', 'fruta': 'fruit', 'frutos rojos': 'berries', 'banana': 'banana',
    'manzana': 'apple', 'frutillas': 'strawberries', 'yogur': 'yogurt', 'leche': 'milk',
    'queso': 'cheese', 'pan': 'bread', 'integral': 'wholegrain', 'granola': 'granola',
    'sal': 'salt', 'pimienta': 'pepper', 'limon': 'lemon', 'cocidas': 'cooked', 'cocidos': 'cooked',
    'cocida': 'cooked', 'cocido': 'cooked', 'tibio': 'warm', 'hervida': 'boiled',
    'hornear': 'bake', 'cocinar': 'cook', 'servir': 'serve', 'mezclar': 'mix', 'hervir': 'boil',
    'cortar': 'cut', 'agregar': 'add', 'saltear': 'saute', 'lavar': 'wash', 'calentar': 'heat',
    'de': 'of', 'con': 'with', 'y': 'and', 'la': 'the', 'el': 'the', 'las': 'the', 'los': 'the',
  };
  const pattern = new RegExp(`\\b(${Object.keys(words).sort((a,b) => b.length-a.length).join('|')})\\b`, 'g');
  text = text.replace(pattern, word => words[word]);
  return text;
}
// Platos con nombre propio que el diccionario palabra por palabra describe mal («tortilla» no es una frittata).
// Sólo describen la forma del plato: nunca ingredientes, cocción ni recipientes que la receta no declara.
const DISH_PHRASES: Array<[RegExp, string]> = [
  [/\btortilla de (papas?|patatas?)\b/, 'a thick round golden-brown potato omelette, cut into a wedge that shows the soft yellow inside with layers of sliced potato'],
  [/\bmilanesas?\b/, 'a golden breaded cutlet (milanesa)'],
  [/\bempanadas?\b/, 'Argentine empanadas, half-moon pastries with a folded edge'],
  [/\bpure de (papas?|patatas?)\b/, 'smooth mashed potatoes'],
];
/** Plato en inglés: el nombre propio conocido, o el nombre original traducido palabra por palabra. */
function dishPhrase(title: string): string {
  const plain = title.slice(0, 180).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return DISH_PHRASES.find(([pattern]) => pattern.test(plain))?.[1] ?? culinaryEnglish(title.slice(0, 180));
}
// Sólo título e ingredientes: los pasos están en español y confunden al modelo, que dibuja palabras sueltas.
// Pedido sólo en positivo: el modelo no admite negativos y suele dibujar justo lo que se nombra para prohibirlo.
export function recipeCoverPrompt(context: RecipeCoverContext): string {
  return [
    `Professional food photograph of ${dishPhrase(context.title)}.`,
    `The dish is made only of ${context.items.slice(0, 20).map(i => culinaryEnglish(i.name.slice(0, 80))).join(', ')}, all clearly recognizable.`,
    'Served as a single dish on a white ceramic plate or bowl, centered on a warm cream background, soft natural daylight, three-quarter overhead view, square composition, clean and simple.',
  ].join(' ').slice(0, 2048);
}
/** Deja en el registro por qué no hubo foto: solo el motivo y el código HTTP, nunca claves, textos ni imágenes. */
function logCoverFailure(reason: string) { console.error('[ai:cloudflare-cover] sin foto', { reason }); }
export async function generateRecipeCoverImage(context: RecipeCoverContext): Promise<RecipeCoverResult> {
  if (!recipeCoverEnabled()) { logCoverFailure('proveedor_no_configurado'); return { status: 'failed' }; }
  if (!context.title.trim() || !context.items.length) return { status: 'failed' };
  return generateCoverFromPrompt(recipeCoverPrompt(context), `${context.title} · imagen ilustrativa generada con IA`);
}
/**
 * Núcleo compartido por las fotos de platos y de ingredientes: un solo modelo, sin alternativas.
 * El texto de la petición lo arma quien llama; aquí nunca se registran ni textos ni imágenes.
 */
export async function generateCoverFromPrompt(prompt: string, alt: string): Promise<RecipeCoverResult> {
  if (!recipeCoverEnabled()) { logCoverFailure('proveedor_no_configurado'); return { status: 'failed' }; }
  try {
    const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`, {
      method: 'POST', headers: { Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, steps: 4 }), signal: AbortSignal.timeout(60_000), redirect: 'error',
    });
    if (response.status === 429) {
      logCoverFailure('limite_diario');
      const nextDay = new Date(); nextDay.setUTCHours(24, 1, 0, 0);
      return { status: 'failed', retry_after_ms: nextDay.getTime() - Date.now(), blocked: true };
    }
    if (!response.ok) logCoverFailure(`http_${response.status}`);
    if (response.status === 401 || response.status === 403) return { status: 'failed', retry_after_ms: 3_600_000, blocked: true };
    if (!response.ok) return { status: 'failed', retry_after_ms: 60_000 };
    // Bound the streamed body before parsing; never log prompts, images or keys.
    if (Number(response.headers.get('content-length')) > 7_100_000) return { status: 'failed' };
    const reader = response.body?.getReader(); if (!reader) return { status: 'failed' };
    const chunks: Uint8Array[] = []; let size = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; size += value.length; if (size > 7_100_000) { await reader.cancel(); return { status: 'failed' }; } chunks.push(value); }
    const result = JSON.parse(Buffer.concat(chunks).toString('utf8')) as { success?: boolean; result?: { image?: string }; errors?: Array<{ code?: number }> };
    if (!result.success || typeof result.result?.image !== 'string') logCoverFailure('respuesta_sin_imagen');
    if (!result.success || typeof result.result?.image !== 'string') return { status: 'failed', retry_after_ms: 60_000 };
    const bytes = Buffer.from(result.result.image, 'base64');
    if (bytes.length > 5 * 1024 * 1024) return { status: 'failed' };
    const image = inspectPrivateFile('body_progress', bytes, 'image/jpeg');
    if (image.mime === 'application/pdf') return { status: 'failed' };
    return { status: 'ready', bytes: image.bytes, mime: image.mime, alt };
  } catch (error) { logProviderFailure('cloudflare-cover', error); return { status: 'failed', retry_after_ms: 60_000 }; }
}
