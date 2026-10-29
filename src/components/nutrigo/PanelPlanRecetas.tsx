import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ProfessionalRecipe } from '../../types/recipes';
import { normalizeFoodSearch } from '../../types/foods';
import { recipesApi } from '../../api/recipes';
import { PanelV29Icon } from './PanelV29Icon';
import { CajonV29, Campo } from './CajonV29';
import { RecipeEditorForm, useRecipeCatalog } from './RecipeCatalog';
import './panel-plan-recetas.css';
import { canLeaveWorkspace } from './unsaved-changes';

export const FILTROS_RECETAS_V29 = ['Todas', 'Rápida', 'Sin gluten', 'Vegetariana', 'Viandas'] as const;
export type FiltroReceta = typeof FILTROS_RECETAS_V29[number];
export function recetasVisibles(recetas: readonly ProfessionalRecipe[], filtro: FiltroReceta, consulta: string) {
  const buscar = normalizeFoodSearch(consulta);
  return recetas.filter(r => {
    const categorias = (r.current.card?.culinary_categories ?? []).map(normalizeFoodSearch);
    const coincide = filtro === 'Todas' || categorias.includes(normalizeFoodSearch(filtro)) || (filtro === 'Rápida' && r.current.card?.prep_minutes != null && r.current.card.prep_minutes <= 30);
    return coincide && normalizeFoodSearch([r.title, ...r.current.ingredients.map(i => i.name)].join(' ')).includes(buscar);
  });
}
function FotoReceta({ receta, detalle = false }: { receta: ProfessionalRecipe; detalle?: boolean }) {
  const card = receta.current.card;
  const [fallo, setFallo] = useState(false);
  const url = card?.cover_status === 'ready' && card.cover_url && (/^https:\/\//i.test(card.cover_url) || /^\/(?!\/)/.test(card.cover_url)) ? card.cover_url : null;
  useEffect(() => setFallo(false), [url]);
  const style = { width: '100%', height: detalle ? 150 : 222, objectFit: 'cover' as const, borderRadius: 10, display: 'block' };
  return url && !fallo ? <img src={url} alt={card?.cover_alt || receta.title} style={style} onError={() => setFallo(true)}/> : <span className="pr-sin-foto" role="img" aria-label={`Sin foto de ${receta.title}`} style={style}>Sin foto</span>;
}
const dato = (n: number | null | undefined, unidad = '') => n == null ? 'Sin dato' : `${n.toLocaleString('es-AR')}${unidad}`;

type VistaProps = {
  recetas: ProfessionalRecipe[]; elegida?: ProfessionalRecipe; filtro: FiltroReceta; consulta: string; cargando: boolean; ocupado: boolean; error: string; aviso: string;
  pacienteNombre: string; puedeCompartir: boolean; puedeAgregar: boolean;
  onFiltro: (f: FiltroReceta) => void; onConsulta: (q: string) => void; onSeleccionar: (id: string) => void;
  onEditar: () => void; onPublicar: () => void; onCompartir: () => void; onAgregar: () => void; onReintentar: () => void;
};
/** pRecetas + el buscador r29: las clases y el orden son los del HTML de panel-trabajo. */
export function PanelPlanRecetasVista(p: VistaProps) {
  const visibles = recetasVisibles(p.recetas, p.filtro, p.consulta);
  const r = p.elegida;
  const macros = r?.current.card?.macro_status === 'declared' ? r.current.card.macros : null;
  return <div className="fx pfx">
    <div className="c"><section className="fxp g"><header><h3>Recetas</h3><span className="m">{p.cargando ? '—' : p.recetas.length}</span><span className="sp"/><div className="tabs" id="prf">{FILTROS_RECETAS_V29.map(f => <button type="button" key={f} className={p.filtro === f ? 'on' : undefined} aria-pressed={p.filtro === f} onClick={() => p.onFiltro(f)}>{f}</button>)}</div></header>
      <label className="r29-search"><PanelV29Icon name="search" size={14}/><input id="r29-recipe-search" type="search" aria-label="Buscar recetas" placeholder="Buscar receta o ingrediente…" value={p.consulta} onChange={e => p.onConsulta(e.target.value)}/></label>
      {p.error && <p className="mhelp" role="alert">{p.error} <button className="sbtn" type="button" onClick={p.onReintentar}>Reintentar</button></p>}
      {p.aviso && <p className="mhelp" role="status">{p.aviso}</p>}
      <div className="fxs prgrid">{p.cargando ? <p className="mempty" role="status">Cargando recetas…</p> : visibles.map(x => <button type="button" key={x.id} className={`prc${x.id === r?.id ? ' on' : ''}`} aria-pressed={x.id === r?.id} onClick={() => p.onSeleccionar(x.id)}><FotoReceta receta={x}/><b>{x.title}</b><small className="num">{dato(x.current.card?.macro_status === 'declared' ? x.current.card.macros?.kcal : null, ' kcal')} · {dato(x.current.card?.prep_minutes, ' min')} · {(x.current.card?.culinary_categories ?? []).join(' · ')}</small></button>)}{!p.cargando && !visibles.length && <p className="mempty">{p.recetas.length ? 'No hay recetas con ese filtro.' : 'Todavía no hay recetas. Creá la primera con Nueva receta.'}</p>}</div>
    </section></div>
    <div className="c"><section className="fxp g pfs"><header><h3>{r?.title ?? 'Elegí una receta'}</h3><span className="sp"/>{r && <><button type="button" className="sbtn" disabled={p.ocupado} onClick={p.onEditar}>Editar</button>{!r.current.published_at && <button type="button" className="sbtn" disabled={p.ocupado} onClick={p.onPublicar}>Publicar borrador</button>}</>}</header>
      {r ? <><FotoReceta receta={r} detalle/><div className="mnum"><div><small>Calorías</small><b className="num">{dato(macros?.kcal)}</b></div><div><small>Tiempo</small><b className="num">{dato(r.current.card?.prep_minutes, ' min')}</b></div></div>
        {(r.current.nutrition?.origin === 'ai_estimate' || r.current.catalog_recipe?.estimate_origin) && <p className="mhelp">Valores estimados por IA, para revisar.</p>}
        {r.published && r.published.version !== r.current.version && <p className="mhelp">Estás viendo un borrador. Compartir y agregar al plan utilizan la versión publicada {r.published.version}.</p>}
        <div className="fxkv">{[['Proteínas', dato(macros?.protein_g, ' g')], ['Carbohidratos', dato(macros?.carbs_g, ' g')], ['Grasas', dato(macros?.fat_g, ' g')], ['La usaste', 'Sin dato']].map(([k, v]) => <div key={k}><span>{k}</span><b>{v}</b></div>)}</div>
        <div className="plab">Ingredientes</div><ul className="pul">{r.current.ingredients.map(i => <li key={i.id}>{dato(i.quantity)} {i.unit} · {i.name}</li>)}</ul><div className="plab">Pasos</div><ol className="pul">{r.current.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>
        <div className="macts pbot"><button type="button" className="sbtn" disabled={p.ocupado || !r.published || !p.puedeCompartir} onClick={p.onCompartir}>Compartir en su app</button><button type="button" className="sbtn k" disabled={p.ocupado || !r.published || !p.puedeAgregar} onClick={p.onAgregar}>Agregar al plan de {p.pacienteNombre}</button></div>
      </> : <p className="mhelp">Elegí una receta del catálogo para ver ingredientes y pasos.</p>}
    </section></div>
  </div>;
}

export function PanelPlanRecetas({ pacienteId, pacientes, onHeader, onAgregarAlPlan }: {
  pacienteId: string; pacientes: { id: string; name: string }[]; onHeader?: (acciones: ReactNode) => void; onAgregarAlPlan?: (receta: ProfessionalRecipe) => void;
}) {
  const catalog = useRecipeCatalog(pacienteId);
  const actual = useRef(catalog); actual.current = catalog;
  const [filtro, setFiltro] = useState<FiltroReceta>('Todas'), [consulta, setConsulta] = useState(''), [seleccionada, setSeleccionada] = useState('');
  const [compartiendo, setCompartiendo] = useState<ProfessionalRecipe | null>(null), [destino, setDestino] = useState(pacienteId);
  const lista = (catalog.recipes ?? []).filter(r => r.status !== 'archived');
  const visibles = recetasVisibles(lista, filtro, consulta);
  const receta = visibles.find(r => r.id === seleccionada) ?? visibles[0];
  const persona = pacientes.find(p => p.id === pacienteId);
  useEffect(() => { onHeader?.(<button type="button" className="cta" disabled={catalog.busy} onClick={() => actual.current.chooseManual()}><PanelV29Icon name="plus" size={13}/>Nueva receta</button>); }, [onHeader, catalog.busy]);
  useEffect(() => () => onHeader?.(null), [onHeader]);
  const cerrar = () => catalog.closeEditorAfterConfirmation();
  return <><PanelPlanRecetasVista recetas={lista} elegida={receta} filtro={filtro} consulta={consulta} cargando={catalog.recipes === null} ocupado={catalog.busy} error={catalog.error} aviso={catalog.status}
    pacienteNombre={persona?.name.split(' ')[0] ?? 'la paciente'} puedeCompartir={pacientes.length > 0} puedeAgregar={Boolean(onAgregarAlPlan) && pacientes.length > 0}
    onFiltro={setFiltro} onConsulta={setConsulta} onSeleccionar={setSeleccionada} onEditar={() => { if (receta) catalog.startEdit(receta); }} onPublicar={() => { if (receta) catalog.publish(receta); }}
    onCompartir={() => { setDestino(pacienteId || pacientes[0]?.id || ''); if (receta?.published) setCompartiendo(receta); }} onAgregar={() => { if (receta?.published) onAgregarAlPlan?.(receta); }} onReintentar={() => void catalog.reload()}/>
    {catalog.editing && <CajonV29 titulo={catalog.editing.expected_revision ? 'Editar receta' : 'Nueva receta'} sub="Queda en tu recetario como borrador" ok={false} onClose={cerrar} antesDeCerrar={() => !catalog.busy && canLeaveWorkspace()}><RecipeEditorForm catalog={catalog}/>{catalog.error && <p role="alert">{catalog.error}</p>}{catalog.status && <p role="status">{catalog.status}</p>}</CajonV29>}
    {compartiendo?.published && <CajonV29 titulo="Compartir receta en su app" sub={compartiendo.published.title ?? compartiendo.title} ok="Compartir" onClose={() => setCompartiendo(null)} antesDeCerrar={() => !catalog.busy} onGuardar={() => {
      if (!destino || catalog.busy || !compartiendo.published) return false;
      void catalog.run(async () => { await recipesApi.assign(compartiendo.id, destino, compartiendo.published!.version); setCompartiendo(null); }, 'Receta compartida en su app.'); return false;
    }}><Campo etiqueta="Paciente"><select className="ai" aria-label="Paciente para compartir la receta" value={destino} disabled={catalog.busy} onChange={e => setDestino(e.target.value)}>{pacientes.map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></Campo><p className="mhelp">Se comparte únicamente la versión publicada. El borrador no se envía.</p>{catalog.error && <p role="alert">{catalog.error}</p>}</CajonV29>}
  </>;
}
