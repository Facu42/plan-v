/* Iconos del showroom, con los glifos del .fig.
 *
 * El archivo de Nutrigo usa Phosphor: los nombres de sus capas son literalmente
 * los de la librería (`Icon/Nav/SquaresFour`, `Icon/Special/PintGlass`, …), y los
 * diecisiete que aparecen en el frame existen en `@phosphor-icons/react` (MIT).
 *
 * No dibujamos los glifos a mano ni copiamos los SVG del pack: usamos la misma
 * librería de la que salieron, que además es la fuente original. El entorno no
 * puede bajar los assets exportados de figma.com (la política de red rechaza el
 * host), así que esta es también la única vía disponible acá.
 *
 * El mapa de abajo respeta la elección del archivo pantalla por pantalla. Donde
 * Plan V tiene una sección que Nutrigo no tiene, se elige de la misma familia.
 */
import {
  BowlFood, CalendarDots, CaretDown, ChartLineUp, ChatTeardropDots, Fire, Footprints,
  ForkKnife, Heartbeat, Lightning, MoonStars, Notebook, PersonSimpleTaiChi, PintGlass,
  ShoppingCart, SignOut, Speedometer, SquaresFour, UserPlus,
  type Icon as PhosphorIcon,
} from '@phosphor-icons/react';

/** Izquierda: sección de Plan V. Derecha: el icono que usa el .fig para esa sección. */
export const NV_ICONS = {
  inicio: SquaresFour,            // Dashboard
  agenda: CalendarDots,           // Calendar
  mensajes: ChatTeardropDots,     // Messages
  menu: ForkKnife,                // Healthy Menu
  plan: BowlFood,                 // Meal Plan
  diario: Notebook,               // Food Diary
  progreso: ChartLineUp,          // Progress
  ejercicio: PersonSimpleTaiChi,  // Exercises
  recursos: Heartbeat,            // Health Insights
  salir: SignOut,                 // Logout
  // Sin contraparte en Nutrigo; misma familia.
  compras: ShoppingCart,
  ingreso: UserPlus,
  // Iconos de tarjeta que el dashboard usa en las métricas.
  adherencia: Speedometer,
  pasos: Footprints,
  descanso: MoonStars,
  hidratacion: PintGlass,
  calorias: Lightning,
  quemadas: Fire,
  desplegar: CaretDown,
} satisfies Record<string, PhosphorIcon>;

export type NvIconName = keyof typeof NV_ICONS;

export function NvIcon({ name, size = 20, weight = 'regular' }: {
  name: NvIconName;
  /** El .fig usa 20 en la navegación y 14–16 dentro de las tarjetas. */
  size?: number;
  weight?: 'regular' | 'bold' | 'fill';
}) {
  const Glyph = NV_ICONS[name];
  return <Glyph size={size} weight={weight} aria-hidden />;
}
