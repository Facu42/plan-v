const STRIP = /[\u0300-\u036f]/g;

export function normalizeClinicalToken(value: string): string {
  return value
    .trim()
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(STRIP, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

const ALLERGEN_ALIASES: Record<string, readonly string[]> = {
  mani: ['mani', 'cacahuate', 'cacahuete', 'peanut', 'peanuts'],
  leche: ['leche', 'lacteo', 'lacteos', 'lactosa', 'dairy', 'yogur', 'yogurt', 'queso', 'manteca', 'crema'],
  huevo: ['huevo', 'huevos', 'egg', 'eggs', 'clara'],
  gluten: ['gluten', 'trigo', 'harina', 'tacc', 'cebada', 'centeno'],
  soja: ['soja', 'soya', 'soy'],
  pescado: ['pescado', 'merluza', 'atun', 'salmon', 'caballa'],
  marisco: ['marisco', 'mariscos', 'camaron', 'langostino', 'shrimp', 'gamba'],
  nuez: ['nuez', 'nueces', 'walnut', 'almendra', 'almendras', 'castana', 'avellana', 'pecan'],
  sesamo: ['sesamo', 'ajonjoli', 'tahini'],
};

const RESTRICTION_CONTRADICTIONS: Record<string, readonly string[]> = {
  vegetariano: ['pollo', 'carne', 'pescado', 'cerdo', 'vaca', 'vacuno', 'jamon', 'salmon', 'atun', 'merluza', 'cordero'],
  vegano: ['pollo', 'carne', 'pescado', 'cerdo', 'huevo', 'leche', 'queso', 'yogur', 'yogurt', 'miel', 'manteca'],
  gluten: ALLERGEN_ALIASES.gluten,
  tacc: ALLERGEN_ALIASES.gluten,
  trigo: ALLERGEN_ALIASES.gluten,
};

const STOP = new Set(['sin', 'con', 'para', 'una', 'las', 'los', 'del', 'por', 'que', 'the', 'and', 'de']);

function aliasesFor(token: string, extra: Record<string, readonly string[]>): string[] {
  const normalized = normalizeClinicalToken(token);
  if (!normalized) return [];
  const words = normalized.split(' ').filter((word) => word.length >= 3 && !STOP.has(word));
  const found = new Set<string>();
  for (const word of words.length ? words : [normalized]) {
    if (STOP.has(word)) continue;
    const group = extra[word] ?? ALLERGEN_ALIASES[word];
    if (group) for (const alias of group) found.add(alias);
    else if (word.length >= 3) found.add(word);
  }
  return [...found];
}

export function allergenTokens(item: string): string[] {
  return aliasesFor(item, ALLERGEN_ALIASES);
}

export function restrictionTokens(item: string): string[] {
  return aliasesFor(item, { ...ALLERGEN_ALIASES, ...RESTRICTION_CONTRADICTIONS });
}

export function tokenizeHaystack(text: string): Set<string> {
  const normalized = normalizeClinicalToken(text);
  return new Set(normalized.split(' ').filter((word) => word.length >= 3));
}

export function haystackContains(haystack: string, tokens: readonly string[]): string | null {
  const words = tokenizeHaystack(haystack);
  for (const token of tokens) {
    if (token.length >= 3 && words.has(token)) return token;
  }
  return null;
}
