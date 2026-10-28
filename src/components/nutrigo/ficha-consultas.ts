// Lo que la solapa «Consultas y notas» de la Ficha calcula con los turnos y las notas reales: asistencia, línea de consultas y nota SOAP.
import type { ConsultationAppointmentCompletion, ConsultationSession, ConsultationSharedSummary } from '../../types/consultations';

export type EstadoConsulta = { texto: string; clase: string; tono: '' | 'a' | 'r' | 'n' };
export type FilaConsulta = { id: string; fecha: string; sub: string; estado: EstadoConsulta; sesionId: string | null };

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const enArgentina = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3600_000);
export const fechaCorta = (iso: string) => { const f = enArgentina(iso); return `${f.getUTCDate()}/${f.getUTCMonth() + 1}`; };
export const fechaCortaConCero = (iso: string) => { const f = enArgentina(iso); return `${String(f.getUTCDate()).padStart(2, '0')}/${String(f.getUTCMonth() + 1).padStart(2, '0')}`; };
export const horaCorta = (iso: string) => { const f = enArgentina(iso); return `${String(f.getUTCHours()).padStart(2, '0')}:${String(f.getUTCMinutes()).padStart(2, '0')}`; };
export const diaYFecha = (iso: string) => `${DIAS[enArgentina(iso).getUTCDay()]} ${fechaCorta(iso)}`;
export const mesDe = (iso: string) => MESES[enArgentina(iso).getUTCMonth()] ?? '';
export const canalTexto = (canal: string) => (canal === 'video' ? 'videollamada' : 'consultorio');

/** Los turnos más viejos primero: el primero de todos es la «Primera consulta». */
const cronologicos = (turnos: readonly ConsultationAppointmentCompletion[]) => [...turnos].sort((a, b) => a.starts_at.localeCompare(b.starts_at));

export function tipoDeConsulta(turno: ConsultationAppointmentCompletion, turnos: readonly ConsultationAppointmentCompletion[]): string {
  const primero = cronologicos(turnos).find(t => t.status !== 'cancelled');
  return primero?.appointment_id === turno.appointment_id ? 'Primera consulta' : 'Seguimiento';
}

export function estadoDeConsulta(turno: ConsultationAppointmentCompletion, sesion: ConsultationSession | undefined, publicada: boolean, ahora: Date): EstadoConsulta {
  if (turno.status === 'cancelled') return { texto: 'Cancelada', clase: 'p-bad', tono: 'r' };
  if (Date.parse(turno.starts_at) > ahora.getTime()) return { texto: 'Próxima', clase: 'p-now', tono: 'n' };
  if (publicada) return { texto: 'Publicada', clase: 'p-conf', tono: '' };
  if (sesion) return { texto: 'Nota por aprobar', clase: 'p-wait', tono: 'a' };
  if (turno.completed) return { texto: 'Realizada', clase: 'p-conf', tono: '' };
  return { texto: 'Sin confirmar', clase: 'p-wait', tono: '' };
}

/** Las consultas ya ocurridas (o canceladas), la más reciente primero, con su nota si hay. */
export function filasDeConsultas(turnos: readonly ConsultationAppointmentCompletion[], sesiones: readonly ConsultationSession[], publicadas: readonly ConsultationSharedSummary[], ahora: Date): FilaConsulta[] {
  return [...turnos].filter(t => Date.parse(t.starts_at) <= ahora.getTime()).sort((a, b) => b.starts_at.localeCompare(a.starts_at)).map(turno => {
    const sesion = sesiones.find(s => s.appointment_id === turno.appointment_id);
    const publicada = Boolean(sesion && publicadas.some(p => p.session_id === sesion.id));
    return { id: turno.appointment_id, fecha: fechaCorta(turno.starts_at), sub: `${tipoDeConsulta(turno, turnos)} · ${canalTexto(turno.channel)}`, estado: estadoDeConsulta(turno, sesion, publicada, ahora), sesionId: sesion?.id ?? null };
  });
}

export type Asistencia = { pct: number; realizadas: number; canceladas: number; desde: string | null; proxima: string | null };
export function asistenciaDe(turnos: readonly ConsultationAppointmentCompletion[], ahora: Date): Asistencia {
  const pasados = turnos.filter(t => Date.parse(t.starts_at) <= ahora.getTime());
  const canceladas = pasados.filter(t => t.status === 'cancelled').length;
  const realizadas = pasados.filter(t => t.status !== 'cancelled' && t.completed).length;
  const total = realizadas + canceladas;
  const primero = cronologicos(turnos)[0];
  const proxima = proximoTurno(turnos, ahora);
  return { pct: total ? Math.round((realizadas / total) * 100) : 0, realizadas, canceladas, desde: primero ? mesDe(primero.starts_at) : null, proxima: proxima ? fechaCorta(proxima.starts_at) : null };
}

/** El turno más cercano que todavía no pasó (o el de hoy que sigue en curso), sin cancelar. */
export function proximoTurno(turnos: readonly ConsultationAppointmentCompletion[], ahora: Date): ConsultationAppointmentCompletion | null {
  const limite = ahora.getTime() - 60 * 60_000;
  return cronologicos(turnos).find(t => t.status !== 'cancelled' && !t.completed && Date.parse(t.starts_at) >= limite) ?? null;
}

const SECCIONES = [['S', 'Subjetivo'], ['O', 'Objetivo'], ['A', 'Análisis'], ['P', 'Plan']] as const;
export type BloqueNota = { l: string; t: string; d: string };

/** Parte la nota en S, O, A y P si trae esos encabezados («S:», «Subjetivo:»…). Sin encabezados, la nota entera queda en un solo bloque. */
export function partirNota(texto: string): BloqueNota[] {
  const limpio = texto.replace(/\r/g, '').trim();
  const encabezado = /^\s*(?:(S|O|A|P)|(Subjetivo|Objetivo|An[aá]lisis|Plan))\s*[:\-–.]\s*/i;
  const bloques = new Map<string, string[]>();
  let actual: string | null = null;
  for (const linea of limpio.split('\n')) {
    const m = encabezado.exec(linea);
    if (m) {
      const clave = (m[1] ?? m[2]!).charAt(0).toUpperCase();
      actual = clave;
      bloques.set(clave, [...(bloques.get(clave) ?? []), linea.slice(m[0].length)]);
    } else if (actual) bloques.set(actual, [...(bloques.get(actual) ?? []), linea]);
  }
  if (!bloques.size) return [{ l: 'N', t: 'Nota', d: limpio || 'Sin escribir todavía.' }];
  return SECCIONES.map(([l, t]) => ({ l, t, d: (bloques.get(l) ?? []).join(' ').replace(/\s+/g, ' ').trim() || 'Sin escribir todavía.' }));
}

export const PLANTILLA_SOAP = 'S: \nO: \nA: \nP: ';

/** Los acuerdos que salen del apartado «Plan» de la nota: una frase cada uno. */
export function acuerdosDeNota(texto: string): string[] {
  const plan = partirNota(texto).find(b => b.l === 'P');
  if (!plan || plan.d === 'Sin escribir todavía.') return [];
  return plan.d.split(/(?<=[.;])\s+/).map(f => f.replace(/[.;]\s*$/, '').trim()).filter(f => f.length > 3 && !/^próxima consulta/i.test(f)).slice(0, 6);
}

/** Lo que ve la paciente: la nota tal cual la escribió la nutricionista más los acuerdos que tildó. */
export function versionParaPaciente(texto: string, acuerdos: readonly string[]): string {
  const base = texto.trim();
  return acuerdos.length ? `${base}\n\nAcuerdos:\n${acuerdos.map(a => `- ${a}`).join('\n')}` : base;
}

export function textoCertificado(paciente: string, fecha: string, profesional: string): string {
  return `Certifico que ${paciente} asistió a una consulta nutricional el ${fecha}.\n\n${profesional}`;
}

/** Cuatro semanas después de la última consulta, el mismo día de la semana y a la misma hora. */
export function sugerirProximoTurno(turnos: readonly ConsultationAppointmentCompletion[], ahora: Date): string | null {
  const ultimo = [...turnos].filter(t => t.status !== 'cancelled' && Date.parse(t.starts_at) <= ahora.getTime()).sort((a, b) => b.starts_at.localeCompare(a.starts_at))[0];
  if (!ultimo) return null;
  let cuando = new Date(Date.parse(ultimo.starts_at) + 28 * 86_400_000);
  while (cuando.getTime() < ahora.getTime()) cuando = new Date(cuando.getTime() + 7 * 86_400_000);
  const iso = cuando.toISOString();
  return `${diaYFecha(iso)}, ${horaCorta(iso)}`;
}
