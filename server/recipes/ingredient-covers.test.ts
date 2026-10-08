import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ generate: vi.fn(), enabled: vi.fn(), db: null as any, requestDb: null as any }));
vi.mock('../ai/recipe-cover.js', async importOriginal => ({ ...await importOriginal<typeof import('../ai/recipe-cover.js')>(), recipeCoverEnabled: mocks.enabled }));
vi.mock('../ai/ingredient-cover.js', async importOriginal => ({ ...await importOriginal<typeof import('../ai/ingredient-cover.js')>(), generateIngredientCoverImage: mocks.generate }));
vi.mock('../db/supabase-client.js', () => ({ getSupabaseAdmin: () => mocks.db, getRequestDb: () => mocks.requestDb }));
import { processQueue, resetProcessQueue, runOne } from '../jobs/queue.js';
import { handleProcessingJob } from '../jobs/handlers.js';
import { getRecipeCard, resetRecipeCards } from './presentation.js';
import { INGREDIENT_NOUNS } from '../ai/ingredient-vocabulary.js';
import {
  handleMemoryIngredient, ingredientCoverDailyLimit, ingredientCoverLimits, ingredientKeysOf, ingredientPhotoLookup, MAX_KEYS_PER_PUBLICATION,
  patientPlanWithPhotos, patientRecipesWithPhotos, planVersionIngredients, queueIngredientCovers,
  resetIngredientCoverWorker, runPersistentIngredientCover, safeIngredientCoverUrl, withIngredientPhotos,
} from './ingredient-covers.js';

const readyImage = { status: 'ready', bytes: Buffer.from('synthetic-only'), mime: 'image/jpeg', alt: 'Tomate · imagen ilustrativa generada con IA' };
const names = (list: string[]) => list.map(name => ({ name }));
const jobs = async () => (await processQueue.snapshot()).filter(job => job.kind === 'ingredient_cover');

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  resetProcessQueue(); resetRecipeCards(); resetIngredientCoverWorker(); vi.resetAllMocks();
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  mocks.enabled.mockReturnValue(true); mocks.generate.mockResolvedValue(readyImage); mocks.db = null; mocks.requestDb = null;
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); errorSpy.mockRestore(); });

describe('claves y direcciones', () => {
  it('junta claves únicas del vocabulario conocido y descarta todo lo demás', () => {
    expect(ingredientKeysOf(names(['Tomate', 'tomates', '200 g de tomate', 'Cebolla', '!!!', '', 'Receta secreta de Sofía', 'Juan Pérez', 'Pollo con la receta de la abuela']))).toEqual(['tomate', 'cebolla']);
  });

  const supabase = 'https://abc.supabase.co/storage/v1/object/public/recipe-covers/ingredients';
  it.each([
    [`${supabase}/tomate.jpg`, true],
    [`${supabase}/aceite-de-oliva.webp`, true],
    ['data:image/png;base64,iVBORw0KGgo=', true],
    ['data:image/jpeg;base64,/9j/4AAQ', true],
    ['data:image/gif;base64,R0lGODlh', false],
    ['https://otro-proyecto.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.jpg', false],
    ['https://abc.supabase.co.evil.example/storage/v1/object/public/recipe-covers/ingredients/tomate.jpg', false],
    ['http://abc.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.jpg', false],
    ['https://abc.supabase.co/storage/v1/object/public/recipe-covers/otra/tomate.jpg', false],
    [`${supabase}/tomate.svg`, false],
    ['https://evil.example/ingredients/tomate.jpg', false],
    ['data:image/svg+xml;base64,PHN2Zz4=', false],
    ['data:text/html;base64,PGgxPg==', false],
    ['javascript:alert(1)', false],
    ['', false], [null, false], [42, false],
  ])('«%s» seguro: %s', (value, safe) => {
    vi.stubEnv('SUPABASE_URL', 'https://abc.supabase.co');
    expect(safeIngredientCoverUrl(value)).toBe(safe ? value : null);
  });

  it('el host de la dirección debe ser el de SUPABASE_URL: sin esa configuración no se acepta ninguna https', () => {
    vi.stubEnv('SUPABASE_URL', ''); vi.stubEnv('VITE_SUPABASE_URL', '');
    expect(safeIngredientCoverUrl(`${supabase}/tomate.jpg`)).toBeNull();
    vi.stubEnv('VITE_SUPABASE_URL', 'https://abc.supabase.co');
    expect(safeIngredientCoverUrl(`${supabase}/tomate.jpg`)).toBe(`${supabase}/tomate.jpg`);
  });

  it('la imagen incrustada sólo vale en la demostración, nunca en producción', () => {
    vi.stubEnv('APP_MODE', 'production');
    expect(safeIngredientCoverUrl('data:image/png;base64,iVBORw0KGgo=')).toBeNull();
    vi.stubEnv('APP_MODE', 'demo');
    expect(safeIngredientCoverUrl('data:image/png;base64,iVBORw0KGgo=')).toBe('data:image/png;base64,iVBORw0KGgo=');
  });

  it('el tope diario de ingredientes nunca pasa de la mitad de la cuota total', () => {
    expect(ingredientCoverLimits({})).toEqual({ ingredient_limit: 30, total_limit: 100 });
    expect(ingredientCoverLimits({ INGREDIENT_COVERS_DAILY_LIMIT: '12' })).toEqual({ ingredient_limit: 12, total_limit: 100 });
    expect(ingredientCoverLimits({ INGREDIENT_COVERS_DAILY_LIMIT: '99999' })).toEqual({ ingredient_limit: 50, total_limit: 100 });
    expect(ingredientCoverLimits({ IMAGE_DAILY_LIMIT: '40' })).toEqual({ ingredient_limit: 20, total_limit: 40 });
    expect(ingredientCoverLimits({ IMAGE_DAILY_LIMIT: '10', INGREDIENT_COVERS_DAILY_LIMIT: '30' })).toEqual({ ingredient_limit: 5, total_limit: 10 });
    expect(ingredientCoverLimits({ INGREDIENT_COVERS_DAILY_LIMIT: '0' }).ingredient_limit).toBe(0);
    for (const bad of ['-3', 'abc', '']) expect(ingredientCoverLimits({ INGREDIENT_COVERS_DAILY_LIMIT: bad, IMAGE_DAILY_LIMIT: bad })).toEqual({ ingredient_limit: 30, total_limit: 100 });
    expect(ingredientCoverDailyLimit({ INGREDIENT_COVERS_DAILY_LIMIT: '7' })).toBe(7);
  });
});

describe('demostración en memoria', () => {
  it('sin proveedor y fuera de la demo no encola nada', async () => {
    mocks.enabled.mockReturnValue(false);
    await queueIngredientCovers(names(['Tomate']), { persistent: false });
    expect(await jobs()).toHaveLength(0);
  });

  it('encola una tarea por ingrediente único con sólo la clave, y es idempotente aun con doble clic', async () => {
    const list = names(['Tomate', 'tomates', 'Cebolla', '100 g de cebolla']);
    await Promise.all(Array.from({ length: 6 }, () => queueIngredientCovers(list, { persistent: false })));
    await queueIngredientCovers(list, { persistent: false });
    const queued = await jobs();
    expect(queued.map(job => job.payload)).toEqual([{ key: 'tomate' }, { key: 'cebolla' }]);
    expect(queued.every(job => job.max_attempts === 3)).toBe(true);
    expect(getRecipeCard('ingredient:tomate', 'tomate').cover_generation).toBe('queued');
  });

  it('genera una vez, guarda la foto y no vuelve a encolar un ingrediente listo', async () => {
    await queueIngredientCovers(names(['Tomate']), { persistent: false });
    const done = await runOne(processQueue, 'worker', handleProcessingJob);
    expect(done?.status).toBe('succeeded');
    expect(mocks.generate).toHaveBeenCalledOnce();
    expect(mocks.generate).toHaveBeenCalledWith('tomate');
    const card = getRecipeCard('ingredient:tomate', 'tomate');
    expect(card).toMatchObject({ cover_status: 'ready', cover_generation: 'ready', cover_alt: readyImage.alt });
    expect(card.cover_url).toMatch(/^data:image\/jpeg;base64,/);
    await queueIngredientCovers(names(['Tomate']), { persistent: false });
    await queueIngredientCovers(names(['Tomate']), { persistent: false, retry: true });
    expect(await jobs()).toHaveLength(1);
  });

  it('en la demo sin Cloudflare usa la imagen simulada, sin llamar al proveedor', async () => {
    mocks.enabled.mockReturnValue(false); vi.stubEnv('APP_MODE', 'demo');
    await queueIngredientCovers(names(['Zanahoria']), { persistent: false });
    await runOne(processQueue, 'worker', handleProcessingJob);
    expect(mocks.generate).not.toHaveBeenCalled();
    const card = getRecipeCard('ingredient:zanahoria', 'zanahoria');
    expect(card).toMatchObject({ cover_status: 'ready' });
    expect(card.cover_url).toMatch(/^data:image\/png;base64,/);
    expect(card.cover_alt).toContain('simulada');
  });

  it('un fallo con cuota agotada espera al día siguiente y conserva el ingrediente pendiente', async () => {
    mocks.generate.mockResolvedValueOnce({ status: 'failed', retry_after_ms: 86_400_000 });
    await queueIngredientCovers(names(['Tomate']), { persistent: false });
    const done = await runOne(processQueue, 'worker', handleProcessingJob);
    expect(done?.status).toBe('queued');
    expect(Date.parse(done!.run_after) - Date.now()).toBeGreaterThan(86_300_000);
    expect(getRecipeCard('ingredient:tomate', 'tomate')).toMatchObject({ cover_generation: 'queued', cover_url: null });
  });

  it('tras tres intentos fallidos queda en fallo y sólo el reintento explícito lo reabre', async () => {
    mocks.generate.mockResolvedValue({ status: 'failed', retry_after_ms: 60_000 });
    await queueIngredientCovers(names(['Tomate']), { persistent: false });
    for (let i = 0; i < 3; i += 1) {
      const [job] = await jobs(); await processQueue.replaceAll([{ ...job, run_after: new Date(0).toISOString() }]);
      await runOne(processQueue, 'worker', handleProcessingJob);
    }
    expect((await jobs())[0].status).toBe('dead');
    expect(getRecipeCard('ingredient:tomate', 'tomate').cover_generation).toBe('failed');
    await queueIngredientCovers(names(['Tomate']), { persistent: false });
    expect(await jobs()).toHaveLength(1);
    await queueIngredientCovers(names(['Tomate']), { persistent: false, retry: true });
    expect(await jobs()).toHaveLength(2);
  });

  it('el tope cuenta intentos, no filas: la misma clave que falla varias veces el mismo día se corta, sin gastar intentos del aplazo', async () => {
    vi.stubEnv('INGREDIENT_COVERS_DAILY_LIMIT', '2');
    mocks.generate.mockResolvedValue({ status: 'failed', retry_after_ms: 60_000 });
    await queueIngredientCovers(names(['Tomate']), { persistent: false });
    for (let i = 0; i < 2; i += 1) {
      const [job] = await jobs(); await processQueue.replaceAll([{ ...job, run_after: new Date(0).toISOString() }]);
      await runOne(processQueue, 'worker', handleProcessingJob);
    }
    expect(mocks.generate).toHaveBeenCalledTimes(2);
    const [job] = await jobs(); await processQueue.replaceAll([{ ...job, run_after: new Date(0).toISOString() }]);
    const third = await runOne(processQueue, 'worker', handleProcessingJob);
    expect(mocks.generate).toHaveBeenCalledTimes(2);
    expect(third).toMatchObject({ status: 'queued', attempts: 2 });
  });

  it('una caída del proveedor (401, 403, 429) no gasta intentos de la clave ni la deja muerta', async () => {
    mocks.generate.mockResolvedValue({ status: 'failed', retry_after_ms: 3_600_000, blocked: true });
    await queueIngredientCovers(names(['Tomate']), { persistent: false });
    for (let i = 0; i < 6; i += 1) {
      const [job] = await jobs(); await processQueue.replaceAll([{ ...job, run_after: new Date(0).toISOString() }]);
      await runOne(processQueue, 'worker', handleProcessingJob);
    }
    expect(await jobs()).toEqual([expect.objectContaining({ status: 'queued', attempts: 0 })]);
    expect(getRecipeCard('ingredient:tomate', 'tomate').cover_generation).toBe('queued');
  });

  it('el tope diario aplaza los ingredientes sobrantes hasta el próximo día UTC sin llamar al proveedor', async () => {
    vi.stubEnv('INGREDIENT_COVERS_DAILY_LIMIT', '2');
    await queueIngredientCovers(names(['Tomate', 'Cebolla', 'Papa']), { persistent: false });
    const results = [];
    for (let i = 0; i < 3; i += 1) results.push(await runOne(processQueue, 'worker', handleProcessingJob));
    expect(results.map(job => job?.status)).toEqual(['succeeded', 'succeeded', 'queued']);
    expect(mocks.generate).toHaveBeenCalledTimes(2);
    expect(Date.parse(results[2]!.run_after)).toBeGreaterThan(Date.now());
  });

  it('un nombre fuera del vocabulario no se encola ni llega al proveedor', async () => {
    await queueIngredientCovers(names(['Receta secreta de Sofía', 'Juan Pérez', 'Tomate']), { persistent: false });
    expect((await jobs()).map(job => job.payload.key)).toEqual(['tomate']);
  });

  it('una clave inválida o desconocida en la tarea es un error definitivo', async () => {
    for (const key of ['Tomate; drop', 'juan-perez']) await processQueue.enqueue({ kind: 'ingredient_cover', payload: { key }, max_attempts: 3 });
    expect((await runOne(processQueue, 'worker', handleProcessingJob))?.status).toBe('dead');
    expect((await runOne(processQueue, 'worker', handleProcessingJob))?.status).toBe('dead');
    expect(mocks.generate).not.toHaveBeenCalled();
  });

  it('la lectura devuelve sólo fotos listas y seguras, por nombre de ingrediente', async () => {
    await queueIngredientCovers(names(['Tomate']), { persistent: false });
    await runOne(processQueue, 'worker', handleProcessingJob);
    const lookup = await ingredientPhotoLookup(['Tomates', 'Cebolla', '!!!'], false);
    expect(lookup('Tomates')).toMatchObject({ ingredient_cover_url: expect.stringMatching(/^data:image\/jpeg;base64,/), ingredient_cover_alt: readyImage.alt });
    expect(lookup('Cebolla')).toEqual({});
    expect(lookup('!!!')).toEqual({});
  });

  it('withIngredientPhotos no muta los originales y conserva cantidades y unidades', () => {
    const original = [{ id: 'a', name: 'Tomate', quantity: 100, unit: 'g' }, { id: 'b', name: 'Sal', quantity: 1, unit: 'cdita' }];
    const frozen = structuredClone(original);
    const out = withIngredientPhotos(original, name => name === 'Tomate' ? { ingredient_cover_url: 'data:image/png;base64,AA==', ingredient_cover_alt: 'x' } : {});
    expect(original).toEqual(frozen);
    expect(out[0]).toEqual({ ...frozen[0], ingredient_cover_url: 'data:image/png;base64,AA==', ingredient_cover_alt: 'x' });
    expect(out[1]).toEqual(frozen[1]);
    const accented = withIngredientPhotos([{ name: 'Limón' }], () => ({ ingredient_cover_url: 'data:image/png;base64,AA==', ingredient_cover_alt: 'Limon · imagen ilustrativa generada con IA' }));
    expect(accented[0].ingredient_cover_alt).toBe('Limón · imagen ilustrativa generada con IA');
    expect(out).not.toBe(original);
  });
});

describe('cola persistente', () => {
  const lease = { key: 'tomate', run_token: 'token' };
  let bucket: { upload: ReturnType<typeof vi.fn>; getPublicUrl: ReturnType<typeof vi.fn> };
  beforeEach(() => {
    bucket = { upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: vi.fn((path: string) => ({ data: { publicUrl: `https://abc.supabase.co/storage/v1/object/public/recipe-covers/${path}` } })) };
    mocks.db = { storage: { from: vi.fn().mockReturnValue(bucket) }, rpc: vi.fn().mockResolvedValue({ data: null, error: null }) };
  });

  it('el encolado manda sólo las claves únicas conocidas por la función de servicio y nunca rompe la publicación', async () => {
    await queueIngredientCovers(names(['Tomate', 'tomates', 'Aceite de oliva', 'Receta secreta de Sofía']), { persistent: true });
    expect(mocks.db.rpc).toHaveBeenCalledWith('enqueue_ingredient_covers', { keys: ['tomate', 'aceite-de-oliva'], retry_failed: false });
    await queueIngredientCovers(names(['Tomate']), { persistent: true, retry: true });
    expect(mocks.db.rpc).toHaveBeenLastCalledWith('enqueue_ingredient_covers', { keys: ['tomate'], retry_failed: true });
    mocks.db.rpc.mockRejectedValueOnce(new Error('caído'));
    await expect(queueIngredientCovers(names(['Tomate']), { persistent: true })).resolves.toBeUndefined();
    mocks.db.rpc.mockResolvedValueOnce({ data: null, error: { code: '42883' } });
    await expect(queueIngredientCovers(names(['Tomate']), { persistent: true })).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('pone un tope de claves nuevas por publicación', async () => {
    const many = Object.keys(INGREDIENT_NOUNS).slice(0, 100).map(name => ({ name }));
    expect(MAX_KEYS_PER_PUBLICATION).toBe(60);
    await queueIngredientCovers(many, { persistent: true });
    expect(mocks.db.rpc.mock.calls[0][1].keys).toHaveLength(60);
    resetProcessQueue(); await queueIngredientCovers(many, { persistent: false });
    expect(await jobs()).toHaveLength(60);
  });

  it('una lista de forma rara o un origen que falla nunca lanza ni espera de más', async () => {
    const weird = [null, undefined, 42, { name: 7 }, { name: null }, { nombre: 'Tomate' }] as never;
    await expect(queueIngredientCovers(weird, { persistent: true })).resolves.toBeUndefined();
    await expect(queueIngredientCovers(() => { throw new Error('forma rara'); }, { persistent: true })).resolves.toBeUndefined();
    expect(mocks.db.rpc).not.toHaveBeenCalled();
    mocks.db.rpc.mockImplementation(() => new Promise(() => undefined));
    const started = Date.now();
    await queueIngredientCovers(names(['Tomate']), { persistent: true }, 30);
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('planVersionIngredients tolera planes de forma rara', () => {
    expect(planVersionIngredients(null)).toEqual([]);
    expect(planVersionIngredients({ items: null } as never)).toEqual([]);
    expect(planVersionIngredients({ items: [null, { recipe: { ingredients: 'x' } }, { recipe: { ingredients: [{ name: 'Tomate' }, null, { name: 3 }] } }, { recipe_proposal: { ingredients: [{ name: 'Sal' }] } }] } as never))
      .toEqual([{ name: 'Tomate' }, { name: 'Sal' }]);
  });

  it('sin proveedor, sin base de servicio o sin ingredientes válidos no llama a nada', async () => {
    mocks.enabled.mockReturnValue(false);
    await queueIngredientCovers(names(['Tomate']), { persistent: true });
    mocks.enabled.mockReturnValue(true);
    await queueIngredientCovers(names(['!!!']), { persistent: true });
    mocks.db = null;
    await expect(queueIngredientCovers(names(['Tomate']), { persistent: true })).resolves.toBeUndefined();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('el trabajo reserva con los topes, genera, sube a ingredients/<clave> y cierra con la clave secreta', async () => {
    mocks.db.rpc.mockResolvedValueOnce({ data: lease, error: null }).mockResolvedValueOnce({ data: { status: 'ready' }, error: null });
    await runPersistentIngredientCover();
    expect(mocks.db.rpc.mock.calls[0]).toEqual(['lease_ingredient_cover', { ingredient_limit: 30, total_limit: 100 }]);
    expect(mocks.generate).toHaveBeenCalledWith('tomate');
    expect(bucket.upload).toHaveBeenCalledWith('ingredients/tomate.jpg', readyImage.bytes, { contentType: 'image/jpeg', upsert: true });
    expect(mocks.db.rpc.mock.calls[1]).toEqual(['finish_ingredient_cover', {
      target_key: 'tomate', expected_token: 'token', result_url: 'https://abc.supabase.co/storage/v1/object/public/recipe-covers/ingredients/tomate.jpg',
      result_alt: readyImage.alt, retry_delay_seconds: 60, provider_blocked: false,
    }]);
  });

  it('usa los topes del ambiente, con ingredientes como máximo la mitad del total', async () => {
    vi.stubEnv('INGREDIENT_COVERS_DAILY_LIMIT', '70'); vi.stubEnv('IMAGE_DAILY_LIMIT', '40');
    await runPersistentIngredientCover();
    expect(mocks.db.rpc).toHaveBeenCalledWith('lease_ingredient_cover', { ingredient_limit: 20, total_limit: 40 });
  });

  it('una clave desconocida reservada (dato viejo) no llega al proveedor', async () => {
    mocks.db.rpc.mockResolvedValueOnce({ data: { key: 'juan-perez', run_token: 'token' }, error: null }).mockResolvedValueOnce({ data: {}, error: null });
    mocks.generate.mockResolvedValue({ status: 'failed' });
    await runPersistentIngredientCover();
    expect(bucket.upload).not.toHaveBeenCalled();
    expect(mocks.db.rpc.mock.calls[1][1]).toMatchObject({ target_key: 'juan-perez', result_url: null, provider_blocked: false });
  });

  it('una caída del proveedor devuelve el intento y pausa al trabajador hasta la hora indicada', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    mocks.generate.mockResolvedValue({ status: 'failed', retry_after_ms: 3_600_000, blocked: true });
    mocks.db.rpc.mockResolvedValueOnce({ data: lease, error: null }).mockResolvedValueOnce({ data: {}, error: null });
    await runPersistentIngredientCover();
    expect(bucket.upload).not.toHaveBeenCalled();
    expect(mocks.db.rpc.mock.calls[1][1]).toMatchObject({ result_url: null, result_alt: '', retry_delay_seconds: 3600, provider_blocked: true });
    expect(mocks.db.rpc).toHaveBeenCalledTimes(2);
    vi.setSystemTime(new Date('2026-10-08T12:59:00Z')); await runPersistentIngredientCover();
    expect(mocks.db.rpc).toHaveBeenCalledTimes(2);
    vi.setSystemTime(new Date('2026-10-08T13:00:01Z')); await runPersistentIngredientCover();
    expect(mocks.db.rpc).toHaveBeenCalledTimes(3);
  });

  it('un error propio del pedido (no del proveedor) sí cuenta como intento y no pausa', async () => {
    mocks.generate.mockResolvedValue({ status: 'failed', retry_after_ms: 60_000 });
    mocks.db.rpc.mockResolvedValueOnce({ data: lease, error: null }).mockResolvedValueOnce({ data: {}, error: null }).mockResolvedValue({ data: lease, error: null });
    await runPersistentIngredientCover();
    expect(mocks.db.rpc.mock.calls[1][1]).toMatchObject({ retry_delay_seconds: 60, provider_blocked: false });
    await runPersistentIngredientCover();
    expect(mocks.db.rpc.mock.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('si la subida falla cierra como fallo, sin foto', async () => {
    bucket.upload.mockResolvedValue({ error: { message: 'x' } });
    mocks.db.rpc.mockResolvedValueOnce({ data: lease, error: null }).mockResolvedValueOnce({ data: {}, error: null });
    await runPersistentIngredientCover();
    expect(mocks.db.rpc.mock.calls[1][1]).toMatchObject({ result_url: null });
  });

  it('descansa 15 segundos cuando no hay trabajo y cinco minutos cuando falla la reserva', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    await runPersistentIngredientCover(); await runPersistentIngredientCover();
    expect(mocks.db.rpc).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date('2026-10-08T12:00:16Z'));
    mocks.db.rpc.mockResolvedValueOnce({ data: null, error: { code: '42883' } });
    await runPersistentIngredientCover();
    expect(mocks.db.rpc).toHaveBeenCalledTimes(2);
    vi.setSystemTime(new Date('2026-10-08T12:04:00Z')); await runPersistentIngredientCover();
    expect(mocks.db.rpc).toHaveBeenCalledTimes(2);
    vi.setSystemTime(new Date('2026-10-08T12:06:00Z')); await runPersistentIngredientCover();
    expect(mocks.db.rpc).toHaveBeenCalledTimes(3);
  });

  it('no corre sin proveedor ni dos veces a la vez', async () => {
    mocks.enabled.mockReturnValue(false); await runPersistentIngredientCover();
    expect(mocks.db.rpc).not.toHaveBeenCalled();
    mocks.enabled.mockReturnValue(true);
    let release!: () => void;
    mocks.db.rpc.mockImplementationOnce(() => new Promise(resolve => { release = () => resolve({ data: null, error: null }); }));
    const first = runPersistentIngredientCover(); await runPersistentIngredientCover();
    release(); await first;
    expect(mocks.db.rpc).toHaveBeenCalledTimes(1);
  });

  it('el registro de errores no incluye nombres ni claves', async () => {
    mocks.db.rpc.mockResolvedValueOnce({ data: lease, error: null }).mockResolvedValueOnce({ data: null, error: { code: 'PT409', message: 'tomate secreto' } });
    await runPersistentIngredientCover();
    expect(errorSpy).toHaveBeenCalled();
    expect(JSON.stringify(errorSpy.mock.calls)).not.toMatch(/tomate|token/);
    expect(JSON.stringify(errorSpy.mock.calls)).toContain('PT409');
  });
});

describe('lectura persistente del catálogo (clave de servicio, sólo las claves pedidas)', () => {
  const host = 'https://abc.supabase.co/storage/v1/object/public/recipe-covers/ingredients';
  function catalog(results: Array<{ data: unknown; error: unknown }>) {
    const eq = vi.fn(); results.forEach(result => eq.mockResolvedValueOnce(result)); eq.mockResolvedValue({ data: [], error: null });
    const inFn = vi.fn().mockReturnValue({ eq });
    const select = vi.fn().mockReturnValue({ in: inFn });
    mocks.db = { from: vi.fn().mockReturnValue({ select }) };
    return { select, inFn, eq };
  }
  beforeEach(() => { vi.stubEnv('SUPABASE_URL', 'https://abc.supabase.co'); });

  it('pide sólo clave, dirección y descripción de las fotos listas, únicamente de las claves pedidas', async () => {
    const { select, inFn, eq } = catalog([{ data: [{ key: 'tomate', url: `${host}/tomate.jpg`, alt: 'Tomate' }, { key: 'papa', url: 'javascript:alert(1)', alt: 'x' }, { key: 'sal', url: 'https://otro.supabase.co/storage/v1/object/public/recipe-covers/ingredients/sal.jpg', alt: 'x' }], error: null }]);
    const lookup = await ingredientPhotoLookup(['Tomates', 'Papa', 'Sal', 'Receta de Sofía'], true);
    expect(mocks.db.from).toHaveBeenCalledWith('ingredient_covers');
    expect(select).toHaveBeenCalledWith('key,url,alt');
    expect(inFn).toHaveBeenCalledWith('key', ['tomate', 'papa', 'sal']);
    expect(eq).toHaveBeenCalledWith('status', 'ready');
    expect(lookup('Tomates')).toEqual({ ingredient_cover_url: `${host}/tomate.jpg`, ingredient_cover_alt: 'Tomate' });
    expect(lookup('Papa')).toEqual({});
    expect(lookup('Sal')).toEqual({});
    expect(lookup('Receta de Sofía')).toEqual({});
  });

  it('lee en lotes de 100 claves', async () => {
    const { inFn } = catalog([]);
    const many = Object.keys(INGREDIENT_NOUNS).slice(0, 250).map(name => name);
    await ingredientPhotoLookup(many, true);
    const sizes = inFn.mock.calls.map(call => call[1].length);
    expect(sizes.length).toBeGreaterThanOrEqual(2);
    expect(sizes.every(size => size <= 100)).toBe(true);
  });

  it('si una lectura falla devuelve vacío y lo registra; vuelve a registrarlo pasado un rato, no calla para siempre', async () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    catalog([{ data: null, error: { code: '42P01' } }, { data: null, error: { code: '42P01' } }, { data: null, error: { code: '42P01' } }]);
    expect((await ingredientPhotoLookup(['Tomate'], true))('Tomate')).toEqual({});
    await ingredientPhotoLookup(['Tomate'], true);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    vi.setSystemTime(new Date('2026-10-08T12:11:00Z'));
    await ingredientPhotoLookup(['Tomate'], true);
    expect(errorSpy).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(errorSpy.mock.calls)).toContain('42P01');
  });

  it('sin clave de servicio, sin ingredientes conocidos o con una lectura colgada no rompe nada', async () => {
    mocks.db = null;
    expect((await ingredientPhotoLookup(['Tomate'], true))('Tomate')).toEqual({});
    catalog([]);
    await ingredientPhotoLookup(['Receta de Sofía', '!!!'], true);
    expect(mocks.db.from).not.toHaveBeenCalled();
  });
});

describe('enriquecimiento de lo que lee la paciente nunca rompe la respuesta', () => {
  it('un plan de forma rara se devuelve igual, sin fotos', async () => {
    mocks.db = null;
    const weird = { id: 'p', items: [null, { recipe: { ingredients: 'x' } }, { recipe: null, recipe_proposal: { ingredients: [null, { name: 5 }] } }] } as never;
    await expect(patientPlanWithPhotos(weird, true)).resolves.toBeTruthy();
    expect(await patientPlanWithPhotos(null, true)).toBeNull();
    expect(await patientPlanWithPhotos({ id: 'p', items: null } as never, false)).toMatchObject({ id: 'p' });
  });

  it('recetas de forma rara se devuelven igual', async () => {
    const weird = [{ id: 'r', ingredients: null }, { id: 's', ingredients: [{ name: 'Tomate' }, null] }] as never;
    const out = await patientRecipesWithPhotos(weird, false);
    expect(out).toHaveLength(2);
    expect((out[0] as unknown as { id: string }).id).toBe('r');
  });

  it('si la lectura falla del todo devuelve el mismo plan sin fotos', async () => {
    mocks.db = { from: () => { throw new Error('caído'); } };
    const plan = { id: 'p', items: [{ recipe: { ingredients: [{ name: 'Tomate', id: 'a', quantity: 1, unit: 'g' }] } }] } as never;
    expect(await patientPlanWithPhotos(plan, true)).toEqual(plan);
  });
});
