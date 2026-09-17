import { useEffect, useState } from 'react';
import { api, isAbortError } from '../../api/client';
import type { ProfessionalIntakeView } from '../../types/intake';
import { NvBadge, NvButton, NvState } from './primitives';
import { healthFactLabel, intakeMissingItems, intakeStatusLabel } from './intake-review';

function readableDate(value: string | null | undefined) {
  if (!value) return 'Sin fecha';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Sin fecha' : new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date);
}

export function IntakeReviewPanel({
  view,
  note,
  error,
  busy,
  onNoteChange,
  onReview,
  onSaveNote,
}: {
  view: ProfessionalIntakeView;
  note: string;
  error: string;
  busy: boolean;
  onNoteChange: (value: string) => void;
  onReview: () => void;
  onSaveNote: () => void;
}) {
  const payload = view.intake.payload ?? {};
  const missing = intakeMissingItems(view);
  const care = view.consents.find((event) => event.purpose === 'care_relationship');
  const canReview = view.intake.status === 'submitted';

  return <section className="nr-intake" aria-label="Ingreso autodeclarado">
    <header>
      <div>
        <span className="nr-kicker">Ingreso del paciente</span>
        <h3>Declaración para revisar</h3>
      </div>
      <NvBadge tone={view.intake.status === 'reviewed' ? 'green' : 'gold'}>{intakeStatusLabel(view.intake.status)}</NvBadge>
    </header>
    {error && <p className="nr-intake-error" role="alert">{error}</p>}
    <dl>
      <div><dt>Nombre preferido</dt><dd>{payload.preferred_name?.trim() || 'Sin nombre preferido'}</dd></div>
      <div><dt>Pedido</dt><dd>{payload.patient_intent?.trim() || 'Sin texto adicional'}</dd></div>
      <div><dt>Alergias</dt><dd>{healthFactLabel(payload.allergies, 'alergias')}</dd></div>
      <div><dt>Restricciones</dt><dd>{healthFactLabel(payload.restrictions, 'restricciones')}</dd></div>
      <div><dt>Consentimiento de atención</dt><dd>{care?.decision === 'granted' ? `Otorgado · ${care.text_version ?? ''}` : 'No vigente'}</dd></div>
      <div><dt>Enviado</dt><dd>{readableDate(view.intake.submitted_at)}</dd></div>
    </dl>
    <section aria-label="Faltantes del ingreso">
      <h4>Faltantes y banderas</h4>
      {missing.length ? <ul>{missing.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No hay faltantes de ingreso. Los documentos opcionales se cargan en un paso posterior.</p>}
    </section>
    <section aria-label="Observaciones profesionales privadas">
      <h4>Notas privadas de revisión</h4>
      <p>Estas observaciones no se muestran al paciente ni reescriben su declaración.</p>
      {view.clinical_notes.length ? <ol>{view.clinical_notes.map((entry) => <li key={entry.id}><p>{entry.body}</p><small>v{entry.version} · {readableDate(entry.created_at)}</small></li>)}</ol> : <p>Todavía no hay observaciones de este ingreso.</p>}
      <label>Observación profesional
        <textarea value={note} onChange={(event) => onNoteChange(event.target.value)} maxLength={4000} rows={3} />
      </label>
      <div className="nr-intake-actions">
        <NvButton className="nv-soft" onClick={onSaveNote} disabled={busy || note.trim().length < 2}>Guardar observación profesional</NvButton>
        <NvButton onClick={onReview} disabled={busy || !canReview}>{view.intake.status === 'reviewed' ? 'Ya revisado' : 'Marcar ingreso como revisado'}</NvButton>
      </div>
    </section>
  </section>;
}

export function ShowroomIntakeReview({ patientId, initialView }: { patientId: string; initialView?: ProfessionalIntakeView | null }) {
  const [view, setView] = useState<ProfessionalIntakeView | null>(initialView ?? null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (initialView) {
      setView(initialView);
      return;
    }
    const controller = new AbortController();
    setError('');
    api.getProfessionalIntake(patientId, { signal: controller.signal }).then((result) => {
      if (!controller.signal.aborted) setView(result);
    }).catch((reason: unknown) => {
      if (controller.signal.aborted || isAbortError(reason)) return;
      setError('No pudimos cargar el ingreso. Reintentá desde la ficha.');
    });
    return () => controller.abort();
  }, [patientId, initialView]);

  if (!view) {
    return <section className="nr-intake" role="status">{error || 'Cargando ingreso…'}</section>;
  }

  const saveNote = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api.addClinicalNote(patientId, note);
      setView((current) => current ? { ...current, clinical_notes: [result.clinical_note, ...current.clinical_notes] } : current);
      setNote('');
    } catch {
      setError('No pudimos guardar la observación profesional.');
    } finally {
      setBusy(false);
    }
  };

  const review = async () => {
    setBusy(true);
    setError('');
    try {
      setView(await api.reviewIntake(patientId, view.intake.revision));
    } catch {
      setError('No pudimos marcar el ingreso. Recargá la ficha si otra sesión lo revisó.');
    } finally {
      setBusy(false);
    }
  };

  return <IntakeReviewPanel view={view} note={note} error={error} busy={busy} onNoteChange={setNote} onReview={() => void review()} onSaveNote={() => void saveNote()} />;
}
