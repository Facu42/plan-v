import { useEffect, useState } from 'react';
import { patientHistoryApi } from '../../api/patient-history';
import type { Patient } from '../../types';
import { vigentes } from './ficha-historia';

export type Patologia = { texto: string; desde: string };

/** Mismo color que el boceto: celiaquía e intolerancias en azafrán, diabetes y anemia en rojo, el resto en azul. */
export const clasePatologia = (texto: string) => (/Celíaca|lactosa/i.test(texto) ? 'pa' : /Diabetes|Anemia/i.test(texto) ? 'pr' : 'pb');

/** Diagnósticos vigentes de la historia clínica: lo que el boceto muestra como «Patologías». */
export const patologiasDe = (entradas: Parameters<typeof vigentes>[0], hoy: string): Patologia[] =>
  vigentes(entradas, 'diag', hoy).map(e => ({ texto: e.text, desde: e.since }));

const EN_PARALELO = 4;
const MAXIMO = 40;

/** Trae los diagnósticos de las pacientes de la lista, de a pocas a la vez. Sin permiso de atención o con error, esa paciente queda sin dato. */
export function usePatologias(pacientes: readonly Patient[], hoy: string): ReadonlyMap<string, Patologia[]> {
  const [mapa, setMapa] = useState<ReadonlyMap<string, Patologia[]>>(new Map());
  const claves = pacientes.filter(p => !p.archived_at).slice(0, MAXIMO).map(p => p.id).join(',');
  useEffect(() => {
    if (!claves) return;
    const controller = new AbortController();
    const pendientes = claves.split(',');
    const trabajar = async () => {
      for (let id = pendientes.shift(); id && !controller.signal.aborted; id = pendientes.shift()) {
        try {
          const { entries } = await patientHistoryApi.list(id, controller.signal);
          if (!controller.signal.aborted) setMapa(previo => new Map(previo).set(id as string, patologiasDe(entries, hoy)));
        } catch { /* sin permiso o sin red: queda «Sin declarar» */ }
      }
    };
    void Promise.all(Array.from({ length: EN_PARALELO }, trabajar));
    return () => controller.abort();
  }, [claves, hoy]);
  return mapa;
}
