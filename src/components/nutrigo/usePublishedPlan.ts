import { useEffect, useState } from 'react';
import { plansApi } from '../../api/plans';
import { careErrorMessage } from '../../api/care';
import { weekPlanFromSlots, type MealPlanView } from '../../types/plans';
import type { Patient } from '../../types';

export function usePublishedPlan(patientId: string) {
  const [snapshot, setSnapshot] = useState<{ patientId: string; published: MealPlanView | null; loaded: boolean; error: string }>(() => ({ patientId, published: null, loaded: false, error: '' }));
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setSnapshot({ patientId, published: null, loaded: false, error: '' });
    plansApi.board(patientId, false, controller.signal)
      .then((result) => { if (!controller.signal.aborted) setSnapshot({ patientId, published: result.published, loaded: true, error: '' }); })
      .catch((err) => {
        if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
        setSnapshot({ patientId, published: null, loaded: true, error: careErrorMessage(err) });
      });
    return () => controller.abort();
  }, [patientId, attempt]);
  const visible = snapshot.patientId === patientId ? snapshot : { patientId, published: null, loaded: false, error: '' };
  return { published: visible.published, loaded: visible.loaded, error: visible.error, retry: () => setAttempt((value) => value + 1) };
}

export function weekPlanForPatient(patient: Pick<Patient, 'weekPlan'>, published: MealPlanView | null) {
  return published ? weekPlanFromSlots(published.slots) : patient.weekPlan;
}
