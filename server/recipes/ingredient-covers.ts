import { generateIngredientCoverImage, ingredientCoverKey, isKnownIngredientKey } from '../ai/ingredient-cover.js';
import { recipeCoverEnabled } from '../ai/recipe-cover.js';
import { simulatedIngredientAlt, simulatedIngredientImage } from '../ai/simulated-image.js';
import { allowsSyntheticDemo } from '../config/runtime.js';
import { getSupabaseAdmin } from '../db/supabase-client.js';
import { persistDemoState } from '../demo/state.js';
import { PermanentJobError } from '../jobs/errors.js';
import { processQueue } from '../jobs/queue.js';
import type { ProcessingJob } from '../jobs/types.js';
import type { PatientMealPlan } from '../../src/types/plans.js';
import type { IngredientPhoto } from '../../src/types/recipes.js';
import { getRecipeCard, setRecipeCard } from './presentation.js';

/**
 * Fotos de ingredientes: un catálogo compartido (una foto por ingrediente normalizado). Lo único que sale hacia
 * el proveedor, la cola o el registro es la clave del ingrediente: nunca pacientes, notas ni cantidades.
 */
export type IngredientPhotoLookup = (name: string) => IngredientPhoto;

const DEFAULT_INGREDIENT_LIMIT = 30;
const MAX_INGREDIENT_LIMIT = 200;
const DEFAULT_TOTAL_LIMIT = 100;
const MAX_TOTAL_LIMIT = 1000;
export const MAX_KEYS_PER_PUBLICATION = 60;
const READ_BATCH = 100;
const IDLE_PAUSE_MS = 15_000;
const ERROR_PAUSE_MS = 5 * 60_000;
const LOG_WINDOW_MS = 10 * 60_000;
const QUEUE_BUDGET_MS = 1_500;
const READ_BUDGET_MS = 2_000;
const MAX_JOB_ATTEMPTS = 3;
const DEFAULT_RETRY_MS = 60_000;
const SAFE_HTTPS = /^https:\/\/[A-Za-z0-9.-]+\/storage\/v1\/object\/public\/recipe-covers\/ingredients\/[a-z0-9]+(-[a-z0-9]+)*\.(png|jpg|webp)$/;
const SAFE_DATA = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const MAX_DATA_URL = 7_100_000;
const noPhoto: IngredientPhoto = {};
type Env = Record<string, string | undefined>;

/** Claves únicas del vocabulario curado. Todo lo demás (texto libre, nombres propios) queda afuera: no se encola ni viaja. */
export function ingredientKeysOf(ingredients: ReadonlyArray<{ name: string }>): string[] {
  const keys = ingredients.map(item => typeof item?.name === 'string' ? ingredientCoverKey(item.name) : null);
  return [...new Set(keys.filter((key): key is string => key !== null && isKnownIngredientKey(key)))];
}
function supabaseHost(env: Env): string | null {
  try { return new URL(env.SUPABASE_URL || env.VITE_SUPABASE_URL || '').host || null; } catch { return null; }
}
/**
 * Sólo se muestra: https del propio proyecto de Supabase (mismo host), bucket público y ruta `ingredients/`,
 * o la imagen incrustada de la demostración (nunca en producción).
 */
export function safeIngredientCoverUrl(value: unknown, env: Env = process.env): string | null {
  if (typeof value !== 'string' || value.length > MAX_DATA_URL) return null;
  if (SAFE_DATA.test(value)) return allowsSyntheticDemo(env) ? value : null;
  if (!SAFE_HTTPS.test(value)) return null;
  const host = supabaseHost(env);
  return host && new URL(value).host === host ? value : null;
}
function readLimit(raw: string | undefined, fallback: number, max: number): number {
  return raw === undefined || !/^\d+$/.test(raw.trim()) ? fallback : Math.min(max, Number(raw));
}
/**
 * Topes por día UTC. La cuota gratuita es una sola: los ingredientes usan como máximo la mitad
 * (INGREDIENT_COVERS_DAILY_LIMIT, por omisión 30) del total (IMAGE_DAILY_LIMIT, por omisión 100).
 */
export function ingredientCoverLimits(env: Env = process.env): { ingredient_limit: number; total_limit: number } {
  const total = Math.max(2, readLimit(env.IMAGE_DAILY_LIMIT, DEFAULT_TOTAL_LIMIT, MAX_TOTAL_LIMIT));
  const wanted = readLimit(env.INGREDIENT_COVERS_DAILY_LIMIT, DEFAULT_INGREDIENT_LIMIT, MAX_INGREDIENT_LIMIT);
  return { ingredient_limit: Math.min(wanted, Math.floor(total / 2)), total_limit: total };
}
export const ingredientCoverDailyLimit = (env: Env = process.env) => ingredientCoverLimits(env).ingredient_limit;

const lastLogged = new Map<string, number>();
/** Solo código de error (ej. 42883), nunca nombres, textos, claves ni imágenes. Se repite cada 10 minutos, no una vez y nunca más. */
function logIngredientFailure(scope: string, error?: unknown) {
  const now = Date.now();
  if (now - (lastLogged.get(scope) ?? -Infinity) < LOG_WINDOW_MS) return;
  lastLogged.set(scope, now);
  const code = error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' && /^[A-Za-z0-9_]{1,16}$/.test(error.code) ? error.code : undefined;
  console.error('[ai:ingredient-cover] fallo', { scope, ...(code ? { code } : {}) });
}
/** Espera como mucho `ms`: la publicación y la lectura de la paciente no dependen de las fotos. */
async function withinBudget<T>(work: Promise<T>, ms: number, fallback: T): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const limit = new Promise<T>(resolve => { timer = setTimeout(() => resolve(fallback), ms); });
  try { return await Promise.race([work, limit]); } finally { clearTimeout(timer); }
}
const simulationAllowed = () => process.env.APP_MODE === 'demo';
const memoryId = (key: string) => `ingredient:${key}`;

// ---------------------------------------------------------------- Encolado

type IngredientNames = ReadonlyArray<{ name: string }>;
/**
 * Nunca lanza ni espera más de un instante: una foto que no se pudo reservar no frena la publicación.
 * `source` puede ser una función para que también la lectura del plan (de forma impredecible) quede protegida.
 */
export async function queueIngredientCovers(source: IngredientNames | (() => IngredientNames), options: { persistent: boolean; retry?: boolean }, budgetMs = QUEUE_BUDGET_MS): Promise<void> {
  const work = (async () => {
    try {
      const keys = ingredientKeysOf(typeof source === 'function' ? source() : source).slice(0, MAX_KEYS_PER_PUBLICATION);
      if (!keys.length) return;
      if (options.persistent) await enqueuePersistent(keys, options.retry ?? false);
      else await enqueueMemory(keys, options.retry ?? false);
    } catch (error) { logIngredientFailure('encolado', error); }
  })();
  await withinBudget(work, budgetMs, undefined);
}
async function enqueuePersistent(keys: string[], retry: boolean) {
  if (!recipeCoverEnabled()) return;
  const db = getSupabaseAdmin(); if (!db) return;
  const { error } = await db.rpc('enqueue_ingredient_covers', { keys, retry_failed: retry });
  if (error) logIngredientFailure('encolado', error);
}
const memoryLocks = new Set<string>();
async function enqueueMemory(keys: string[], retry: boolean) {
  if (!recipeCoverEnabled() && !simulationAllowed()) return;
  for (const key of keys) {
    if (memoryLocks.has(key)) continue;
    memoryLocks.add(key);
    try { await enqueueMemoryKey(key, retry); } finally { memoryLocks.delete(key); }
  }
  persistDemoState();
}
async function enqueueMemoryKey(key: string, retry: boolean) {
  const card = getRecipeCard(memoryId(key), key);
  if (card.cover_status === 'ready') return;
  const own = (await processQueue.snapshot()).filter(job => job.kind === 'ingredient_cover' && job.payload.key === key);
  if (own.some(job => ['queued', 'leased'].includes(job.status))) return;
  if (!retry && own.length) return;
  // Se marca antes de esperar a la cola para que el doble clic y los platos repetidos se junten.
  setRecipeCard(memoryId(key), { ...card, cover_generation: 'queued' });
  await processQueue.enqueue({ kind: 'ingredient_cover', payload: { key }, max_attempts: MAX_JOB_ATTEMPTS });
}

// ---------------------------------------------------------------- Demostración (memoria)

function nextUtcDayWaitMs(): number {
  const next = new Date(); next.setUTCHours(24, 1, 0, 0);
  return next.getTime() - Date.now();
}
/** Intentos reales de hoy (día UTC) de las tareas de ingredientes, incluida la que está corriendo. */
async function attemptsToday(): Promise<number> {
  const dayStart = new Date(); dayStart.setUTCHours(0, 0, 0, 0);
  return (await processQueue.snapshot()).filter(job => job.kind === 'ingredient_cover' && Date.parse(job.updated_at) >= dayStart.getTime())
    .reduce((sum, job) => sum + job.attempts, 0);
}
/** Con el proveedor real respeta el tope; sin él (demo) usa la imagen simulada. */
async function memoryImage(key: string) {
  if (!recipeCoverEnabled()) return { status: 'ready' as const, bytes: simulatedIngredientImage(key), mime: 'image/png' as const, alt: simulatedIngredientAlt(key) };
  if (await attemptsToday() > ingredientCoverDailyLimit()) return { status: 'failed' as const, retry_after_ms: nextUtcDayWaitMs(), blocked: true as const };
  return generateIngredientCoverImage(key);
}
export async function handleMemoryIngredient(job: ProcessingJob): Promise<void> {
  const key = String(job.payload.key ?? '');
  if (!isKnownIngredientKey(key)) throw new PermanentJobError('ingredient_key');
  const card = getRecipeCard(memoryId(key), key);
  if (card.cover_status === 'ready') { setRecipeCard(memoryId(key), { ...card, cover_generation: 'ready' }); persistDemoState(); return; }
  if (!recipeCoverEnabled() && !simulationAllowed()) throw new Error('ingredient_cover_disabled');
  setRecipeCard(memoryId(key), { ...card, cover_generation: 'leased' }); persistDemoState();
  const generated = await memoryImage(key);
  if (generated.status !== 'ready') {
    // Caída del proveedor o tope diario: la tarea espera sin gastar intentos (la cola devuelve el intento con «provider_wait»).
    const blocked = 'blocked' in generated && generated.blocked === true;
    const pending = blocked || job.attempts < job.max_attempts;
    setRecipeCard(memoryId(key), { ...card, cover_status: 'failed', cover_generation: pending ? 'queued' : 'failed', cover_url: null });
    throw Object.assign(new Error(blocked ? 'provider_wait' : 'ingredient_cover_unavailable'), { retryAfterMs: generated.retry_after_ms ?? DEFAULT_RETRY_MS });
  }
  setRecipeCard(memoryId(key), { ...card, cover_status: 'ready', cover_generation: 'ready', cover_alt: generated.alt,
    cover_url: `data:${generated.mime};base64,${generated.bytes.toString('base64')}` });
  persistDemoState();
}

// ---------------------------------------------------------------- Trabajo persistente

let running = false;
let pausedUntil = 0;
/** Sólo para pruebas. */
export function resetIngredientCoverWorker() { running = false; pausedUntil = 0; lastLogged.clear(); memoryLocks.clear(); }

/**
 * Una pasada del trabajo: reserva un ingrediente, genera su foto, la sube a `ingredients/<clave>` y cierra
 * con la clave secreta de la reserva. Si no hay trabajo o falla la reserva, descansa antes de volver a preguntar.
 */
export async function runPersistentIngredientCover(): Promise<void> {
  if (running || Date.now() < pausedUntil || !recipeCoverEnabled()) return;
  const db = getSupabaseAdmin(); if (!db) return;
  running = true;
  try {
    const leased = await db.rpc('lease_ingredient_cover', ingredientCoverLimits());
    if (leased.error) { logIngredientFailure('reserva', leased.error); pausedUntil = Date.now() + ERROR_PAUSE_MS; return; }
    const job = leased.data as null | { key: string; run_token: string };
    if (!job) { pausedUntil = Date.now() + IDLE_PAUSE_MS; return; }
    pausedUntil = Math.max(pausedUntil, Date.now() + await generateAndFinish(db, job));
  } catch (error) { logIngredientFailure('trabajo', error); }
  finally { running = false; }
}
/** Devuelve cuánto debe esperar el trabajador: 0, o lo que pida el proveedor si no atendió (clave, permisos o cuota). */
async function generateAndFinish(db: NonNullable<ReturnType<typeof getSupabaseAdmin>>, job: { key: string; run_token: string }): Promise<number> {
  const generated = await generateIngredientCoverImage(job.key);
  const blocked = generated.status === 'failed' && generated.blocked === true;
  let url: string | null = null;
  if (generated.status === 'ready') {
    const extension = generated.mime === 'image/jpeg' ? 'jpg' : generated.mime === 'image/webp' ? 'webp' : 'png';
    const path = `ingredients/${job.key}.${extension}`;
    const bucket = db.storage.from('recipe-covers');
    // Ruta fija por ingrediente: repetir la subida es seguro y no deja archivos huérfanos.
    const upload = await bucket.upload(path, generated.bytes, { contentType: generated.mime, upsert: true });
    if (upload.error) logIngredientFailure('subida', upload.error);
    else url = bucket.getPublicUrl(path).data.publicUrl;
  }
  const waitMs = generated.status === 'failed' ? generated.retry_after_ms ?? DEFAULT_RETRY_MS : 0;
  const finished = await db.rpc('finish_ingredient_cover', {
    target_key: job.key, expected_token: job.run_token, result_url: url,
    result_alt: url && generated.status === 'ready' ? generated.alt : '',
    retry_delay_seconds: generated.status === 'failed' ? Math.ceil(waitMs / 1000) : 60, provider_blocked: blocked,
  });
  if (finished.error) logIngredientFailure('cierre', finished.error);
  return blocked ? waitMs : 0;
}

// ---------------------------------------------------------------- Lectura

/** Fotos listas por nombre de ingrediente. Es presentación opcional: ante cualquier error, la receta se ve igual, sin fotos. */
export async function ingredientPhotoLookup(names: ReadonlyArray<string>, persistent: boolean): Promise<IngredientPhotoLookup> {
  const keys = ingredientKeysOf(names.map(name => ({ name })));
  if (!keys.length) return () => noPhoto;
  const photos = persistent ? await readCatalog(keys) : readMemory(keys);
  return name => { const key = ingredientCoverKey(name); return (key && photos.get(key)) || noPhoto; };
}
function readMemory(keys: string[]): Map<string, IngredientPhoto> {
  const photos = new Map<string, IngredientPhoto>();
  for (const key of keys) {
    const card = getRecipeCard(memoryId(key), key);
    const url = card.cover_status === 'ready' ? safeIngredientCoverUrl(card.cover_url) : null;
    if (url) photos.set(key, { ingredient_cover_url: url, ingredient_cover_alt: card.cover_alt });
  }
  return photos;
}
/** Lee con la clave de servicio, solo las fotos listas de las claves pedidas y en lotes de 100. */
async function readCatalog(keys: string[]): Promise<Map<string, IngredientPhoto>> {
  const photos = new Map<string, IngredientPhoto>();
  const db = getSupabaseAdmin(); if (!db) return photos;
  const reading = (async () => {
    for (let start = 0; start < keys.length; start += READ_BATCH) {
      const { data, error } = await db.from('ingredient_covers').select('key,url,alt').in('key', keys.slice(start, start + READ_BATCH)).eq('status', 'ready');
      if (error) throw error;
      for (const row of (data ?? []) as Array<{ key: string; url: unknown; alt: unknown }>) {
        const url = safeIngredientCoverUrl(row.url);
        if (url && typeof row.key === 'string') photos.set(row.key, { ingredient_cover_url: url, ingredient_cover_alt: typeof row.alt === 'string' ? row.alt : '' });
      }
    }
  })();
  try { await withinBudget(reading, READ_BUDGET_MS, undefined); }
  catch (error) { logIngredientFailure('lectura', error); } // Es presentación opcional: la receta se ve igual, sin fotos.
  return photos;
}
/** Copia de la lista de ingredientes con la foto de cada uno cuando existe; no modifica el original. */
export function withIngredientPhotos<T extends { name: string }>(ingredients: ReadonlyArray<T>, lookup: IngredientPhotoLookup): Array<T & IngredientPhoto> {
  return ingredients.map(ingredient => {
    if (typeof ingredient?.name !== 'string') return ingredient;
    const photo = lookup(ingredient.name);
    // La descripción lleva el nombre tal como lo escribió la nutricionista (con sus tildes).
    return { ...ingredient, ...photo, ...(photo.ingredient_cover_alt ? { ingredient_cover_alt: photo.ingredient_cover_alt.replace(/^.*? · /, `${ingredient.name} · `) } : {}) };
  });
}

const namesOf = (list: unknown): Array<{ name: string }> => Array.isArray(list) ? list.filter((item): item is { name: string } => typeof item?.name === 'string') : [];
/** Recetas asignadas a la paciente con la foto de cada ingrediente (si existe). Ante cualquier error devuelve las recetas sin fotos. */
export async function patientRecipesWithPhotos<T extends { ingredients: ReadonlyArray<{ name: string }> }>(recipes: ReadonlyArray<T>, persistent: boolean): Promise<Array<T>> {
  try {
    const lookup = await ingredientPhotoLookup(recipes.flatMap(recipe => namesOf(recipe?.ingredients).map(({ name }) => name)), persistent);
    return recipes.map(recipe => withPhotosIfList(recipe, lookup));
  } catch (error) { logIngredientFailure('lectura', error); return [...recipes]; }
}
export type IngredientSource = { recipe?: { ingredients: ReadonlyArray<{ name: string }> } | null; recipe_proposal?: { ingredients: ReadonlyArray<{ name: string }> } | null };
const itemIngredients = (item: IngredientSource | null | undefined) => [...namesOf(item?.recipe?.ingredients), ...namesOf(item?.recipe_proposal?.ingredients)];
function withPhotosIfList<T extends { ingredients: ReadonlyArray<{ name: string }> }>(recipe: T, lookup: IngredientPhotoLookup): T {
  return Array.isArray(recipe?.ingredients) ? { ...recipe, ingredients: withIngredientPhotos(recipe.ingredients, lookup) } : recipe;
}
/** Plan publicado de la paciente con la foto de cada ingrediente. Ante cualquier error o forma rara devuelve el mismo plan sin fotos. */
export async function patientPlanWithPhotos(plan: PatientMealPlan | null, persistent: boolean): Promise<PatientMealPlan | null> {
  if (!plan || !Array.isArray(plan.items)) return plan;
  try {
    const lookup = await ingredientPhotoLookup(plan.items.flatMap(item => itemIngredients(item).map(({ name }) => name)), persistent);
    const items = plan.items.map(item => !item ? item : ({
      ...item,
      ...(item.recipe ? { recipe: withPhotosIfList(item.recipe, lookup) } : {}),
      ...(item.recipe_proposal ? { recipe_proposal: withPhotosIfList(item.recipe_proposal, lookup) } : {}),
    }));
    return { ...plan, items };
  } catch (error) { logIngredientFailure('lectura', error); return plan; }
}
/** Ingredientes de las recetas y platos de una versión publicada, para reservar sus fotos. Tolera formas raras. */
export function planVersionIngredients(version: { items: ReadonlyArray<IngredientSource> } | null | undefined): Array<{ name: string }> {
  return Array.isArray(version?.items) ? version.items.flatMap(itemIngredients) : [];
}
