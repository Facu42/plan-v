import { exchangeVisibilityApi } from '../../api/exchange-visibility';
import type { PatientExchangeGroup } from '../../types/exchange-visibility';
import { useRemote } from '../../features/nutrigo/screens/shared';

const amount = (value: number) => value.toLocaleString('es-AR', { maximumFractionDigits: 2 });

export function PatientExchangeList({ groups }: { groups: PatientExchangeGroup[] }) {
  return <>{groups.length ? groups.map(group => <section key={group.id} className="flex flex-col gap-[8px]">
    <h3 className="font-['Poppins:SemiBold']">{group.name}</h3>
    <ul>{group.items.map(item => <li key={item.food.id}>{item.food.name} · {amount(item.quantity)} {item.unit}</li>)}</ul>
  </section>) : <p>Tu nutricionista todavía no cargó grupos revisados.</p>}</>;
}

/** Se monta al abrir las opciones: consulta siempre el permiso vigente, sin modificar el plan. */
export function PatientPlanExchanges({ patientId }: { patientId: string }) {
  const remote = useRemote(`${patientId}:equivalencias`, signal => exchangeVisibilityApi.patient(patientId, signal));
  if (remote.error) return <p role="alert">No se pudieron consultar las equivalencias. <button type="button" className="underline" onClick={remote.reload}>Reintentar</button></p>;
  if (!remote.data) return <p role="status">Consultando equivalencias…</p>;
  if (!remote.data.enabled) return null;
  return <details className="flex flex-col gap-[12px]" aria-label="Equivalencias revisadas">
    <summary className="cursor-pointer">Ver equivalencias revisadas</summary>
    <p>Estas son las porciones revisadas por tu nutricionista. Consultarlas no cambia las comidas de tu plan.</p>
    <PatientExchangeList groups={remote.data.groups} />
  </details>;
}
