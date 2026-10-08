import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateIngredientCoverImage, ingredientCoverAlt, ingredientCoverKey, ingredientCoverPrompt, ingredientVocabularySize, isKnownIngredientKey } from './ingredient-cover.js';
import { INGREDIENT_NOUNS } from './ingredient-vocabulary.js';

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('clave estable del ingrediente', () => {
  it.each([
    ['Tomate', 'tomate'],
    ['Tomates', 'tomate'],
    ['  TOMATE  ', 'tomate'],
    ['200 g de tomate', 'tomate'],
    ['2 cucharadas de aceite de oliva', 'aceite-de-oliva'],
    ['1/2 taza de arroz integral', 'arroz-integral'],
    ['1,5 kg de papas', 'papa'],
    ['media cebolla', 'cebolla'],
    ['Lentejas cocidas', 'lenteja'],
    ['Zanahoria rallada', 'zanahoria'],
    ['Yogur griego (sin azúcar)', 'yogur-griego'],
    ['Limones', 'limon'],
    ['Nueces', 'nuez'],
    ['Ají molido', 'aji-molido'],
    ['Huevos', 'huevo'],
    ['Frutos rojos', 'fruto-rojo'],
    ['Garbanzos', 'garbanzo'],
    ['Cebolla de verdeo', 'cebolla-de-verdeo'],
    ['Pechuga de pollo', 'pechuga-de-pollo'],
    ['Anís', 'anis'],
    ['Sal', 'sal'],
    ['Arroz', 'arroz'],
  ])('«%s» se guarda como «%s»', (name, key) => {
    expect(ingredientCoverKey(name)).toBe(key);
  });

  it('la misma clave para variantes de cantidad, plural y mayúsculas', () => {
    const keys = ['Tomate', 'tomates', '100 g de tomates', 'Dos tomates maduros', '1 u tomate'].map(ingredientCoverKey);
    expect(new Set(keys)).toEqual(new Set(['tomate']));
  });

  it.each(['', '   ', '123', 'g', '100 g', '1/2', '!!!', 'x'.repeat(80)])('«%s» no tiene clave válida', name => {
    expect(ingredientCoverKey(name)).toBeNull();
  });

  it('sólo produce letras minúsculas, números y guiones simples', () => {
    for (const name of ['Piña (fresca)', 'Crème fraîche', 'Pan con semillas / chía', "Ñoquis de papa", 'A--B', '<script>alert(1)</script>']) {
      const key = ingredientCoverKey(name);
      if (key) expect(key).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });
});

describe('descripción de la foto de un ingrediente', () => {
  it('es una foto de estudio de un solo ingrediente, en inglés culinario, sin texto ni platos', () => {
    const prompt = ingredientCoverPrompt('tomate');
    expect(prompt).toContain('tomato');
    expect(prompt).toMatch(/studio/i);
    expect(prompt).toMatch(/light/i);
    expect(prompt).toMatch(/no (plate|dish)/i);
    expect(prompt).toMatch(/no .*text/i);
    expect(prompt).not.toMatch(/tomate/);
  });

  it('traduce frases culinarias y conserva lo desconocido', () => {
    expect(ingredientCoverPrompt('aceite-de-oliva')).toContain('olive oil');
    expect(ingredientCoverPrompt('yogur-griego')).toContain('Greek yogurt');
    expect(ingredientCoverPrompt('pechuga-de-pollo')).toContain('chicken breast');
    expect(ingredientCoverPrompt('fruto-rojo')).toContain('berries');
    expect(ingredientCoverPrompt('lenteja-seca')).toContain('dry lentils dried');
    expect(ingredientCoverPrompt('filet-de-merluza')).toContain('fillet of');
  });

  it('tiene un límite de largo y no incluye nada fuera de la clave', () => {
    const prompt = ingredientCoverPrompt('a'.repeat(60));
    expect(prompt.length).toBeLessThanOrEqual(600);
    expect(prompt).not.toMatch(/paciente|patient|nota|alerg/i);
  });

  it('la descripción accesible es legible y avisa que es una ilustración de IA', () => {
    expect(ingredientCoverAlt('aceite-de-oliva')).toBe('Aceite de oliva · imagen ilustrativa generada con IA');
  });
});

describe('generación con el mismo proveedor y modelo fijo', () => {
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0x3f, 0xff, 0xd9]);
  function enabled() {
    vi.stubEnv('IMAGE_PROVIDER', 'cloudflare_free'); vi.stubEnv('CLOUDFLARE_FREE_TIER', '1');
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'a'.repeat(32)); vi.stubEnv('CLOUDFLARE_API_TOKEN', 'synthetic-only');
  }

  it('manda sólo la descripción del ingrediente al modelo fijo y devuelve los bytes', async () => {
    enabled();
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, result: { image: jpeg.toString('base64') } })));
    vi.stubGlobal('fetch', fetcher);
    const result = await generateIngredientCoverImage('tomate');
    expect(result).toMatchObject({ status: 'ready', mime: 'image/jpeg', bytes: jpeg, alt: 'Tomate · imagen ilustrativa generada con IA' });
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toContain('/@cf/black-forest-labs/flux-1-schnell');
    expect(Object.keys(JSON.parse(init.body)).sort()).toEqual(['prompt', 'steps']);
    expect(JSON.parse(init.body).prompt).toContain('tomato');
  });

  it('sin proveedor configurado no llama a la red', async () => {
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect(await generateIngredientCoverImage('tomate')).toEqual({ status: 'failed' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('una clave inválida no llama a la red', async () => {
    enabled(); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    expect(await generateIngredientCoverImage('Tomate; DROP')).toEqual({ status: 'failed' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('la cuota agotada (429) espera hasta el próximo día UTC sin otro proveedor', async () => {
    enabled(); const fetcher = vi.fn().mockResolvedValue(new Response('{}', { status: 429 })); vi.stubGlobal('fetch', fetcher);
    const result = await generateIngredientCoverImage('tomate');
    expect(result).toMatchObject({ status: 'failed', retry_after_ms: expect.any(Number) });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('el registro de fallos no contiene el nombre del ingrediente ni claves', async () => {
    enabled(); vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 500 })));
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await generateIngredientCoverImage('tomate');
    expect(JSON.stringify(spy.mock.calls)).not.toMatch(/tomate|tomato|synthetic-only/);
    spy.mockRestore();
  });
});

describe('vocabulario curado: sólo ingredientes conocidos generan foto', () => {
  it('es chico y revisable: entre 150 y 300 nombres', () => {
    expect(ingredientVocabularySize()).toBeGreaterThanOrEqual(150);
    expect(ingredientVocabularySize()).toBeLessThanOrEqual(300);
  });

  it('cada nombre del catálogo es una clave válida y se alcanza escribiéndolo normalmente', () => {
    for (const phrase of Object.keys(INGREDIENT_NOUNS)) {
      const key = phrase.replace(/ /g, '-');
      expect(isKnownIngredientKey(key), key).toBe(true);
      expect(ingredientCoverKey(phrase), phrase).toBe(key);
    }
  });

  it.each([
    'tomate', 'aceite-de-oliva', 'lenteja-seca', 'arroz-integral', 'poroto-negro', 'filet-de-merluza', 'leche-en-polvo', 'yogur-griego', 'cebolla-de-verdeo',
  ])('«%s» es conocido', key => { expect(isKnownIngredientKey(key)).toBe(true); });

  it.each([
    'receta-secreta-de-sofia', 'juan-perez', 'tomate-juan', 'pollo-con-la-receta', 'paciente', 'diabetes-tipo-2', 'integral', 'de', 'tomate-', 'Tomate', '', 'x'.repeat(61),
    'ensalada-de-lucia-gomez',
  ])('«%s» no es conocido', key => { expect(isKnownIngredientKey(key)).toBe(false); });

  it('una clave desconocida nunca llega a la red', async () => {
    vi.stubEnv('IMAGE_PROVIDER', 'cloudflare_free'); vi.stubEnv('CLOUDFLARE_FREE_TIER', '1');
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'a'.repeat(32)); vi.stubEnv('CLOUDFLARE_API_TOKEN', 'synthetic-only');
    const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher);
    for (const key of ['juan-perez', 'receta-secreta', 'quinoa-pop']) expect(await generateIngredientCoverImage(key)).toEqual({ status: 'failed' });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('una caída del proveedor (401, 403, 429) se marca como bloqueo; un error propio (500) no', async () => {
    vi.stubEnv('IMAGE_PROVIDER', 'cloudflare_free'); vi.stubEnv('CLOUDFLARE_FREE_TIER', '1');
    vi.stubEnv('CLOUDFLARE_ACCOUNT_ID', 'a'.repeat(32)); vi.stubEnv('CLOUDFLARE_API_TOKEN', 'synthetic-only');
    for (const [status, blocked] of [[401, true], [403, true], [429, true], [500, false]] as const) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
      const result = await generateIngredientCoverImage('tomate');
      expect(result, String(status)).toMatchObject({ status: 'failed', retry_after_ms: expect.any(Number) });
      expect('blocked' in result && result.blocked === true, String(status)).toBe(blocked);
    }
  });
});
