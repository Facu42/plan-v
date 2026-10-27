import { useCallback, useEffect, useState } from 'react';
import { patientHistoryApi, type HistoryEntry, type HistoryTopic } from '../../api/patient-history';
import { careErrorMessage } from '../../api/care';

/** Historia clínica por temas de una paciente. `activo` es false mientras falta el permiso de atención: no se consulta. */
export function usePatientHistory(patientId: string, activo: boolean) {
  const [entries, setEntries] = useState<HistoryEntry[] | null>(null);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    setEntries(null);
    setError('');
    if (!activo) return;
    const controller = new AbortController();
    patientHistoryApi.list(patientId, controller.signal).then(r => setEntries(r.entries)).catch(caught => { if (!controller.signal.aborted) setError(careErrorMessage(caught)); });
    return () => controller.abort();
  }, [patientId, activo, revision]);
  /** Guarda y deja la lista que devolvió el servidor; si falla, devuelve el aviso en vez de perder lo escrito en silencio. */
  const guardar = useCallback(async (accion: () => Promise<{ entries: HistoryEntry[] }>) => {
    try { setEntries((await accion()).entries); return ''; } catch (caught) { return careErrorMessage(caught); }
  }, []);
  return {
    entries, error, reintentar: () => setRevision(n => n + 1),
    agregar: (topic: HistoryTopic, text: string, since = '') => guardar(() => patientHistoryApi.add(patientId, { topic, text, since })),
    editar: (id: string, text: string) => guardar(() => patientHistoryApi.edit(patientId, id, { text })),
    darDeBaja: (id: string) => guardar(() => patientHistoryApi.end(patientId, id)),
  };
}
