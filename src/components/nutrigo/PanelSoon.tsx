import './panel-fase5.css';

const TITLES: Record<string, string> = {
  'asistente-ia': 'Asistente IA',
  ayuda: 'Centro de ayuda',
  recetas: 'Recetas',
  equivalencias: 'Equivalencias',
  modelos: 'Modelos',
  biblioteca: 'Biblioteca',
};

/** Pantalla del panel para una entrada del menú que todavía no tiene su propia vista. */
export function PanelSoon({ moduleId = '' }: { moduleId?: string }) {
  const name = TITLES[moduleId] ?? 'Esta sección';
  return <section className="p5" aria-label="Próximamente">
    <section className="p5-card">
      <header><h2>{name}</h2></header>
      <p>Próximamente. Esta parte del consultorio todavía no está lista. El resto del panel sigue andando.</p>
      <a className="p5-btn p5-pri" href="/crm/inicio">Volver al inicio</a>
    </section>
  </section>;
}
