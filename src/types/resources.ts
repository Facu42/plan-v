import { z } from 'zod';

export const RESOURCE_KINDS = ['operational', 'clinical'] as const;
export type ResourceKind = (typeof RESOURCE_KINDS)[number];

export const FAVORITE_KINDS = ['resource', 'article', 'recipe', 'plan_b'] as const;
export type FavoriteKind = (typeof FAVORITE_KINDS)[number];

export const LICENSE_KINDS = ['internal_operational', 'placeholder', 'declared'] as const;
export type LicenseKind = (typeof LICENSE_KINDS)[number];

export type EditorialSection = { title: string; body: string };

export type EditorialResource = {
  id: string;
  slug: string;
  kind: ResourceKind;
  nutritionist_id?: string | null;
  title: string;
  category: string;
  eyebrow: string;
  summary: string;
  minutes: number;
  icon: string;
  tags: string[];
  sections: EditorialSection[];
  related: string[];
  action_label: string;
  action_page: string;
  author_name: string;
  reviewed_at: string | null;
  published: boolean;
  license_kind: LicenseKind;
  license_note: string;
  cover_url: string | null;
};

export type ResourceAssignmentView = {
  id: string;
  patient_id: string;
  resource_id: string;
  slug: string;
  assigned_at: string;
  read_at: string | null;
};

export type FavoriteView = {
  id: string;
  patient_id: string;
  item_kind: FavoriteKind;
  item_id: string;
  title: string;
  created_at: string;
};

export type LibraryHit = {
  kind: FavoriteKind;
  id: string;
  title: string;
  summary: string;
  category: string;
};

export type PatientLibraryView = {
  patient_id: string;
  resources: EditorialResource[];
  articles: EditorialResource[];
  recipes: Array<{ id: string; title: string; assigned_at: string }>;
  plan_b: { patient_id: string; title: string } | null;
  assignments: ResourceAssignmentView[];
  favorites: FavoriteView[];
  hits: LibraryHit[];
};

const LICENSE_OPERATIONAL = {
  license_kind: 'internal_operational' as const,
  license_note: 'Texto original de Plan V. Sin imagen de terceros ni URL remota.',
  cover_url: null,
  author_name: 'Plan V',
  reviewed_at: '2026-09-16T12:00:00.000Z',
  published: true,
};

export const SEEDED_OPERATIONAL_RESOURCES: EditorialResource[] = [
  {
    id: '22222222-2222-4222-a222-000000000001',
    slug: 'leer-plan-semanal',
    kind: 'operational',
    title: 'Cómo leer tu plan semanal',
    category: 'Mi plan',
    eyebrow: 'EMPEZÁ POR ACÁ',
    summary: 'Ubicá cada indicación por día y momento, buscá títulos y consultá cualquier cambio con tu nutricionista.',
    minutes: 3,
    icon: 'list',
    tags: ['plan semanal', 'días', 'comidas'],
    related: ['compras-desde-plan', 'registrar-comida'],
    action_label: 'Abrir mi plan',
    action_page: 'plan',
    sections: [
      { title: 'Una semana, siete días', body: 'En Mi plan podés recorrer los siete días publicados por tu nutricionista. Cada tarjeta conserva el título y el momento de comida que forman parte del plan vigente.' },
      { title: 'Sólo mostramos lo que fue indicado', body: 'Plan V no completa por su cuenta porciones, cantidades ni información nutricional. Si una indicación necesita más detalle, usá Mensajes para consultarlo.' },
      { title: 'Encontrá una preparación', body: 'El buscador recorre títulos, días y momentos. Menú saludable reúne los mismos títulos para ver rápidamente dónde aparecen durante la semana.' },
    ],
    ...LICENSE_OPERATIONAL,
  },
  {
    id: '22222222-2222-4222-a222-000000000002',
    slug: 'registrar-comida',
    kind: 'operational',
    title: 'Registrar una comida sin perder contexto',
    category: 'Diario',
    eyebrow: 'TU REGISTRO',
    minutes: 2,
    icon: 'camera',
    summary: 'Sumá una foto o una descripción al Diario para compartir el registro con tu nutricionista.',
    tags: ['diario', 'foto', 'seguimiento'],
    related: ['leer-plan-semanal', 'progreso-semanal'],
    action_label: 'Abrir mi diario',
    action_page: 'diario',
    sections: [
      { title: 'Foto o descripción', body: 'Elegí el momento de comida y registrá una foto o un texto. La entrada queda asociada a tu ficha y visible para la profesional que te acompaña.' },
      { title: 'Revisión profesional', body: 'Cuando exista una revisión, el Diario muestra únicamente la devolución habilitada para vos. Las notas privadas de trabajo profesional permanecen fuera de tu vista.' },
      { title: 'Análisis disponible', body: 'Si el análisis asistido está habilitado, Plan V lo procesa dentro del circuito existente. Si no está disponible, tu registro igualmente conserva el contenido que enviaste.' },
    ],
    ...LICENSE_OPERATIONAL,
  },
  {
    id: '22222222-2222-4222-a222-000000000003',
    slug: 'compras-desde-plan',
    kind: 'operational',
    title: 'Preparar la compra desde el plan',
    category: 'Organización',
    eyebrow: 'ORGANIZÁ TU SEMANA',
    minutes: 2,
    icon: 'check',
    summary: 'Usá la lista derivada del plan vigente y marcá en este dispositivo lo que ya resolviste.',
    tags: ['compras', 'organización', 'plan'],
    related: ['leer-plan-semanal', 'registrar-comida'],
    action_label: 'Abrir lista de compras',
    action_page: 'compras',
    sections: [
      { title: 'Una ayuda basada en tu plan', body: 'La lista reúne conservadoramente los títulos publicados para la semana y los organiza para facilitar el repaso antes de comprar.' },
      { title: 'Sin cantidades inventadas', body: 'Si el plan no incluye ingredientes, cantidades o unidades, la lista tampoco los agrega. Ante una duda sobre qué comprar, consultá a tu nutricionista.' },
      { title: 'Checklist de este dispositivo', body: 'Las marcas de completado son una comodidad local, separada de tu información clínica. Podés reiniciarlas cuando empiece una nueva compra.' },
    ],
    ...LICENSE_OPERATIONAL,
  },
  {
    id: '22222222-2222-4222-a222-000000000004',
    slug: 'contacto-nutricionista',
    kind: 'operational',
    title: 'Coordinar con tu nutricionista',
    category: 'Acompañamiento',
    eyebrow: 'SEGUÍ EN CONTACTO',
    minutes: 2,
    icon: 'message',
    summary: 'Encontrá tu próxima consulta y mantené la conversación en el mismo hilo privado de Plan V.',
    tags: ['mensajes', 'agenda', 'consulta'],
    related: ['leer-plan-semanal', 'registrar-comida'],
    action_label: 'Abrir mensajes',
    action_page: 'mensajes',
    sections: [
      { title: 'Una conversación continua', body: 'Mensajes conserva el intercambio con tu nutricionista dentro de tu ficha. Es el lugar indicado para consultar una indicación o compartir contexto.' },
      { title: 'Tu próxima consulta', body: 'Agenda muestra la próxima ocurrencia disponible, junto con modalidad y duración cuando esos datos fueron definidos por la profesional.' },
      { title: 'Sin estados supuestos', body: 'Plan V no muestra confirmaciones de lectura o entrega que todavía no estén persistidas. El hilo presenta únicamente los mensajes disponibles.' },
    ],
    ...LICENSE_OPERATIONAL,
  },
  {
    id: '22222222-2222-4222-a222-000000000005',
    slug: 'progreso-semanal',
    kind: 'operational',
    title: 'Entender tu progreso semanal',
    category: 'Seguimiento',
    eyebrow: 'TUS ÚLTIMOS DÍAS',
    minutes: 3,
    icon: 'trend',
    summary: 'Revisá los registros disponibles de los últimos siete días sin confundirlos con una evaluación clínica.',
    tags: ['progreso', 'hábitos', 'semana'],
    related: ['registrar-comida', 'actividad-autodeclarada'],
    action_label: 'Ver mi progreso',
    action_page: 'progreso',
    sections: [
      { title: 'Una ventana de siete días', body: 'Progreso organiza los datos que ya existen en tu ficha para mostrar una vista breve de comidas revisadas y hábitos registrados.' },
      { title: 'Datos disponibles, no estimaciones', body: 'Cuando falta un registro, Plan V no lo completa ni lo reemplaza con valores aproximados. La vista se limita a la información disponible.' },
      { title: 'Contexto para conversar', body: 'Usá esta pantalla como apoyo para reconocer patrones y preparar preguntas. La interpretación profesional corresponde a tu nutricionista.' },
    ],
    ...LICENSE_OPERATIONAL,
  },
  {
    id: '22222222-2222-4222-a222-000000000006',
    slug: 'actividad-autodeclarada',
    kind: 'operational',
    title: 'Registrar actividad autodeclarada',
    category: 'Movimiento',
    eyebrow: 'TU ACTIVIDAD',
    minutes: 2,
    icon: 'heart',
    summary: 'Anotá tipo, duración e intensidad percibida sin convertir el registro en una rutina indicada.',
    tags: ['actividad', 'duración', 'intensidad'],
    related: ['progreso-semanal', 'contacto-nutricionista'],
    action_label: 'Registrar actividad',
    action_page: 'ejercicio',
    sections: [
      { title: 'Contá lo que hiciste', body: 'Podés registrar el nombre de la actividad, los minutos, la intensidad que percibiste y una nota opcional.' },
      { title: 'Un registro personal', body: 'La pantalla conserva lo que declaraste y lo comparte con tu nutricionista. No agrega distancia, pasos, frecuencia cardíaca ni otros resultados que no ingresaste.' },
      { title: 'Separado de una rutina', body: 'Anotar una actividad no crea una recomendación ni reemplaza la indicación de una persona habilitada para trabajar sobre ejercicio.' },
    ],
    ...LICENSE_OPERATIONAL,
  },
];

const LICENSE_CLINICAL = {
  license_kind: 'placeholder' as const,
  license_note: 'Artículo revisado de Plan V. Portada ilustrativa local; no hay imagen licenciada remota.',
  cover_url: null,
  author_name: 'Equipo editorial Plan V',
  reviewed_at: '2026-09-16T15:00:00.000Z',
  published: true,
};

export const SEEDED_CLINICAL_ARTICLES: EditorialResource[] = [
  {
    id: '33333333-3333-4333-a333-000000000001',
    slug: 'hidratacion-cotidiana',
    kind: 'clinical',
    title: 'Registrar agua sin convertirla en una pauta',
    category: 'Hábitos',
    eyebrow: 'ARTÍCULO REVISADO',
    minutes: 4,
    icon: 'sparkle',
    summary: 'Cómo usar el registro de hidratación de Plan V para conversar con tu nutricionista, sin cantidades prescritas por la app.',
    tags: ['agua', 'hábitos', 'registro'],
    related: ['progreso-semanal'],
    action_label: 'Ver mi progreso',
    action_page: 'progreso',
    sections: [
      { title: 'Lo que sí registra Plan V', body: 'El vaso de hidratación cuenta lo que vos marcás. No estima sed, no completa vasos faltantes y no convierte el recuento en una indicación clínica.' },
      { title: 'Autoría y revisión', body: 'Este artículo fue escrito por el equipo editorial de Plan V y marcado como revisado antes de publicarse. No se publica solo desde un borrador de IA.' },
      { title: 'Qué consultar', body: 'Si tu profesional indicó una cantidad o un horario, esa indicación vive en el plan o en Mensajes. Este texto no la reemplaza ni la infiere.' },
    ],
    ...LICENSE_CLINICAL,
  },
  {
    id: '33333333-3333-4333-a333-000000000002',
    slug: 'comidas-fuera-de-casa',
    kind: 'clinical',
    title: 'Comer fuera con el plan publicado',
    category: 'Organización',
    eyebrow: 'ARTÍCULO REVISADO',
    minutes: 4,
    icon: 'leaf',
    summary: 'Cómo apoyarte en el plan vigente cuando comés fuera, sin que Plan V arme un menú alternativo por su cuenta.',
    tags: ['plan', 'fuera de casa', 'organización'],
    related: ['leer-plan-semanal', 'compras-desde-plan'],
    action_label: 'Abrir mi plan',
    action_page: 'plan',
    sections: [
      { title: 'Partí del plan publicado', body: 'Si hay un título o un momento publicado para ese día, usalo como referencia. Plan V no inventa un plato equivalente ni calcula porciones de un restaurante.' },
      { title: 'Registro honesto', body: 'Si comiste algo distinto, el Diario admite foto o texto. Eso no cambia el plan vigente ni genera una receta nueva.' },
      { title: 'Límite editorial', body: 'Este artículo no diagnostica intolerancias ni prescribe un reemplazo. La decisión clínica queda en tu nutricionista.' },
    ],
    ...LICENSE_CLINICAL,
  },
];

export const SEEDED_RESOURCES: EditorialResource[] = [
  ...SEEDED_OPERATIONAL_RESOURCES,
  ...SEEDED_CLINICAL_ARTICLES,
];

export const favoriteInputSchema = z.object({
  item_kind: z.enum(FAVORITE_KINDS),
  item_id: z.string().trim().min(1).max(80),
}).strict();

export const resourceSlugSchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/);

export function favoriteKindForResource(kind: ResourceKind): Exclude<FavoriteKind, 'recipe' | 'plan_b'> {
  return kind === 'clinical' ? 'article' : 'resource';
}

export function normalizeLibraryQuery(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');
}

export function resourceMatchesQuery(entry: Pick<EditorialResource, 'title' | 'category' | 'summary' | 'tags'>, query: string) {
  const term = normalizeLibraryQuery(query);
  if (!term) return true;
  return normalizeLibraryQuery(`${entry.title} ${entry.category} ${entry.summary} ${entry.tags.join(' ')}`).includes(term);
}
