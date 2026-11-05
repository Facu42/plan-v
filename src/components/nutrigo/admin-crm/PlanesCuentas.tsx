import { useMemo, useState } from 'react';
import type { PlanPrecio } from '../../../types/centro';
import type { HubNutri } from '../../../types/hub';
import { dateShort, num, stateBadge, stateLabel, timeAgo } from './centro-format';

export const SIN_PLAN = 'sin';
const VENCE_PRONTO = 7;

export function planDe(nutri: HubNutri): string {
  return nutri.plan_code ?? SIN_PLAN;
}

/** Texto corto del vencimiento: nunca inventa una fecha que no hay. */
export function venceTexto(nutri: HubNutri): string {
  if (!nutri.until) return 'Sin fecha';
  const dias = nutri.days_left;
  if (dias == null) return dateShort(nutri.until);
  if (dias < 0) return `Vencida hace ${num(Math.abs(dias))} días`;
  if (dias === 0) return 'Vence hoy';
  return `En ${num(dias)} días`;
}

export function venceProntoCount(nutris: HubNutri[]): number {
  return nutris.filter((n) => n.days_left != null && n.days_left >= 0 && n.days_left <= VENCE_PRONTO).length;
}

type Props = {
  plans: PlanPrecio[];
  nutris: HubNutri[];
  filtro: string;
  onFiltro: (next: string) => void;
};

/** Lista de cuentas con su plan, para saber quién tiene cada plan. */
export function PlanesCuentas({ plans, nutris, filtro, onFiltro }: Props) {
  const [q, setQ] = useState('');
  const conteo = useMemo(() => {
    const out = new Map<string, number>();
    for (const n of nutris) out.set(planDe(n), (out.get(planDe(n)) ?? 0) + 1);
    return out;
  }, [nutris]);
  const filas = useMemo(() => {
    const term = q.trim().toLowerCase();
    return nutris
      .filter((n) => filtro === 'todos' || planDe(n) === filtro)
      .filter((n) => !term || `${n.display_name} ${n.email}`.toLowerCase().includes(term))
      .sort((a, b) => (a.days_left ?? 9999) - (b.days_left ?? 9999));
  }, [nutris, filtro, q]);
  const opciones = [
    { code: 'todos', label: 'Todas', n: nutris.length },
    ...plans.filter((p) => (conteo.get(p.code) ?? 0) > 0).map((p) => ({ code: p.code, label: p.name, n: conteo.get(p.code) ?? 0 })),
    ...(conteo.get(SIN_PLAN) ? [{ code: SIN_PLAN, label: 'Sin plan de pago', n: conteo.get(SIN_PLAN) ?? 0 }] : []),
  ];

  return (
    <section className="nd-card nd-planes-cuentas" aria-label="Cuentas por plan">
      <div className="nd-card-head">
        <div className="nd-grow">
          <div className="nd-card-title">Quién tiene cada plan</div>
          <div className="nd-card-sub">Sin cuentas de prueba internas. Las que vencen antes van primero.</div>
        </div>
        <input
          className="nd-planes-buscar"
          type="search"
          aria-label="Buscar nutri"
          placeholder="Buscar nutri"
          value={q}
          onChange={(event) => setQ(event.target.value)}
        />
      </div>
      <div className="nd-planes-chips" role="group" aria-label="Filtrar por plan">
        {opciones.map((op) => (
          <button key={op.code} type="button" className={`nd-chip${filtro === op.code ? ' is-active' : ''}`} aria-pressed={filtro === op.code} onClick={() => onFiltro(op.code)}>
            {op.label}<span className="nd-planes-chip-n">{num(op.n)}</span>
          </button>
        ))}
      </div>
      {filas.length === 0 ? <p className="nd-empty">No hay nutris con este filtro</p> : (
        <div className="nd-table-wrap">
          <table className="nd-table">
            <thead>
              <tr><th>Nutri</th><th>Plan</th><th>Estado</th><th>Vence</th><th>Pacientes</th><th>Último ingreso</th></tr>
            </thead>
            <tbody>
              {filas.map((n) => (
                <tr key={n.id}>
                  <td><a className="nd-planes-nutri" href={`#/nutris/${n.id}`}><strong>{n.display_name}</strong><small>{n.email}</small></a></td>
                  <td>{n.plan}</td>
                  <td><span className={`nd-badge ${stateBadge(n.state)}`}><span className="dot" />{stateLabel(n.state)}</span></td>
                  <td>{venceTexto(n)}</td>
                  <td>{num(n.patients_active)} de {num(n.patients_total)}</td>
                  <td>{timeAgo(n.last_sign_in_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
