import pacientesScene from './escenas/pacientes.svg?raw';
import nutrisScene from './escenas/nutris.svg?raw';
import './entry-stage.css';

export type EntryEntrada = 'paciente' | 'nutri';

/**
 * Lado oscuro del ingreso. Cada entrada cuenta su producto: la paciente ve el recorrido del
 * plato a su progreso y la nutri las funciones del panel que le ahorran gestión.
 * Los textos no prometen resultados de salud.
 */
const CONTENT: Record<EntryEntrada, { headline: string; label: string; phrases: string[]; feats: string[]; scene: string }> = {
  paciente: {
    headline: 'Tu plan, tu nutri y tu progreso, en un lugar.',
    label: 'Una ensalada se convierte en un gráfico de macros, después en la semana de la paciente y por último en su progreso con un mensaje de su nutri',
    phrases: ['Tu plato de hoy, parte de tu plan.', 'Cada comida que registrás suma.', 'Tu semana, de un vistazo.', 'Tu nutri lo ve y te acompaña.'],
    feats: [],
    scene: pacientesScene,
  },
  nutri: {
    headline: 'Tu consultorio, simple.',
    label: 'Recorrido por el panel: la agenda del día, la ficha de una paciente con mediciones y registros, el armado del plan y los cobros con avisos automáticos',
    phrases: [
      'Tu agenda se ordena sola: turnos, reservas y recordatorios.',
      'Cada ficha completa: mediciones y registros al día.',
      'Armá el plan en minutos, con tus recetas y plantillas.',
      'Cobros y avisos en automático.',
    ],
    feats: ['Agenda', 'Fichas', 'Planes', 'Cobros'],
    scene: nutrisScene,
  },
};

export function EntryStage({ entrada }: { entrada: EntryEntrada }) {
  const content = CONTENT[entrada];
  return (
    <aside className="entry-stage" data-entrada={entrada}>
      <span className="entry-stage-glow" aria-hidden="true" />
      <img className="entry-stage-logo" src="/nutridash-logo-blanco.svg" alt="Nutridash" width="125" height="32" />
      <div className="entry-stage-scene" role="img" aria-label={content.label}>
        {/* Escena propia (archivo del repo, no contenido de usuarios). */}
        <svg viewBox="0 0 480 300" aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: content.scene }} />
      </div>
      <div className="entry-stage-copy">
        <h2>{content.headline}</h2>
        <p className="entry-stage-phrases" aria-hidden="true">
          {content.phrases.map((phrase) => <span key={phrase}>{phrase}</span>)}
        </p>
      </div>
      {content.feats.length > 0 && (
        <ul className="entry-stage-feats" aria-hidden="true">
          {content.feats.map((feat) => <li key={feat}>{feat}</li>)}
        </ul>
      )}
    </aside>
  );
}
