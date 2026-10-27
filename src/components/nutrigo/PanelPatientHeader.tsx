import type { Patient } from '../../types';
import { Icon } from '../shared/Icon';
import { secureMeetUrl } from './ShowroomConsultations';
import type { RecordTab } from './patient-record-sections';

export function PanelPatientHeader({patient,onSection,onOpen,onEdit}:{patient:Patient;onSection:(section:RecordTab)=>void;onOpen:(href:string)=>void;onEdit:()=>void}) {
  const call=secureMeetUrl(patient.appointment?.meet_url);
  const since=patient.created_at&&Number.isFinite(Date.parse(patient.created_at))?new Intl.DateTimeFormat('es-AR',{month:'long',year:'numeric',timeZone:'America/Argentina/Buenos_Aires'}).format(new Date(patient.created_at)):null;
  return <header className="pn-record-head"><div className="pn-record-identity"><button type="button" className="pn-record-back" aria-label="Volver a Pacientes" onClick={()=>onOpen('/crm/pacientes')}><Icon name="arrow" size={18}/></button><span className={`pn-record-avatar pn-tone-${patient.tone}`}>{patient.initials}</span><div><small>Pacientes</small><h2>{patient.name}</h2><p>{since?`Paciente desde ${since}`:patient.goal||'Objetivo por definir'}</p></div></div><div className="pn-record-actions"><button type="button" className="pn-record-edit" onClick={onEdit} aria-label={`Editar datos de ${patient.name}`}><Icon name="edit" size={16}/></button>{patient.has_account!==false&&<button type="button" onClick={()=>onSection('chat')}><Icon name="message" size={16}/>Escribir</button>}<button type="button" onClick={()=>onSection('notas')}><Icon name="mic" size={16}/>Grabar consulta</button>{call?<a className="pn-record-primary" href={call} target="_blank" rel="noopener noreferrer"><Icon name="video" size={16}/>Iniciar consulta</a>:<button type="button" className="pn-record-primary" onClick={()=>onSection('consultas')}><Icon name="calendar" size={16}/>Iniciar consulta</button>}</div></header>;
}
