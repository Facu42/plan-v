import { generateImage } from 'ai';
import { openai } from '@ai-sdk/openai';
import { logProviderFailure, resolveAiMode } from './mode.js';

export type RecipeCoverContext = {
  title: string;
  items: Array<{ name: string }>;
};

export type RecipeCoverResult =
  | { status: 'ready'; bytes: Buffer; mime: 'image/png' | 'image/jpeg' | 'image/webp'; alt: string }
  | { status: 'failed' };

function coverPrompt(context: RecipeCoverContext): string {
  const ingredients = context.items.map((item) => item.name).slice(0, 8).join(', ');
  return `Foto de comida real, estilo flat-lay editorial, fondo neutro claro, luz natural, plato limpio y apetitoso, sin texto, sin marca de agua, sin personas. Plato: "${context.title}"${ingredients ? `. Ingredientes visibles: ${ingredients}.` : '.'}`;
}

/**
 * Genera la foto de portada de una receta ya aprobada (publicada). Se llama
 * DESPUÉS de aprobar, nunca antes: es un borrador de imagen, no se inventa
 * si la IA no está en modo vivo. AI_MODE!=='live' nunca intenta la llamada
 * (evita costo en demo/test/disabled) y devuelve 'failed' sin URL.
 */
export async function generateRecipeCoverImage(context: RecipeCoverContext): Promise<RecipeCoverResult> {
  if (resolveAiMode() !== 'live' || !process.env.OPENAI_API_KEY) return { status: 'failed' };
  try {
    const { image } = await generateImage({
      model: openai.image('dall-e-3'),
      prompt: coverPrompt(context),
      size: '1024x1024',
    });
    if (!image?.base64) return { status: 'failed' };
    const mime = image.mediaType || 'image/png';
    if (mime !== 'image/png' && mime !== 'image/jpeg' && mime !== 'image/webp') return { status: 'failed' };
    const bytes = Buffer.from(image.base64, 'base64');
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) return { status: 'failed' };
    return { status: 'ready', bytes, mime, alt: context.title };
  } catch (error) {
    logProviderFailure('recipe-cover', error);
    return { status: 'failed' };
  }
}
