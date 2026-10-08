import { createHash, randomUUID } from 'node:crypto';
import { generateRecipeCoverImage, recipeCoverEnabled, type RecipeCoverContext } from '../ai/recipe-cover.js';
import { getSupabaseAdmin } from '../db/supabase-client.js';
import { persistDemoState } from '../demo/state.js';
import { processQueue } from '../jobs/queue.js';
import type { ProcessingJob } from '../jobs/types.js';
import { getRecipeCard, setRecipeCard } from './presentation.js';
import { logProviderFailure } from '../ai/mode.js';

export function memoryDishKey(nutritionistId: string, context: RecipeCoverContext, versionId?: string | null) {
  return versionId ?? `proposal:${nutritionistId}:${createHash('sha256').update(JSON.stringify(context)).digest('hex')}`;
}
export function proposalCoverContext(recipe: { title: string; steps: string[]; ingredients: Array<{ name: string; quantity: number; unit: string }> }): RecipeCoverContext {
  return { title: recipe.title, steps: recipe.steps, items: recipe.ingredients.map(({ name, quantity, unit }) => ({ name, quantity, unit })) };
}
/** Called only after publication. No patient identifiers, health or notes in the job. */
const enqueueLocks = new Set<string>();
export async function enqueueMemoryDish(nutritionistId: string, context: RecipeCoverContext, versionId?: string | null, retry = false) {
  if (!recipeCoverEnabled()) return;
  const key = memoryDishKey(nutritionistId, context, versionId);
  if (enqueueLocks.has(key)) return;
  enqueueLocks.add(key);
  try {
  const card = getRecipeCard(key, context.title);
  if (card.cover_status === 'ready') {
    if (card.cover_generation !== 'ready') { setRecipeCard(key, { ...card, cover_generation: 'ready' }); persistDemoState(); }
    return;
  }
  const jobs = await processQueue.snapshot();
  if (jobs.some(job => job.kind === 'menu_cover' && job.payload.key === key && ['queued', 'leased'].includes(job.status))) return;
  if (!retry && jobs.some(job => job.kind === 'menu_cover' && job.payload.key === key)) return;
  // Set before awaiting enqueue so repeated meals and double clicks coalesce.
  setRecipeCard(key, { ...card, cover_generation: 'queued' });
  await processQueue.enqueue({ kind: 'menu_cover', payload: { key, context }, max_attempts: 3 });
  persistDemoState();
  } finally { enqueueLocks.delete(key); }
}
export async function handleMemoryDish(job: ProcessingJob) {
  const key = String(job.payload.key ?? '');
  const context = job.payload.context as RecipeCoverContext;
  if (!key || !context?.title || !context.items?.length) throw new Error('dish_cover_payload');
  const card = getRecipeCard(key, context.title);
  if (card.cover_status === 'ready') {
    if (card.cover_generation !== 'ready') { setRecipeCard(key, { ...card, cover_generation: 'ready' }); persistDemoState(); }
    return;
  }
  if (!recipeCoverEnabled()) throw new Error('dish_cover_disabled');
  setRecipeCard(key, { ...card, cover_generation: 'leased' }); persistDemoState();
  const generated = await generateRecipeCoverImage(context);
  const latest = getRecipeCard(key, context.title);
  if (latest.cover_status === 'ready') { setRecipeCard(key, { ...latest, cover_generation: 'ready' }); persistDemoState(); return; } // Preserve a photo uploaded during generation.
  if (generated.status !== 'ready') {
    const pending = job.attempts < job.max_attempts;
    setRecipeCard(key, { ...latest, cover_status: 'failed', cover_generation: pending ? 'queued' : 'failed', cover_url: null });
    throw Object.assign(new Error('dish_cover_unavailable'), { retryAfterMs: generated.retry_after_ms ?? 60_000 });
  }
  setRecipeCard(key, { ...latest, cover_status: 'ready', cover_generation: 'ready', cover_url: `data:${generated.mime};base64,${generated.bytes.toString('base64')}`, cover_alt: generated.alt });
  persistDemoState();
}

let running = false;
/** Durable database queue. Only the worker's service client can lease or finish. */
/** Devuelve verdadero si tomó una foto de plato o ya hay una pasada en curso: así las fotos de ingredientes esperan su turno. */
export async function runPersistentDishCover(): Promise<boolean> {
  if (running) return true;
  if (!recipeCoverEnabled()) return false;
  const db = getSupabaseAdmin(); if (!db) return false;
  running = true;
  let worked = false;
  try {
    const leased = await db.rpc('lease_menu_dish_cover');
    if (leased.error) { logProviderFailure('menu-cover-lease', leased.error); return false; }
    const job = leased.data as null | { id: string; run_token: string; nutritionist_id: string; recipe_version_id: string | null; context: { title: string; steps: string[]; ingredients: RecipeCoverContext['items'] } };
    if (!job) return false;
    worked = true;
    const generated = await generateRecipeCoverImage({ title: job.context.title, steps: job.context.steps, items: job.context.ingredients });
    let url: string | null = null, path: string | null = null;
    const bucket = db.storage.from('recipe-covers');
    if (generated.status === 'ready') {
      const ext = generated.mime === 'image/jpeg' ? 'jpg' : generated.mime === 'image/webp' ? 'webp' : 'png';
      path = `${job.nutritionist_id}/${job.recipe_version_id ?? job.id}/${randomUUID()}.${ext}`;
      const upload = await bucket.upload(path, generated.bytes, { contentType: generated.mime, upsert: false });
      if (!upload.error) url = bucket.getPublicUrl(path).data.publicUrl;
      else logProviderFailure('menu-cover-upload', upload.error);
    }
    const finished = await db.rpc('finish_menu_dish_cover', { target_job: job.id, expected_token: job.run_token,
      result_url: url, result_alt: generated.status === 'ready' ? generated.alt : job.context.title,
      retry_delay_seconds: generated.status === 'failed' ? Math.ceil((generated.retry_after_ms ?? 60_000) / 1000) : 60 });
    if (finished.error) logProviderFailure('menu-cover-finish', finished.error);
    // A fenced/manual replacement may win. Clean only our unreferenced candidate.
    if (path && url && ((!finished.error && finished.data?.cover_url !== url) || ['PT409','22023'].includes(finished.error?.code ?? ''))) {
      const [dishRefs, recipeRefs] = await Promise.all([
        db.from('menu_dish_covers').select('id').eq('url', url),
        db.from('recipe_covers').select('recipe_version_id').eq('url', url),
      ]);
      // A stale/replayed completion can already be referenced. Re-read both
      // tables; transport errors keep the candidate because commit is uncertain.
      if (!dishRefs.error && !recipeRefs.error && dishRefs.data?.length === 0 && recipeRefs.data?.length === 0) {
        const removed = await bucket.remove([path]);
        if (removed.error) logProviderFailure('menu-cover-cleanup', removed.error);
      }
    }
    // Cuota compartida con las fotos de ingredientes: cuenta el intento sin tocar la tabla de platos. Si el contador no existe, no pasa nada.
    try { await db.rpc('record_cover_attempt', { usage_kind: 'dish' }); } catch { /* sin contador no se frena la foto */ }
  } catch (error) { logProviderFailure('menu-cover-worker', error); }
  finally { running = false; }
  return worked;
}
