import { randomUUID } from 'node:crypto';
import type { ProfessionalRecipe } from '../../src/types/recipes.js';
import { inspectPrivateFile, parseDataUrl } from '../assets/inspect.js';
import { getRequestDb, privilegedDb } from '../db/supabase-client.js';
import { CareError } from '../care/errors.js';
import { listProfessionalRecipes, recipeDbError } from './repository.js';
import { getRecipeCard, setRecipeCard } from './presentation.js';
import { logProviderFailure } from '../ai/mode.js';

export const MANUAL_COVER_LIMIT = 5 * 1024 * 1024;
const BUCKET = 'recipe-covers';

async function publishedVersion(nutritionistId: string, recipeId: string, expectedVersion: number, persistent: boolean) {
  const recipe = (await listProfessionalRecipes(nutritionistId, persistent)).find((row) => row.id === recipeId);
  if (!recipe || recipe.status === 'archived') throw new CareError(403, 'No tenés permiso para esta receta.');
  if (!recipe.published || recipe.published.version !== expectedVersion) {
    throw new CareError(409, 'La receta cambió. Volvé a abrir la revisión publicada antes de subir la foto.');
  }
  return { recipe, version: recipe.published };
}

/** Sólo se limpia el candidato de esta petición y si ninguna portada lo referencia. */
async function inspectCandidate(versionId: string, path: string, url: string): Promise<'confirmed' | 'unconfirmed'> {
  try {
    const admin = privilegedDb();
    const { data, error } = await admin.from('recipe_covers').select('recipe_version_id,status').eq('url', url);
    if (error || !data) return 'unconfirmed';
    if (data.some((row) => row.recipe_version_id === versionId && row.status === 'ready')) return 'confirmed';
    if (data.length === 0) {
      const removed = await admin.storage.from(BUCKET).remove([path]);
      if (removed.error) logProviderFailure('manual-cover-cleanup', removed.error);
    }
  } catch (error) { logProviderFailure('manual-cover-cleanup', error); }
  // Ante incertidumbre se conserva el candidato: jamás se elimina una foto referenciada.
  return 'unconfirmed';
}

export async function saveManualRecipeCover(
  nutritionistId: string, recipeId: string, expectedVersion: number,
  expectedCoverUrl: string | null, dataUrl: string, persistent: boolean,
): Promise<ProfessionalRecipe> {
  const { recipe, version } = await publishedVersion(nutritionistId, recipeId, expectedVersion, persistent);
  if ((version.card?.cover_url ?? null) !== expectedCoverUrl) throw new CareError(409, 'La foto cambió. Recargá la receta antes de reemplazarla.');
  const raw = parseDataUrl(dataUrl);
  if (raw.bytes.length > MANUAL_COVER_LIMIT) throw new CareError(413, 'La foto debe pesar como máximo 5 MB.');
  // Reutiliza detección de bytes, límites de píxeles y retiro de metadatos.
  const inspected = inspectPrivateFile('body_progress', raw.bytes, raw.mime);
  if (inspected.mime === 'application/pdf') throw new CareError(415, 'Usá una foto JPG, PNG o WebP.');
  if (!persistent) {
    const latest = await publishedVersion(nutritionistId, recipeId, expectedVersion, false);
    const card = getRecipeCard(latest.version.id, latest.recipe.title);
    if ((card.cover_url ?? null) !== expectedCoverUrl) throw new CareError(409, 'La foto cambió. Recargá la receta.');
    setRecipeCard(latest.version.id, { ...card, cover_status: 'ready', cover_url: `data:${inspected.mime};base64,${inspected.bytes.toString('base64')}`, cover_alt: recipe.title });
    return (await publishedVersion(nutritionistId, recipeId, expectedVersion, false)).recipe;
  }
  const extension = inspected.mime === 'image/jpeg' ? 'jpg' : inspected.mime === 'image/webp' ? 'webp' : 'png';
  const path = `${nutritionistId}/${version.id}/${randomUUID()}.${extension}`;
  const db = getRequestDb();
  const bucket = db.storage.from(BUCKET);
  const { error: uploadError } = await bucket.upload(path, inspected.bytes, { contentType: inspected.mime, upsert: false });
  if (uploadError) throw new CareError(503, 'No se pudo guardar la foto. La portada anterior se conserva.');
  const url = bucket.getPublicUrl(path).data.publicUrl;
  try {
    const { data, error } = await db.rpc('save_manual_recipe_cover', {
      target_recipe: recipeId, expected_version: expectedVersion, expected_cover_url: expectedCoverUrl, cover_url: url,
    });
    recipeDbError(error);
    if (!data || data.cover_status !== 'ready' || data.cover_url !== url) throw new CareError(503, 'No se pudo confirmar la foto guardada.');
  } catch (error) {
    if (await inspectCandidate(version.id, path, url) !== 'confirmed') throw error;
  }
  // Verificación de lectura: un guardado incierto no se presenta como éxito.
  const refreshed = (await listProfessionalRecipes(nutritionistId, true)).find((row) => row.id === recipe.id);
  if (!refreshed) throw new CareError(503, 'No se pudo volver a leer la receta. Recargala para comprobar la foto.');
  return refreshed;
}
