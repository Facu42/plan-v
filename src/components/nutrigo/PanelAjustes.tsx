import { useEffect, useState, type ReactNode } from 'react';
import { nutritionCapabilityApi } from '../../api/nutrition-capabilities';
import { ajustesApi } from '../../api/ajustes';
import type { NoticeKey, NoticeView, TemplateView } from '../../types/ajustes';
import { EditarAviso, EditarMarca, EditarPlantilla, type ModoMarca } from './AjustesEditores';
import type { NutritionSettingsView } from '../../types/nutrition-capabilities';
import { friendlyError } from '../../lib/error-messages';
import { NutritionSettingsPanel } from './NutritionSettingsPanel';
import { ConfigurationReports } from './ConfigurationReports';
import { SectionTabs, SettingsDialog } from './EquipoAjustesShared';
import { canLeaveWorkspace } from './unsaved-changes';
import { AjustesAvisos, AjustesCuenta, AjustesIntegraciones, AjustesPlantillas, AjustesSeguridad, type TemaAjustes } from './PanelAjustesVistas';

const TABS = ['Mi cuenta', 'Plantillas', 'Avisos automáticos', 'Seguridad', 'Integraciones'];
type Dialogo = { tipo: 'exportar' } | { tipo: 'marca'; modo: ModoMarca } | { tipo: 'plantilla'; modo: 'nueva' | 'editar' | 'cuando'; plantilla?: TemplateView } | { tipo: 'aviso'; clave: NoticeKey; titulo: string; cuando: string; texto: string; activo: boolean } | null;
const reemplazar = <T extends { id?: string; key?: string }>(lista: T[] | null, nuevo: T) => { const base = lista ?? []; const i = base.findIndex(x => (x.id ?? x.key) === (nuevo.id ?? nuevo.key)); return i < 0 ? [...base, nuevo] : base.map((x, j) => j === i ? nuevo : x); };

/** Ajustes v29: cada pestaña es una de las cinco vistas del boceto (`PanelAjustesVistas`); los diálogos reusan la edición de marca y los reportes que ya existían. */
export function PanelAjustes({ onOpen, onHeader, tema, onSecurity }: { onOpen: (href: string) => void; onHeader?: (actions: ReactNode) => void; tema?: TemaAjustes; onSecurity?: () => void }) {
  const [view, setView] = useState(0), [dialogo, setDialogo] = useState<Dialogo>(null), [data, setData] = useState<NutritionSettingsView | null>(null), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => { const c = new AbortController(); setError(''); nutritionCapabilityApi.settings(c.signal).then(d => { if (!c.signal.aborted) setData(d); }).catch(e => { if (!c.signal.aborted) setError(friendlyError(e)); }); return () => c.abort(); }, [revision]);
  const [plantillas, setPlantillas] = useState<TemplateView[] | null>(null), [avisos, setAvisos] = useState<NoticeView[] | null>(null), [errPlantillas, setErrPlantillas] = useState(''), [errAvisos, setErrAvisos] = useState(''), [reintento, setReintento] = useState(0);
  useEffect(() => { const c = new AbortController(); setErrPlantillas(''); ajustesApi.templates(c.signal).then(d => { if (!c.signal.aborted) setPlantillas(d.templates); }).catch(e => { if (!c.signal.aborted) setErrPlantillas(friendlyError(e)); }); return () => c.abort(); }, [reintento]);
  useEffect(() => { const c = new AbortController(); setErrAvisos(''); ajustesApi.notices(c.signal).then(d => { if (!c.signal.aborted) setAvisos(d.notices); }).catch(e => { if (!c.signal.aborted) setErrAvisos(friendlyError(e)); }); return () => c.abort(); }, [reintento]);
  const guardarAviso = (aviso: Parameters<typeof ajustesApi.saveNotice>[0]) => { setErrAvisos(''); ajustesApi.saveNotice(aviso).then(r => setAvisos(a => reemplazar(a, r.notice))).catch(e => setErrAvisos(friendlyError(e))); };
  useEffect(() => { onHeader?.(<SectionTabs labels={TABS} value={view} onChange={setView} label="Ajustes"/>); }, [onHeader, view]);
  useEffect(() => () => onHeader?.(null), [onHeader]);
  return <div id="s-ajustes" className="ea-screen">
    {!onHeader && <header className="ea-local"><h1>Ajustes</h1><p>Tu cuenta, plantillas, avisos y seguridad del consultorio</p><SectionTabs labels={TABS} value={view} onChange={setView} label="Ajustes"/></header>}
    {error && <p role="alert">{error} <button type="button" className="chip" onClick={() => setRevision(r => r + 1)}>Reintentar</button></p>}
    <div role="tabpanel" aria-label={TABS[view]} className="ea-settings-v29">
      {view === 0 ? <AjustesCuenta marca={data?.settings.brand ?? null} cargando={!data && !error} tema={tema} onEditar={modo => setDialogo({ tipo: 'marca', modo })} onExportar={() => setDialogo({ tipo: 'exportar' })} onOpen={onOpen}/>
        : view === 1 ? <AjustesPlantillas marca={data?.settings.brand ?? null} plantillas={plantillas} error={errPlantillas} onNueva={() => setDialogo({ tipo: 'plantilla', modo: 'nueva' })} onEditar={plantilla => setDialogo({ tipo: 'plantilla', modo: 'editar', plantilla })} onCuando={plantilla => setDialogo({ tipo: 'plantilla', modo: 'cuando', plantilla })} onReintentar={() => setReintento(r => r + 1)}/>
        : view === 2 ? <AjustesAvisos avisos={avisos} error={errAvisos} irAIntegraciones={() => setView(4)} onGuardar={guardarAviso} onEditar={({ key, ...resto }) => setDialogo({ tipo: 'aviso', clave: key, ...resto })} onReintentar={() => setReintento(r => r + 1)}/>
        : view === 3 ? <AjustesSeguridad onOpen={onOpen} onSecurity={onSecurity}/>
        : <AjustesIntegraciones onOpen={onOpen}/>}
    </div>
    {dialogo?.tipo === 'marca' && data && <EditarMarca modo={dialogo.modo} data={data} onSaved={setData} onClose={() => setDialogo(null)}/>}
    {dialogo?.tipo === 'plantilla' && <EditarPlantilla modo={dialogo.modo} plantilla={dialogo.plantilla} onSaved={t => setPlantillas(l => reemplazar(l, t))} onEliminada={id => setPlantillas(l => (l ?? []).filter(x => x.id !== id))} onClose={() => setDialogo(null)}/>}
    {dialogo?.tipo === 'aviso' && <EditarAviso clave={dialogo.clave} titulo={dialogo.titulo} cuando={dialogo.cuando} texto={dialogo.texto} activo={dialogo.activo} onSaved={n => setAvisos(l => reemplazar(l, n))} onClose={() => setDialogo(null)}/>}
    {dialogo?.tipo === 'exportar' && <SettingsDialog title="Descargar mis datos" onClose={() => setDialogo(null)}><ConfigurationReports onOpen={onOpen}/></SettingsDialog>}
  </div>;
}
