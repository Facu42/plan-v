import { useEffect, useMemo, useRef, useState } from 'react';
import { api, isAbortError } from '../../api/client';
import { Icon, Mark } from '../shared/Icon';
import { NvButton } from './primitives';
import welcomeDish from '../../assets/onboarding/welcome-dish.webp';
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
  onboardingReview,
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
  invite: { eyebrow: 'Tu espacio en Plan V', title: 'Bienvenida a tu espacio', lead: 'Tu plan, tus registros y tu nutricionista en un solo lugar.' },
  privacy: { eyebrow: 'Privacidad', title: 'Vos elegís qué compartir', lead: 'Tu nutricionista ve lo que registrás para acompañarte. Las fotos corporales y los estudios son opcionales.' },
  profile: { eyebrow: 'Sobre vos', title: 'Contanos sobre vos', lead: 'Empecemos por cómo preferís que te llamemos y qué te gustaría trabajar.' },
  allergies: { eyebrow: 'Alimentos y hábitos', title: 'Tu día a día también cuenta', lead: 'Contanos si hay alimentos que evitás. Los hábitos son opcionales: podés completarlos después.' },
  review: { eyebrow: 'Revisar y enviar', title: 'Revisá lo que vas a compartir', lead: 'Tu nutricionista recibe esta información para revisarla con vos.' },
  ready: { eyebrow: 'Información recibida', title: 'Ya estás en tu espacio', lead: 'Tu nutricionista va a revisar lo que enviaste. Podés consultar tu plan o registrar una comida.' },
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
  const loadedRevision = useRef<number | null>(null);
  draftRef.current = draft;
  stepRef.current = step;
  contextRef.current = context;
  const copy = STEP_COPY[step];
  const canContinue = canLeaveOnboardingStep(step, draft);
  const next = nextOnboardingStep(step);
  const previous = prevOnboardingStep(step);
  const finished = finishOnboarding(draft);
  const care = careConsentFromCatalog(catalog);
  const stepNumber = ONBOARDING_STEPS.findIndex(id => id === step) + 1;
  const busy = navigating || submitting || consentBusy;
  const disabled = !loaded || recoverNeeded || busy || awaitingReceipt;

  const cancelTimer = () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  useEffect(() => {
    const controller = new AbortController();
    controllerRef.current = controller;
    loadedRevision.current = null;
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
        loadedRevision.current = snapshot.intake.revision;
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
      if (result && sessionRef.current === session) { loadedRevision.current = result.intake.revision; setStep('ready'); setSaveState('saved'); }
    } catch (reason) {
      showFailure(reason, session);
      if (session.awaitingReceipt && !session.blocked) setSaveError('No recibimos la confirmación del envío. Reintentá confirmar; se conserva el mismo ingreso sin duplicarlo.');
    } finally {
      if (sessionRef.current === session) setAwaitingReceipt(session.awaitingReceipt);
      actionRef.current = false; setSubmitting(false);
    }
  };

  const correctSubmitted = async () => {
    const revision = loadedRevision.current;
    if (revision === null || actionRef.current || disabled) return;
    actionRef.current = true; setNavigating(true); cancelTimer(); setSaveError('');
    try {
      const snapshot = await api.reopenIntake(patient.id, revision, { signal: controllerRef.current?.signal });
      if (controllerRef.current?.signal.aborted) return;
      const currentCare = careConsentFromCatalog(catalog);
      const recovered = intakeToDraft({ intake: { ...snapshot.intake, payload: snapshot.intake.payload as Record<string, unknown> }, consents: snapshot.consents.filter(event => event.purpose !== 'care_relationship' || event.text_version === currentCare?.text_version) }, contextRef.current);
      sessionRef.current?.dispose();
      sessionRef.current = createIntakeSession(snapshot.intake.revision, { save: data => api.patchIntake(patient.id, data, { signal: controllerRef.current?.signal }), submit: expected => api.submitIntake(patient.id, expected, { signal: controllerRef.current?.signal }) });
      loadedRevision.current = snapshot.intake.revision;
      skipInitialSave.current = true; setDraft(recovered); setStep(recovered.consentSharing ? 'profile' : 'privacy'); setSaveState('saved');
    } catch (error) {
      if (isAbortError(error)) return;
      setRecoverNeeded(true); setSaveState('error'); setSaveError('No pudimos confirmar la apertura para corregir. Recuperá la ficha guardada antes de reintentar. Los datos anteriores se conservan.');
    } finally { actionRef.current = false; setNavigating(false); }
  };

  const saveLabel = !loaded && !saveError ? 'Recuperando tu ingreso…'
    : consentBusy ? 'Registrando tu decisión…'
      : saveState === 'saving' ? 'Guardando…'
        : saveState === 'saved' ? 'Guardado en el consultorio'
          : saveState === 'unavailable' ? 'Ingreso no disponible'
            : saveState === 'error' ? 'Guardado sin confirmar'
              : 'Cambios pendientes de guardar';

  return <section className={`nvon${step === 'invite' ? ' nvon-welcome' : ''}`} aria-label="Ingreso del paciente">
    <header className="nvon-top">
      <Mark />
      <span>Plan V</span>
      <p className="nvon-progress" aria-live="polite">{step === 'ready' ? 'Ingreso completo' : `${stepNumber} de ${ONBOARDING_STEPS.length}`}</p>
      <ol aria-label="Pasos del ingreso">{ONBOARDING_STEPS.map((id, index) => <li key={id} aria-current={id === step ? 'step' : undefined}><span className="nvon-sr">{index + 1}. {STEP_COPY[id].eyebrow}</span></li>)}</ol>
      <NvButton className="nv-ghost nv-theme" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} onClick={onToggleTheme}><Icon name={darkMode ? 'sun' : 'moon'} size={18} /></NvButton>
    </header>

    <div className="nvon-body">
    {step === 'invite' && <aside className="nvon-photo">
      <img src={welcomeDish} alt="Plato con garbanzos, brócoli, zanahorias y hojas verdes" width={960} height={960} fetchPriority="high" />
      <h2>Tu bienestar, acompañado</h2>
      <p>Un espacio para avanzar a tu ritmo.</p>
    </aside>}
    <div className="nvon-panel">
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

      {step === 'invite' && <ul className="nvon-points nvon-benefits">
        <li><Icon name="list" size={20} /><div><strong>Plan</strong><span>Tus comidas e indicaciones de la semana.</span></div></li>
        <li><Icon name="history" size={20} /><div><strong>Diario</strong><span>Tus registros, con revisión profesional.</span></div></li>
        <li><Icon name="message" size={20} /><div><strong>Mensajes</strong><span>Contacto directo con tu nutricionista.</span></div></li>
      </ul>}

      {step === 'privacy' && <div className="nvon-privacy">
        <ul>
          <li>Ve tus comidas, hábitos y mensajes de este espacio.</li>
          <li>No ves notas internas, briefs ni el resto de la agenda del consultorio.</li>
          <li>Peso, medidas y fotos corporales no se piden en este ingreso.</li>
        </ul>
        <label>
          <input
            type="checkbox"
            checked={draft.consentSharing}
            disabled={!care || disabled}
            onChange={(event) => void grantCare(event.target.checked)}
          />
          Acepto compartir mis registros con mi nutricionista para el acompañamiento.
        </label>
        <details className="nvon-consent-details"><summary>Leer el consentimiento de atención</summary><p>{care?.text ?? 'Estamos recuperando el texto del consentimiento.'}</p></details>
        <p className="nvon-help">Podés revisar o retirar el consentimiento en Tus datos, desde el menú de tu cuenta.</p>
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
        <div className="nvon-intent"><label>¿Qué te gustaría trabajar? <small>Opcional</small>
          <textarea value={draft.patientIntent} onChange={event => setDraft(current => ({ ...current, patientIntent: event.target.value }))} maxLength={500} rows={3} placeholder="Contanos con tus palabras…" />
        </label><p className="nvon-help">Es tu pedido. El objetivo del plan lo define tu nutricionista.</p></div>
        <article>
          <small>Objetivo publicado</small>
          <p>{context.goal}</p>
        </article>
        {context.appointmentWhen && <article>
          <small>Próxima consulta</small>
          <p>{context.appointmentWhen}</p>
        </article>}
      </div>}

      {step === 'allergies' && <><div className="nvon-health">
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
      </div><div className="nvon-habits">
        <h2>Un primer registro <small>Opcional</small></h2>
        <fieldset>
          <legend>Agua de hoy</legend>
          <div>{[0, 2, 4, 6, 8].map((value) => <button type="button" key={value} aria-pressed={draft.hydration === value} onClick={() => setDraft((current) => ({ ...current, hydration: current.hydration === value ? null : value }))}>{value} vasos</button>)}</div>
        </fieldset>
        <fieldset>
          <legend>Sueño de anoche</legend>
          <div>{[5, 6, 7, 8, 9].map((value) => <button type="button" key={value} aria-pressed={draft.sleepHours === value} onClick={() => setDraft((current) => ({ ...current, sleepHours: current.sleepHours === value ? null : value }))}>{value} h</button>)}</div>
        </fieldset>
        <fieldset>
          <legend>Energía percibida</legend>
          <div>{ENERGY.map((value) => <button type="button" key={value} aria-pressed={draft.energy === value} onClick={() => setDraft((current) => ({ ...current, energy: current.energy === value ? null : value }))}>{value}</button>)}</div>
        </fieldset>
        <p>Si lo salteás, no se inventa un valor. Cero vasos es distinto de no responder.</p>
      </div></>}

      {step === 'review' && <dl className="nvon-review">{onboardingReview(draft).map(row => <div key={row.title}><dt>{row.title}</dt><dd>{row.value}</dd></div>)}</dl>}

      {step === 'ready' && <ul className="nvon-points">
        <li><Icon name="check" size={18} /><div><strong>Hola, {normalizePreferredName(draft.preferredName)}</strong><span>{context.hasPublishedPlan ? 'Ya tenés un plan de la semana para consultar.' : 'Cuando tu nutricionista publique el plan, aparece en tu inicio.'}</span></div></li>
        <li><Icon name="calendar" size={18} /><div><strong>{context.appointmentWhen ?? 'Consulta por coordinar'}</strong><span>Tu información ya está en el consultorio para su revisión.</span></div></li>
      </ul>}
      {step === 'ready' && <p className="nvon-help">Si querés cargar peso y medidas para el cálculo del plan, podés hacerlo después en Inicio. Es un formulario separado y opcional.</p>}
      </fieldset>
    </div>

    <footer className="nvon-actions">
      {previous && step !== 'ready' ? <NvButton className="nv-ghost" disabled={disabled} onClick={() => void moveTo(previous)}>Atrás</NvButton> : <NvButton className="nv-ghost" disabled={busy || (loaded && recoverNeeded)} onClick={() => void exit()}>{step === 'ready' ? 'Cerrar' : 'Continuar después'}</NvButton>}
      {step === 'review' && <NvButton onClick={() => void submit()} disabled={!loaded || recoverNeeded || !canContinue || busy}>{submitting ? 'Enviando…' : awaitingReceipt ? 'Confirmar envío' : 'Enviar a mi nutricionista'}</NvButton>}
      {step === 'ready' && <NvButton className="nv-soft" disabled={disabled} onClick={() => void correctSubmitted()}>Corregir mi ficha enviada</NvButton>}
      {step === 'ready' && finished ? <>
        <NvButton onClick={() => onFinished(context.hasPublishedPlan ? 'plan' : 'inicio', finished)}>{context.hasPublishedPlan ? 'Ver mi plan' : 'Ir al inicio'}</NvButton>
      </> : step !== 'review' && step !== 'ready' ? <NvButton onClick={() => void goNext()} disabled={disabled || !canContinue}>{step === 'invite' ? 'Comenzar' : 'Continuar'}</NvButton> : null}
    </footer>
    </div>
    </div>
  </section>;
}
