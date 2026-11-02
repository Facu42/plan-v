import { beforeEach, describe, expect, it } from 'vitest';
import { huellaFoto } from '../../src/lib/public-page-profile.js';
import { schedulingDefaultSettings } from '../../src/types/scheduling.js';
import { defaultNutritionSettings } from '../../src/types/nutrition-capabilities.js';
import { resetNutritionCapabilities, saveNutritionSettings } from '../nutrition-capabilities/repository.js';
import { profiles, publicPage, saveProfile } from './repository.js';

const nutri = 'nutri-foto';
const nueva = 'data:image/png;base64,iVBORw0KGgo=';
const vieja = 'data:image/jpeg;base64,/9j/4AAQ=';

beforeEach(() => {
  profiles.clear();
  resetNutritionCapabilities();
});

async function paginaCon(logo: string, huella?: string) {
  await saveNutritionSettings(nutri, { ...defaultNutritionSettings(), brand: { name: '', contact: '', logo } }, 0, false);
  const base = schedulingDefaultSettings();
  return saveProfile(nutri, 0, { ...base, page: { ...base.page, enabled: true, slug: 'consultorio-foto' }, ...(huella ? { page_extras: { photo_sha256: huella } } : {}) }, false);
}

describe('foto pública recién al publicar', () => {
  it('un logo guardado en la marca no sale en /slug si no se publicó', async () => {
    const perfil = await paginaCon(nueva);
    expect((await publicPage(perfil, false)).profile.photo).toBe('');
  });

  it('un logo distinto del publicado tampoco sale', async () => {
    const perfil = await paginaCon(nueva, await huellaFoto(vieja));
    expect((await publicPage(perfil, false)).profile.photo).toBe('');
  });

  it('sale solo cuando la huella publicada es la de esa foto', async () => {
    const perfil = await paginaCon(vieja, await huellaFoto(vieja));
    expect((await publicPage(perfil, false)).profile.photo).toBe(vieja);
  });
});
