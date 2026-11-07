// Encabezado de la Ficha v29 (`.card.fh`) y sus diez solapas (`#ftabs`), con los datos reales de la paciente.
import { forwardRef, useContext, useState } from 'react';
import type { Patient } from '../../types';
import { homeDay } from '../../lib/panel-home';
import { PanelV29Icon } from './PanelV29Icon';
import { PanelBellContext } from './PanelBocetoShell';
import { secureMeetUrl } from './ShowroomConsultations';
import { estadoDe, pacienteDesde, ultimoRegistro } from './pacientes-presentacion';
import { intakeMissingItems } from './intake-review';
import { FICHA_SOLAPAS, avanceDeIngreso, type ConteoSolapa, type SolapaFicha } from './ficha-presentacion';
import type { FichaData } from './use-ficha-data';
import type { PatientTag } from '../../api/crm-work';
import { FichaEtiquetas } from './FichaEtiquetas';

const ETIQUETAS_A_MOSTRAR = 4;
const SIN_PATOLOGIAS = 'Sin patologías declaradas';

export function PanelFichaCabecera({ patient, now, datos, etiquetasPropias = null, onGuardarEtiquetas, onBack, onChat, onAgendar, onEdit, onConsulta }: {
  patient: Patient; now: Date; datos: FichaData; etiquetasPropias?: readonly PatientTag[] | null; onGuardarEtiquetas?: (etiquetas: string[]) => Promise<boolean>; onBack: () => void; onChat: () => void; onAgendar: () => void; onEdit: () => void; onConsulta: () => void;
}) {
  const bell = useContext(PanelBellContext);
  const [editando, setEditando] = useState(false);
  const { care, current } = datos;
  const estado = estadoDe(patient, current?.vista ?? undefined, null, homeDay(now));
  const ingreso = current?.intake ?? null;
  const declaradas = ingreso ? [...(ingreso.intake.payload.restrictions?.items ?? []), ...(ingreso.intake.payload.allergies?.items ?? [])].filter(Boolean).slice(0, ETIQUETAS_A_MOSTRAR) : [];
  const propias = etiquetasPropias ?? [];
  const etiquetas = [...propias.map(t => ({ texto: t.label, tono: t.tone })), ...declaradas.filter(d => !propias.some(t => t.label.toLowerCase() === d.toLowerCase())).map(texto => ({ texto, tono: 'a' as const }))];
  const conectada = patient.has_account !== false;
  const registro = ultimoRegistro(patient, now);
  const avance = ingreso ? avanceDeIngreso(intakeMissingItems(ingreso).length) : null;
  const atencion = !care ? null : care.consented.includes('care_relationship');
  const llamada = secureMeetUrl(patient.appointment?.meet_url);
  const detalle = [avance ? `Anamnesis ${avance.completos} de ${avance.total}` : null, atencion === null ? null : atencion ? 'atención autorizada' : 'permiso de atención pendiente'].filter(Boolean).join(' · ');
  return <div className="card fh ntfh">
    <span className="av">{patient.initials}</span>
    <div>
      <button type="button" className="crumb" onClick={onBack}><svg viewBox="0 0 24 24" className="i" style={{ width: 11, height: 11 }} aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>Pacientes</button>
      <h1>{patient.name} <span className={`pill ${estado.pill}`}>{estado.texto}</span></h1>
      <div className="sub2">{patient.created_at ? `Paciente desde ${pacienteDesde(patient.created_at, now)}` : patient.goal || 'Objetivo por definir'}</div>
      <div className="tagsr">{etiquetas.length ? etiquetas.map(({ texto, tono }) => <span className={tono === 'n' ? 'tg2 n' : 'tg2'} key={texto}>{texto}</span>) : <span className="tg2 n">{ingreso ? SIN_PATOLOGIAS : 'Consultando antecedentes…'}</span>}{onGuardarEtiquetas && etiquetasPropias ? <button className="tg2 add" type="button" onClick={() => setEditando(true)}>+ etiqueta</button> : null}</div>
    </div>
    <span className="sp" />
    <div className="ntfhr">
      <div className="appst"><b><i />{conectada ? `App conectada · ${registro.texto === 'sin registros' ? 'sin registros' : registro.texto}` : 'Sin vincular'}</b>{detalle || 'Consultando…'}</div>
      <div className="ntfhg">
        {conectada ? <button className="chip" type="button" onClick={onChat}><PanelV29Icon name="chat" />Chat</button> : null}
        <button className="chip" type="button" onClick={onAgendar}><PanelV29Icon name="cal" />Agendar</button>
        <button className="ibtn" type="button" onClick={onEdit} aria-label={`Editar datos de ${patient.name}`}><PanelV29Icon name="pen" /></button>
        {bell}
        {llamada ? <a className="cta" href={llamada} target="_blank" rel="noopener noreferrer"><PanelV29Icon name="play" />Iniciar consulta</a> : <button className="cta" type="button" onClick={onConsulta}><PanelV29Icon name="play" />Iniciar consulta</button>}
      </div>
    </div>
    {editando && onGuardarEtiquetas ? <FichaEtiquetas nombre={patient.name.split(' ')[0] ?? patient.name} actuales={propias.map(t => t.label)} onGuardar={onGuardarEtiquetas} onClose={() => setEditando(false)} /> : null}
  </div>;
}

export const FichaSolapas = forwardRef<HTMLElement, { activa: SolapaFicha | null; conteo: Partial<Record<SolapaFicha, ConteoSolapa>>; onChange: (solapa: SolapaFicha) => void }>(function FichaSolapas({ activa, conteo, onChange }, ref) {
  return <nav ref={ref} className="ftabs" id="ftabs" aria-label="Secciones de la ficha">{FICHA_SOLAPAS.map(([id, texto]) => {
    const n = conteo[id];
    return <button type="button" key={id} className={id === activa ? 'on' : undefined} aria-current={id === activa ? 'page' : undefined} onClick={() => onChange(id)}>{texto}{n ? <span className={`n${n.hot ? ' hot' : ''}`}>{n.n}</span> : null}</button>;
  })}</nav>;
});
