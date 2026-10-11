/* Iconos del showroom, con los glifos del .fig.
 *
 * El archivo de Nutrigo usa Phosphor: los nombres de sus capas son literalmente
 * los de la librería (`Icon/Nav/SquaresFour`, `Icon/Special/PintGlass`, …), y los
 * diecisiete que aparecen en el frame existen en `@phosphor-icons/react` (MIT).
 *
 * Los glifos regulares son los SVG descargados del MCP del archivo Nutrigo.
 * Phosphor se conserva para pesos alternativos y secciones propias del CRM.
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

import sourceinicio from '../../assets/nutrigo/inicio.svg?no-inline';
import sourceagenda from '../../assets/nutrigo/agenda.svg?no-inline';
import sourcemensajes from '../../assets/nutrigo/mensajes.svg?no-inline';
import sourcemenu from '../../assets/nutrigo/menu.svg?no-inline';
import sourceplan from '../../assets/nutrigo/plan.svg?no-inline';
import sourcediario from '../../assets/nutrigo/diario.svg?no-inline';
import sourceprogreso from '../../assets/nutrigo/progreso.svg?no-inline';
import sourceejercicio from '../../assets/nutrigo/ejercicio.svg?no-inline';
import sourcerecursos from '../../assets/nutrigo/recursos.svg?no-inline';
import sourcesalir from '../../assets/nutrigo/salir.svg?no-inline';
import sourceadherencia from '../../assets/nutrigo/adherencia.svg?no-inline';
import sourcepasos from '../../assets/nutrigo/pasos.svg?no-inline';
import sourcedescanso from '../../assets/nutrigo/descanso.svg?no-inline';
import sourcehidratacion from '../../assets/nutrigo/hidratacion.svg?no-inline';
import sourcecalorias from '../../assets/nutrigo/calorias.svg?no-inline';
import sourcequemadas from '../../assets/nutrigo/quemadas.svg?no-inline';
import sourcedesplegar from '../../assets/nutrigo/desplegar.svg?no-inline';

const SOURCE_ICONS: Partial<Record<NvIconName, string>> = {
  inicio: sourceinicio,
  agenda: sourceagenda,
  mensajes: sourcemensajes,
  menu: sourcemenu,
  plan: sourceplan,
  diario: sourcediario,
  progreso: sourceprogreso,
  ejercicio: sourceejercicio,
  recursos: sourcerecursos,
  salir: sourcesalir,
  adherencia: sourceadherencia,
  pasos: sourcepasos,
  descanso: sourcedescanso,
  hidratacion: sourcehidratacion,
  calorias: sourcecalorias,
  quemadas: sourcequemadas,
  desplegar: sourcedesplegar,
};

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
  const source = SOURCE_ICONS[name];
  if (source && weight === 'regular') return <span className="nv-source-icon" style={{ width: size, height: size, maskImage: `url("${source}")` }} aria-hidden="true" />;
  const Glyph = NV_ICONS[name];
  return <Glyph size={size} weight={weight} aria-hidden />;
}
