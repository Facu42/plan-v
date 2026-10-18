import { useMemo, useState } from 'react';
import type { Patient } from '../../types';
import type { ShowroomPage } from './ShowroomPanels';

const CHIPS = [
  { id: 'pacientes', label: 'Pacientes', href: '/crm/pacientes' },
  { id: 'planes', label: 'Planes', href: '/crm/plan' },
  { id: 'registros', label: 'Registros', href: '/crm/ficha?seccion=alimentario' },
  { id: 'consultas', label: 'Consultas', href: '/crm/agenda' },
] as const;

function chipCurrent(id: string, page: ShowroomPage, search: URLSearchParams) {
  if (id === 'pacientes') return page === 'pacientes';
  if (id === 'planes') return page === 'plan';
  if (id === 'registros') return page === 'diario' || (page === 'ficha' && search.get('seccion') === 'alimentario');
  return page === 'agenda' || page === 'consultas' || (page === 'ficha' && search.get('seccion') === 'consultas');
}

export function ProCommandBar({ page, search, query, patients, selectedId, onQuery, onOpen, onSelect }: {
  page: ShowroomPage;
  search: URLSearchParams;
  query: string;
  patients: Patient[];
  selectedId: string;
  onQuery: (value: string) => void;
  onOpen: (href: string) => void;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase('es');
    const list = needle ? patients.filter((person) => person.name.toLocaleLowerCase('es').includes(needle)) : patients;
    return list.slice(0, 6);
  }, [patients, query]);
  const go = (href: string) => {
    const url = new URL(href, window.location.origin);
    if (selectedId && /\/(ficha|plan|agenda)/.test(url.pathname)) url.searchParams.set('paciente', selectedId);
    onOpen(`${url.pathname}${url.search}`);
  };
  return <form className="pv-command" role="search" onSubmit={(event) => { event.preventDefault(); setOpen(false); onOpen(`/crm/pacientes`); }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></svg>
    <input
      type="search"
      name="q"
      autoComplete="off"
      spellCheck={false}
      aria-label="Buscar en el consultorio"
      placeholder="Buscar pacientes, planes o registros…"
      value={query}
      onChange={(event) => { onQuery(event.target.value); setOpen(true); }}
      onFocus={() => setOpen(true)}
    />
    <div className="pv-command-chips" role="group" aria-label="Filtros">
      {CHIPS.map((chip) => <a key={chip.id} href={chip.href} aria-current={chipCurrent(chip.id, page, search) ? 'page' : undefined} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); go(chip.href); }}>{chip.label}</a>)}
    </div>
    <label className="pv-command-patient">
      <span>Paciente</span>
      <select aria-label="Paciente abierta" value={selectedId} disabled={!patients.length} onChange={(event) => { if (event.target.value) onSelect(event.target.value); }}>
        {!selectedId && <option value="">{patients.length ? 'Elegí' : 'Sin pacientes'}</option>}
        {patients.map((person) => <option key={person.id} value={person.id}>{person.name}</option>)}
      </select>
    </label>
    {open && query.trim() && <ul className="pv-command-results">
      {matches.length ? matches.map((person) => <li key={person.id}><a href={`/crm/ficha?paciente=${encodeURIComponent(person.id)}&seccion=resumen`} onClick={(event) => { if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return; event.preventDefault(); setOpen(false); onSelect(person.id); onOpen(`/crm/ficha?paciente=${encodeURIComponent(person.id)}&seccion=resumen`); }}>{person.name}</a></li>) : <li>Ninguna paciente coincide.</li>}
    </ul>}
  </form>;
}
