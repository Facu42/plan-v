import { NvButton } from './primitives';
import './first-steps.css';

const STEPS = [
  { title: 'Creá tu primer paciente', text: 'En Pacientes, tocá "Nuevo paciente" y completá sus datos.' },
  { title: 'Compartile el enlace', text: 'Copiá el enlace de invitación o mandalo por WhatsApp.' },
  { title: 'Armá su plan', text: 'En Plan semanal cargá las comidas de cada día.' },
];

/** Primer uso de la nutricionista: lo que ve antes de tener pacientes, con los tres pasos en orden. */
export function FirstSteps({ onStart }: { onStart: () => void }) {
  return <section className="nv-first-steps" aria-labelledby="nv-first-steps-title">
    <h2 id="nv-first-steps-title">Empecemos</h2>
    <p>Todavía no tenés pacientes. En tres pasos dejás todo listo para acompañarlos.</p>
    <ol>{STEPS.map((step) => <li key={step.title}><strong>{step.title}</strong><span>{step.text}</span></li>)}</ol>
    <NvButton onClick={onStart}>Ir a Pacientes</NvButton>
  </section>;
}
