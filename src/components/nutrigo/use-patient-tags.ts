import { useCallback, useEffect, useState } from 'react';
import { crmWorkApi, type PatientTag } from '../../api/crm-work';

/** Etiquetas propias de la nutri para esta paciente. Si no se pueden leer, la ficha sigue sin ellas. */
export function usePatientTags(patientId: string) {
  const [tags, setTags] = useState<PatientTag[] | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setTags(null);
    crmWorkApi.patientTags(patientId, controller.signal).then(r => setTags(r.tags)).catch(() => { if (!controller.signal.aborted) setTags([]); });
    return () => controller.abort();
  }, [patientId]);
  /** Deja exactamente `deseadas` (las primeras dos van en azafrán, como el boceto) y devuelve si todo se guardó. */
  const guardar = useCallback(async (deseadas: readonly string[]) => {
    const actuales = tags ?? [];
    const igual = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
    try {
      let ultimo = actuales;
      for (const tag of actuales) if (!deseadas.some(d => igual(d, tag.label))) ultimo = (await crmWorkApi.removePatientTag(patientId, tag.id)).tags;
      for (const label of deseadas) if (!actuales.some(t => igual(t.label, label))) ultimo = (await crmWorkApi.addPatientTag(patientId, label, deseadas.indexOf(label) < 2 ? 'a' : 'n')).tags;
      setTags(ultimo);
      return true;
    } catch {
      crmWorkApi.patientTags(patientId).then(r => setTags(r.tags)).catch(() => undefined);
      return false;
    }
  }, [patientId, tags]);
  return { tags, guardar };
}
