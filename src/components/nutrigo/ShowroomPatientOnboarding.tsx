import { useEffect, useMemo, useRef, useState } from 'react';
import { api, isAbortError } from '../../api/client';
import { Icon, Mark } from '../shared/Icon';
import { NvButton } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import {
  buildOnboardingContext,
  canLeaveOnboardingStep,
  careConsentFromCatalog,
  createOnboardingDraft,
  draftToIntakePayload,
  finishOnboarding,
  intakeStepForUi,
  intakeToDraft,
  isPersistUnavailable,
  nextOnboardingStep,
  normalizePreferredName,
  ONBOARDING_STEPS,
  prevOnboardingStep,
  resumeOnboardingStep,
  stepFieldError,
  type ConsentCatalogEntry,
  type HealthChoice,
  type OnboardingDraft,
  type OnboardingFinish,
  type OnboardingStep,
} from './showroom-onboarding';
import './showroom-onboarding.css';

const ENERGY: Array<NonNullable<OnboardingDraft['energy']>> = ['Baja', 'Media', 'Alta'];
const HEALTH: Array<{ id: HealthChoice; label: string }> = [
  { id: 'unknown', label: 'No lo sé' },
  { id: 'none', label: 'No tengo' },
  { id: 'reported', label: 'Sí' },
];
const STEP_COPY: Record<OnboardingStep, { eyebrow: string; title: string; lead: string }> = {
  invite: { eyebrow: 'Invitación del consultorio', title: 'Tu nutricionista te espera en Plan V', lead: 'Este espacio es el acompañamiento con tu profesional, no una app genérica de dietas.' },
  how: { eyebrow: 'Cómo funciona', title: 'Tres cosas, con claridad', lead: 'Vas a ver sólo lo que tu nutricionista publica. Nada se inventa para rellenar la pantalla.' },
  privacy: { eyebrow: 'Privacidad', title: 'Qué ve tu nutricionista', lead: 'Vos elegís qué compartir. Las fotos corporales y los estudios son opcionales.' },
  profile: { eyebrow: 'Sobre vos', title: 'Confirmá cómo te llamamos', lead: 'El objetivo lo publica tu nutricionista. Acá no se edita ni se diagnostica.' },
  intent: { eyebrow: 'Tu pedido', title: '¿En qué te gustaría que te acompañemos?', lead: 'Es tu intención, no una indicación profesional. Podés dejarlo breve.' },
  allergies: { eyebrow: 'Alimentos', title: '¿Hay algo que necesites evitar?', lead: 'Vacío no significa “no tengo”. Elegí No lo sé, No tengo o Sí.' },
  habits: { eyebrow: 'Opcional', title: 'Un primer registro, si querés', lead: 'Agua, sueño y energía son autodeclarados. Podés saltearlos y cargarlos después.' },
  review: { eyebrow: 'Revisar', title: 'Revisá lo que vas a compartir', lead: 'Al enviar, Verónica recibe tu declaración. Sus notas no aparecen acá.' },
  ready: { eyebrow: 'Recibido', title: 'Ya estás en tu espacio', lead: 'Empezá por el plan de hoy o registrá una comida. Verónica va a revisar lo que enviaste.' },
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error' | 'unavailable';

export function ShowroomPatientOnboarding({
  patient,
  darkMode,
  onToggleTheme,
  onExit,
  onFinished,
}: {
  patient: ShowroomPatient;
  darkMode: boolean;
  onToggleTheme: () => void;
  onExit: () => void;
  onFinished: (next: 'inicio' | 'plan' | 'diario', result: OnboardingFinish) => void;
}) {
  const context = useMemo(() => buildOnboardingContext(patient), [patient]);
  const [step, setStep] = useState<OnboardingStep>('invite');
  const [draft, setDraft] = useState<OnboardingDraft>(() => createOnboardingDraft(context));
  const [catalog, setCatalog] = useState<ConsentCatalogEntry[]>([]);
  const revisionRef = useRef(1);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const readyDraft = useRef(false);
  const copy = STEP_COPY[step];
  const canContinue = canLeaveOnboardingStep(step, draft);
  const next = nextOnboardingStep(step);
  const previous = prevOnboardingStep(step);
  const finished = finishOnboarding(draft);
  const care = careConsentFromCatalog(catalog);
  const stepNumber = ONBOARDING_STEPS.indexOf(step) + 1;

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      api.getConsentCatalog(),
      api.getIntake(patient.id),
    ]).then(([catalogResult, intake]) => {
      if (controller.signal.aborted) return;
      setCatalog(catalogResult.consents);
      revisionRef.current = intake.intake.revision;
      setDraft(intakeToDraft({
        intake: {
          revision: intake.intake.revision,
          status: intake.intake.status,
          payload: (intake.intake.payload ?? {}) as Record<string, unknown>,
        },
        consents: (intake.consents ?? []) as Array<{ purpose: string; decision: string }>,
      }, context));
      setStep(resumeOnboardingStep(intake.intake.status, intake.intake.step));
      readyDraft.current = true;
    }).catch((error: unknown) => {
      if (controller.signal.aborted || isAbortError(error)) return;
      readyDraft.current = true;
      if (isPersistUnavailable(error)) {
        setSaveState('unavailable');
        setSaveError('El ingreso persistente todavía no está habilitado en este entorno.');
        return;
      }
      setSaveState('error');
      setSaveError('No pudimos recuperar tu ingreso. Podés reintentar en un momento.');
    });
    return () => controller.abort();
  }, [patient.id, context]);

  useEffect(() => {
    titleRef.current?.focus();
  }, [step]);

  useEffect(() => {
    if (!readyDraft.current || step === 'ready' || saveState === 'unavailable') return;
    const timer = window.setTimeout(() => {
      void persist(step, draft);
    }, 800);
    return () => window.clearTimeout(timer);
  }, [draft, step]);

  const persist = async (currentStep: OnboardingStep, currentDraft: OnboardingDraft) => {
    if (saveState === 'unavailable') return false;
    setSaveState('saving');
    setSaveError('');
    try {
      const result = await api.patchIntake(patient.id, {
        expected_revision: revisionRef.current,
        step: intakeStepForUi(currentStep),
        payload: draftToIntakePayload(currentDraft),
      });
      revisionRef.current = result.intake.revision;
      setSaveState('saved');
      return true;
    } catch (error) {
      if (isPersistUnavailable(error)) {
        setSaveState('unavailable');
        setSaveError('El ingreso persistente todavía no está habilitado en este entorno.');
        return false;
      }
      setSaveState('error');
      setSaveError('No pudimos guardar. Revisá la conexión e intentá de nuevo.');
      return false;
    }
  };

  const grantCare = async (granted: boolean) => {
    setDraft((current) => ({ ...current, consentSharing: granted }));
    if (!granted || !care) return;
    try {
      await api.recordConsent(patient.id, {
        purpose: care.purpose,
        text_version: care.text_version,
        text_hash: care.text_hash,
        decision: 'granted',
      });
    } catch (error) {
      setDraft((current) => ({ ...current, consentSharing: false }));
      setSaveState('error');
      setSaveError(isPersistUnavailable(error)
        ? 'El consentimiento persistente todavía no está habilitado en este entorno.'
        : 'No pudimos registrar el consentimiento.');
    }
  };

  const goNext = async () => {
    const error = stepFieldError(step, draft);
    setFieldError(error);
    if (error) return;
    const saved = await persist(next ?? step, draft);
    if (!saved) return;
    if (next) {
      setStep(next);
    }
  };

  const submit = async () => {
    const error = stepFieldError('review', draft) ?? (finished ? null : 'Completá consentimiento y nombre para enviar.');
    setFieldError(error);
    if (error || !finished || submitting) return;
    setSubmitting(true);
    const saved = await persist('review', draft);
    if (!saved) {
      setSubmitting(false);
      return;
    }
    try {
      const result = await api.submitIntake(patient.id, revisionRef.current);
      revisionRef.current = result.intake.revision;
      setStep('ready');
      setSaveState('saved');
    } catch (reason) {
      setSaveState('error');
      setSaveError(isPersistUnavailable(reason)
        ? 'El envío persistente todavía no está habilitado en este entorno.'
        : 'No pudimos enviar el ingreso. Reintentá; no se duplica si ya estaba enviado.');
    } finally {
      setSubmitting(false);
    }
  };

  const saveLabel = saveState === 'saving' ? 'Guardando…'
    : saveState === 'saved' ? 'Guardado en el consultorio'
      : saveState === 'unavailable' ? 'Sin persistencia en este entorno'
        : saveState === 'error' ? 'No pudimos guardar'
          : 'Se guarda al avanzar y mientras escribís';

  return <section className="nvon" aria-label="Ingreso del paciente">
    <header className="nvon-top">
      <Mark />
      <span>Plan V</span>
      <p className="nvon-progress" aria-live="polite">Paso {stepNumber} de {ONBOARDING_STEPS.length}</p>
      <ol aria-label="Pasos del ingreso">{ONBOARDING_STEPS.map((id) => <li key={id} aria-current={id === step ? 'step' : undefined} />)}</ol>
      <NvButton className="nv-ghost nv-theme" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} onClick={onToggleTheme}><Icon name={darkMode ? 'sun' : 'moon'} size={18} /></NvButton>
    </header>

    <div className="nvon-card">
      <p className="nvon-eyebrow">{copy.eyebrow}</p>
      <h1 ref={titleRef} tabIndex={-1}>{copy.title}</h1>
      <p className="nvon-lead">{copy.lead}</p>
      <p className="nvon-status" role="status">{saveLabel}</p>
      {saveError && <p className="nvon-error" role="alert">{saveError}</p>}
      {fieldError && <p className="nvon-error" role="alert">{fieldError}</p>}

      {step === 'invite' && <div className="nvon-invite">
        <span className="nv-avatar">VT</span>
        <div><strong>{context.nutritionist}</strong><small>Nutricionista · Plan V</small></div>
        <p>Invitó a <strong>{context.fullName}</strong> a seguir el plan desde acá.</p>
      </div>}

      {step === 'how' && <ul className="nvon-points">
        <li><Icon name="list" size={18} /><div><strong>Plan publicado</strong><span>Indicaciones de la semana, cuando tu nutricionista las deje listas.</span></div></li>
        <li><Icon name="history" size={18} /><div><strong>Diario con revisión</strong><span>Registrás comidas. Los valores cuentan cuando ella los confirma o ajusta.</span></div></li>
        <li><Icon name="message" size={18} /><div><strong>Mensajes del consultorio</strong><span>Un hilo con Verónica. No hay chatbot clínico ni otros pacientes.</span></div></li>
      </ul>}

      {step === 'privacy' && <div className="nvon-privacy">
        <ul>
          <li>Ve tus comidas, hábitos y mensajes de este espacio.</li>
          <li>No ves notas internas, briefs ni el resto de la agenda del consultorio.</li>
          <li>Peso, medidas y fotos corporales no se piden en este ingreso.</li>
        </ul>
        <p className="nvon-consent-text">{care?.text ?? 'Autorizo a mi nutricionista a ver lo que registre para el acompañamiento.'}</p>
        <label>
          <input
            type="checkbox"
            checked={draft.consentSharing}
            onChange={(event) => void grantCare(event.target.checked)}
          />
          Acepto la relación de atención con {context.nutritionist}. No está preseleccionado.
        </label>
      </div>}

      {step === 'profile' && <div className="nvon-profile">
        <label>¿Cómo preferís que te nombremos?
          <input
            value={draft.preferredName}
            onChange={(event) => setDraft((current) => ({ ...current, preferredName: event.target.value }))}
            maxLength={40}
            autoComplete="nickname"
            aria-invalid={Boolean(fieldError)}
          />
        </label>
        <article>
          <small>Objetivo publicado</small>
          <p>{context.goal}</p>
        </article>
        {context.appointmentWhen && <article>
          <small>Próxima consulta</small>
          <p>{context.appointmentWhen}</p>
        </article>}
      </div>}

      {step === 'intent' && <div className="nvon-intent">
        <label>Contame con tus palabras
          <textarea
            value={draft.patientIntent}
            onChange={(event) => setDraft((current) => ({ ...current, patientIntent: event.target.value }))}
            maxLength={500}
            rows={4}
          />
        </label>
      </div>}

      {step === 'allergies' && <div className="nvon-health">
        <fieldset>
          <legend>Alimentos a evitar</legend>
          <div>{HEALTH.map((option) => (
            <button type="button" key={option.id} aria-pressed={draft.allergiesState === option.id} onClick={() => setDraft((current) => ({ ...current, allergiesState: option.id }))}>{option.label}</button>
          ))}</div>
          {draft.allergiesState === 'reported' && (
            <label>Cuáles, separados por coma
              <input value={draft.allergyItems} onChange={(event) => setDraft((current) => ({ ...current, allergyItems: event.target.value }))} />
            </label>
          )}
        </fieldset>
        <fieldset>
          <legend>Otras restricciones</legend>
          <div>{HEALTH.map((option) => (
            <button type="button" key={option.id} aria-pressed={draft.restrictionsState === option.id} onClick={() => setDraft((current) => ({ ...current, restrictionsState: option.id }))}>{option.label}</button>
          ))}</div>
          {draft.restrictionsState === 'reported' && (
            <label>Cuáles, separados por coma
              <input value={draft.restrictionItems} onChange={(event) => setDraft((current) => ({ ...current, restrictionItems: event.target.value }))} />
            </label>
          )}
        </fieldset>
      </div>}

      {step === 'habits' && <div className="nvon-habits">
        <fieldset>
          <legend>Agua de hoy</legend>
          <div>{[0, 2, 4, 6, 8].map((value) => <button type="button" key={value} aria-pressed={draft.hydration === value} onClick={() => setDraft((current) => ({ ...current, hydration: value }))}>{value} vasos</button>)}</div>
        </fieldset>
        <fieldset>
          <legend>Sueño de anoche</legend>
          <div>{[5, 6, 7, 8, 9].map((value) => <button type="button" key={value} aria-pressed={draft.sleepHours === value} onClick={() => setDraft((current) => ({ ...current, sleepHours: value }))}>{value} h</button>)}</div>
        </fieldset>
        <fieldset>
          <legend>Energía percibida</legend>
          <div>{ENERGY.map((value) => <button type="button" key={value} aria-pressed={draft.energy === value} onClick={() => setDraft((current) => ({ ...current, energy: value }))}>{value}</button>)}</div>
        </fieldset>
        <p>Si lo salteás, no se inventa un valor. Cero vasos es distinto de no responder.</p>
      </div>}

      {step === 'review' && <ul className="nvon-points">
        <li><Icon name="check" size={18} /><div><strong>{normalizePreferredName(draft.preferredName) || 'Nombre pendiente'}</strong><span>{draft.consentSharing ? 'Consentimiento de atención otorgado.' : 'Falta el consentimiento de atención.'}</span></div></li>
        <li><Icon name="list" size={18} /><div><strong>Alimentos</strong><span>{draft.allergiesState === 'reported' ? draft.allergyItems : draft.allergiesState === 'none' ? 'Declaraste que no tenés alimentos a evitar.' : 'Todavía no lo sabés o preferís hablarlo.'}</span></div></li>
        <li><Icon name="message" size={18} /><div><strong>Tu pedido</strong><span>{draft.patientIntent.trim() || 'Sin texto adicional. Se puede completar después.'}</span></div></li>
      </ul>}

      {step === 'ready' && <ul className="nvon-points">
        <li><Icon name="check" size={18} /><div><strong>Hola, {normalizePreferredName(draft.preferredName)}</strong><span>{context.hasPublishedPlan ? 'Ya tenés un plan de la semana para consultar.' : 'Cuando Verónica publique el plan, aparece en tu inicio.'}</span></div></li>
        <li><Icon name="calendar" size={18} /><div><strong>{context.appointmentWhen ?? 'Consulta por coordinar'}</strong><span>Recibimos tu información. Verónica la va a revisar; no hay un plan inventado.</span></div></li>
      </ul>}
    </div>

    <footer className="nvon-actions">
      {previous && step !== 'ready' ? <NvButton className="nv-ghost" onClick={() => setStep(previous)}>Atrás</NvButton> : <NvButton className="nv-ghost" onClick={onExit}>{step === 'ready' ? 'Cerrar' : 'Salir'}</NvButton>}
      {step === 'habits' && next && <NvButton className="nv-ghost" onClick={() => { setStep(next); }}>Saltear</NvButton>}
      {step === 'review' && <NvButton onClick={() => void submit()} disabled={!canContinue || submitting}>{submitting ? 'Enviando…' : 'Enviar a mi nutricionista'}</NvButton>}
      {step === 'ready' && finished ? <>
        <NvButton className="nv-ghost" onClick={() => onFinished('diario', finished)}>Registrar comida</NvButton>
        <NvButton onClick={() => onFinished(context.hasPublishedPlan ? 'plan' : 'inicio', finished)}>{context.hasPublishedPlan ? 'Ver mi plan' : 'Ir al inicio'}</NvButton>
      </> : step !== 'review' && step !== 'ready' ? <NvButton onClick={() => void goNext()} disabled={!canContinue}>{step === 'invite' ? 'Continuar' : 'Siguiente'}</NvButton> : null}
    </footer>
  </section>;
}
