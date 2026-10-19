import {useEffect,useState} from 'react';
import {api} from '../../api/client';
import {careApi} from '../../api/care';
import type {ProfessionalIntakeView} from '../../types/intake';
import {healthFactLabel} from './intake-review';
import {NvButton} from './primitives';
export function PlanSafetySummary({ patientId }: { patientId: string }) {
  const [view, setView] = useState<ProfessionalIntakeView | null>(null);
  const [consented, setConsented] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setView(null); setError('');
    Promise.all([api.getProfessionalIntake(patientId, { signal: controller.signal }), careApi.snapshot(patientId, true, controller.signal)]).then(([result, care]) => {
      if (!controller.signal.aborted) { setView(result); setConsented(care.consented); }
    }).catch((reason) => { if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : 'No pudimos consultar los antecedentes.'); });
    return () => controller.abort();
  }, [patientId, revision]);
  return <section className="pw-safety" aria-label="Datos vigentes para preparar el plan">
    <h3>Antes de preparar el plan</h3>
    {error ? <div role="alert"><p>{error}</p><NvButton onClick={() => setRevision((value) => value + 1)}>Reintentar antecedentes</NvButton></div>
      : !view ? <p role="status">Consultando alergias y permisos…</p> : <dl>
        <div><dt>Alergias</dt><dd>{healthFactLabel(view.intake.payload.allergies, 'alergias')}</dd></div>
        <div><dt>Restricciones</dt><dd>{healthFactLabel(view.intake.payload.restrictions, 'restricciones')}</dd></div>
        <div><dt>Ingreso</dt><dd>{view.intake.status === 'reviewed' ? 'Revisado' : 'Pendiente de revisión'}</dd></div>
        <div><dt>Permisos vigentes</dt><dd>{consented.map((purpose) => (({ care_relationship: 'Atención', meal_photo: 'Fotos de comidas', clinical_document: 'Estudios', measurement: 'Medidas', body_progress: 'Fotos corporales', ai_meal_analysis: 'IA de comidas', ai_menu_draft: 'IA de menús', ai_followup: 'IA de seguimiento' } as Record<string, string>)[purpose] ?? purpose)).join(' · ') || 'Sin permisos otorgados'}</dd></div>
      </dl>}
  </section>;
}

