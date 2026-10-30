import type { Patient } from '../../types';
import { eachIsoDate, planWeekIndex, type PlanVersionView, type ProfessionalMealPlan } from '../../types/plans';

/** Lo que la parte 1 muestra. El editor y el asistente quedan para las partes 2 y 3. */
export type VistaPlanes = 'lista' | 'plan' | 'recetas' | 'plantillas' | 'equivalencias';
export type EstadoPlan = 'Sin plan' | 'Borrador' | 'Por vencer' | 'Publicado';
export type FiltroPlanes = 'todos' | 'publicados' | 'borradores' | 'por-vencer' | 'sin-plan';
export type OrdenPlanes = 'nombre' | 'atencion';

export const FILTROS_PLANES: Array<{ id: FiltroPlanes; etiqueta: string; estado?: EstadoPlan }> = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'publicados', etiqueta: 'Publicados', estado: 'Publicado' },
  { id: 'borradores', etiqueta: 'Borradores', estado: 'Borrador' },
  { id: 'por-vencer', etiqueta: 'Por vencer', estado: 'Por vencer' },
  { id: 'sin-plan', etiqueta: 'Sin plan', estado: 'Sin plan' },
];

const ORDEN_ATENCION: EstadoPlan[] = ['Sin plan', 'Borrador', 'Por vencer', 'Publicado'];

export type FilaPlan = {
  id: string;
  nombre: string;
  iniciales: string;
  tono: Patient['tone'];
  titulo: string;
  objetivo: string;
  estado: EstadoPlan;
  clase: 'p-conf' | 'p-wait' | 'p-bad';
  semana: string;
  accion: 'Crear plan' | 'Abrir plan';
};

const FONDO: Record<Patient['tone'], string> = { mint: '#D6EBA3', lilac: '#E4DDF2', peach: '#F1E3C4' };

export function fondoAvatar(tono: Patient['tone']) {
  return FONDO[tono];
}

export function hoyArgentina(ahora = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(ahora);
}

export function diasHasta(desde: string, hasta: string) {
  const inicio = Date.UTC(Number(desde.slice(0, 4)), Number(desde.slice(5, 7)) - 1, Number(desde.slice(8, 10)));
  const fin = Date.UTC(Number(hasta.slice(0, 4)), Number(hasta.slice(5, 7)) - 1, Number(hasta.slice(8, 10)));
  return Math.round((fin - inicio) / 86_400_000);
}

export function normalizarBusqueda(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function textoSemana(inicio: string, fin: string, hoy: string) {
  const dias = eachIsoDate(inicio, fin);
  if (!dias.length) return '—';
  const semanas = Math.max(1, Math.ceil(dias.length / 7));
  return `${planWeekIndex(inicio, fin, hoy) + 1} de ${semanas}`;
}

function claseDe(estado: EstadoPlan): FilaPlan['clase'] {
  if (estado === 'Publicado') return 'p-conf';
  if (estado === 'Sin plan') return 'p-bad';
  return 'p-wait';
}

function tituloDe(version: PlanVersionView | null, estado: EstadoPlan) {
  const kcal = version?.nutrition_target?.kcal;
  if (typeof kcal === 'number') return `${kcal.toLocaleString('es-AR')} kcal por día`;
  if (estado === 'Borrador') return 'Borrador sin publicar';
  if (estado === 'Sin plan') return 'Sin plan todavía';
  return 'Plan publicado';
}

export function estadoDePlan(plan: Pick<ProfessionalMealPlan, 'current' | 'published'> | null, hoy: string) {
  if (!plan) return { estado: 'Sin plan' as const, version: null };
  const publicado = plan.published && plan.published.status !== 'archived' ? plan.published : null;
  if (publicado && diasHasta(hoy, publicado.period_end) <= 7) return { estado: 'Por vencer' as const, version: publicado };
  if (plan.current.status === 'draft') return { estado: 'Borrador' as const, version: plan.current };
  if (publicado) return { estado: 'Publicado' as const, version: publicado };
  if (plan.current.status === 'published') {
    if (diasHasta(hoy, plan.current.period_end) <= 7) return { estado: 'Por vencer' as const, version: plan.current };
    return { estado: 'Publicado' as const, version: plan.current };
  }
  return { estado: 'Borrador' as const, version: plan.current };
}

function armar(patient: Pick<Patient, 'id' | 'name' | 'initials' | 'tone' | 'goal'>, estado: EstadoPlan, titulo: string, semana: string): FilaPlan {
  return {
    id: patient.id,
    nombre: patient.name,
    iniciales: patient.initials,
    tono: patient.tone,
    titulo,
    objetivo: patient.goal.trim() || 'Sin objetivo cargado',
    estado,
    clase: claseDe(estado),
    semana,
    accion: estado === 'Sin plan' ? 'Crear plan' : 'Abrir plan',
  };
}

/** Antes de leer el plan guardado: si la semana de la ficha tiene comidas, se muestra publicado. */
export function filaProvisoria(patient: Pick<Patient, 'id' | 'name' | 'initials' | 'tone' | 'goal' | 'weekPlan'>, hoy: string) {
  const tiene = patient.weekPlan.some(dia => dia.meals.length > 0);
  return armar(patient, tiene ? 'Publicado' : 'Sin plan', tiene ? 'Plan publicado' : 'Sin plan todavía', '—');
}

export function filaDePlan(
  patient: Pick<Patient, 'id' | 'name' | 'initials' | 'tone' | 'goal' | 'weekPlan'>,
  plan: Pick<ProfessionalMealPlan, 'current' | 'published'> | null,
  hoy: string,
) {
  const { estado, version } = estadoDePlan(plan, hoy);
  const semana = version ? textoSemana(version.period_start, version.period_end, hoy) : '—';
  return armar(patient, estado, tituloDe(version, estado), semana);
}

function nombreOrden(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, 'es');
}

export function primerNombrePlanes(patients: Array<Pick<Patient, 'id' | 'name'>>, selectedId = '') {
  const elegida = patients.find(persona => persona.id === selectedId)
    ?? [...patients].sort(nombreOrden)[0];
  return elegida?.name.split(/\s+/)[0] || 'la paciente';
}

export function coincideFiltro(fila: FilaPlan, filtro: FiltroPlanes) {
  const pedido = FILTROS_PLANES.find(item => item.id === filtro);
  return !pedido?.estado || fila.estado === pedido.estado;
}

export function conteoFiltro(filas: FilaPlan[], filtro: FiltroPlanes) {
  return filas.filter(fila => coincideFiltro(fila, filtro)).length;
}

export function filasVisibles(filas: FilaPlan[], filtro: FiltroPlanes, orden: OrdenPlanes, consulta: string) {
  const busqueda = normalizarBusqueda(consulta.trim());
  const lista = filas.filter(fila => coincideFiltro(fila, filtro) && (
    !busqueda || normalizarBusqueda(`${fila.nombre} ${fila.titulo} ${fila.objetivo}`).includes(busqueda)
  ));
  return [...lista].sort((a, b) => {
    if (orden === 'atencion') {
      const diferencia = ORDEN_ATENCION.indexOf(a.estado) - ORDEN_ATENCION.indexOf(b.estado);
      if (diferencia) return diferencia;
    }
    return a.nombre.localeCompare(b.nombre, 'es');
  });
}

export function proximasAcciones(filas: FilaPlan[]) {
  return filas.filter(fila => fila.estado === 'Sin plan' || fila.estado === 'Borrador' || fila.estado === 'Por vencer');
}

export function textoAccion(fila: FilaPlan) {
  if (fila.estado === 'Sin plan') return 'Crear su primer plan';
  if (fila.estado === 'Borrador') return 'Revisar el borrador';
  return 'Renovar esta semana';
}

export function etiquetaAlta(vista: VistaPlanes) {
  return vista === 'plantillas' ? 'Nueva plantilla' : 'Nuevo plan';
}

/** El editor que ya existía sigue en estos enlaces. El listado es el resto de Planes. */
export function planesMuestraEditor(params: URLSearchParams) {
  if (params.get('propuesta')) return true;
  if (params.get('editor') === '1') return true;
  return Boolean(params.get('paciente')) && !params.get('planes');
}
