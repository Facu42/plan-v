import { useEffect, useState } from 'react';
import { plansApi } from '../../api/plans';
import { careErrorMessage } from '../../api/care';
import type { PlanVersionView } from '../../types/plans';
import { PlanPublishedItem } from './MealPlanVersions';
import { PlanGuidanceView } from './PlanGuidance';
export function PlanHistory({
  patientId,
  currentId,
  revision,
}: {
  patientId: string;
  currentId?: string;
  revision?: string;
}) {
  const [versions, setVersions] = useState<PlanVersionView[]>([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(true),
    [retry, setRetry] = useState(0),
    [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    plansApi
      .history(patientId, controller.signal)
      .then((r) => {
        if (!controller.signal.aborted) {
          if (!Array.isArray(r.versions))
            throw new Error('No se pudo cargar el historial.');
          setVersions(r.versions);
        }
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(careErrorMessage(e));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [patientId, revision, retry, open]);
  return (
    <details
      className="meal-plan-published-copy"
      onToggle={(event) => setOpen(event.currentTarget.open)}
    >
      <summary>Versiones anteriores · sólo lectura</summary>
      {!open ? null : loading ? (
        <p>Cargando historial…</p>
      ) : error ? (
        <p role="alert">
          {error}{' '}
          <button type="button" onClick={() => setRetry((v) => v + 1)}>
            Reintentar
          </button>
        </p>
      ) : versions.filter((v) => v.id !== currentId).length ? (
        versions
          .filter((v) => v.id !== currentId)
          .map((v) => (
            <details key={v.id}>
              <summary>
                Versión {v.version} ·{' '}
                {v.published_at
                  ? 'publicada previamente'
                  : 'borrador conservado'}{' '}
                · {v.period_start} a {v.period_end}
              </summary>
              <p>
                Esta copia se conserva para consulta. No modifica el plan
                actual.
              </p>
              <PlanGuidanceView guidance={v.guidance} />
              {v.items.map((item) => (
                <section key={item.id}>
                  <h4>{item.for_date}</h4>
                  <PlanPublishedItem item={item} />
                </section>
              ))}
            </details>
          ))
      ) : (
        <p>Todavía no hay versiones anteriores guardadas.</p>
      )}
    </details>
  );
}
