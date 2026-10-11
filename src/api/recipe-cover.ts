import { request } from './client';
import type { ProfessionalRecipe } from '../types/recipes';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function readPhoto(file: File): Promise<string> {
  if (file.size === 0 || file.size > MAX_BYTES) throw new Error('La foto debe pesar entre 1 byte y 5 MB.');
  if (!TYPES.includes(file.type)) throw new Error('Usá una foto JPG, PNG o WebP.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('No se pudo abrir la foto.'));
    reader.onerror = () => reject(new Error('No se pudo abrir la foto.'));
    reader.onabort = () => reject(new Error('Se canceló la lectura de la foto.'));
    reader.readAsDataURL(file);
  });
}

export const recipeCoverApi = {
  upload: async (recipe: ProfessionalRecipe, file: File) => {
    if (!recipe.published) throw new Error('Publicá la receta antes de subir la foto del plato.');
    const dataUrl = await readPhoto(file);
    return request<{ recipe: ProfessionalRecipe; source: string }>(`/api/recipes/${encodeURIComponent(recipe.id)}/cover/manual`, {
      method: 'POST', body: JSON.stringify({ expected_version: recipe.published.version, expected_cover_url: recipe.published.card?.cover_url ?? null, data_url: dataUrl }),
    });
  },
};
