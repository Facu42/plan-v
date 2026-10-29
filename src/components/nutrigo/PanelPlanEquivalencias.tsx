import { useEffect, useState, type ReactNode } from 'react';
import { nutritionCapabilityApi } from '../../api/nutrition-capabilities';
import { careApi, careErrorMessage } from '../../api/care';
import type { CareReplacement } from '../../types/care';
import { foodQuantityUnit, type Food } from '../../types/foods';
import { type ExchangeGroup } from '../../types/nutrition-capabilities';
import { ExchangeEditor } from './NutritionExchanges';

const numero = (n: number) => n.toLocaleString('es-AR', { maximumFractionDigits: 2 });

/** La calculadora compara energía por la unidad nativa del catálogo, nunca supone densidad g/ml. */
export function calcularEquivalencias(origen: Food, cantidad: number, alternativas: readonly Food[]) {
  const kcal = origen.nutrients.kcal;
  if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 100000 || typeof kcal !== 'number' || !Number.isFinite(kcal) || kcal <= 0) return null;
  const energia = kcal * cantidad / 100;
  return { energia, alternativas: alternativas.filter(f => f.id !== origen.id && typeof f.nutrients.kcal === 'number' && Number.isFinite(f.nutrients.kcal) && f.nutrients.kcal > 0).flatMap(food => {
    const exacta = energia / food.nutrients.kcal! * 100;
    if (!Number.isFinite(exacta) || exacta <= 0 || exacta > 100000) return [];
    // El boceto redondea de a cinco; para porciones menores no mostramos una falsa cantidad cero.
    const redondeada = Math.round(exacta / 5) * 5;
    const quantity = redondeada || Math.round(exacta * 100) / 100;
    if (!quantity) return [];
    const porcion = foodQuantityUnit(food) === 'g' ? food.portions.find(p => p.grams > 0) : undefined;
    return [{ food, quantity, unit: foodQuantityUnit(food), kcal: food.nutrients.kcal! * quantity / 100,
      casera: porcion ? `${numero(quantity / porcion.grams)} × ${porcion.name}` : '—' }];
  }) };
}

function Panel({ titulo, meta, derecha, grande = false, children }: { titulo: string; meta?: string; derecha?: ReactNode; grande?: boolean; children: ReactNode }) {
  return <section className={`fxp${grande ? ' g' : ''}`}><header><h3>{titulo}</h3>{meta && <span className="m">{meta}</span>}<span className="sp" />{derecha}</header>{children}</section>;
}

export function PanelPlanEquivalenciasVista({ grupos, grupoId, alimentoId, cantidad, estado, error = '', cambios = [], historialEstado = 'sin-paciente', onGrupo, onAlimento, onCantidad, onEditar, onReintentar, onPlan }: {
  grupos: ExchangeGroup[]; grupoId: string; alimentoId: string; cantidad: string; estado: 'cargando' | 'lista' | 'error'; error?: string;
  cambios?: CareReplacement[]; historialEstado?: 'cargando' | 'lista' | 'error' | 'sin-paciente';
  onGrupo: (id: string) => void; onAlimento: (id: string) => void; onCantidad: (v: string) => void; onEditar: (g?: ExchangeGroup) => void; onReintentar: () => void; onPlan?: () => void;
}) {
  const grupo = grupos.find(g => g.id === grupoId) ?? grupos[0];
  const alimentos = grupo?.items.map(i => i.food) ?? [];
  const elegido = alimentos.find(f => f.id === alimentoId) ?? alimentos[0];
  const resultado = elegido ? calcularEquivalencias(elegido, cantidad.trim() ? Number(cantidad) : NaN, alimentos) : null;
  const unidad = elegido ? foodQuantityUnit(elegido) : 'g';
  return <div className="fx pfx"><div className="c">
    <Panel titulo="Calculadora de equivalencias" meta="misma energía, otro alimento" derecha={<div className="tabs" id="peg">{grupos.map(g => <button type="button" key={g.id} className={g.id === grupo?.id ? 'on' : ''} onClick={() => onGrupo(g.id)}>{g.name}</button>)}</div>}>
      <p className="r29-note warn">La equivalencia compara energía dentro de un grupo. Revisá también nutrientes, alergias y tolerancias antes de sustituir.</p>
      <div className="peqin"><label className="af"><span>Alimento</span><select className="ai" id="peqf" disabled={!alimentos.length} value={elegido?.id ?? ''} onChange={e => onAlimento(e.target.value)}>{!alimentos.length && <option value="">Sin alimentos en el grupo</option>}{alimentos.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}</select></label>
        <label className="af"><span>Cantidad ({unidad})</span><input className="ai num" id="peqg" aria-label={`Cantidad (${unidad})`} type="number" min="0.01" max="100000" step="0.01" disabled={!elegido} value={cantidad} onChange={e => onCantidad(e.target.value)} /></label>
        <div className="peqk"><small>Aporta</small><b className="num">{resultado ? `${numero(resultado.energia)} kcal` : '—'}</b></div>
      </div>
      {estado === 'cargando' ? <p className="mhelp" role="status">Cargando grupos…</p> : estado === 'error' ? <p className="mhelp" role="alert">{error} <button type="button" className="sbtn" onClick={onReintentar}>Reintentar</button></p> : !grupos.length ? <p className="mhelp">Todavía no hay grupos revisados. <button type="button" className="sbtn" onClick={() => onEditar()}>Crear grupo</button></p> : !resultado ? <p className="mhelp">Ingresá una cantidad válida y elegí un alimento con energía declarada.</p> : null}
      <div className="fxs fxtb tall"><table><thead><tr><th>Equivale a</th><th style={{ textAlign: 'right' }}>Cantidad</th><th style={{ textAlign: 'right' }}>Calorías</th><th style={{ textAlign: 'right' }}>En medidas caseras</th></tr></thead><tbody>{resultado?.alternativas.map(r => <tr key={r.food.id}><td><b style={{ fontWeight: 500 }}>{r.food.name}</b></td><td className="num" style={{ textAlign: 'right' }}>{numero(r.quantity)} {r.unit}</td><td className="num" style={{ textAlign: 'right' }}>{numero(r.kcal)} kcal</td><td style={{ textAlign: 'right', color: 'var(--ink2)' }}>{r.casera}</td></tr>)}</tbody></table></div>
      {resultado && !resultado.alternativas.length && <p className="mhelp">No hay otras alternativas con energía declarada en este grupo.</p>}
    </Panel>
    <Panel titulo="Últimos cambios en los planes" meta="propuestas publicadas para la paciente elegida" grande><div className="fxs fxr">{historialEstado === 'sin-paciente' ? <p className="mhelp">Elegí una paciente para ver sus propuestas de cambio.</p> : historialEstado === 'cargando' ? <p className="mhelp" role="status">Cargando cambios…</p> : historialEstado === 'error' ? <p className="mhelp" role="alert">No se pudieron leer los cambios. <button className="sbtn" type="button" onClick={onReintentar}>Reintentar</button></p> : cambios.length ? cambios.map(c => <div key={c.id}><span className="t"><b>{c.recipe.title}</b><small>{c.recipe.explanation}</small></span><span style={{ fontSize: '11.5px', color: 'var(--ink3)' }}>{new Date(c.published_at!).toLocaleDateString('es-AR')}</span></div>) : <p className="mhelp">No hay propuestas de cambio publicadas para esta paciente.</p>}</div></Panel>
  </div><div className="c">
    <Panel titulo="En la app de la paciente" derecha={<button type="button" className="sw" role="switch" disabled aria-checked={false} aria-label="Mostrar equivalencias en la app" title="No hay un interruptor global: las alternativas se revisan y publican por paciente." />}>
      <p className="mhelp">Las equivalencias de esta calculadora quedan solo para vos. Las propuestas de cambio se revisan y publican por paciente; no existe un interruptor global.</p><div className="mnot"><i className="mnl">V</i><span><b>Tu plan</b><small>Esta comparación no modifica ni publica el plan de la paciente.</small></span></div>{onPlan && <button type="button" className="sbtn" onClick={onPlan}>Revisar el plan</button>}
    </Panel>
    <Panel titulo="Grupos" meta="cómo se arman" grande><div className="fxkv">{grupos.map(g => <div key={g.id}><span>{g.name}</span><b>{g.items.map(i => i.food.name).join(', ')}</b></div>)}</div><div className="macts pbot"><button type="button" className="sbtn" onClick={() => onEditar()}>Nuevo grupo</button>{grupo && <button type="button" className="sbtn" onClick={() => onEditar(grupo)}>Revisar grupo</button>}</div></Panel>
  </div></div>;
}

export function PanelPlanEquivalencias({ pacienteId, onOpenPlan }: { pacienteId?: string; onOpenPlan?: () => void }) {
  const [grupos, setGrupos] = useState<ExchangeGroup[]>([]), [grupoId, setGrupo] = useState(''), [alimentoId, setAlimento] = useState(''), [cantidad, setCantidad] = useState('150');
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando'), [error, setError] = useState(''), [intento, setIntento] = useState(0), [editar, setEditar] = useState<ExchangeGroup | null | undefined>();
  const [historial, setHistorial] = useState<{ paciente: string; estado: 'cargando' | 'lista' | 'error'; cambios: CareReplacement[] }>({ paciente: '', estado: 'cargando', cambios: [] });
  useEffect(() => { const c = new AbortController(); setEstado('cargando'); setError(''); nutritionCapabilityApi.exchanges(c.signal).then(r => { if (!c.signal.aborted) { setGrupos(r.groups); setEstado('lista'); } }).catch(e => { if (!c.signal.aborted) { setError(careErrorMessage(e)); setEstado('error'); } }); return () => c.abort(); }, [intento]);
  useEffect(() => { if (!pacienteId) return; const c = new AbortController(); setHistorial({ paciente: pacienteId, estado: 'cargando', cambios: [] }); careApi.snapshot(pacienteId, true, c.signal).then(r => { if (!c.signal.aborted) setHistorial({ paciente: pacienteId, estado: 'lista', cambios: r.replacements.filter(r => r.published_at !== null).sort((a,b) => b.published_at!.localeCompare(a.published_at!)) }); }).catch(() => { if (!c.signal.aborted) setHistorial({ paciente: pacienteId, estado: 'error', cambios: [] }); }); return () => c.abort(); }, [pacienteId, intento]);
  return <><PanelPlanEquivalenciasVista grupos={grupos} grupoId={grupoId} alimentoId={alimentoId} cantidad={cantidad} estado={estado} error={error}
    cambios={pacienteId === historial.paciente ? historial.cambios : []} historialEstado={!pacienteId ? 'sin-paciente' : pacienteId === historial.paciente ? historial.estado : 'cargando'}
    onGrupo={id => { setGrupo(id); setAlimento(''); }} onAlimento={setAlimento} onCantidad={setCantidad} onEditar={setEditar} onReintentar={() => setIntento(n => n + 1)} onPlan={onOpenPlan} />
    {editar !== undefined && <ExchangeEditor group={editar ?? undefined} panel onClose={() => setEditar(undefined)} onSaved={g => { setGrupos(v => [...v.filter(x => x.id !== g.id), g]); setGrupo(g.id); setAlimento(''); setEditar(undefined); }} />}
  </>;
}
