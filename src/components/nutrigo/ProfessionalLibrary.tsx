import { ProfessionalResourceEditor } from './ProfessionalResourceEditor';
import type { EditorialResource } from '../../types/resources';
import { useState } from 'react';
import { RecipeCatalog } from './RecipeCatalog';
import { ResourceAssignmentManager } from './ShowroomWorkCenter';
import { NvState } from './primitives';
import { ShowroomResources } from './ShowroomResources';
import { canLeaveWorkspace } from './unsaved-changes';
import type { Patient } from '../../types';
import type { ShowroomPage } from './ShowroomPanels';

export function ProfessionalLibrary({ patient, patients, query, onQueryChange, onNavigate, onOpenPatient, onOpenHref }: {
  patient?: Patient; patients: Patient[]; query: string; onQueryChange: (query: string) => void; onNavigate: (page: ShowroomPage) => void; onOpenPatient: (id: string) => void; onOpenHref: (href: string) => void;
}) {
  const [tab, setTab] = useState<'recetas' | 'recursos'>(() => typeof window !== 'undefined' && (window.location.hash.startsWith('#recurso=') || new URLSearchParams(window.location.search).get('biblioteca') === 'recursos') ? 'recursos' : 'recetas');
  const [resources, setResources] = useState<EditorialResource[] | null>(null);
  return <section className={`pw-library${tab === 'recetas' ? ' pw-library-recipes' : ''}`} aria-label="Biblioteca del consultorio">{tab === 'recursos' && <header><h2>Biblioteca</h2><p>Preparaciones y material para el acompañamiento.</p></header>}
    <nav className="pw-tabs" aria-label="Contenido de la biblioteca">{(['recetas', 'recursos'] as const).map((id) => <button key={id} type="button" aria-current={tab === id ? 'page' : undefined} onClick={() => {
      if (id === tab) return;
      const url = new URL(window.location.href); url.searchParams.set('biblioteca', id); url.hash = '';
      onOpenHref(url.pathname + url.search);
    }}>{id === 'recetas' ? 'Recetas' : 'Recursos'}</button>)}</nav>
    {tab === 'recetas' ? <RecipeCatalog patientId={patient?.id ?? ''} patients={patients} /> : <><ProfessionalResourceEditor onCatalog={setResources} />{patient ? <ShowroomResources professional patientId={patient.id} query={query} onQueryChange={onQueryChange} assignments={patient.resource_assignments} onNavigate={onNavigate} /> : <NvState title="Elegí un paciente para revisar sus recursos" description="Los recursos publicados se pueden asignar desde la lista del consultorio." />}{resources && <ResourceAssignmentManager key={resources.filter(r=>r.published).map(r=>r.id).join(',')} catalog={resources} patients={patients} onOpenPatient={onOpenPatient} />}</>}
  </section>;
}
