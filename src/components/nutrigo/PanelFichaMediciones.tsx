// Solapa Mediciones de la Ficha v29: el HTML de `mediciones:` del boceto (el segundo, con piezas `fx`), con las medidas reales.
import { useState, type ReactNode } from 'react';
import type { Patient } from '../../types';
import { PanelV29Icon } from './PanelV29Icon';
import { FxCurva, FxFilas, FxMedidor, FxPanel, FxStk } from './ficha-fx';
import { MeasurementEntryDialog, type MeasurementEntryInitial } from './MeasurementEntryDialog';
import { ScaleImportDialog } from './ScaleImportDialog';
import { medidoresDe, ultimaMedicion, SOLAPAS_MEDIDA, unidadDeSolapa, filasDeMedidas, filasSegmentales, ultimaKerr, seriesDeEvolucion, type SolapaMedida } from './ficha-mediciones';
import { numero, type SolapaFicha } from './ficha-presentacion';
import { homeDay } from '../../lib/panel-home';
import type { FichaData } from './use-ficha-data';

const SIN_PERMISO = 'Permiso de medidas pendiente.';
const boton = (texto: string, onClick: () => void, opciones: { k?: boolean; icono?: 'up' | 'plus'; apagado?: boolean } = {}) =>
  <button type="button" className={`sbtn${opciones.k ? ' k' : ''} cbtn`} disabled={opciones.apagado} onClick={onClick}>{opciones.icono ? <PanelV29Icon name={opciones.icono} size={13} /> : null}{texto}</button>;

export function PanelFichaMediciones({ patient, now, datos, ir, children }: { patient: Patient; now: Date; datos: FichaData; ir: (solapa: SolapaFicha) => void; children?: ReactNode }) {
  const hoy = homeDay(now);
  const [solapa, setSolapa] = useState<SolapaMedida>('pliegues');
  const [grafico, setGrafico] = useState<'peso' | 'grasa' | 'cintura'>('peso');
  const [cargando, setCargando] = useState<MeasurementEntryInitial | null>(null);
  const [importando, setImportando] = useState(false);
  const { care, careError, reload, canDocs, current } = datos;
  const permitido = Boolean(care?.consented.includes('measurement'));
  const medidas = care && permitido ? care.measurements.filter(m => m.patient_id === patient.id) : [];
  const registros = canDocs && current?.clinical ? current.clinical.records : [];
  const medidores = medidoresDe(medidas, hoy);
  const kerr = ultimaKerr(registros, hoy);
  const series = seriesDeEvolucion(medidas, patient.goal ?? '', hoy);
  const serie = series.find(s => s.clave === grafico)!;
  const fotos = care?.consented.includes('body_progress') ? care.records.filter(r => r.patient_id === patient.id && r.data.kind === 'body_photo').length : null;
  const filas = solapa === 'perimetros' || solapa === 'composicion' ? filasDeMedidas(medidas, solapa, hoy) : solapa === 'segmental' ? filasSegmentales(registros, hoy) : [];
  const vacio = !care ? (careError ? 'No pudimos cargar las medidas.' : 'Consultando medidas…') : !permitido ? SIN_PERMISO
    : solapa === 'pliegues' ? 'Los pliegues todavía no se cargan en Nutridash. Se suman con la fórmula que valide Verónica.'
      : solapa === 'segmental' ? (canDocs ? 'Sin evaluación segmental cargada.' : 'Permiso de estudios pendiente.') : 'Sin mediciones cargadas.';
  const primerNombre = patient.name.split(' ')[0] ?? patient.name;
  return <>
    <div className="fx" data-mk="1" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
      <div className="c">
        <FxPanel titulo="Mediciones" meta={care ? (permitido ? ultimaMedicion(medidas, hoy) : 'sin permiso de medidas') : 'consultando…'}
          derecha={<>{boton('Importar balanza', () => setImportando(true), { icono: 'up', apagado: !permitido })}{boton('Nueva medición', () => setCargando({ date: null, values: {} }), { k: true, icono: 'plus', apagado: !permitido })}</>}>
          <div className="fxgauges">{medidores.map(m => <div key={m.clave}><FxMedidor pct={m.pct} texto={m.valor} ancho={108} chico /><small>{m.etiqueta}</small><em>{m.nota}</em></div>)}</div>
        </FxPanel>
        <section className="fxp g"><header><h3><div className="tabs">{SOLAPAS_MEDIDA.map(([id, texto]) => <button key={id} className={id === solapa ? 'on' : undefined} type="button" aria-pressed={id === solapa} onClick={() => setSolapa(id)}>{texto}</button>)}</div></h3>{unidadDeSolapa(solapa) ? <span className="m">{unidadDeSolapa(solapa)}</span> : null}<span className="sp" />
          <span className="m">Fórmula</span><button className="chip" type="button" style={{ padding: '5px 10px' }} disabled title="Se activa cuando Verónica valide una fórmula">Sin fórmula validada</button></header>
          <div className="fxs fxtb"><table><thead><tr><th>Sitio</th><th>Último</th><th>Fecha</th><th>Anterior</th><th>Cambio</th></tr></thead>
            <tbody>{filas.length ? filas.map(f => <tr key={f.sitio}><td>{f.sitio}</td><td className="num">{f.ultimo}</td><td className="num" style={{ color: 'var(--ink3)' }}>{f.fecha}</td><td className="num" style={{ color: 'var(--ink3)' }}>{f.anterior}</td><td className="num ok">{f.cambio}</td></tr>)
              : <tr><td colSpan={5} style={{ color: 'var(--ink3)' }}>{vacio}{careError && !care ? <> <button type="button" className="lnk" onClick={reload}>Reintentar</button></> : null}</td></tr>}</tbody></table></div>
        </section>
      </div>
      <div className="c">
        <FxPanel titulo="Evolución" derecha={<div className="tabs">{series.map(s => <button key={s.clave} className={s.clave === grafico ? 'on' : undefined} type="button" aria-pressed={s.clave === grafico} onClick={() => setGrafico(s.clave)}>{s.etiqueta}</button>)}</div>}>
          {serie.valores.length ? <FxCurva valores={serie.valores} rotulos={serie.fechas} ancho={360} alto={118} meta={serie.meta} rotuloMeta={serie.meta === null ? undefined : numero(serie.meta)} />
            : <div className="fxhint">{care && !permitido ? SIN_PERMISO : 'Sin mediciones de este valor.'}</div>}
        </FxPanel>
        <FxPanel titulo="Kerr · 5 componentes" meta={kerr ? (kerr.completo && kerr.suma !== null ? `suma ${numero(kerr.suma)} kg` : `peso ${numero(kerr.peso)} kg`) : 'sin evaluación'} derecha={kerr ? <span className="pill p-conf">Resultados de la profesional</span> : null}>
          {kerr ? <><FxStk partes={kerr.componentes.map(c => [c.etiqueta, c.pct, c.clase] as const)} /><div className="fxkv">{kerr.componentes.map(c => <div key={c.clave}><span className={`dot ${c.clase}`}>{c.etiqueta}</span><b>{numero(c.kg)} kg · {c.pct}%</b></div>)}</div>
            {kerr.completo && kerr.diferencia !== null ? null : <div className="fxhint">Faltan masas: la suma no se calcula.</div>}</>
            : <div className="fxhint">{!care ? 'Consultando…' : !canDocs ? 'Permiso de estudios pendiente.' : `Sin evaluación Kerr cargada. Se carga abajo, en «Evaluaciones clínicas».`}</div>}
        </FxPanel>
        <FxPanel titulo={`Para ${primerNombre}`} grande>
          <FxFilas ir={ir} filas={[
            { tono: 'l', titulo: 'Informe de mediciones', sub: 'PDF con tu logo, gráficos y lo que cambió', derecha: boton('Generar', () => ir('archivos'), { k: true }) },
            { tono: 'b', titulo: 'Fotos de progreso', sub: fotos === null ? (care ? 'Permiso de fotos pendiente' : 'Consultando…') : `${fotos} ${fotos === 1 ? 'foto privada' : 'fotos privadas'}`, derecha: boton('Comparar', () => ir('archivos')) },
          ]} />
        </FxPanel>
      </div>
    </div>
    {children}
    {importando && care ? <ScaleImportDialog measurements={care.measurements} onClose={() => setImportando(false)} onReview={initial => { setImportando(false); setCargando(initial); }} /> : null}
    {cargando ? <MeasurementEntryDialog patientId={patient.id} patientName={patient.name} initial={cargando} onClose={() => setCargando(null)} /> : null}
  </>;
}
