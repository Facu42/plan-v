import { useEffect, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { localBillingDate } from '../../billing';
import { useAppStore } from '../../store/useAppStore';
import type { BillingStatus, Patient } from '../../types';
import { Icon } from '../shared/Icon';

const LABELS: Record<BillingStatus, string> = {
  active: 'Activo',
  pending: 'Pendiente',
  waived: 'Exceptuado',
  past_due: 'Vencido',
};

function dateAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localBillingDate(date);
}

export function CrmBillingControl({ patient }: { patient: Patient }) {
  const refreshPatient = useAppStore((state) => state.refreshPatient);
  const [status, setStatus] = useState<BillingStatus>(patient.billing_status);
  const [billingUntil, setBillingUntil] = useState(patient.billing_until ?? dateAfter(30));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setStatus(patient.billing_status);
    setBillingUntil(patient.billing_until ?? dateAfter(30));
    setFeedback('');
    setError('');
  }, [patient.id, patient.billing_status, patient.billing_until]);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'past_due') return;
    if (status === 'active' && !billingUntil) {
      setError('Elegí hasta qué fecha está vigente el período.');
      return;
    }

    setSaving(true);
    setFeedback('');
    setError('');
    try {
      await api.updateBilling(patient.id, status === 'active'
        ? { status, billing_until: billingUntil }
        : { status });
      await refreshPatient(patient.id);
      setFeedback('Estado de cobro actualizado.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos actualizar el cobro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="crm-billing-strip" onSubmit={save} aria-label={`Cobranza de ${patient.name}`}>
      <div className="billing-strip-title">
        <span className={`billing-chip billing-${patient.billing_status}`}>{LABELS[patient.billing_status]}</span>
        <div><strong>Acompañamiento mensual</strong><small>{patient.billing_until ? `Vigencia: ${patient.billing_until}` : 'Sin período cargado'}</small></div>
      </div>
      <label>
        Estado
        <select value={status} onChange={(event) => setStatus(event.target.value as BillingStatus)}>
          <option value="pending">Pendiente</option>
          <option value="active">Activo</option>
          <option value="waived">Exceptuado</option>
          {patient.billing_status === 'past_due' && <option value="past_due" disabled>Vencido</option>}
        </select>
      </label>
      {status === 'active' && (
        <label>
          Vigente hasta
          <input type="date" min={localBillingDate()} value={billingUntil} onChange={(event) => setBillingUntil(event.target.value)} required />
        </label>
      )}
      <button type="submit" disabled={saving || status === 'past_due'}>{saving ? 'Guardando…' : 'Guardar cobro'}</button>
      {feedback && <p className="billing-feedback" role="status"><Icon name="check" size={12} />{feedback}</p>}
      {error && <p className="billing-error" role="alert">{error}</p>}
    </form>
  );
}
