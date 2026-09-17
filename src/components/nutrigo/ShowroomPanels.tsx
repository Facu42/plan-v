import { NvBadge, NvBars, NvCard, NvState } from './primitives';
import type { ShowroomPatient } from './showroom-model';
import { PatientOverview } from './PatientOverview';

export type ShowroomPage = 'inicio' | 'ficha' | 'plan' | 'diario' | 'consultas' | 'objetivos' | 'mensajes' | 'progreso' | 'pacientes' | 'agenda' | 'reciente' | 'guardado' | 'seguimiento' | 'paneles' | 'videollamadas' | 'recetas' | 'compras' | 'ejercicio' | 'recursos';
export const PAGE_LABELS: Record<ShowroomPage, string> = { inicio: 'Inicio', ficha: 'Ficha', plan: 'Plan semanal', diario: 'Diario de comidas', consultas: 'Consultas', objetivos: 'Objetivos', mensajes: 'Mensajes', progreso: 'Progreso', pacientes: 'Pacientes', agenda: 'Agenda', reciente: 'Reciente', guardado: 'Guardado', seguimiento: 'Centro de seguimiento', paneles: 'Paneles', videollamadas: 'Videollamadas', recetas: 'Menú saludable', compras: 'Lista de compras', ejercicio: 'Ejercicio', recursos: 'Recursos' };

export function ShowroomOverview({ patient: p, onNavigate }: { patient: ShowroomPatient; onNavigate: (page: ShowroomPage) => void }) {
  return <>
    <PatientOverview patient={p} audience="professional" onNavigate={onNavigate} />
    <details className="nv-habit-details"><summary>Historial de hidratación · últimos 7 días</summary><NvBars label="Vasos de agua por día" values={p.journey.days.map((d) => ({ label: d.label, value: d.hydration }))} /><p className="nv-caption">Vasos registrados, no una meta prescrita.</p></details>
  </>;
}

export function ShowroomDetail({ page, patient: p, query }: { page: ShowroomPage; patient: ShowroomPatient; query: string }) {
  if (page === 'mensajes') return <NvCard title={`Conversación con ${p.name}`} action={<NvBadge>Mensajes</NvBadge>}><div className="nv-thread">{p.messages.map((m) => <article key={m.id} className={m.from === 'patient' ? 'nv-bubble nv-own' : 'nv-bubble'}><small>{m.from === 'vero' ? 'Verónica · Nutricionista' : p.name}</small><p>{m.text}</p><time>{new Date(m.sent_at).toLocaleString('es-AR')}</time></article>)}{!p.messages.length && <NvState title="Todavía no hay mensajes" description="Solo se muestran mensajes enviados; nunca borradores profesionales." />}</div><p className="nv-caption">Los mensajes se envían desde esta conversación.</p></NvCard>;
  if (page === 'plan') return <NvCard title="Tu plan semanal" action={<NvBadge>Publicado</NvBadge>}><div className="nv-plan-grid">{p.weekPlan.map((d) => <section key={d.day}><h3>{d.day}</h3>{d.meals.filter((m) => `${m.slot} ${m.title}`.toLowerCase().includes(query.toLowerCase())).map((m) => <article key={m.slot}><NvBadge tone="gold">{m.slot}</NvBadge><p>{m.title}</p></article>)}</section>)}</div>{!p.weekPlan.length && <NvState title="Sin plan publicado" description="Las indicaciones de tu nutricionista aparecerán acá." />}</NvCard>;
  return <NvState title={`${PAGE_LABELS[page]} · próximo módulo`} description="Esta sección pertenece a la ampliación del producto. Todavía no tiene funciones nuevas implementadas en esta vista." />;
}
