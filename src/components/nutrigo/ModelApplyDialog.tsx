import { useEffect, useState } from 'react';
import type { Patient } from '../../types';
import type { ProfessionalMealPlan } from '../../types/plans';
import {
  datedModelItems,
  modelPlanChanges,
  modelApplySchema,
  modelPlanFrom,
  type ProfessionalModel,
} from '../../types/models';
import { modelsApi } from '../../api/models';
import { plansApi } from '../../api/plans';
import { careErrorMessage } from '../../api/care';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { ModelContent } from './ModelCatalog';
import { useUnsavedChanges } from './unsaved-changes';
import { NvButton } from './primitives';
import { PlanGuidanceView } from './PlanGuidance';
import { mergeGuidance } from '../../types/plan-guidance';

export function ModelApplyDialog({
  model,
  patients,
  onClose,
  onApplied,
}: {
  model: ProfessionalModel;
  patients: Patient[];
  onClose: () => void;
  onApplied: (patientId: string, plan: ProfessionalMealPlan) => void;
}) {
  const [patient, setPatient] = useState(''),
    [plan, setPlan] = useState<ProfessionalMealPlan | null>(null),
    [loaded, setLoaded] = useState(false),
    [loading, setLoading] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [reviewed, setReviewed] = useState(false);
  const [start, setStart] = useState(
    new Date().toLocaleDateString('en-CA', {
      timeZone: 'America/Argentina/Buenos_Aires',
    }),
  );
  useUnsavedChanges(false, busy);
  useEffect(() => {
    setReviewed(false);
    setLoaded(false);
    setPlan(null);
    setError('');
    setLoading(false);
    if (!patient) return;
    const controller = new AbortController();
    setLoading(true);
    plansApi
      .professional(patient, controller.signal)
      .then((r) => {
        if (controller.signal.aborted) return;
        setPlan(r.plan);
        setLoaded(true);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(careErrorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [patient]);
  const copy = model.published;
  const isPlan = model.kind === 'plan';
  let merged = plan?.current.guidance;
  let guidanceError = '';
  if (!isPlan && plan && copy) {
    try {
      merged = mergeGuidance(
        plan.current.guidance,
        model.kind as 'recommendations' | 'avoid',
        copy.lines,
      );
    } catch {
      guidanceError =
        'El plan admite hasta 100 indicaciones por categoría. Revisá las existentes.';
    }
  }
  async function apply() {
    if (busy || !loaded || !copy || (!isPlan && (!plan || guidanceError)))
      return;
    const parsed = modelApplySchema.safeParse({
      patient_id: patient,
      expected_revision: model.revision,
      expected_version: copy.version,
      expected_plan_revision: plan?.current.revision ?? null,
      period_start: isPlan ? start : plan!.current.period_start,
      reviewed,
    });
    if (!parsed.success) {
      setError('Elegí fechas válidas y confirmá la revisión.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      onApplied(patient, (await modelsApi.apply(model, parsed.data)).plan);
    } catch (e) {
      setError(careErrorMessage(e));
      setReviewed(false);
    } finally {
      setBusy(false);
    }
  }
  if (!copy || (isPlan && !copy.plan)) return null;
  const valid = modelApplySchema.shape.period_start.safeParse(start).success;
  const end = valid
    ? new Date(
        Date.parse(`${start}T12:00:00Z`) +
          ((copy.plan?.days ?? 1) - 1) * 86400000,
      )
        .toISOString()
        .slice(0, 10)
    : '';
  const changes =
    valid && isPlan
      ? modelPlanChanges(
          plan?.current.items ?? [],
          datedModelItems(copy, start),
        )
      : null;
  return (
    <FigmaRecordDialog
      title={`Aplicar modelo · copia publicada v${copy.version}`}
      className="mc-dialog"
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <div className="mc-review" aria-busy={busy}>
        <fieldset
          disabled={busy}
          style={{ border: 0, padding: 0, minWidth: 0 }}
        >
          <label>
            Paciente
            <select
              aria-label="Paciente para aplicar modelo"
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
            >
              <option value="">Elegí un paciente</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {loading && <p role="status">Cargando el plan actual…</p>}
          {loaded && (
            <>
              {isPlan && (
                <label>
                  Primer día del nuevo borrador
                  <input
                    type="date"
                    max="9999-12-10"
                    value={start}
                    onChange={(e) => {
                      setStart(e.target.value);
                      setReviewed(false);
                    }}
                  />
                </label>
              )}
              {valid && isPlan && (
                <p>
                  Del {start.split('-').reverse().join('/')} al{' '}
                  {end.split('-').reverse().join('/')}. Las cantidades se copian
                  tal como están, sin ajuste automático.
                </p>
              )}
              {!isPlan && (
                <p>
                  Se agregan las indicaciones sin duplicar textos iguales; las
                  comidas, cantidades y fechas se conservan.{' '}
                  {plan
                    ? `Período: ${plan.current.period_start} a ${plan.current.period_end}.`
                    : 'Guardá primero un plan del paciente para incorporar indicaciones.'}
                </p>
              )}
              {guidanceError && <p role="alert">{guidanceError}</p>}
              <p>
                {plan
                  ? `Se creará el borrador v${plan.current.version + 1}. La versión v${plan.current.version} se conservará en el historial.`
                  : isPlan
                    ? 'Se creará el primer borrador del paciente.'
                    : 'Primero necesitás un plan guardado.'}
                {plan?.published
                  ? ` El paciente seguirá viendo su plan publicado v${plan.published.version} hasta que publiques otro.`
                  : ' Este borrador todavía no se entregará al paciente.'}
              </p>
              {changes && (
                <p role="status">
                  Cambios en la nueva copia: {changes.added} comidas nuevas,{' '}
                  {changes.changed} modificadas y {changes.removed} del plan
                  anterior que quedarán únicamente en el historial.
                </p>
              )}
              {!isPlan && plan && merged && !guidanceError && (
                <p role="status">
                  Se sumarán{' '}
                  {merged[model.kind as 'recommendations' | 'avoid'].length -
                    (plan.current.guidance?.[
                      model.kind as 'recommendations' | 'avoid'
                    ].length ?? 0)}{' '}
                  indicaciones nuevas. Los textos repetidos no se agregan otra
                  vez.
                </p>
              )}
              <div className="mc-comparison">
                <details>
                  <summary>
                    Antes ·{' '}
                    {plan
                      ? `plan guardado v${plan.current.version}`
                      : 'sin plan'}
                  </summary>
                  {plan ? (
                    <>
                      <PlanGuidanceView guidance={plan.current.guidance} />
                      <ModelContent
                        copy={{
                          version: plan.current.version,
                          title: 'Plan anterior',
                          description: '',
                          lines: [],
                          plan: modelPlanFrom(plan.current),
                          published_at: plan.current.published_at,
                        }}
                      />
                    </>
                  ) : (
                    <p>No hay un plan guardado.</p>
                  )}
                </details>
                <h3>Nuevo borrador · {copy.title}</h3>
                {isPlan ? (
                  <ModelContent copy={copy} />
                ) : (
                  <PlanGuidanceView guidance={merged} />
                )}
              </div>
              <label className="mc-confirm">
                <input
                  type="checkbox"
                  checked={reviewed}
                  onChange={(e) => setReviewed(e.target.checked)}
                />
                Revisé el contenido y las fechas. Quiero crear otro borrador y
                conservar el plan anterior.
              </label>
            </>
          )}
          {error && (
            <>
              <p role="alert">{error}</p>
              <NvButton onClick={onClose}>
                Volver al catálogo y actualizar
              </NvButton>
            </>
          )}
          <footer>
            <NvButton onClick={onClose}>Cancelar</NvButton>
            <NvButton
              disabled={
                !loaded ||
                !reviewed ||
                !valid ||
                busy ||
                (!isPlan && (!plan || Boolean(guidanceError)))
              }
              onClick={() => void apply()}
            >
              {busy ? 'Creando borrador…' : 'Crear nuevo borrador'}
            </NvButton>
          </footer>
        </fieldset>
      </div>
    </FigmaRecordDialog>
  );
}
