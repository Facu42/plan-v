// «Mensaje a varias» del panel (v29): a quién le llega y cómo se manda. Cada paciente lo recibe por separado, como un chat.
import type { Patient } from '../../types';
import type { TagGroup } from '../../api/crm-work';
import type { BillingBoard } from '../../types/fees';
import { cuotaDe } from './inicio-presentacion';
import { esActiva } from './pacientes-presentacion';
import { homeDay } from '../../lib/panel-home';
import { sendShowroomMessage } from './message-send';

export const MAX_MENSAJE = 2000;
export const DIAS_CONSULTA_PROXIMA = 7;

export type Audiencia = { id: string; texto: string; ids: string[] };

/** Solo las activas que ya usan la app: es por ahí que les llega el mensaje. */
export const conChat = (p: Patient) => esActiva(p) && p.has_account !== false;

const esta7Dias = (p: Patient, ahora: Date) => {
  const inicio = p.appointment?.starts_at ? Date.parse(p.appointment.starts_at) : NaN;
  return Number.isFinite(inicio) && inicio >= ahora.getTime() && inicio - ahora.getTime() <= DIAS_CONSULTA_PROXIMA * 86_400_000;
};

/** Las opciones de «Para»: todas, cada grupo y los cortes de siempre. Las que quedan sin nadie no se ofrecen. */
export function armarAudiencias(pacientes: readonly Patient[], grupos: readonly TagGroup[], board: BillingBoard | null, ahora: Date): Audiencia[] {
  const posibles = pacientes.filter(conChat);
  const hoy = homeDay(ahora);
  const ids = (filtro: (p: Patient) => boolean) => posibles.filter(filtro).map(p => p.id);
  const lista: Audiencia[] = [{ id: 'todas', texto: 'Todas las activas', ids: ids(() => true) }];
  for (const g of grupos) lista.push({ id: `grupo:${g.label}`, texto: `Grupo ${g.label}`, ids: ids(p => g.patient_ids.includes(p.id)) });
  lista.push(
    { id: 'cuota', texto: 'Cuota vencida', ids: board ? ids(p => cuotaDe(board, p.id, hoy).texto === 'Vencida') : [] },
    { id: 'sinregistro', texto: 'Sin registrar esta semana', ids: ids(p => p.weekly_registration?.recorded_days === 0) },
    { id: 'consulta', texto: 'Consulta esta semana', ids: ids(p => esta7Dias(p, ahora)) },
  );
  return lista.filter(a => a.ids.length > 0);
}

/** Las pacientes de las opciones elegidas, sin repetir a nadie. */
export const destinatarias = (audiencias: readonly Audiencia[], elegidas: readonly string[]) =>
  [...new Set(audiencias.filter(a => elegidas.includes(a.id)).flatMap(a => a.ids))];

/** «{nombre}» se completa con el primer nombre de cada paciente. */
export const personalizar = (texto: string, nombreCompleto: string) => texto.replace(/\{nombre\}/gi, nombreCompleto.trim().split(/\s+/)[0] ?? '');

export type ResultadoEnvio = { enviados: number; fallaron: string[] };
type Enviar = Parameters<typeof sendShowroomMessage>[1]['send'];

/** Manda de a una, sin frenarse si alguna falla; cuenta cuántas salieron y cuáles no. */
export async function enviarAVarias(pacientes: readonly Pick<Patient, 'id' | 'name'>[], texto: string, send: Enviar, nuevoId: () => string = () => crypto.randomUUID()): Promise<ResultadoEnvio> {
  const resultado: ResultadoEnvio = { enviados: 0, fallaron: [] };
  for (const p of pacientes) {
    try {
      await sendShowroomMessage({ patientId: p.id, text: personalizar(texto, p.name), role: 'pro', client_id: nuevoId() }, { send, refresh: async () => undefined });
      resultado.enviados += 1;
    } catch { resultado.fallaron.push(p.name); }
  }
  return resultado;
}

