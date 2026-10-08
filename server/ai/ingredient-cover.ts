import { INGREDIENT_MODIFIERS, INGREDIENT_NOUNS } from './ingredient-vocabulary.js';
import { culinaryEnglish, generateCoverFromPrompt, type RecipeCoverResult } from './recipe-cover.js';

/** Clave del catálogo compartido: minúsculas, sin tildes, palabras unidas por guiones (ej. `aceite-de-oliva`). */
export const INGREDIENT_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const MAX_KEY_LENGTH = 60;
const MIN_KEY_LENGTH = 2;

const COUNT_WORDS = new Set(['un', 'una', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'medio', 'media', 'medios', 'medias', 'cuarto']);
const UNIT_WORDS = new Set([
  'g', 'gr', 'grs', 'gramo', 'gramos', 'kg', 'kilo', 'kilos', 'mg', 'ml', 'cc', 'l', 'lt', 'litro', 'litros', 'u', 'unidad', 'unidades',
  'cda', 'cdas', 'cucharada', 'cucharadas', 'cdita', 'cditas', 'cucharadita', 'cucharaditas', 'taza', 'tazas', 'vaso', 'vasos',
  'pizca', 'pizcas', 'punado', 'punados', 'rodaja', 'rodajas', 'diente', 'dientes', 'feta', 'fetas', 'lata', 'latas',
  'paquete', 'paquetes', 'porcion', 'porciones', 'trozo', 'trozos', 'rebanada', 'rebanadas', 'chorrito', 'cubito', 'cubitos',
]);
const FILLER_WORDS = new Set(['de', 'del', 'el', 'la', 'los', 'las']);
/** Estado de preparación o tamaño: la foto es del ingrediente, no de cómo se cocina. */
const DESCRIPTOR_WORDS = new Set([
  'cocido', 'cocida', 'cocidos', 'cocidas', 'hervido', 'hervida', 'hervidos', 'hervidas', 'picado', 'picada', 'picados', 'picadas',
  'rallado', 'rallada', 'rallados', 'ralladas', 'fresco', 'fresca', 'frescos', 'frescas', 'maduro', 'madura', 'maduros', 'maduras',
  'grande', 'grandes', 'chico', 'chica', 'chicos', 'chicas', 'mediano', 'mediana', 'medianos', 'medianas', 'entero', 'entera', 'enteros', 'enteras',
  'crudo', 'cruda', 'crudos', 'crudas', 'tibio', 'tibia', 'congelado', 'congelada', 'congelados', 'congeladas',
]);
const KEEP_AS_IS = new Set(['hummus', 'anis', 'ananas', 'cuscus', 'cus', 'mas', 'pais', 'res']);
const SINGULAR_FIXES: Record<string, string> = { ajies: 'aji', ajis: 'aji' };
const NO_SINGULAR = new Set([...FILLER_WORDS, 'con', 'y', 'al', 'a', 'en']);

/** Español simple: ces→z, consonante+es→sin «es», vocal+s→sin «s». Palabras cortas o invariables no cambian. */
function singularWord(word: string): string {
  if (word.length <= 3 || KEEP_AS_IS.has(word) || NO_SINGULAR.has(word)) return word;
  if (SINGULAR_FIXES[word]) return SINGULAR_FIXES[word];
  if (/ces$/.test(word)) return `${word.slice(0, -3)}z`;
  if (/[nldrj]es$/.test(word)) return word.slice(0, -2);
  if (/[aeiou]s$/.test(word)) return word.slice(0, -1);
  return word;
}

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '');
}

/** Corta lo que no es el ingrediente: aclaraciones entre paréntesis, «, picado», «sin …», «para …», alternativas con «o». */
function cutAsides(value: string): string {
  return value
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\s*,\s*(?=[a-z])[\s\S]*$/, ' ')
    .replace(/\b(sin|para|o)\b[\s\S]*$/, ' ')
    .replace(/\b(al|a) gusto\b/g, ' ')
    .replace(/\ben (cubos|cubitos|rodajas|tiras|trozos|juliana)\b/g, ' ');
}

/** Saca del principio las cantidades y unidades («2 cucharadas de», «media», «200 g de»). */
function dropLeadingAmounts(tokens: string[]): string[] {
  let index = 0;
  while (index < tokens.length) {
    const token = tokens[index];
    if (/^\d+$/.test(token) || COUNT_WORDS.has(token) || UNIT_WORDS.has(token) || (index > 0 && FILLER_WORDS.has(token))) index += 1;
    else break;
  }
  const rest = tokens.slice(index);
  return index > 0 && rest.length && FILLER_WORDS.has(rest[0]) ? rest.slice(1) : rest;
}

/**
 * Clave estable del catálogo de fotos de ingredientes a partir del nombre que escribió la nutricionista.
 * Función pura: sólo mira el nombre del ingrediente; nada de pacientes, cantidades ni notas.
 */
export function ingredientCoverKey(name: string): string | null {
  const text = cutAsides(stripAccents(String(name ?? '')).toLowerCase());
  const words = text.replace(/[^a-z0-9]+/g, ' ').trim().split(' ').filter(Boolean);
  let tokens = dropLeadingAmounts(words).filter(word => !DESCRIPTOR_WORDS.has(word) && !/^\d+$/.test(word) && !COUNT_WORDS.has(word));
  while (tokens.length && (FILLER_WORDS.has(tokens[tokens.length - 1]) || tokens[tokens.length - 1] === 'en')) tokens = tokens.slice(0, -1);
  if (!tokens.length) return null;
  const key = tokens.map(singularWord).join('-');
  return key.length >= MIN_KEY_LENGTH && key.length <= MAX_KEY_LENGTH && INGREDIENT_KEY_PATTERN.test(key) ? key : null;
}

const CONNECTORS = new Set(['de', 'del', 'en']);
const PHRASES = Object.keys(INGREDIENT_NOUNS).sort((a, b) => b.split(' ').length - a.split(' ').length);

type Piece = { english: string; noun: boolean };
/** Parte la clave en frases conocidas, modificadores y conectores. Devuelve null si algo no está en el vocabulario curado. */
function segment(key: string): Piece[] | null {
  const words = key.split('-');
  const pieces: Piece[] = [];
  for (let index = 0; index < words.length;) {
    const phrase = PHRASES.find(candidate => candidate.split(' ').every((part, offset) => words[index + offset] === part));
    if (phrase) { pieces.push({ english: INGREDIENT_NOUNS[phrase], noun: true }); index += phrase.split(' ').length; continue; }
    const word = words[index];
    if (INGREDIENT_MODIFIERS[word]) pieces.push({ english: INGREDIENT_MODIFIERS[word], noun: false });
    else if (index > 0 && CONNECTORS.has(word)) pieces.push({ english: word === 'en' ? 'in' : 'of', noun: false });
    else return null;
    index += 1;
  }
  return pieces.some(piece => piece.noun) ? pieces : null;
}
/** Solo el vocabulario curado genera foto: así ningún texto libre llega a la cola ni al proveedor. */
export function isKnownIngredientKey(key: string): boolean {
  return INGREDIENT_KEY_PATTERN.test(key) && key.length <= MAX_KEY_LENGTH && segment(key) !== null;
}
export function ingredientVocabularySize(): number { return PHRASES.length; }
/** Inglés culinario del ingrediente; para claves fuera del vocabulario (nunca se genera) conserva las palabras. */
function ingredientEnglish(key: string): string {
  const pieces = segment(key);
  return pieces ? pieces.map(piece => piece.english).join(' ') : key.split('-').map(culinaryEnglish).join(' ');
}

/** Foto de estudio de un solo ingrediente, con el mismo estilo claro y natural de las fotos de platos. */
export function ingredientCoverPrompt(key: string): string {
  return [
    `Studio food photograph of ${ingredientEnglish(key)}, a single ingredient shown on its own.`,
    'Clean light cream-white background, soft natural daylight, three-quarter overhead view, centered square composition.',
    'No plate, no dish, no bowl, no cutlery, no hands, no people, no text, no labels, no logos, no packaging, no collage, no other ingredients.',
  ].join(' ').slice(0, 600);
}

export function ingredientCoverAlt(key: string): string {
  const label = key.replace(/-/g, ' ');
  return `${label.charAt(0).toLocaleUpperCase('es')}${label.slice(1)} · imagen ilustrativa generada con IA`;
}

/** Misma conexión, modelo y cuota que las fotos de platos. Sólo viaja el nombre normalizado del ingrediente. */
export async function generateIngredientCoverImage(key: string): Promise<RecipeCoverResult> {
  if (!isKnownIngredientKey(key)) return { status: 'failed' };
  return generateCoverFromPrompt(ingredientCoverPrompt(key), ingredientCoverAlt(key));
}
