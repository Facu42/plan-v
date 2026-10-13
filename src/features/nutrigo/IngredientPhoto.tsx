import { findSource, nodeName, renderSource, sourceText, type SourceNode, type SourceBinding } from './SourceView';
import source from './source/84-3145.json';
import dashboard from './source/12-792.json';
import { translateSource } from './translation';
import { hideBrokenPhoto, ingredientPhotoUrl } from './plate-photo';
import type { IngredientPhoto } from '../../types/recipes';

const number = findSource(source as SourceNode, node => nodeName(node) === 'Number')!;
const image = findSource(dashboard as SourceNode, node => nodeName(node) === 'Image' && String(node.props.className).includes('size-[64px]'))!;
/** Default nuevo: pieza de imagen de Nutrigo junto al número original, sin reemplazar datos. */
export function ingredientNumberBinding(node: SourceNode, ingredient: IngredientPhoto & { name: string }, index: number): SourceBinding {
  const src = ingredientPhotoUrl(ingredient);
  return { props: { className: 'content-stretch flex gap-[12px] items-center relative shrink-0', 'data-name': 'Ingredient identity' }, children: <>
    {renderSource(node, n => n !== node && /^\d+$/.test(sourceText(n)) ? { text: index + 1 } : undefined, translateSource)}
    {src && renderSource(image, n => n === image ? { children: <img key={src} src={src} alt={ingredient.ingredient_cover_alt || `${ingredient.name} · imagen ilustrativa generada con IA`} loading="lazy" decoding="async" onError={hideBrokenPhoto} className="absolute inset-0 block size-full object-cover" /> } : undefined, translateSource)}
  </> };
}
export function NutrigoIngredientPhoto({ ingredient, index }: { ingredient: IngredientPhoto & { name: string }; index: number }) {
  return renderSource(number, node => node === number ? ingredientNumberBinding(node, ingredient, index) : undefined, translateSource);
}
