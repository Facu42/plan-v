import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { usePanelBoceto } from './panel-v29-boceto';
import { PanelV29Icon } from './PanelV29Icon';
import { filterGuides, HELP_GUIDES, HELP_TOPICS, HELP_FAQ } from './help-center-model';
import './help-center.css';

type Faq = (typeof HELP_FAQ)[number];

/** sxAyuda v29 con contenido real; no genera mediciones ni envía pedidos a soporte. */
export function HelpCenter({ onOpen, onHeader }: { onOpen: (href: string) => void; onHeader?: (actions: ReactNode) => void }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState('todas');
  const [selectedTitle, setSelectedTitle] = useState(HELP_GUIDES[0].title);
  const [faq, setFaq] = useState<Faq | null>(null);
  const [asking, setAsking] = useState(false);
  const [notice, setNotice] = useState('');
  const visible = filterGuides(query, topic);
  const selected = visible.find(g => g.title === selectedTitle) ?? visible[0];
  useEffect(() => {
    if (!visible.some(g => g.title === selectedTitle)) setSelectedTitle(visible[0]?.title ?? HELP_GUIDES[0].title);
  }, [query, topic, selectedTitle]);
  const actions = <><form className="help-search" onSubmit={event => { event.preventDefault(); setNotice(query.trim() ? `Buscaste «${query.trim()}».` : 'Mostrando las guías del tema.'); }}>
    <label className="sxin"><PanelV29Icon name="search" size={14}/><input aria-label="Buscar una guía" placeholder="Invitación, consulta, importar…" value={query} onChange={event => setQuery(event.target.value)}/></label>
    <button className="chip" type="submit">Buscar</button>
  </form><button className="chip" type="button" onClick={() => setNotice('Todavía no hay medición de consultas. No podemos identificar la más consultada.')}>La más consultada</button></>;
  useEffect(() => { onHeader?.(actions); }, [onHeader, query]); // Las acciones solo dependen del texto de búsqueda.
  useEffect(() => () => onHeader?.(null), [onHeader]);
  return <div id="s-ayuda" className="sxw" aria-label="Centro de ayuda">
    {!onHeader && <header className="help-local-header"><div><h1>Centro de ayuda</h1><p className="sxsub">Guías, temas y preguntas frecuentes</p></div>{actions}</header>}
    {notice && <p className="sxsub" role="status">{notice}</p>}
    <div className="fx help-columns"><div className="c"><section className="fxp g" aria-label="Temas y guías">
      <header><h3>Temas</h3><span className="m">{visible.length} de {HELP_GUIDES.length} guías</span></header>
      <div className="sxtemas">{HELP_TOPICS.map(([value, label]) => <button type="button" key={value} className={`chip${topic === value ? ' on' : ''}`} aria-pressed={topic === value} onClick={() => setTopic(value)}>{label}</button>)}</div>
      <div className="fxs"><div className="fxr">{visible.length ? visible.map(g => <div className={`l${selected?.title === g.title ? ' on' : ''}`} key={g.title}><span className="sxwho"><b>{g.title}</b><small>{HELP_TOPICS.find(([value]) => value === g.topic)?.[1]}</small></span><button className="chip" type="button" aria-label={`Ver ${g.title}`} aria-pressed={selected?.title === g.title} onClick={() => setSelectedTitle(g.title)}>Ver</button></div>) : <p className="sxsub">No encontramos una guía con ese texto.</p>}</div></div>
    </section></div><div className="c">
      <section className="fxp" aria-label="Detalle de la guía"><header><h3>{selected?.title ?? 'Guía'}</h3><span className="sp"/>{selected && <button className="chip" type="button" onClick={() => onOpen(selected.href)}>Abrir apartado</button>}</header>
        {selected ? <><p className="sxsub">Sin medición de consultas este mes.</p><ol className="sxol sxguide">{selected.steps.map((step, index) => <li key={step}><span className="n" aria-hidden="true">{index + 1}</span><span>{step}</span></li>)}</ol><p className="sxsub">{selected.error}</p></> : <p className="sxsub">Probá con otra palabra.</p>}
      </section>
      <section className="fxp g" aria-label="Preguntas frecuentes"><header><h3>Preguntas frecuentes</h3><span className="m">{HELP_FAQ.length} respuestas cortas</span><span className="sp"/><button type="button" className="chip" onClick={() => setAsking(true)}>Pedir ayuda a Plan V</button></header>
        <div className="fxs"><div className="fxr">{HELP_FAQ.map(f => <button className="l" type="button" key={f.q} onClick={() => setFaq(f)}><span className="sxwho"><b>{f.q}</b><small>{f.a}</small></span></button>)}</div></div>
      </section>
    </div></div>
    {faq && <HelpDialog title={faq.q} onClose={() => setFaq(null)}><p className="sxsub">Pregunta frecuente</p><p>{faq.a}</p><button className="chip" type="button" onClick={() => { setFaq(null); onOpen(faq.href); }}>Abrir el apartado</button></HelpDialog>}
    {asking && <HelpDialog title="Pedir ayuda a Plan V" onClose={() => setAsking(false)} footer={<><button type="button" className="chip" onClick={() => setAsking(false)}>Cancelar</button><span className="sp"/><button className="cta" type="submit" form="help-request-form">Anotar pedido</button></>}><p className="sxsub">No pongas datos de pacientes ni claves. Este pedido queda solo en esta pantalla: no se envía a soporte ni se guarda al salir.</p><form id="help-request-form" className="help-request" onSubmit={event => { event.preventDefault(); setAsking(false); setNotice('Pedido anotado solo en esta pantalla. No se envió a Plan V ni se guardó al salir.'); }}>
      <label><span id="help-section-label">Apartado</span><select aria-labelledby="help-section-label" defaultValue={selected?.title}>{HELP_GUIDES.map(g => <option key={g.title}>{g.title}</option>)}</select></label>
      <label>Qué pasó<textarea required maxLength={2000} placeholder="Ej.: no veo la conversación"/></label>
      <label className="help-check"><input type="checkbox" required/>No incluyo datos de pacientes ni claves</label>
    </form></HelpDialog>}
  </div>;
}

function HelpDialog({ title, children, onClose, footer }: { title: string; children: ReactNode; onClose: () => void; footer?: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  const { clase, cerrar } = usePanelBoceto(onClose);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => previous?.focus();
  }, []);
  const node = <div id="actw" className={clase ? `on help-dialog` : 'help-dialog'}><div className="ascrim" onClick={cerrar}/><aside id="act" ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="help-dialog-title" onKeyDown={event => {
    if (event.key === 'Escape') { event.stopPropagation(); cerrar(); }
    if (event.key !== 'Tab') return;
    const targets = Array.from(ref.current?.querySelectorAll<HTMLElement>('button, input, textarea, select') ?? []);
    const first = targets[0], last = targets[targets.length - 1];
    if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first?.focus(); }
  }}><header><div><h2 id="help-dialog-title">{title}</h2></div><button type="button" className="ibtn" aria-label="Cerrar" onClick={cerrar}><PanelV29Icon name="x" size={13}/></button></header><div className="abody">{children}</div><footer>{footer ?? <button type="button" className="chip" onClick={cerrar}>Cerrar panel</button>}</footer></aside></div>;
  const host = typeof document === 'undefined' ? null : document.querySelector('#pv-panel-v29 .app');
  return host ? createPortal(node, host) : node;
}
