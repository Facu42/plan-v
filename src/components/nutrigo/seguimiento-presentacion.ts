import type { HabitLog, Macros, MealLog, Patient } from '../../types';
import type { WeeklyRegistration } from '../../types/weekly-registration';
import { symptomFrequency } from '../../types/symptoms';
import { HOME_ZONE } from '../../lib/panel-home';

const TONOS: Record<Patient['tone'], string> = { mint: '#D6EBA3', lilac: '#E4DDF2', peach: '#F1E3C4' };

export function fondoAvatar(tone: Patient['tone'] | undefined) {
  return tone ? TONOS[tone] : '#E7E4DC';
}

export function inicialesDe(name: string, initials?: string) {
  const propias = initials?.trim();
  if (propias) return propias;
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(parte => parte[0]?.toUpperCase() ?? '').join('') || '·';
}

export function comidaId(itemId: string) {
  return itemId.startsWith('meal:') ? itemId.slice('meal:'.length) : itemId;
}

export function fotoVisible(url: string | null | undefined) {
  if (!url) return null;
  return /^(https?:|data:|blob:)/i.test(url) ? url : null;
}

function diaClave(fecha: Date) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: HOME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}

function moverDia(clave: string, delta: number) {
  const [anio, mes, dia] = clave.split('-').map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia + delta)).toISOString().slice(0, 10);
}

/** «Hoy 8:10», «Ayer 21:40» o «25/10 13:05», en el huso del consultorio. */
export function mealWhen(iso: string, now = new Date()) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '';
  const hora = new Intl.DateTimeFormat('es-AR', { timeZone: HOME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(fecha);
  const dia = diaClave(fecha);
  const hoy = diaClave(now);
  if (dia === hoy) return `Hoy ${hora}`;
  if (dia === moverDia(hoy, -1)) return `Ayer ${hora}`;
  const [, mes, numero] = dia.split('-');
  return `${Number(numero)}/${Number(mes)} ${hora}`;
}

/** Sin macros no se inventa un cero. */
export function kcalLabel(macros: Macros | null | undefined) {
  if (!macros || !Number.isFinite(macros.kcal)) return null;
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(macros.kcal)} kcal`;
}

export function animoPill(energy: string) {
  const normal = energy.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  if (normal === 'baja' || normal === 'bajo') return 'p-bad';
  if (normal === 'alta' || normal === 'bien' || normal === 'con energia') return 'p-conf';
  return 'p-wait';
}

export function animoDe(logs: HabitLog[]) {
  if (!logs.length) return { text: 'Sin registros', className: 'p-wait' };
  const ultimo = [...logs].sort((a, b) => b.date.localeCompare(a.date)).find(dia => dia.energy?.trim());
  if (!ultimo?.energy) return { text: 'Sin dato', className: 'p-wait' };
  return { text: ultimo.energy, className: animoPill(ultimo.energy) };
}

export function suenoDe(logs: HabitLog[]) {
  const minutos = logs.map(dia => dia.sleep_minutes).filter((valor): valor is number => typeof valor === 'number' && valor > 0);
  if (!minutos.length) return 'Sin dato';
  const horas = minutos.reduce((total, valor) => total + valor, 0) / minutos.length / 60;
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(horas)} h`;
}

export function aguaDe(vasos: number | null | undefined) {
  if (vasos == null || !Number.isFinite(vasos)) return 'Sin dato';
  return `${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 }).format(vasos)} vasos`;
}

/** Sin hábitos en la lista, el dato está en la ficha. Con hábitos y sin marcas, no se inventa un síntoma. */
export function sintomasDe(logs: HabitLog[] | undefined) {
  if (!logs?.length) return 'en la ficha';
  const frecuentes = symptomFrequency(logs);
  if (!frecuentes.length) return 'Sin síntomas nuevos';
  return frecuentes.slice(0, 2).map(sintoma => `${sintoma.label} ${sintoma.days} ${sintoma.days === 1 ? 'día' : 'días'}`).join(', ');
}

function logsEnSemana(logs: HabitLog[], semana: WeeklyRegistration | null | undefined) {
  if (semana?.start && semana.end) return logs.filter(dia => dia.date >= semana.start && dia.date <= semana.end);
  return [...logs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7);
}

export type SentimientoFila = {
  id: string;
  name: string;
  initials: string;
  tone: Patient['tone'] | undefined;
  line: string;
  animo: string;
  pill: string;
  detail: string;
  href: string;
};

export function sentimientoDe(patient: Pick<Patient, 'id' | 'name' | 'initials' | 'tone' | 'habit_logs' | 'weekly_registration'>): SentimientoFila {
  const logs = patient.habit_logs ?? [];
  const semana = logs.length ? logsEnSemana(logs, patient.weekly_registration) : [];
  const agua = aguaDe(patient.weekly_registration?.water_average);
  const sueno = logs.length ? suenoDe(semana) : 'Sin dato';
  const sintomas = sintomasDe(logs.length ? semana : undefined);
  const animo = animoDe(logs.length ? semana : []);
  const dias = patient.weekly_registration?.recorded_days;
  return {
    id: patient.id,
    name: patient.name,
    initials: inicialesDe(patient.name, patient.initials),
    tone: patient.tone,
    line: `Agua ${agua} · sueño ${sueno} · ${sintomas}`,
    animo: animo.text,
    pill: animo.className,
    detail: `Ánimo: ${animo.text}. ${sintomas}. Agua ${agua} · sueño ${sueno} · días con registro: ${dias == null ? 'sin resumen' : `${dias} de 7`}.`,
    href: `/crm/ficha?${new URLSearchParams({ paciente: patient.id, seccion: 'evolucion' })}`,
  };
}

export type DiasFila = {
  id: string;
  name: string;
  initials: string;
  tone: Patient['tone'] | undefined;
  text: string;
  on: number | null;
};

/** `null` no es cero: el resumen no vino. Cero sí es «sin registros». */
export function diasEtiqueta(recorded: number | null | undefined): { text: string; on: number | null } {
  if (recorded == null || !Number.isFinite(recorded)) return { text: 'Resumen no disponible', on: null };
  const dias = Math.max(0, Math.min(7, Math.round(recorded)));
  if (dias === 0) return { text: '0 de 7 · sin registros', on: 0 };
  return { text: `${dias} de 7`, on: dias };
}

export function diasDe(patient: Pick<Patient, 'id' | 'name' | 'initials' | 'tone' | 'weekly_registration'>): DiasFila {
  const etiqueta = diasEtiqueta(patient.weekly_registration ? patient.weekly_registration.recorded_days : null);
  return {
    id: patient.id,
    name: patient.name,
    initials: inicialesDe(patient.name, patient.initials),
    tone: patient.tone,
    text: etiqueta.text,
    on: etiqueta.on,
  };
}

export type ComidaFila = {
  id: string;
  patientId: string;
  name: string;
  initials: string;
  tone: Patient['tone'] | undefined;
  slot: string;
  when: string;
  title: string;
  meta: string;
  photoUrl: string | null;
  href: string;
  log: MealLog | null;
};

export function armarComida(input: {
  id: string;
  patientId: string;
  patientName: string;
  slot: string;
  at: string;
  href: string;
  title: string;
  log: MealLog | null;
  patient?: Pick<Patient, 'initials' | 'tone'> | null;
  now?: Date;
}): ComidaFila {
  const kcal = kcalLabel(input.log?.macros);
  const nota = input.log?.note_for_nutri?.trim() ?? '';
  const when = mealWhen(input.at, input.now);
  const partes = [input.patientName, input.slot, when, kcal, nota].filter((parte): parte is string => Boolean(parte));
  return {
    id: input.id,
    patientId: input.patientId,
    name: input.patientName,
    initials: inicialesDe(input.patientName, input.patient?.initials),
    tone: input.patient?.tone,
    slot: input.slot,
    when,
    title: input.log?.description?.trim() || input.title,
    meta: partes.join(' · '),
    photoUrl: fotoVisible(input.log?.photo_url),
    href: input.href,
    log: input.log,
  };
}

export const COMIDAS_PEDIDO = ['Desayuno', 'Almuerzo', 'Merienda', 'Cena'] as const;

export function textoPedido(nombre: string, dias: 7 | 14, comidas: string[]) {
  const cuales = comidas.length ? comidas.join(', ') : 'las comidas';
  return `Hola${nombre ? ` ${nombre.split(/\s+/)[0]}` : ''}. ¿Podés cargar ${cuales} de los últimos ${dias} días? Lo vemos en la app.`;
}
