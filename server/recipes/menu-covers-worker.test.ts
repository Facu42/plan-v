import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ db: null as any, generate: vi.fn() }));
vi.mock('../db/supabase-client.js', () => ({ getSupabaseAdmin: () => mocks.db }));
vi.mock('../ai/recipe-cover.js', () => ({ recipeCoverEnabled: () => true, generateRecipeCoverImage: mocks.generate }));
import { runPersistentDishCover } from './menu-covers.js';

const leased = {
  id: 'job', run_token: 'token', nutritionist_id: 'consultorio', recipe_version_id: 'version',
  context: { title: 'Tomate al horno', ingredients: [{ name: 'Tomate', quantity: 100, unit: 'g' }], steps: ['Hornear.'] },
};
let bucket: { upload: ReturnType<typeof vi.fn>; getPublicUrl: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn> };
const url = 'https://synthetic.example.test/our-generated-candidate.jpg';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.generate.mockResolvedValue({ status: 'ready', bytes: Buffer.from('synthetic-only'), mime: 'image/jpeg', alt: 'Ilustración IA' });
  bucket = { upload: vi.fn().mockResolvedValue({ error: null }), getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: url } }), remove: vi.fn().mockResolvedValue({ error: null }) };
  mocks.db = {
    storage: { from: vi.fn().mockReturnValue(bucket) },
    rpc: vi.fn().mockResolvedValueOnce({ data: leased, error: null }),
    from: vi.fn().mockImplementation(() => ({ select: () => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) }) })),
  };
});

describe('limpieza de archivos de fotos después de finalizar una reserva', () => {
  it.each(['PT409', '22023'])('elimina sólo el candidato no referenciado tras rechazo definitivo %s', async code => {
    mocks.db.rpc.mockResolvedValueOnce({ data: null, error: { code } });
    await runPersistentDishCover();
    expect(mocks.db.from.mock.calls.map((call: string[]) => call[0]).sort()).toEqual(['menu_dish_covers', 'recipe_covers']);
    expect(bucket.remove).toHaveBeenCalledOnce();
    expect(bucket.remove.mock.calls[0][0]).toEqual([expect.stringMatching(/^consultorio\/version\/[a-f0-9-]+\.jpg$/)]);
  });

  it.each(['menu_dish_covers', 'recipe_covers'])('conserva el candidato si %s confirma que está en uso aunque la respuesta sea stale', async referencedTable => {
    mocks.db.rpc.mockResolvedValueOnce({ data: null, error: { code: 'PT409' } });
    mocks.db.from.mockImplementation((table: string) => ({ select: () => ({ eq: vi.fn().mockResolvedValue({ data: table === referencedTable ? [{ id: 'existing-reference' }] : [], error: null }) }) }));
    await runPersistentDishCover();
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('conserva un archivo cuando la finalización puede haberse confirmado pero se perdió la respuesta', async () => {
    mocks.db.rpc.mockResolvedValueOnce({ data: null, error: { code: 'network_error' } });
    await runPersistentDishCover();
    expect(mocks.db.from).not.toHaveBeenCalled();
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('conserva el candidato cuando una lectura de referencias falla', async () => {
    mocks.db.rpc.mockResolvedValueOnce({ data: { cover_url: 'https://synthetic.example.test/manual.jpg' }, error: null });
    mocks.db.from.mockImplementation((table: string) => ({ select: () => ({ eq: vi.fn().mockResolvedValue({ data: [], error: table === 'recipe_covers' ? { code: 'network_error' } : null }) }) }));
    await runPersistentDishCover();
    expect(bucket.remove).not.toHaveBeenCalled();
  });

  it('descarta la generación cuando prevalece una foto manual y ambas lecturas confirman que nadie usa el candidato', async () => {
    mocks.db.rpc.mockResolvedValueOnce({ data: { cover_url: 'https://synthetic.example.test/manual.jpg' }, error: null });
    await runPersistentDishCover();
    expect(bucket.remove).toHaveBeenCalledOnce();
  });

  it('conserva la foto cuya finalización se confirmó', async () => {
    mocks.db.rpc.mockResolvedValueOnce({ data: { cover_url: url }, error: null });
    await runPersistentDishCover();
    expect(mocks.db.from).not.toHaveBeenCalled();
    expect(bucket.remove).not.toHaveBeenCalled();
  });
});

describe('aviso de ocupación para repartir la cuota entre platos e ingredientes', () => {
  it('informa que trabajó cuando tomó una reserva', async () => {
    mocks.db.rpc.mockResolvedValueOnce({ data: { cover_url: url }, error: null });
    expect(await runPersistentDishCover()).toBe(true);
  });

  it('informa que no hay trabajo cuando la cola está vacía o falla la reserva', async () => {
    mocks.db.rpc = vi.fn().mockResolvedValueOnce({ data: null, error: null }).mockResolvedValueOnce({ data: null, error: { code: '42883' } });
    expect(await runPersistentDishCover()).toBe(false);
    expect(await runPersistentDishCover()).toBe(false);
  });

  it('informa ocupado mientras otra pasada sigue en curso', async () => {
    let release!: () => void;
    mocks.db.rpc = vi.fn().mockImplementationOnce(() => new Promise(resolve => { release = () => resolve({ data: null, error: null }); }));
    const first = runPersistentDishCover();
    expect(await runPersistentDishCover()).toBe(true);
    release(); expect(await first).toBe(false);
  });
});

describe('cuota compartida: cada foto de plato intentada se registra para repartir el día', () => {
  it('registra un intento de plato después de tomar una reserva', async () => {
    mocks.db.rpc.mockResolvedValueOnce({ data: { cover_url: url }, error: null });
    await runPersistentDishCover();
    expect(mocks.db.rpc.mock.calls.map((call: unknown[]) => call[0])).toEqual(['lease_menu_dish_cover', 'finish_menu_dish_cover', 'record_cover_attempt']);
    expect(mocks.db.rpc.mock.calls[2][1]).toEqual({ usage_kind: 'dish' });
  });

  it('no registra nada si no había trabajo y nunca falla si el contador no existe todavía', async () => {
    mocks.db.rpc = vi.fn().mockResolvedValueOnce({ data: null, error: null });
    await runPersistentDishCover();
    expect(mocks.db.rpc).toHaveBeenCalledTimes(1);
    mocks.db.rpc = vi.fn().mockResolvedValueOnce({ data: leased, error: null }).mockResolvedValueOnce({ data: { cover_url: url }, error: null }).mockRejectedValueOnce(new Error('sin tabla'));
    await expect(runPersistentDishCover()).resolves.toBe(true);
  });
});
