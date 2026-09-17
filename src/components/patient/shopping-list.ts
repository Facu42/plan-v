export type ShoppingMeal = { title: string; detail?: string | null };

export type ShoppingCategory =
  | 'Verdulería'
  | 'Proteínas'
  | 'Lácteos'
  | 'Panadería y cereales'
  | 'Almacén'
  | 'Otros';

export type ShoppingItem = {
  id: string;
  label: string;
  category: ShoppingCategory;
  occurrences: number;
};

export type ShoppingGroup = {
  category: ShoppingCategory;
  items: ShoppingItem[];
};

const CATEGORY_ORDER: ShoppingCategory[] = [
  'Verdulería',
  'Proteínas',
  'Lácteos',
  'Panadería y cereales',
  'Almacén',
  'Otros',
];

const INGREDIENT_RULES: readonly {
  id: string;
  label: string;
  category: ShoppingCategory;
  pattern: RegExp;
}[] = [
  { id: 'verduras-variadas', label: 'Verduras variadas', category: 'Verdulería', pattern: /\b(verdura|verduras|vegetal|vegetales|ensalada)\b/ },
  { id: 'fruta-fresca', label: 'Fruta fresca', category: 'Verdulería', pattern: /\b(fruta|frutas|banana)\b/ },
  { id: 'palta', label: 'Palta', category: 'Verdulería', pattern: /\bpalta\b/ },
  { id: 'zapallo', label: 'Zapallo', category: 'Verdulería', pattern: /\bzapallo\b/ },
  { id: 'pollo', label: 'Pollo', category: 'Proteínas', pattern: /\b(pollo|milanesa)\b/ },
  { id: 'huevos', label: 'Huevos', category: 'Proteínas', pattern: /\b(huevo|huevos|tortilla|omelette)\b/ },
  { id: 'pescado', label: 'Pescado', category: 'Proteínas', pattern: /\b(pescado|atun)\b/ },
  { id: 'yogur', label: 'Yogur', category: 'Lácteos', pattern: /\byogur\b/ },
  { id: 'queso', label: 'Queso', category: 'Lácteos', pattern: /\bqueso\b/ },
  { id: 'pan-integral', label: 'Pan integral', category: 'Panadería y cereales', pattern: /\b(pan|tostada|tostadas|wrap)\b/ },
  { id: 'avena', label: 'Avena', category: 'Panadería y cereales', pattern: /\bavena\b/ },
  { id: 'arroz', label: 'Arroz', category: 'Panadería y cereales', pattern: /\barroz\b/ },
  { id: 'quinoa', label: 'Quinoa', category: 'Panadería y cereales', pattern: /\bquinoa\b/ },
  { id: 'pasta-integral', label: 'Pasta integral', category: 'Panadería y cereales', pattern: /\bpasta\b/ },
  { id: 'granola', label: 'Granola', category: 'Panadería y cereales', pattern: /\bgranola\b/ },
  { id: 'galletas-de-arroz', label: 'Galletas de arroz', category: 'Panadería y cereales', pattern: /\bgalletas? de arroz\b/ },
  { id: 'frutos-secos', label: 'Frutos secos', category: 'Almacén', pattern: /\b(nuez|nueces|frutos secos)\b/ },
  { id: 'semillas', label: 'Semillas', category: 'Almacén', pattern: /\bsemillas?\b/ },
  { id: 'lentejas', label: 'Lentejas', category: 'Almacén', pattern: /\blentejas?\b/ },
];

function normalized(value: string): string {
  return value
    .toLocaleLowerCase('es-AR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function slug(value: string): string {
  return normalized(value)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function buildShoppingList(meals: readonly ShoppingMeal[]): ShoppingGroup[] {
  const items = new Map<string, ShoppingItem>();

  for (const meal of meals) {
    const source = normalized(`${meal.title} ${meal.detail ?? ''}`);
    const matched = INGREDIENT_RULES.filter((rule) => rule.pattern.test(source));
    const ingredients = matched.length > 0 ? matched : [{
      id: `ingredientes-${slug(meal.title)}`,
      label: `Ingredientes para: ${meal.title}`,
      category: 'Otros' as const,
      pattern: /(?:)/,
    }];

    for (const ingredient of ingredients) {
      const current = items.get(ingredient.id);
      items.set(ingredient.id, {
        id: ingredient.id,
        label: ingredient.label,
        category: ingredient.category,
        occurrences: (current?.occurrences ?? 0) + 1,
      });
    }
  }

  return CATEGORY_ORDER.map((category) => ({
    category,
    items: [...items.values()]
      .filter((item) => item.category === category)
      .sort((a, b) => a.label.localeCompare(b.label, 'es-AR')),
  })).filter((group) => group.items.length > 0);
}

export function shoppingChecklistKey(patientId: string, weekId: string): string {
  return `plan-v:${patientId}:shopping:${weekId}`;
}

export function buildShoppingExport({
  label,
  range,
  groups,
  checkedIds,
}: {
  label: string;
  range: string;
  groups: readonly ShoppingGroup[];
  checkedIds: ReadonlySet<string>;
}): string {
  const lines = [`Lista de compras · ${label}`, range];

  for (const group of groups) {
    lines.push('', group.category.toLocaleUpperCase('es-AR'));
    for (const item of group.items) {
      const frequency = item.occurrences > 1 ? ` · aparece en ${item.occurrences} comidas` : '';
      lines.push(`[${checkedIds.has(item.id) ? 'x' : ' '}] ${item.label}${frequency}`);
    }
  }

  return `${lines.join('\n')}\n`;
}
