/** Front Nutrigo obtenido por get_design_context (24 nodos en design/figma-reference).
 * Traducción de sus piezas a React/CSS nativo. Los slots reciben datos de Plan V;
 * su ausencia no elimina ni reemplaza la estructura dibujada en Figma. */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ShowroomPage } from './ShowroomPanels';
import type { ProgressSeries } from '../../types/progress';

const sources = import.meta.glob('../../assets/nutrigo/front/*.svg', { eager: true, query: '?no-inline', import: 'default' }) as Record<string, string>;
export type FigmaDetail = { title: string; nodes: [string,string] };
export const FigmaDetailContext = createContext<((detail: FigmaDetail | null) => void) | null>(null);
export function useFigmaDetail(title: string | null, nodes: [string,string]) {
  const setDetail = useContext(FigmaDetailContext);
  const [desktop,mobile] = nodes;
  useEffect(() => { setDetail?.(title ? {title,nodes:[desktop,mobile]} : null); return () => setDetail?.(null); },[setDetail,title,desktop,mobile]);
}
export function FigmaAsset({ name, size, className = '' }: { name: string; size?: number; className?: string }) {
  const src = sources[`../../assets/nutrigo/front/${name}.svg`];
  return <span className={`fp-asset ${className}`} style={size ? { width: size, height: size } : undefined} aria-hidden="true"><img src={src} alt="" /></span>;
}

export const PATIENT_FIGMA_NODES: Partial<Record<ShowroomPage, [string, string]>> = {
  inicio: ['12:792','427:14405'], agenda: ['84:1666','433:17250'], mensajes: ['84:2565','433:19982'],
  recetas: ['84:2716','445:10499'], plan: ['84:2994','470:15300'], compras: ['105:2472','492:11324'],
  diario: ['105:2649','492:14886'], progreso: ['105:2790','498:18237'], ejercicio: ['105:2931','501:22824'], recursos: ['263:6588','504:15334'],
};

/** Navbar / Card Free Access: misma caja Saffron de 183 px, CTA conectado al plan. */
export function FigmaPlanCard({ onOpen }: { onOpen: () => void }) {
  return <section className="fp-plan-card" aria-label="Tu plan de alimentación">
    <div className="fp-plan-card-image" aria-hidden="true" />
    <p>Seguí tu acompañamiento<br />con <strong>tu plan de alimentación</strong><br />y tus registros de cada día.</p>
    <button type="button" onClick={onOpen}>Ver mi plan</button>
  </section>;
}

/** Section Footer: fila 20 px, copyright, enlaces y cinco assets originales. */
export function FigmaPatientFooter({ year, onContact }: { year: number; onContact: () => void }) {
  return <footer className="nv-footer fp-footer">
    <p>© {year} Plan V</p>
    <nav className="fp-footer-links" aria-label="Información y contacto"><a href="/legal/privacidad.html" target="_blank" rel="noreferrer">Privacidad</a>
    <a href="/legal/terminos.html" target="_blank" rel="noreferrer">Términos y condiciones</a>
    <button type="button" onClick={onContact}>Contacto</button></nav>
    <span className="fp-social" aria-hidden="true">{['facebook','twitter','instagram','youtube','linkedin'].map((name) => <FigmaAsset key={name} name={name} size={20} />)}</span>
  </footer>;
}

/** Diálogo nativo: formularios conservados fuera de la composición del frame.
 * showModal proporciona foco contenido, Escape y retorno al botón de apertura. */
export function FigmaRecordDialog({ title, onClose, children, className = '', closeLabel = 'Cerrar registros' }: { title: string; onClose: () => void; children: ReactNode; className?: string; closeLabel?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [closeStatus, setCloseStatus] = useState('');
  const requestClose = () => {
    if (ref.current?.querySelector('fieldset:disabled, [aria-busy="true"]')) { setCloseStatus('Esperá a que termine el guardado antes de cerrar.'); return; }
    onClose();
  };
  useEffect(() => {
    const dialog = ref.current;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog?.showModal();
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus(); };
  }, []);
  return <dialog ref={ref} className={`fp-record-dialog ${className}`} aria-labelledby="fp-record-title" onCancel={(event) => { event.preventDefault(); requestClose(); }}>
    <header><h2 id="fp-record-title">{title}</h2><button type="button" onClick={requestClose} aria-label={closeLabel}>×</button></header>
    {closeStatus && <p role="status">{closeStatus}</p>}
    {children}
  </dialog>;
}

/** Image Area 161:6761 / 498:18849. Imagen gris del original y sus cinco
 * anotaciones, sin convertir fotos en medidas ni rellenar campos no declarados. */
export function FigmaBodyMap({ series, onRecord }: { series: readonly ProgressSeries[]; onRecord: () => void }) {
  const latest = (kind: string) => {
    const row = series.find((entry) => entry.kind === kind);
    const point = row?.current_last ?? row?.previous_last;
    return { value: point ? point.value.toLocaleString('es-AR') : '—', unit: row?.unit ?? 'cm' };
  };
  const labels = [['chest','Pecho'],['waist','Cintura'],['hip','Cadera'],['arm','Brazo'],['thigh','Muslo']];
  return <div className="fp-body-map" data-figma-node="161:6761" aria-label="Últimas medidas declaradas">
    <button type="button" className="fp-body-picker" onClick={onRecord}>Mis registros <span aria-hidden="true">⌄</span></button>
    {labels.map(([kind,label]) => <div key={kind} className={`fp-body-label fp-body-${kind}`}><small>{label}</small><span><strong>{latest(kind).value}</strong> {latest(kind).unit}</span></div>)}
    {['line','line1','line2','line3','line4'].map((line) => <span key={line} className={`fp-body-line fp-body-${line}`} aria-hidden="true">
      <picture><source media="(max-width: 799px)" srcSet={sources[`../../assets/nutrigo/front/body-mobile-${line}.svg`]} /><img src={sources[`../../assets/nutrigo/front/body-${line}.svg`]} alt="" /></picture>
    </span>)}
    {[0,1,2,3,4].map((index) => <span key={index} className={`fp-body-point fp-body-point-${index}`} aria-hidden="true"><picture><source media="(max-width: 799px)" srcSet={sources[`../../assets/nutrigo/front/body-mobile-point${index === 0 ? '' : index === 1 ? '1' : '2'}.svg`]} /><img src={sources['../../assets/nutrigo/front/body-point.svg']} alt="" /></picture></span>)}
  </div>;
}
