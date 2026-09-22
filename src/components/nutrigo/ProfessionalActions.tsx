import type { Patient } from '../../types';
import type { CrmEntry } from '../crm/crm-entry';
import { buildProfessionalSummary } from './professional-summary';
import { NvButton } from './primitives';

export function ProfessionalActions({ patients, selectedId, onSelect, onOpen, showMetrics }: {
  patients: Patient[];
  selectedId: string;
  onSelect: (id: string) => void;
  onOpen: (entry: CrmEntry) => void;
  showMetrics: boolean;
}) {
  const active = patients.filter((p) => !p.archived_at);
  const selected = active.find((p) => p.id === selectedId);
  const summary = buildProfessionalSummary(active);
  return <section aria-label="Herramientas profesionales">
    {showMetrics && <dl className="nv-pro-summary" aria-label="Resumen del consultorio">
      <div><button type="button" className="nv-pro-summary-item" aria-label="Abrir el directorio de pacientes" onClick={() => onOpen({ patientId: selected?.id ?? '', module: 'pacientes' })}><dt>Pacientes activos</dt><dd>{summary.active}</dd></button></div>
      <div><button type="button" className="nv-pro-summary-item" aria-label="Revisar las comidas pendientes" onClick={() => selected && onOpen({ patientId: selected.id, module: 'fichas', tab: 'comidas' })} disabled={!selected}><dt>Comidas por revisar</dt><dd>{summary.pending}</dd></button></div>
      <div><button type="button" className="nv-pro-summary-item" aria-label="Abrir el centro de seguimiento" onClick={() => onOpen({ patientId: selected?.id ?? '', module: 'seguimiento' })}><dt>Adherencia media</dt><dd>{summary.adherence === null ? '—' : `${summary.adherence}%`}</dd></button></div>
      <div><button type="button" className="nv-pro-summary-item" aria-label="Abrir la agenda" onClick={() => onOpen({ patientId: selected?.id ?? '', module: 'agenda' })}><dt>Consultas programadas</dt><dd>{summary.appointments}</dd></button></div>
    </dl>}
    <section className="nv-work-toolbar" aria-label="Mi trabajo">
      <header><h2>Mi trabajo</h2><span>Seguimiento individual</span></header>
      <label className="nv-patient-select">Paciente en seguimiento
        <select aria-label="Paciente en seguimiento" value={selected?.id ?? ''} onChange={(e) => onSelect(e.target.value)} disabled={!active.length}>
          {!active.length && <option value="">Sin pacientes activos</option>}
          {active.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>

      <div className="nv-action-grid">
        <NvButton disabled={!selected} onClick={() => onOpen({ patientId: selectedId, module: 'fichas' })}>Abrir ficha</NvButton>
        <NvButton className="nv-soft" disabled={!selected} onClick={() => onOpen({ patientId: selectedId, module: 'fichas', tab: 'comidas' })}>Revisar comidas</NvButton>
        <NvButton className="nv-soft" disabled={!selected} onClick={() => onOpen({ patientId: selectedId, module: 'fichas', tab: 'plan' })}>Editar plan</NvButton>
        <NvButton className="nv-soft" disabled={!selected} onClick={() => onOpen({ patientId: selectedId, module: 'fichas', tab: 'consultas' })}>Gestionar consultas</NvButton>
        <NvButton className="nv-ghost" disabled={!selected} onClick={() => onOpen({ patientId: selectedId, module: 'pacientes' })}>Editar pacientes</NvButton>
        <NvButton className="nv-ghost" disabled={!selected} onClick={() => onOpen({ patientId: selectedId, module: 'objetivos' })}>Gestionar objetivos</NvButton>
      </div>
      <p className="nv-caption">Los cambios demo se guardan temporalmente en memoria. Las seis acciones abren el consultorio de esa paciente. La adherencia media es el valor actual, no un ranking ni un historial.</p>
    </section>
  </section>;
}
