import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, type PatientInvite } from '../../api/client';
import type { Patient } from '../../types';
import { Icon } from '../shared/Icon';

export function CrmPatientCreateDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (patient: Patient, invite: PatientInvite) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [goal, setGoal] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInput.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [busy, onClose]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await api.createPatient({ name, email, goal });
      onCreated(result.patient, result.invite);
    } catch {
      setError('No pudimos crear el alta. Revisá los datos o si el email ya está registrado.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop patient-create-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !busy && onClose()}>
      <section className="patient-create-panel" role="dialog" aria-modal="true" aria-labelledby="patient-create-title">
        <header className="patient-create-head">
          <div>
            <p className="eyebrow">Ingreso</p>
            <h2 id="patient-create-title">Nuevo paciente</h2>
            <p>Creá la ficha inicial. El acceso comienza pendiente hasta que definas la cobranza.</p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Cerrar">×</button>
        </header>

        <form className="patient-create-form" onSubmit={submit}>
          <label>
            Nombre completo
            <input ref={nameInput} value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} autoComplete="name" />
          </label>
          <label>
            Email para la invitación
            <input value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} type="email" autoComplete="email" />
          </label>
          <label>
            Objetivo declarado
            <textarea value={goal} onChange={(event) => setGoal(event.target.value)} required minLength={2} maxLength={240} rows={3} />
          </label>
          <p className="patient-create-hint"><Icon name="message" size={14} />En demo se guarda el destino, pero no se envía ningún email.</p>
          {error && <p className="patient-create-error" role="alert">{error}</p>}
          <div className="patient-create-actions">
            <button type="button" onClick={onClose} disabled={busy}>Cancelar</button>
            <button type="submit" className="command-primary" disabled={busy}>
              <Icon name={busy ? 'loader' : 'plus'} size={14} className={busy ? 'spin' : ''} />
              {busy ? 'Creando…' : 'Crear alta'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
