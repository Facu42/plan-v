import { request } from './client';
import type { EstadisticasConsultorio } from '../types/estadisticas';

export type SedesDeTurnos = { instalada: boolean; turnos: Record<string, string> };
const consultorio = (nid?: string) => nid ? `?consultorio=${encodeURIComponent(nid)}` : '';

export const consultorioApi = {
  estadisticas: (meses: 6 | 12, signal?: AbortSignal) => request<EstadisticasConsultorio>(`/api/consultorio/estadisticas?meses=${meses}`, { signal }),
  sedesDeTurnos: (nid?: string, signal?: AbortSignal) => request<SedesDeTurnos>(`/api/consultorio/sedes-de-turnos${consultorio(nid)}`, { signal }),
  guardarSede: (appointmentId: string, locationId: string | null, nid?: string) => request<{ saved: true }>(`/api/consultorio/sedes-de-turnos/${encodeURIComponent(appointmentId)}${consultorio(nid)}`, { method: 'PUT', body: JSON.stringify({ location_id: locationId }) }),
};
