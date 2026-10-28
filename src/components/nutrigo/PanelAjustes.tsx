import { useEffect, useState, type ReactNode } from 'react';
import { nutritionCapabilityApi } from '../../api/nutrition-capabilities';
import type { NutritionSettingsView } from '../../types/nutrition-capabilities';
import { friendlyError } from '../../lib/error-messages';
import { NutritionSettingsPanel } from './NutritionSettingsPanel';
import { ConfigurationReports } from './ConfigurationReports';
import { SectionTabs, SettingsDialog } from './EquipoAjustesShared';
import { canLeaveWorkspace } from './unsaved-changes';
import { AjustesAvisos, AjustesCuenta, AjustesIntegraciones, AjustesPlantillas, AjustesSeguridad, type TemaAjustes } from './PanelAjustesVistas';

const TABS = ['Mi cuenta', 'Plantillas', 'Avisos automáticos', 'Seguridad', 'Integraciones'];
type Dialogo = 'marca' | 'exportar' | null;

/** Ajustes v29: cada pestaña es una de las cinco vistas del boceto (`PanelAjustesVistas`); los diálogos reusan la edición de marca y los reportes que ya existían. */
export function PanelAjustes({ onOpen, onHeader, tema, onSecurity }: { onOpen: (href: string) => void; onHeader?: (actions: ReactNode) => void; tema?: TemaAjustes; onSecurity?: () => void }) {
  const [view, setView] = useState(0), [dialogo, setDialogo] = useState<Dialogo>(null), [data, setData] = useState<NutritionSettingsView | null>(null), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  useEffect(() => { const c = new AbortController(); setError(''); nutritionCapabilityApi.settings(c.signal).then(d => { if (!c.signal.aborted) setData(d); }).catch(e => { if (!c.signal.aborted) setError(friendlyError(e)); }); return () => c.abort(); }, [revision]);
  useEffect(() => { onHeader?.(<SectionTabs labels={TABS} value={view} onChange={setView} label="Ajustes"/>); }, [onHeader, view]);
  useEffect(() => () => onHeader?.(null), [onHeader]);
  return <div id="s-ajustes" className="ea-screen">
    {!onHeader && <header className="ea-local"><h1>Ajustes</h1><p>Tu cuenta, plantillas, avisos y seguridad del consultorio</p><SectionTabs labels={TABS} value={view} onChange={setView} label="Ajustes"/></header>}
    {error && <p role="alert">{error} <button type="button" className="chip" onClick={() => setRevision(r => r + 1)}>Reintentar</button></p>}
    <div role="tabpanel" aria-label={TABS[view]} className="ea-settings-v29">
      {view === 0 ? <AjustesCuenta marca={data?.settings.brand ?? null} cargando={!data && !error} tema={tema} onEditar={() => setDialogo('marca')} onExportar={() => setDialogo('exportar')} onOpen={onOpen}/>
        : view === 1 ? <AjustesPlantillas/>
        : view === 2 ? <AjustesAvisos irAIntegraciones={() => setView(4)}/>
        : view === 3 ? <AjustesSeguridad onOpen={onOpen} onSecurity={onSecurity}/>
        : <AjustesIntegraciones onOpen={onOpen}/>}
    </div>
    {dialogo === 'marca' && <SettingsDialog title="Marca y referencias" onClose={() => { if (canLeaveWorkspace()) setDialogo(null); }}><NutritionSettingsPanel onChanged={setData}/></SettingsDialog>}
    {dialogo === 'exportar' && <SettingsDialog title="Descargar mis datos" onClose={() => setDialogo(null)}><ConfigurationReports onOpen={onOpen}/></SettingsDialog>}
  </div>;
}
