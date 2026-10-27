// Solapa Objetivos y hábitos de la Ficha v29: el HTML de `objetivos:` del boceto, con lo que la paciente registra en su app.
import { useState, type ReactNode } from 'react';
import type { Patient } from '../../types';
import { PanelV29Icon } from './PanelV29Icon';
import { FxBar, FxCols, FxPanel, FxRing } from './ficha-fx';
import { GoalEditor } from './ShowroomGoals';
import { animoDeQuincena, habitosDeLaSemana, objetivoDe, sintomasDeQuincena, textoDeDias, ultimosDias } from './ficha-objetivos';
import { numero } from './ficha-presentacion';
import { formatMetricDate } from './measurement-format';
import { homeDay } from '../../lib/panel-home';
import type { FichaData } from './use-ficha-data';

export function PanelFichaObjetivos({ patient, now, datos, onChanged, children }: { patient: Patient; now: Date; datos: FichaData; onChanged: (patient: Patient) => void; children?: ReactNode }) {
  const hoy = homeDay(now);
  const [editando, setEditando] = useState(false);
  const { care } = datos;
  const puedeVerActividad = Boolean(care?.consented.includes('care_relationship'));
  const desde = ultimosDias(hoy, 7)[0]!;
  const diasConActividad = new Set(care && puedeVerActividad ? care.records.filter(r => r.patient_id === patient.id && r.data.kind === 'activity' && r.recorded_on >= desde && r.recorded_on <= hoy).map(r => r.recorded_on) : []);
  const objetivo = objetivoDe(patient);
  const habitos = habitosDeLaSemana(patient, diasConActividad, hoy, puedeVerActividad);
  const animo = animoDeQuincena(patient, hoy);
  const sintomas = sintomasDeQuincena(patient, hoy);
  const primerNombre = patient.name.split(' ')[0] ?? patient.name;
  return <>
    <div className="fx" data-mk="1" style={{ gridTemplateColumns: '1fr 1fr' }}>
      <div className="c">
        <FxPanel titulo="Objetivos" meta="lo define la profesional" derecha={<button type="button" className="sbtn cbtn" onClick={() => setEditando(true)}><PanelV29Icon name="plus" size={13} />{objetivo.titulo ? 'Actualizar' : 'Agregar'}</button>}>
          {objetivo.titulo ? <div className="fxgoals"><div><FxRing pct={objetivo.pct} tamano={46} /><span><b>{objetivo.titulo}</b><small>{objetivo.estado} · avance que carga la profesional</small></span></div></div>
            : <div className="fxhint">Todavía sin objetivo definido.</div>}
          {objetivo.historial.length ? <details className="fxhint"><summary>Historial del objetivo</summary>{objetivo.historial.map(e => <p key={e.id}><b>{e.goal} · {e.progress}%</b> {e.note || 'Sin nota profesional'} <small>{formatMetricDate(e.updated_at.slice(0, 10))}</small></p>)}</details> : null}
        </FxPanel>
        <FxPanel titulo="Hábitos de la semana" meta={`cargados por ${primerNombre}`} grande>
          <div className="fxhab">{habitos.map(h => { const tope = Math.max(...h.serie, 0);
            return <div key={h.clave}><small>{h.nombre}</small><div className="fxv"><b className="num">{h.valor}</b><span>{h.unidad}</span></div>
              <div className="fxwk">{h.serie.map((x, i) => <i key={i} style={{ height: `${tope > 0 ? Math.max(12, x / tope * 100).toFixed(0) : 12}%` }} />)}</div>
              {h.pct === null ? <span className="fxb" /> : <FxBar pct={h.pct} />}<em>{h.meta}</em></div>; })}</div>
        </FxPanel>
      </div>
      <div className="c">
        <FxPanel titulo="Energía" meta={animo.promedio === null ? 'últimos 14 días · sin registro' : `últimos 14 días · promedio ${numero(animo.promedio)} de 3`} grande>
          <FxCols valores={animo.valores} rotulos={animo.rotulos} max={3} alto={150} promedio={animo.promedio} bajo={2} />
          {animo.registrados ? null : <div className="fxhint">{primerNombre} todavía no registró su energía en estos días.</div>}
        </FxPanel>
        <FxPanel titulo="Síntomas" meta="últimos 14 días">
          {sintomas.length ? <div className="fxsym">{sintomas.map(s => <div key={s.clave}><span><b>{s.nombre}</b></span><div className="fxdots">{s.dias.map((marcado, i) => <i key={i} className={marcado ? 'on' : ''} />)}</div><em className="num">{textoDeDias(s.cantidad)}</em></div>)}</div>
            : <div className="fxhint">Sin síntomas marcados en los últimos 14 días.</div>}
        </FxPanel>
      </div>
    </div>
    {children}
    {editando ? <GoalEditor patient={patient} onClose={() => setEditando(false)} onSaved={actualizada => { onChanged(actualizada); setEditando(false); }} /> : null}
  </>;
}
