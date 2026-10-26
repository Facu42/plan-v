import { useState } from 'react';
import { FigmaRecordDialog } from './FigmaPatientFront';
import { plansApi } from '../../api/plans';
import { careErrorMessage } from '../../api/care';
import type { ProfessionalMealPlan } from '../../types/plans';
import './planes-reutilizar.css';

export function PanelPlanProgramar({ plan, bloqueo, onPlan, onCerrar, onAviso }: {
  plan: ProfessionalMealPlan; bloqueo: string | null; onPlan: (plan: ProfessionalMealPlan) => void;
  onCerrar: () => void; onAviso: (text: string) => void;
}) {
  const programada = plan.delivery_schedule ? new Date(Date.parse(plan.delivery_schedule.scheduled_at) - 3 * 3600000).toISOString() : null;
  const [dia, setDia] = useState(programada?.slice(0, 10) ?? plan.current.period_start);
  const [hora, setHora] = useState(programada?.slice(11, 16) ?? '08:00');
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  async function guardar() {
    if (ocupado || bloqueo) return;
    setOcupado(true); setError('');
    try {
      const at = new Date(`${dia}T${hora}:00-03:00`).toISOString();
      const result = await plansApi.schedule(plan.id, plan.current, at);
      onPlan(result.plan);
      onAviso('Entrega programada. La paciente verá esta copia al abrir el plan desde el día y la hora elegidos. No se envían avisos automáticos.');
      onCerrar();
    } catch (e) { setError(careErrorMessage(e)); }
    finally { setOcupado(false); }
  }
  return <FigmaRecordDialog className="p3c-dialog" title="Programar entrega" onClose={() => { if (!ocupado) onCerrar(); }} closeLabel="Cerrar">
    <form aria-busy={ocupado} onSubmit={e => { e.preventDefault(); void guardar(); }}>
      <p className="mhelp">Hora de Argentina. La copia revisada queda reservada: la paciente la verá al abrir el plan desde ese momento. Conserva el plan anterior mientras espera. No se envían notificaciones push ni mails automáticamente.</p>
      <label className="af"><span>Día</span><input aria-label="Día" className="p3c-input" type="date" required min={plan.current.period_start} max={plan.current.period_end} value={dia} disabled={ocupado} onChange={e => setDia(e.target.value)} /></label>
      <label className="af"><span>Hora</span><input aria-label="Hora" className="p3c-input" type="time" required value={hora} disabled={ocupado} onChange={e => setHora(e.target.value)} /></label>
      {plan.delivery_schedule ? <p role="status">Programada para {new Date(plan.delivery_schedule.scheduled_at).toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires', hour12: false })}. Para cambiarla, guardá un nuevo borrador.</p> : null}
      {bloqueo ? <p role="status">{bloqueo}</p> : null}
      {error ? <p role="alert">{error}</p> : null}
      <footer><button className="sbtn k" type="submit" disabled={ocupado || !!bloqueo || !dia || !hora}>{ocupado ? 'Guardando…' : 'Programar'}</button></footer>
    </form>
  </FigmaRecordDialog>;
}
