import { useMemo, useState } from 'react';
import { Icon, Mark } from '../shared/Icon';
import { NvButton } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import {
  buildOnboardingContext,
  canLeaveOnboardingStep,
  createOnboardingDraft,
  finishOnboarding,
  nextOnboardingStep,
  normalizePreferredName,
  ONBOARDING_STEPS,
  prevOnboardingStep,
  type OnboardingDraft,
  type OnboardingFinish,
  type OnboardingStep,
} from './showroom-onboarding';
import './showroom-onboarding.css';

const ENERGY: Array<NonNullable<OnboardingDraft['energy']>> = ['Baja', 'Media', 'Alta'];
const STEP_COPY: Record<OnboardingStep, { eyebrow: string; title: string; lead: string }> = {
  invite: { eyebrow: 'Invitación del consultorio', title: 'Tu nutricionista te espera en Plan V', lead: 'Este espacio es el acompañamiento con tu profesional, no una app genérica de dietas.' },
  how: { eyebrow: 'Cómo funciona', title: 'Tres cosas, con claridad', lead: 'Vas a ver sólo lo que tu nutricionista publica. Nada se inventa para rellenar la pantalla.' },
  privacy: { eyebrow: 'Privacidad', title: 'Qué ve tu nutricionista', lead: 'Registrás vos. El consultorio lee esos registros. Las notas internas no aparecen acá.' },
  profile: { eyebrow: 'Tu ficha', title: 'Confirmá cómo te llamamos', lead: 'El objetivo lo publica tu nutricionista. Acá no se edita ni se diagnostica.' },
  habits: { eyebrow: 'Opcional', title: 'Un primer registro, si querés', lead: 'Agua, sueño y energía son autodeclarados. Podés saltearlos y cargarlos después.' },
  ready: { eyebrow: 'Listo', title: 'Ya estás en tu espacio', lead: 'Empezá por el plan de hoy o registrá una comida. Verónica va a ver lo que publiques.' },
};

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
  const copy = STEP_COPY[step];
  const canContinue = canLeaveOnboardingStep(step, draft);
  const next = nextOnboardingStep(step);
  const previous = prevOnboardingStep(step);
  const finished = finishOnboarding(draft);

  const goNext = () => {
    if (!canContinue) return;
    if (next) { setStep(next); return; }
    if (finished) onFinished('inicio', finished);
  };

  return <section className="nvon" aria-label="Ingreso del paciente">
    <header className="nvon-top">
      <Mark />
      <span>Plan V</span>
      <ol aria-label="Pasos del ingreso">{ONBOARDING_STEPS.map((id) => <li key={id} aria-current={id === step ? 'step' : undefined} />)}</ol>
      <NvButton className="nv-ghost nv-theme" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} onClick={onToggleTheme}><Icon name={darkMode ? 'sun' : 'moon'} size={18} /></NvButton>
    </header>

    <div className="nvon-card">
      <p className="nvon-eyebrow">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="nvon-lead">{copy.lead}</p>

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
          <li>Peso, medidas y fotos corporales no forman parte de este ingreso.</li>
        </ul>
        <label>
          <input type="checkbox" checked={draft.consentSharing} onChange={(event) => setDraft((current) => ({ ...current, consentSharing: event.target.checked }))} />
          Acepto que {context.nutritionist} vea lo que registre en Plan V.
        </label>
      </div>}

      {step === 'profile' && <div className="nvon-profile">
        <label>¿Cómo preferís que te nombremos?
          <input value={draft.preferredName} onChange={(event) => setDraft((current) => ({ ...current, preferredName: event.target.value }))} maxLength={40} autoComplete="nickname" />
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
        <p>En demo no se escribe en la ficha hasta que lo registres desde Inicio o Diario.</p>
      </div>}

      {step === 'ready' && <ul className="nvon-points">
        <li><Icon name="check" size={18} /><div><strong>Hola, {normalizePreferredName(draft.preferredName)}</strong><span>{context.hasPublishedPlan ? 'Ya tenés un plan de la semana para consultar.' : 'Cuando Verónica publique el plan, aparece en tu inicio.'}</span></div></li>
        <li><Icon name="calendar" size={18} /><div><strong>{context.appointmentWhen ?? 'Consulta por coordinar'}</strong><span>La gestión del turno sigue en el consultorio. Vos podés confirmar asistencia.</span></div></li>
      </ul>}
    </div>

    <footer className="nvon-actions">
      {previous ? <NvButton className="nv-ghost" onClick={() => setStep(previous)}>Atrás</NvButton> : <NvButton className="nv-ghost" onClick={onExit}>Salir</NvButton>}
      {step === 'habits' && next && <NvButton className="nv-ghost" onClick={() => setStep(next)}>Saltear</NvButton>}
      {step === 'ready' && finished ? <>
        <NvButton className="nv-ghost" onClick={() => onFinished('diario', finished)}>Registrar comida</NvButton>
        <NvButton onClick={() => onFinished(context.hasPublishedPlan ? 'plan' : 'inicio', finished)}>{context.hasPublishedPlan ? 'Ver mi plan' : 'Ir al inicio'}</NvButton>
      </> : <NvButton onClick={goNext} disabled={!canContinue}>{step === 'invite' ? 'Continuar' : 'Siguiente'}</NvButton>}
    </footer>
  </section>;
}
