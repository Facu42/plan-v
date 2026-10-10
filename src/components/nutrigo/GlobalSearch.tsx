import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { searchApi } from '../../api/search';
import type { WorkspaceSearchResponse } from '../../types/search';
import { NvButton } from './primitives';
import { searchHelp } from './help/help-search';
import './global-search.css';

export const MIN_SEARCH_LENGTH = 2;
const DEBOUNCE_MS = 250;
const HELP_SAMPLE = 3;

export type SearchPlan = { status: 'idle' } | { status: 'short' } | { status: 'query'; q: string };

/** Qué hacer con lo escrito: nada, avisar que falta, o consultar. */
export function planSearch(raw: string): SearchPlan {
  const q = raw.trim();
  if (!q) return { status: 'idle' };
  if (q.length < MIN_SEARCH_LENGTH) return { status: 'short' };
  return { status: 'query', q };
}

type HelpHit = { id: string; title: string };
export type SearchPanelState =
  | { status: 'short' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: WorkspaceSearchResponse; help: HelpHit[] };

export type SearchPick =
  | { kind: 'patient'; id: string }
  | { kind: 'href'; href: string }
  | { kind: 'help'; id: string };

function Group({ title, total, shown, children }: { title: string; total?: number; shown?: number; children: React.ReactNode }) {
  return <section className="gs-group" aria-label={title}>
    <h3>{title}{total !== undefined && shown !== undefined && total > shown ? <small>{total} en total</small> : null}</h3>
    <ul>{children}</ul>
  </section>;
}

export function SearchResultsPanel({ query, state, onPick, onRetry }: {
  query: string;
  state: SearchPanelState;
  onPick: (pick: SearchPick) => void;
  onRetry: () => void;
}) {
  return <div className="gs-panel" role="region" aria-label="Resultados de la búsqueda">
    {state.status === 'short' && <p className="gs-note" role="status">Escribí al menos {MIN_SEARCH_LENGTH} letras para buscar.</p>}
    {state.status === 'loading' && <p className="gs-note" role="status">Buscando…</p>}
    {state.status === 'error' && <div role="alert" className="gs-note">
      <p>No pudimos buscar ahora. Eso no significa que no haya resultados.</p>
      <NvButton className="nv-ghost" onClick={onRetry}>Reintentar</NvButton>
    </div>}
    {state.status === 'ready' && (() => {
      const { data, help } = state;
      const empty = !data.patients.length && !data.recipes.length && !data.foods.length && !help.length;
      if (empty) return <p className="gs-note" role="status">Sin resultados para «{query.trim()}»</p>;
      return <>
        {data.patients.length > 0 && <Group title="Pacientes" total={data.totals.patients} shown={data.patients.length}>
          {data.patients.map(hit => <li key={hit.id}><button type="button" onClick={() => onPick({ kind: 'patient', id: hit.id })}><strong>{hit.name}</strong><small>Abrir ficha</small></button></li>)}
        </Group>}
        {data.recipes.length > 0 && <Group title="Recetas" total={data.totals.recipes} shown={data.recipes.length}>
          {data.recipes.map(hit => <li key={hit.id}><button type="button" onClick={() => onPick({ kind: 'href', href: hit.href })}><strong>{hit.title}</strong><small>Ver en recetas</small></button></li>)}
        </Group>}
        {data.foods.length > 0 && <Group title="Alimentos" total={data.totals.foods} shown={data.foods.length}>
          {data.foods.map(hit => <li key={hit.id}><button type="button" onClick={() => onPick({ kind: 'href', href: hit.href })}><strong>{hit.name}</strong><small>{[hit.own ? 'Mío' : 'De la plataforma', hit.detail].filter(Boolean).join(' · ')}</small></button></li>)}
        </Group>}
        {help.length > 0 && <Group title="Ayuda">
          {help.map(hit => <li key={hit.id}><button type="button" onClick={() => onPick({ kind: 'help', id: hit.id })}><strong>{hit.title}</strong><small>Centro de ayuda</small></button></li>)}
        </Group>}
      </>;
    })()}
  </div>;
}

export function GlobalSearch({ onOpenPatient, onOpenHref }: {
  onOpenPatient: (patientId: string) => void;
  onOpenHref: (href: string) => void;
}) {
  const [value, setValue] = useState('');
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<SearchPanelState | null>(null);
  const [attempt, setAttempt] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const plan = useMemo(() => planSearch(value), [value]);
  const q = plan.status === 'query' ? plan.q : '';

  useEffect(() => {
    if (plan.status === 'idle') { setState(null); return; }
    if (plan.status === 'short') { setState({ status: 'short' }); return; }
    const controller = new AbortController();
    setState({ status: 'loading' });
    const timer = window.setTimeout(() => {
      searchApi.workspace(plan.q, controller.signal).then(data => {
        if (controller.signal.aborted) return;
        setState({ status: 'ready', data, help: searchHelp(plan.q).slice(0, HELP_SAMPLE).map(article => ({ id: article.id, title: article.title })) });
      }).catch(() => {
        if (!controller.signal.aborted) setState({ status: 'error' });
      });
    }, DEBOUNCE_MS);
    return () => { controller.abort(); window.clearTimeout(timer); };
    // plan.q cambia sólo cuando cambia el texto buscado; attempt reintenta la misma búsqueda.
  }, [q, plan.status, attempt]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false); };
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onPointer);
    window.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onPointer); window.removeEventListener('keydown', onKey); };
  }, [open]);

  const pick = (choice: SearchPick) => {
    setOpen(false);
    if (choice.kind === 'patient') onOpenPatient(choice.id);
    else if (choice.kind === 'help') onOpenHref(`/crm/ayuda?articulo=${encodeURIComponent(choice.id)}`);
    else onOpenHref(choice.href);
  };

  return <div className="gs-root" ref={rootRef}>
    <label className="gs-field">
      <MagnifyingGlass size={17} aria-hidden="true" />
      <input
        type="search"
        aria-label="Buscar pacientes, recetas, alimentos"
        placeholder="Buscar pacientes, recetas, alimentos…"
        autoComplete="off"
        aria-controls={open && state ? panelId : undefined}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={event => { setValue(event.target.value); setOpen(true); }}
      />
    </label>
    {open && state && <div id={panelId}><SearchResultsPanel query={value} state={state} onPick={pick} onRetry={() => setAttempt(count => count + 1)} /></div>}
  </div>;
}
