import type { Patient } from '../../types';
import { Icon, Mark } from '../shared/Icon';

export function PatientPaywall({
  patient,
  darkMode,
  onToggleTheme,
  onShowMessages,
}: {
  patient: Patient;
  darkMode: boolean;
  onToggleTheme: () => void;
  onShowMessages: () => void;
}) {
  const expired = patient.billing_status === 'past_due';

  return (
    <main className="patient-shell billing-shell">
      <header className="patient-topbar">
        <div className="brand-lockup"><Mark /><span>Plan V</span></div>
        <button className="round-button theme-toggle" type="button" aria-label={darkMode ? 'Usar tema claro' : 'Usar tema oscuro'} aria-pressed={darkMode} onClick={onToggleTheme}>
          <Icon name={darkMode ? 'sun' : 'moon'} size={18} />
        </button>
      </header>

      <section className="billing-paywall" aria-labelledby="billing-title">
        <span className="billing-paywall-icon"><Icon name="heart" size={26} /></span>
        <p className="eyebrow">Acompañamiento mensual</p>
        <h1 id="billing-title">{expired ? 'Renová tu acompañamiento con Verónica' : 'Tu acceso está pendiente de activación'}</h1>
        <p>
          {expired
            ? 'Tu período anterior terminó. Cuando Verónica confirme la renovación, vas a recuperar tu plan y seguimiento.'
            : 'Verónica todavía debe confirmar el pago o habilitar tu acceso. Tu información permanece resguardada.'}
        </p>
        {expired && patient.billing_until && (
          <p className="billing-period">Período anterior hasta {new Date(`${patient.billing_until}T12:00:00`).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        )}
        <div className="billing-paywall-actions">
          <button type="button" className="billing-primary" onClick={onShowMessages}>Escribirle a Verónica <Icon name="message" size={16} /></button>
          <small>Mercado Pago todavía no está conectado en este entorno. No se realizará ningún cobro desde esta pantalla.</small>
        </div>
      </section>

      <section className="billing-help">
        <Icon name="message" size={17} />
        <div><strong>Tus mensajes siguen disponibles</strong><p>Podés leer las novedades de Verónica y consultarle por la activación.</p></div>
        <button type="button" onClick={onShowMessages} aria-label="Ver mensajes"><Icon name="arrow" size={16} /></button>
      </section>
    </main>
  );
}
