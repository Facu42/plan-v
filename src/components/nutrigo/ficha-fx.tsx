// Piezas del Resumen de la Ficha v29: el mismo HTML y las mismas clases del boceto (`fxP`, `fxRows`, `fxKv`…), con datos reales.
import { useId, type CSSProperties, type ReactNode } from 'react';
import { PanelV29Icon } from './PanelV29Icon';
import { curvaFicha, medioCirculo, type SolapaFicha } from './ficha-presentacion';

export type Ir = (solapa: SolapaFicha) => void;

/** `alCambiarMeta` vuelve la leyenda del boceto (por ejemplo «últimos 7 días») un selector sin cambiar cómo se ve. */
export function FxPanel({ titulo, meta, derecha, grande, alCambiarMeta, children }: { titulo: string; meta?: string; derecha?: ReactNode; grande?: boolean; alCambiarMeta?: () => void; children: ReactNode }) {
  return <section className={`fxp${grande ? ' g' : ''}`}><header><h3>{titulo}</h3>{meta ? alCambiarMeta ? <span className="m" role="button" tabIndex={0} style={{ cursor: 'pointer' }} title="Cambiar el período" onClick={alCambiarMeta} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); alCambiarMeta(); } }}>{meta}</span> : <span className="m">{meta}</span> : null}<span className="sp" />{derecha}</header>{children}</section>;
}

export function FxIr({ a, ir, texto = 'Ver' }: { a: SolapaFicha; ir: Ir; texto?: string }) {
  return <button className="lnk" type="button" onClick={() => ir(a)}>{texto} <PanelV29Icon name="chev" size={11} /></button>;
}

export type FilaFx = { tono: 'l' | 'a' | 'b' | 'r' | 'n'; titulo: string; sub?: string; derecha?: ReactNode; ir?: SolapaFicha };
export function FxFilas({ filas, ir }: { filas: readonly FilaFx[]; ir: Ir }) {
  return <div className="fxr">{filas.map(fila => {
    const cuerpo = <><span className="t"><b>{fila.titulo}</b>{fila.sub ? <small>{fila.sub}</small> : null}</span>{fila.derecha}{fila.ir ? <PanelV29Icon name="chev" size={12} /> : null}</>;
    return fila.ir ? <button type="button" key={fila.titulo} className={fila.tono} onClick={() => ir(fila.ir!)}>{cuerpo}</button> : <div key={fila.titulo} className={fila.tono}>{cuerpo}</div>;
  })}</div>;
}

export const FxKv = ({ filas }: { filas: ReadonlyArray<readonly [string, ReactNode]> }) => <div className="fxkv">{filas.map(([a, b]) => <div key={a}><span>{a}</span><b>{b}</b></div>)}</div>;
export const FxBar = ({ pct }: { pct: number }) => <span className="fxb"><i style={{ width: `${Math.min(100, pct)}%` }} /></span>;
export const FxCk = ({ filas }: { filas: ReadonlyArray<readonly [string, boolean]> }) => <div className="fxck">{filas.map(([t, on]) => <div key={t}><i className={on ? 'on' : ''} /><span>{t}</span></div>)}</div>;
export const FxStk = ({ partes }: { partes: ReadonlyArray<readonly [string, number, string]> }) => <><div className="fxstk">{partes.map(([t, p, c]) => <i key={t} className={c} style={{ width: `${p}%` }} title={t} />)}</div><div className="fxleg">{partes.map(([t, , c]) => <span key={t} className={c}><i />{t}</span>)}</div></>;

export function FxDk({ clave, titulo, sub, extra }: { clave: string; titulo: string; sub: string; extra?: ReactNode }) {
  return <div className="fxdk"><small>{clave}</small><b className="num">{titulo}</b><span>{sub}</span>{extra}</div>;
}

export function FxCurva({ valores, rotulos, ancho, alto, meta, rotuloMeta, mini }: { valores: readonly number[]; rotulos?: readonly string[]; ancho?: number; alto?: number; meta?: number | null; rotuloMeta?: string; mini?: boolean }) {
  const id = `fxg${useId().replace(/:/g, '')}`;
  const c = curvaFicha(valores, rotulos ?? null, { ancho, alto, meta, rotuloMeta, mini });
  if (!valores.length) return <svg className={`pw-g fxc${mini ? ' mini' : ''}`} viewBox={`0 0 ${c.ancho} ${c.alto}`} aria-hidden="true" />;
  return <svg className={`pw-g fxc${mini ? ' mini' : ''}`} viewBox={`0 0 ${c.ancho} ${c.alto}`} preserveAspectRatio={mini ? 'none' : undefined} aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="s1" /><stop offset="1" className="s2" /></linearGradient></defs>
    {c.meta ? <><line className="goal" x1={6} x2={c.ancho - (mini ? 4 : 30) + 4} y1={c.meta.y.toFixed(1)} y2={c.meta.y.toFixed(1)} />{mini ? null : <text className="gt" x={c.meta.xTexto} y={(c.meta.y + 3).toFixed(1)}>{c.meta.etiqueta}</text>}</> : null}
    <path className="ar" d={c.area} style={{ fill: `url(#${id})` }} /><path className="ln" pathLength={1} d={c.curva} />
    {mini || !c.ultimo ? null : <>{c.puntos.map(([x, y]) => <circle key={`${x}`} className="dt" cx={x.toFixed(1)} cy={y.toFixed(1)} r={2} />)}<circle className="now" cx={c.ultimo[0].toFixed(1)} cy={c.ultimo[1].toFixed(1)} r={4} /><text className="nt" x={c.ultimo[0].toFixed(1)} y={(c.ultimo[1] - 9).toFixed(1)} textAnchor="middle">{c.texto}</text></>}
    {c.etiquetas.map(e => <text key={`${e.x}${e.texto}`} className="xl" x={e.x.toFixed(1)} y={c.alto - 5} textAnchor="middle">{e.texto}</text>)}
  </svg>;
}

export function FxMedidor({ pct, texto, sub, ancho = 150, chico }: { pct: number; texto: string; sub?: string; ancho?: number; chico?: boolean }) {
  const m = medioCirculo(pct);
  return <div className={`pg fxg${chico ? ' sm' : ''}`} style={{ width: ancho }}><svg className="pg-g" viewBox="0 0 160 88" aria-hidden="true"><path className="tr" pathLength={100} d={m.arco} />
    {chico ? null : m.marcas.map(([x1, y1, x2, y2]) => <line key={x1} className="tk" x1={x1.toFixed(1)} y1={y1.toFixed(1)} x2={x2.toFixed(1)} y2={y2.toFixed(1)} />)}
    <path className="pv" pathLength={100} strokeDasharray={100} strokeDashoffset={100 - pct} d={m.arco} />{m.fin ? <circle className="end" cx={m.fin[0].toFixed(1)} cy={m.fin[1].toFixed(1)} r={5} /> : null}</svg>
    <div className="pg-v"><b className="num">{texto}</b>{sub ? <span>{sub}</span> : null}</div></div>;
}

export function FxMosaico({ etiqueta, valor, unidad, cambio, bueno, serie, ir }: { etiqueta: string; valor: string; unidad: string; cambio: string; bueno: boolean; serie: readonly number[]; ir: () => void }) {
  return <button type="button" className="fxp fxtile" onClick={ir}><small>{etiqueta}</small><div className="fxv"><b className="num">{valor}</b><span>{unidad}</span><em className={bueno ? '' : 'bad'}>{cambio}</em></div>
    <FxCurva valores={serie} ancho={120} alto={30} mini /></button>;
}

/** Anillo de avance de la lista de objetivos (`fxRing` del boceto). */
export function FxRing({ pct, texto, tamano = 46 }: { pct: number; texto?: string; tamano?: number }) {
  return <span className="fxring" style={{ '--s': `${tamano}px` } as CSSProperties}><svg viewBox="0 0 40 40" aria-hidden="true"><circle className="bg" cx={20} cy={20} r={16} /><circle className="fg" cx={20} cy={20} r={16} pathLength={100} strokeDasharray={100} strokeDashoffset={100 - pct} /></svg><b className="num">{texto ?? `${pct}%`}</b></span>;
}

/** Columnas de los últimos días (`fxCols` del boceto): la última resaltada, el promedio como línea. */
export function FxCols({ valores, rotulos, max, alto = 110, promedio, bajo, medio, tope }: { valores: readonly number[]; rotulos: readonly string[]; max: number; alto?: number; promedio?: number | null; bajo?: number; medio?: number; tope?: string }) {
  return <div className="pa7 fxcols" style={{ height: alto }}>{promedio != null ? <span className="avg" style={{ bottom: `calc(${(promedio / max * 100).toFixed(1)}% * .78 + 18px)` }} /> : null}
    {valores.map((x, k) => { const ultimo = k === valores.length - 1; const clase = bajo != null && x < bajo ? 'lo' : medio != null && x < medio ? 'md' : '';
      return <div key={k} className={ultimo ? 'td' : ''}>{ultimo && tope ? <u className="num">{tope}</u> : null}<i style={{ height: `${(x / max * 78).toFixed(1)}%` }} className={clase} /><small>{rotulos[k]}</small></div>; })}
  </div>;
}
