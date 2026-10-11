import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api/client';
import { formatPesos } from '../../fees';
import { PERIOD_OPTIONS, countConsultations, countNewPatients, incomeIn, periodWindows, variation, type PeriodDays, type Variation } from '../../lib/inicio-indicators';
import type { Patient } from '../../types';
import type { BillingBoard } from '../../types/fees';
import { NvMetric } from './primitives';

const argentinaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());

export function variationText(change: Variation, previousLabel: string): string {
  if (change.kind === 'no-baseline') return 'Sin datos en el período anterior';
  if (change.kind === 'same') return `↔ Igual que el período anterior (${previousLabel})`;
  return `${change.kind === 'up' ? '↑' : '↓'} ${change.kind === 'up' ? '+' : '−'}${Math.abs(change.delta).toLocaleString('es-AR')} contra el período anterior (${previousLabel})`;
}

/** Indicadores de Inicio con selector de período. Cada cifra sale de datos ya registrados; lo que no se puede calcular no se muestra como cero. */
export function InicioIndicatorsView({ patients, board, boardError, days, onDays, todayId }: {
  patients: readonly Patient[]; board: BillingBoard | null; boardError: boolean; days: PeriodDays; onDays: (days: PeriodDays) => void; todayId: string;
}) {
  const { current, previous } = useMemo(() => periodWindows(todayId, days), [todayId, days]);
  const consultations = countConsultations(patients, current);
  const previousConsultations = countConsultations(patients, previous);
  const newPatients = countNewPatients(patients, current);
  const previousNewPatients = countNewPatients(patients, previous);
  const income = board ? incomeIn(board, current) : null;
  const previousIncome = board ? incomeIn(board, previous) : null;
  return <section className="pw-indicators" aria-label="Indicadores del consultorio">
    <header>
      <h3>Indicadores</h3>
      <label>Período<select value={days} onChange={(event) => onDays(Number(event.target.value) as PeriodDays)}>{PERIOD_OPTIONS.map((option) => <option key={option} value={option}>Últimos {option} días</option>)}</select></label>
    </header>
    <div className="pw-indicator-cards">
      <NvMetric label="Consultas" icon="calendar" tone="green" value={String(consultations.total)}
        note={`${consultations.first} ${consultations.first === 1 ? 'primera' : 'primeras'} · ${consultations.followUp} de seguimiento. ${variationText(variation(consultations.total, previousConsultations.total), String(previousConsultations.total))}`} />
      {newPatients !== null && previousNewPatients !== null
        ? <NvMetric label="Pacientes nuevas" icon="users" tone="coral" value={String(newPatients)} note={variationText(variation(newPatients, previousNewPatients), String(previousNewPatients))} />
        : <NvMetric label="Pacientes nuevas" icon="users" tone="coral" value="Sin dato" note="Todavía no tenemos la fecha de alta de tus pacientes." />}
      {income && previousIncome
        ? <NvMetric label="Ingresos" icon="wallet" tone="gold" value={formatPesos(income.amount)}
          note={`${income.payers} ${income.payers === 1 ? 'paciente pagó' : 'pacientes pagaron'}. ${variationText(variation(income.amount, previousIncome.amount), formatPesos(previousIncome.amount))}`} />
        : <NvMetric label="Ingresos" icon="wallet" tone="gold" value="Sin dato" note={boardError ? 'No pudimos consultar los cobros. Abrí Cobranzas para reintentar.' : 'Consultando cobros…'} />}
    </div>
    <p className="pw-indicator-foot">Consultas: horarios de turno ya transcurridos. Pacientes nuevas: fecha de alta en el consultorio. Ingresos: pagos confirmados por fecha de pago.</p>
  </section>;
}

export function InicioIndicators({ patients }: { patients: readonly Patient[] }) {
  const [days, setDays] = useState<PeriodDays>(30);
  const [board, setBoard] = useState<BillingBoard | null>(null);
  const [boardError, setBoardError] = useState(false);
  useEffect(() => {
    let active = true;
    api.getBillingBoard().then(({ board: loaded }) => { if (active) setBoard(loaded); }).catch(() => { if (active) setBoardError(true); });
    return () => { active = false; };
  }, []);
  return <InicioIndicatorsView patients={patients} board={board} boardError={boardError} days={days} onDays={setDays} todayId={argentinaToday()} />;
}
