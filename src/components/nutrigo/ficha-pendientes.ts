// Lo que la ficha tiene para revisar, calculado una vez y compartido por las solapas y el Resumen.
import type { Patient } from '../../types';
import { recordLabSeries } from './panel-record-data';
import { valoresAlterados } from './ficha-presentacion';
import type { FichaData } from './use-ficha-data';

export function pendientesDeFicha(patient: Patient, datos: FichaData, hoy: string) {
  const { canCare, canDocs, current } = datos;
  const labs = canDocs ? recordLabSeries(current?.clinical?.records ?? [], patient.id, hoy) : [];
  const sesiones = canCare ? current?.notes?.sessions.slice().sort((a, b) => b.started_at.localeCompare(a.started_at)) : undefined;
  const ultimaNota = sesiones?.find(s => s.draft.trim());
  return {
    labs,
    alterados: valoresAlterados(labs),
    ultimoLab: labs.reduce<string | null>((fecha, lab) => !fecha || lab.date > fecha ? lab.date : fecha, null),
    comidas: current?.meals ? current.meals.logs.length : null,
    masComidas: Boolean(current?.meals?.has_more),
    ultimaNota,
    compartida: canCare ? current?.notes?.shared.slice().sort((a, b) => b.published_at.localeCompare(a.published_at))[0] : undefined,
    notaPorAprobar: Boolean(ultimaNota && !current?.notes?.shared.some(fila => fila.session_id === ultimaNota.id)),
  };
}
