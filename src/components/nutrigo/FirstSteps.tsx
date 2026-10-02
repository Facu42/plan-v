import { NvButton } from './primitives';
import { ArrowRight, Check, ListChecks, UserPlus, LinkSimple } from '@phosphor-icons/react';
import './first-steps.css';

/** Primer uso de la nutricionista: lo que ve antes de tener pacientes, con los tres pasos en orden. */
export function FirstSteps({ onStart, onExplore, onInvite, onPlan, patientName, busy = false, error }: {
  onStart: () => void;
  onExplore: () => void;
  onInvite?: () => void;
  onPlan?: () => void;
  patientName?: string;
  busy?: boolean;
  error?: string;
}) {
  const steps = [
    { title: 'Crear paciente', text: 'Completá su ficha para empezar el acompañamiento.', action: onStart, Icon: UserPlus },
    { title: 'Compartir invitación', text: onInvite ? `Abrí la invitación de ${patientName}.` : patientName ? 'Este paciente ya tiene su cuenta vinculada.' : 'Disponible cuando crees tu primer paciente. Podés copiar el enlace o enviarlo por WhatsApp.', action: onInvite, Icon: LinkSimple },
    { title: 'Armar su plan', text: onPlan ? `Abrí el plan de ${patientName}.` : 'Disponible cuando crees tu primer paciente.', action: onPlan, Icon: ListChecks },
  ];
  return <section className="nv-first-steps" aria-labelledby="nv-first-steps-title">
    <span className="nv-first-mark" aria-hidden="true"><Check size={26} /></span>
    <h2 id="nv-first-steps-title">Tu consultorio empieza acá</h2>
    <p>Tres pasos para empezar a acompañar a tus pacientes.</p>
    <ol>{steps.map((step, index) => <li key={step.title}><button type="button" onClick={step.action} disabled={busy || !step.action}>
      <span className="nv-first-icon" aria-hidden="true"><step.Icon size={20} /></span>
      <span className="nv-first-copy"><strong>{step.title}</strong><small>{step.text}</small></span>
      <span className="nv-first-number" aria-hidden="true">{index + 1}</span><ArrowRight size={16} aria-hidden="true" />
    </button></li>)}</ol>
    {busy && <p role="status">Preparando la invitación…</p>}
    {error && <p role="alert">{error}</p>}
    <NvButton onClick={onStart} disabled={busy}>{patientName ? 'Crear otro paciente' : 'Crear mi primer paciente'}</NvButton>
    <NvButton className="nv-ghost" onClick={onExplore} disabled={busy}>Explorar consultorio</NvButton>
    <p className="nv-first-note">La IA propone. Vos revisás y confirmás.</p>
  </section>;
}
