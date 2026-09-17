import { useEffect, useMemo, useState } from 'react';
import type { ResourceAssignment } from '../../types';
import { Icon, type IconName } from '../shared/Icon';
import { NvBadge, NvButton, NvState } from './primitives';
import type { ShowroomPage } from './ShowroomPanels';
import './showroom-resources.css';

export type ResourceGuide = {
  id: string;
  title: string;
  category: string;
  eyebrow: string;
  summary: string;
  minutes: number;
  icon: IconName;
  tags: string[];
  sections: Array<{ title: string; body: string }>;
  related: string[];
  action: { label: string; page: ShowroomPage };
};

export const RESOURCE_GUIDES: ResourceGuide[] = [
  {
    id: 'leer-plan-semanal', title: 'Cómo leer tu plan semanal', category: 'Mi plan', eyebrow: 'EMPEZÁ POR ACÁ', minutes: 3, icon: 'list',
    summary: 'Ubicá cada indicación por día y momento, buscá títulos y consultá cualquier cambio con tu nutricionista.',
    tags: ['plan semanal', 'días', 'comidas'], related: ['compras-desde-plan', 'registrar-comida'], action: { label: 'Abrir mi plan', page: 'plan' },
    sections: [
      { title: 'Una semana, siete días', body: 'En Mi plan podés recorrer los siete días publicados por tu nutricionista. Cada tarjeta conserva el título y el momento de comida que forman parte del plan vigente.' },
      { title: 'Sólo mostramos lo que fue indicado', body: 'Plan V no completa por su cuenta porciones, cantidades ni información nutricional. Si una indicación necesita más detalle, usá Mensajes para consultarlo.' },
      { title: 'Encontrá una preparación', body: 'El buscador recorre títulos, días y momentos. Menú saludable reúne los mismos títulos para ver rápidamente dónde aparecen durante la semana.' },
    ],
  },
  {
    id: 'registrar-comida', title: 'Registrar una comida sin perder contexto', category: 'Diario', eyebrow: 'TU REGISTRO', minutes: 2, icon: 'camera',
    summary: 'Sumá una foto o una descripción al Diario para compartir el registro con tu nutricionista.',
    tags: ['diario', 'foto', 'seguimiento'], related: ['leer-plan-semanal', 'progreso-semanal'], action: { label: 'Abrir mi diario', page: 'diario' },
    sections: [
      { title: 'Foto o descripción', body: 'Elegí el momento de comida y registrá una foto o un texto. La entrada queda asociada a tu ficha y visible para la profesional que te acompaña.' },
      { title: 'Revisión profesional', body: 'Cuando exista una revisión, el Diario muestra únicamente la devolución habilitada para vos. Las notas privadas de trabajo profesional permanecen fuera de tu vista.' },
      { title: 'Análisis disponible', body: 'Si el análisis asistido está habilitado, Plan V lo procesa dentro del circuito existente. Si no está disponible, tu registro igualmente conserva el contenido que enviaste.' },
    ],
  },
  {
    id: 'compras-desde-plan', title: 'Preparar la compra desde el plan', category: 'Organización', eyebrow: 'ORGANIZÁ TU SEMANA', minutes: 2, icon: 'check',
    summary: 'Usá la lista derivada del plan vigente y marcá en este dispositivo lo que ya resolviste.',
    tags: ['compras', 'organización', 'plan'], related: ['leer-plan-semanal', 'registrar-comida'], action: { label: 'Abrir lista de compras', page: 'compras' },
    sections: [
      { title: 'Una ayuda basada en tu plan', body: 'La lista reúne conservadoramente los títulos publicados para la semana y los organiza para facilitar el repaso antes de comprar.' },
      { title: 'Sin cantidades inventadas', body: 'Si el plan no incluye ingredientes, cantidades o unidades, la lista tampoco los agrega. Ante una duda sobre qué comprar, consultá a tu nutricionista.' },
      { title: 'Checklist de este dispositivo', body: 'Las marcas de completado son una comodidad local, separada de tu información clínica. Podés reiniciarlas cuando empiece una nueva compra.' },
    ],
  },
  {
    id: 'contacto-nutricionista', title: 'Coordinar con tu nutricionista', category: 'Acompañamiento', eyebrow: 'SEGUÍ EN CONTACTO', minutes: 2, icon: 'message',
    summary: 'Encontrá tu próxima consulta y mantené la conversación en el mismo hilo privado de Plan V.',
    tags: ['mensajes', 'agenda', 'consulta'], related: ['leer-plan-semanal', 'registrar-comida'], action: { label: 'Abrir mensajes', page: 'mensajes' },
    sections: [
      { title: 'Una conversación continua', body: 'Mensajes conserva el intercambio con tu nutricionista dentro de tu ficha. Es el lugar indicado para consultar una indicación o compartir contexto.' },
      { title: 'Tu próxima consulta', body: 'Agenda muestra la próxima ocurrencia disponible, junto con modalidad y duración cuando esos datos fueron definidos por la profesional.' },
      { title: 'Sin estados supuestos', body: 'Plan V no muestra confirmaciones de lectura o entrega que todavía no estén persistidas. El hilo presenta únicamente los mensajes disponibles.' },
    ],
  },
  {
    id: 'progreso-semanal', title: 'Entender tu progreso semanal', category: 'Seguimiento', eyebrow: 'TUS ÚLTIMOS DÍAS', minutes: 3, icon: 'trend',
    summary: 'Revisá los registros disponibles de los últimos siete días sin confundirlos con una evaluación clínica.',
    tags: ['progreso', 'hábitos', 'semana'], related: ['registrar-comida', 'actividad-autodeclarada'], action: { label: 'Ver mi progreso', page: 'progreso' },
    sections: [
      { title: 'Una ventana de siete días', body: 'Progreso organiza los datos que ya existen en tu ficha para mostrar una vista breve de comidas revisadas y hábitos registrados.' },
      { title: 'Datos disponibles, no estimaciones', body: 'Cuando falta un registro, Plan V no lo completa ni lo reemplaza con valores aproximados. La vista se limita a la información disponible.' },
      { title: 'Contexto para conversar', body: 'Usá esta pantalla como apoyo para reconocer patrones y preparar preguntas. La interpretación profesional corresponde a tu nutricionista.' },
    ],
  },
  {
    id: 'actividad-autodeclarada', title: 'Registrar actividad autodeclarada', category: 'Movimiento', eyebrow: 'TU ACTIVIDAD', minutes: 2, icon: 'heart',
    summary: 'Anotá tipo, duración e intensidad percibida sin convertir el registro en una rutina indicada.',
    tags: ['actividad', 'duración', 'intensidad'], related: ['progreso-semanal', 'contacto-nutricionista'], action: { label: 'Registrar actividad', page: 'ejercicio' },
    sections: [
      { title: 'Contá lo que hiciste', body: 'Podés registrar el nombre de la actividad, los minutos, la intensidad que percibiste y una nota opcional.' },
      { title: 'Un registro personal', body: 'La pantalla conserva lo que declaraste y lo comparte con tu nutricionista. No agrega distancia, pasos, frecuencia cardíaca ni otros resultados que no ingresaste.' },
      { title: 'Separado de una rutina', body: 'Anotar una actividad no crea una recomendación ni reemplaza la indicación de una persona habilitada para trabajar sobre ejercicio.' },
    ],
  },
];

export const resourceGuideIdFromHash = (hash: string) => {
  const match = /^#recurso=([^&]+)$/.exec(hash);
  if (!match) return null;
  let id = '';
  try { id = decodeURIComponent(match[1]); } catch { return null; }
  return RESOURCE_GUIDES.some((guide) => guide.id === id) ? id : null;
};

export const buildResourceShareUrl = (id: string, href: string) => {
  const url = new URL(href);
  url.pathname = '/app/recursos';
  url.searchParams.delete('design');
  url.hash = `recurso=${encodeURIComponent(id)}`;
  return url.toString();
};

type ShareDependencies = {
  href: string;
  share?: (data: ShareData) => Promise<void>;
  writeText?: (text: string) => Promise<void>;
};

export async function shareResourceGuide(guide: ResourceGuide, dependencies: ShareDependencies) {
  const url = buildResourceShareUrl(guide.id, dependencies.href);
  if (dependencies.share) {
    await dependencies.share({ title: guide.title, text: guide.summary, url });
    return 'shared' as const;
  }
  if (dependencies.writeText) {
    await dependencies.writeText(url);
    return 'copied' as const;
  }
  return 'unavailable' as const;
}

const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-AR');
export const filterResourceGuides = (guides: ResourceGuide[], query: string, category: string) => {
  const term = normalize(query);
  return guides.filter((guide) => (category === 'Todas' || guide.category === category)
    && (!term || normalize(`${guide.title} ${guide.category} ${guide.summary} ${guide.tags.join(' ')}`).includes(term)));
};

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
export const resourceAssignmentDateLabel = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T/.exec(value);
  if (!match) return 'fecha no disponible';
  const month = Number(match[2]);
  const day = Number(match[3]);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31 ? `${day} ${MONTHS[month - 1]}` : 'fecha no disponible';
};

const storageKey = (patientId: string) => `plan-v:resource-favorites:${patientId}`;
const readSaved = (patientId: string) => {
  if (typeof window === 'undefined') return [] as string[];
  try {
    const value = JSON.parse(window.localStorage.getItem(storageKey(patientId)) ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
  } catch { return []; }
};

export function ShowroomResources({ patientId, query, assignments = [], onNavigate, onMarkRead }: {
  patientId: string;
  query: string;
  assignments?: ResourceAssignment[];
  onNavigate: (page: ShowroomPage) => void;
  onMarkRead?: (resourceId: string) => Promise<void>;
}) {
  const [category, setCategory] = useState('Todas');
  const [selectedId, setSelectedId] = useState<string | null>(() => typeof window === 'undefined' ? null : resourceGuideIdFromHash(window.location.hash));
  const [saved, setSaved] = useState<string[]>(() => readSaved(patientId));
  const [shareStatus, setShareStatus] = useState('');
  const [readStatus, setReadStatus] = useState('');
  const categories = ['Todas', ...new Set(RESOURCE_GUIDES.map((guide) => guide.category))];
  const guides = useMemo(() => filterResourceGuides(RESOURCE_GUIDES, query, category), [query, category]);
  const selected = RESOURCE_GUIDES.find((guide) => guide.id === selectedId) ?? null;
  const assignedGuides = assignments.map((assignment) => ({
    assignment,
    guide: RESOURCE_GUIDES.find((guide) => guide.id === assignment.resource_id),
  })).filter((item): item is { assignment: ResourceAssignment; guide: ResourceGuide } => Boolean(item.guide));

  useEffect(() => {
    setSaved(readSaved(patientId));
    setSelectedId(resourceGuideIdFromHash(window.location.hash));
  }, [patientId]);
  useEffect(() => {
    const syncHash = () => { setSelectedId(resourceGuideIdFromHash(window.location.hash)); setShareStatus(''); };
    window.addEventListener('popstate', syncHash);
    window.addEventListener('hashchange', syncHash);
    return () => { window.removeEventListener('popstate', syncHash); window.removeEventListener('hashchange', syncHash); };
  }, []);
  useEffect(() => {
    const assignment = assignments.find((item) => item.resource_id === selectedId);
    if (!selectedId || !assignment || assignment.read_at || !onMarkRead) return;
    let active = true;
    setReadStatus('');
    void onMarkRead(selectedId).catch(() => {
      if (active) setReadStatus('No se pudo registrar la lectura.');
    });
    return () => { active = false; };
  }, [assignments, onMarkRead, selectedId]);
  const openGuide = (id: string, replace = false) => {
    const method = replace ? 'replaceState' : 'pushState';
    const state = replace ? window.history.state : { ...window.history.state, planVResourceOpen: true };
    window.history[method](state, '', buildResourceShareUrl(id, window.location.href));
    setSelectedId(id);
    setShareStatus('');
  };
  const closeGuide = () => {
    if (window.history.state?.planVResourceOpen) { window.history.back(); return; }
    const url = new URL(window.location.href);
    url.hash = '';
    window.history.replaceState(window.history.state, '', url);
    setSelectedId(null);
    setShareStatus('');
  };
  const toggleSaved = (id: string) => {
    const next = saved.includes(id) ? saved.filter((value) => value !== id) : [...saved, id];
    setSaved(next);
    window.localStorage.setItem(storageKey(patientId), JSON.stringify(next));
  };
  const shareSelected = async (guide: ResourceGuide) => {
    try {
      const result = await shareResourceGuide(guide, {
        href: window.location.href,
        share: navigator.share?.bind(navigator),
        writeText: navigator.clipboard?.writeText.bind(navigator.clipboard),
      });
      setShareStatus(result === 'shared' ? 'Guía compartida.' : result === 'copied' ? 'Enlace copiado.' : 'Compartir no está disponible en este navegador.');
    } catch {
      setShareStatus('No se pudo compartir la guía.');
    }
  };

  if (selected) {
    const related = selected.related.map((id) => RESOURCE_GUIDES.find((guide) => guide.id === id)).filter((guide): guide is ResourceGuide => Boolean(guide));
    return <section className="nvr-resources nvr-detail" aria-label={`Guía: ${selected.title}`}>
      <div className="nvr-detail-toolbar"><button type="button" onClick={closeGuide}>← Volver a Recursos</button><div><button type="button" onClick={() => void shareSelected(selected)}><Icon name="arrow" size={15} /> Compartir</button><button type="button" aria-pressed={saved.includes(selected.id)} onClick={() => toggleSaved(selected.id)}><Icon name="pin" size={15} /> {saved.includes(selected.id) ? 'Guardada' : 'Guardar'}</button></div></div>
      {shareStatus && <p className="nvr-share-status" role="status" aria-live="polite">{shareStatus}</p>}
      <div className="nvr-detail-layout">
        <article className="nvr-article">
          <header><span>{selected.eyebrow}</span><h2>{selected.title}</h2><p>{selected.summary}</p><div><NvBadge>{selected.category}</NvBadge><small>{selected.minutes} min de lectura</small><small>Guía de uso de Plan V</small></div></header>
          <div className={`nvr-cover nvr-cover-${selected.icon}`}><span className="nv-icon-tile"><Icon name={selected.icon} size={34} /></span><strong>{selected.category}</strong><small>Recurso operativo</small></div>
          <div className="nvr-sections">{selected.sections.map((section) => <section key={section.title}><h3>{section.title}</h3><p>{section.body}</p></section>)}</div>
          <aside className="nvr-disclaimer"><Icon name="sparkle" size={18} /><p><strong>Sobre estas guías</strong><span>Explican cómo usar Plan V. No reemplazan las indicaciones de tu profesional.</span></p></aside>
          <NvButton onClick={() => onNavigate(selected.action.page)}>{selected.action.label} <Icon name="arrow" size={15} /></NvButton>
        </article>
        <aside className="nvr-related">
          <section><span>ETIQUETAS</span><div className="nvr-tags">{selected.tags.map((tag) => <small key={tag}>#{tag.replace(/\s+/g, '')}</small>)}</div></section>
          <section><span>GUÍAS RELACIONADAS</span><div>{related.map((guide) => <button type="button" key={guide.id} onClick={() => openGuide(guide.id, true)}><span className="nv-icon-tile"><Icon name={guide.icon} size={16} /></span><span><strong>{guide.title}</strong><small>{guide.category} · {guide.minutes} min</small></span><Icon name="chevron" size={14} /></button>)}</div></section>
          <p><Icon name="pin" size={15} /> Guardado sólo en este dispositivo.</p>
        </aside>
      </div>
    </section>;
  }

  const featured = guides[0];
  return <section className="nvr-resources" aria-label="Recursos">
    <div className="nvr-layout">
    <div className="nvr-main">
      <header className="nvr-hero"><div><span>RECURSOS DE PLAN V</span><h2>Guías para usar Plan V</h2><p>Pasos breves para aprovechar tu plan, tus registros y el contacto con tu nutricionista.</p></div><span className="nvr-hero-mark"><Icon name="sparkle" size={25} /></span></header>
      {assignedGuides.length > 0 && <section className="nvr-assigned" aria-label="Recursos asignados"><header><div><span>PARA VOS</span><h3>Asignado por tu nutricionista</h3></div><NvBadge>{assignedGuides.length}</NvBadge></header><div>{assignedGuides.map(({ assignment, guide }) => <button type="button" key={assignment.id} onClick={() => openGuide(guide.id)}><span className="nv-icon-tile"><Icon name={guide.icon} size={18} /></span><span><strong>{guide.title}</strong><small>{assignment.read_at ? `Leída · ${resourceAssignmentDateLabel(assignment.read_at)}` : `Pendiente de lectura · asignada ${resourceAssignmentDateLabel(assignment.assigned_at)}`} · {guide.minutes} min</small></span><Icon name="chevron" size={15} /></button>)}</div>{readStatus && <p role="status">{readStatus}</p>}</section>}
      <div className="nvr-filters" aria-label="Categorías de recursos">{categories.map((value) => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
        {featured ? <>
          <article className="nvr-featured">
            <div className={`nvr-cover nvr-cover-${featured.icon}`}><span className="nv-icon-tile"><Icon name={featured.icon} size={30} /></span><strong>{featured.category}</strong><small>Guía de uso</small></div>
            <div><NvBadge>{featured.eyebrow}</NvBadge><h3>{featured.title}</h3><p>{featured.summary}</p><small>{featured.minutes} min de lectura</small><NvButton onClick={() => openGuide(featured.id)}>Abrir guía <Icon name="arrow" size={15} /></NvButton></div>
          </article>
          <section className="nvr-library" aria-label="Biblioteca de guías"><header><div><span>BIBLIOTECA</span><h3>Todas las guías</h3></div><small>{guides.length} {guides.length === 1 ? 'resultado' : 'resultados'}</small></header><div className="nvr-grid">{guides.map((guide) => <article key={guide.id}><div className={`nvr-card-icon nvr-card-${guide.icon}`}><Icon name={guide.icon} size={19} /></div><div><NvBadge tone={guide.category === 'Movimiento' ? 'coral' : guide.category === 'Organización' ? 'gold' : 'green'}>{guide.category}</NvBadge><h4>{guide.title}</h4><p>{guide.summary}</p><small>{guide.minutes} min</small></div><button type="button" onClick={() => openGuide(guide.id)}>Abrir guía <Icon name="arrow" size={14} /></button></article>)}</div></section>
        </> : <NvState title="Sin coincidencias" description="Probá con otra palabra o elegí una categoría diferente." />}
      </div>
      <aside className="nvr-aside" aria-label="Explorar recursos">
        <section><span>EXPLORAR</span><h3>Categorías</h3><div>{categories.slice(1).map((value) => <button type="button" key={value} onClick={() => setCategory(value)}><span>{value}</span><small>{RESOURCE_GUIDES.filter((guide) => guide.category === value).length}</small></button>)}</div></section>
        <section><span>GUARDADO LOCAL</span><h3>Para volver después</h3><strong>{saved.length}</strong><p>{saved.length === 1 ? 'guía guardada' : 'guías guardadas'}</p><small>Guardado sólo en este dispositivo.</small>{saved.length > 0 && <div className="nvr-saved">{saved.map((id) => RESOURCE_GUIDES.find((guide) => guide.id === id)).filter((guide): guide is ResourceGuide => Boolean(guide)).map((guide) => <button type="button" key={guide.id} onClick={() => openGuide(guide.id)}>{guide.title}<Icon name="chevron" size={13} /></button>)}</div>}</section>
      </aside>
    </div>
    <p className="nvr-note"><Icon name="sparkle" size={16} /> Estas guías explican funciones de Plan V; no publican recomendaciones clínicas automáticas.</p>
  </section>;
}
