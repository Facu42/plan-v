import { useEffect, useMemo, useRef, useState } from 'react';
import { api, isAbortError } from '../../api/client';
import { Icon, Mark } from '../shared/Icon';
import { NvButton } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import { isIntakeConflict } from './intake-save-queue';
import { createIntakeSession, type IntakeSession } from './intake-session';
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
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [navigating, setNavigating] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [recoverNeeded, setRecoverNeeded] = useState(false);
  const [awaitingReceipt, setAwaitingReceipt] = useState(false);
  const [reload, setReload] = useState(0);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const sessionRef = useRef<IntakeSession | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const actionRef = useRef(false);
  const skipInitialSave = useRef(true);
  const draftRef = useRef(draft);
  const stepRef = useRef(step);
  const contextRef = useRef(context);
  draftRef.current = draft;
  stepRef.current = step;
  contextRef.current = context;
  const copy = STEP_COPY[step];
  const canContinue = canLeaveOnboardingStep(step, draft);
  const next = nextOnboardingStep(step);
  const previous = prevOnboardingStep(step);
  const finished = finishOnboarding(draft);
  const care = careConsentFromCatalog(catalog);
  const stepNumber = ONBOARDING_STEPS.indexOf(step) + 1;
  const busy = navigating || submitting || consentBusy;
  const disabled = !loaded || recoverNeeded || busy || awaitingReceipt;

  const cancelTimer = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    setLoaded(false);
    setSaveError('');
    setRecoverNeeded(false);
    setAwaitingReceipt(false);
    setSaveState('idle');
    skipInitialSave.current = true;
    const init = { signal: controller.signal };
    Promise.all([api.getConsentCatalog(init), api.getIntake(patient.id, init)])
      .then(([catalogResult, snapshot]) => {
        if (controller.signal.aborted) return;
        setCatalog(catalogResult.consents);
        const currentCare = careConsentFromCatalog(catalogResult.consents);
        const recovered = intakeToDraft({
          intake: { ...snapshot.intake, payload: snapshot.intake.payload as Record<string, unknown> },
          consents: snapshot.consents.filter(event => event.purpose !== 'care_relationship' || event.text_version === currentCare?.text_version),
        }, contextRef.current);
        sessionRef.current = createIntakeSession(snapshot.intake.revision, {
          save: data => api.patchIntake(patient.id, data, init),
          submit: revision => api.submitIntake(patient.id, revision, init),
        });
        setDraft(recovered);
        setStep(resumeOnboardingStep(snapshot.intake.status, snapshot.intake.step));
        setLoaded(true);
        setSaveState('saved');
      }).catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setRecoverNeeded(true);
        setSaveState(isPersistUnavailable(error) ? 'unavailable' : 'error');
        setSaveError('No pudimos recuperar tu ingreso. Reintentá para continuar desde los datos guardados.');
      });
    return () => {
      cancelTimer();
      controller.abort();
      sessionRef.current?.dispose();
      sessionRef.current = null;
    };
  }, [patient.id, reload]);

  useEffect(() => { titleRef.current?.focus(); }, [step]);

  const showFailure = (error: unknown, session: IntakeSession) => {
    if (sessionRef.current !== session || isAbortError(error)) return;
    const conflict = isIntakeConflict(error);
    setRecoverNeeded(conflict);
    setSaveState(isPersistUnavailable(error) ? 'unavailable' : 'error');
    setSaveError(conflict
      ? 'El ingreso cambió en otra sesión. Recuperá la versión guardada para continuar.'
      : 'No pudimos confirmar el guardado. Tus cambios siguen en esta pantalla. Reintentá con conexión.');
  };

  const persist = async (currentStep: OnboardingStep, currentDraft: OnboardingDraft) => {
    const session = sessionRef.current;
    if (!session || session.blocked || !loaded) return false;
    setSaveState('saving');
    setSaveError('');
    try {
      const result = await session.save({ step: intakeStepForUi(currentStep), payload: draftToIntakePayload(currentDraft) });
      if (!result || sessionRef.current !== session) return false;
      setSaveState(draftRef.current === currentDraft ? 'saved' : 'idle');
      return true;
    } catch (error) { showFailure(error, session); return false; }
  };

  useEffect(() => {
    if (!loaded) return;
    if (skipInitialSave.current) { skipInitialSave.current = false; return; }
    if (stepRef.current === 'ready' || actionRef.current || recoverNeeded || awaitingReceipt) return;
    setSaveState('idle');
    timerRef.current = setTimeout(() => {
      const invalid = stepFieldError('allergies', draft);
      if (invalid) { setFieldError(invalid); return; }
      setFieldError(null);
      void persist(stepRef.current, draft);
    }, 800);
    return cancelTimer;
  }, [draft, loaded]);

  const grantCare = async (granted: boolean) => {
    const session = sessionRef.current;
    if (!session || !care || actionRef.current || disabled) return;
    cancelTimer();
    actionRef.current = true;
    setConsentBusy(true);
    setSaveError('');
    try {
      const result = await session.consent(() => api.recordConsent(patient.id, {
        purpose: care.purpose, text_version: care.text_version, text_hash: care.text_hash,
        decision: granted ? 'granted' : 'withdrawn',
      }, { signal: controllerRef.current?.signal }));
      if (result && sessionRef.current === session) {
        setDraft(current => ({ ...current, consentSharing: granted }));
        setSaveState('saved');
      }
    } catch (error) { showFailure(error, session); }
    finally { actionRef.current = false; setConsentBusy(false); }
  };

  const moveTo = async (destination: OnboardingStep) => {
    if (actionRef.current || disabled) return;
    cancelTimer();
    actionRef.current = true;
    setNavigating(true);
    try { if (await persist(destination, draft)) setStep(destination); }
    finally { actionRef.current = false; setNavigating(false); }
  };
  const goNext = async () => {
    const error = stepFieldError(step, draft);
    setFieldError(error);
    if (!error && next) await moveTo(next);
  };
  const exit = async () => {
    if (step === 'ready' || !loaded) { onExit(); return; }
    if (actionRef.current || disabled) return;
    cancelTimer(); actionRef.current = true; setNavigating(true);
    try { if (await persist(step, draft)) onExit(); }
    finally { actionRef.current = false; setNavigating(false); }
  };

  const submit = async () => {
    const session = sessionRef.current;
    const error = finished ? null : 'Completá consentimiento, nombre y alimentos antes de enviar.';
    setFieldError(error);
    if (!session || session.blocked || error || actionRef.current || !loaded) return;
    cancelTimer(); actionRef.current = true; setSubmitting(true); setSaveError('');
    try {
      const result = await session.submit({step:'review',payload:draftToIntakePayload(draft)});
      if (result && sessionRef.current === session) { setStep('ready'); setSaveState('saved'); }
    } catch (reason) {
      showFailure(reason, session);
      if (session.awaitingReceipt && !session.blocked) setSaveError('No recibimos la confirmación del envío. Reintentá confirmar; se conserva el mismo ingreso sin duplicarlo.');
    } finally {
      if (sessionRef.current === session) setAwaitingReceipt(session.awaitingReceipt);
      actionRef.current = false; setSubmitting(false);
    }
  };

  const saveLabel = !loaded && !saveError ? 'Recuperando tu ingreso…'
    : consentBusy ? 'Registrando tu decisión…'
      : saveState === 'saving' ? 'Guardando…'
        : saveState === 'saved' ? 'Guardado en el consultorio'
          : saveState === 'unavailable' ? 'Ingreso no disponible'
            : saveState === 'error' ? 'Guardado sin confirmar'
              : 'Cambios pendientes de guardar';

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
      {saveError && <div className="nvon-recovery">
        {recoverNeeded || !loaded ? <>
          {loaded && <p>Se reemplazarán los cambios de esta pantalla por la última versión guardada.</p>}
          <NvButton className="nv-soft" onClick={() => setReload(value => value + 1)}>Recuperar ingreso guardado</NvButton>
        </> : !awaitingReceipt && <NvButton className="nv-soft" onClick={() => { cancelTimer(); void persist(step, draft); }}>Reintentar guardado</NvButton>}
      </div>}
      <fieldset className="nvon-fields" disabled={disabled}>

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
            disabled={!care || disabled}
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
        <li><Icon name="message" size={18} /><div><strong>Tu pedido</strong><span>{draft.patientIntent.trim() || 'Sin texto adicional para este ingreso.'}</span></div></li>
      </ul>}

      {step === 'ready' && <ul className="nvon-points">
        <li><Icon name="check" size={18} /><div><strong>Hola, {normalizePreferredName(draft.preferredName)}</strong><span>{context.hasPublishedPlan ? 'Ya tenés un plan de la semana para consultar.' : 'Cuando Verónica publique el plan, aparece en tu inicio.'}</span></div></li>
        <li><Icon name="calendar" size={18} /><div><strong>{context.appointmentWhen ?? 'Consulta por coordinar'}</strong><span>Recibimos tu información. Verónica la va a revisar; no hay un plan inventado.</span></div></li>
      </ul>}
      </fieldset>
    </div>

    <footer className="nvon-actions">
      {previous && step !== 'ready' ? <NvButton className="nv-ghost" disabled={disabled} onClick={() => void moveTo(previous)}>Atrás</NvButton> : <NvButton className="nv-ghost" disabled={busy || (loaded && recoverNeeded)} onClick={() => void exit()}>{step === 'ready' ? 'Cerrar' : 'Salir'}</NvButton>}
      {step === 'habits' && next && <NvButton className="nv-ghost" disabled={disabled} onClick={() => void moveTo(next)}>Saltear</NvButton>}
      {step === 'review' && <NvButton onClick={() => void submit()} disabled={!loaded || recoverNeeded || !canContinue || busy}>{submitting ? 'Enviando…' : awaitingReceipt ? 'Confirmar envío' : 'Enviar a mi nutricionista'}</NvButton>}
      {step === 'ready' && finished ? <>
        <NvButton className="nv-ghost" onClick={() => onFinished('diario', finished)}>Registrar comida</NvButton>
        <NvButton onClick={() => onFinished(context.hasPublishedPlan ? 'plan' : 'inicio', finished)}>{context.hasPublishedPlan ? 'Ver mi plan' : 'Ir al inicio'}</NvButton>
      </> : step !== 'review' && step !== 'ready' ? <NvButton onClick={() => void goNext()} disabled={disabled || !canContinue}>{step === 'invite' ? 'Continuar' : 'Siguiente'}</NvButton> : null}
    </footer>
  </section>;
}
