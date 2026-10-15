import { useEffect, useState } from 'react';
import { request } from '../../api/client';
import type { ClinicSettings } from '../../types/communications';
import type { PortfolioIndicators } from '../../types/portfolio';
import { friendlyError } from '../../lib/error-messages';
import { indicatorsCsv } from '../../lib/portfolio-csv';
import { NvButton,NvCard } from './primitives';
export function ConfigurationReports({onOpen}:{onOpen:(href:string)=>void}) {
 const [days,setDays]=useState<7|30|90>(30),[status,setStatus]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false),[loaded,setLoaded]=useState(false);
 useEffect(()=>{const control=new AbortController();request<{settings:ClinicSettings}>('/api/portfolio/settings',{signal:control.signal}).then(data=>{setDays(data.settings.default_days);setLoaded(true);}).catch(e=>{if(!control.signal.aborted)setError(friendlyError(e));});return()=>control.abort();},[]);
 async function save(){setBusy(true);setError('');try{await request('/api/portfolio/settings',{method:'PUT',body:JSON.stringify({default_days:days})});setStatus('Período predeterminado guardado.');}catch(e){setError(friendlyError(e));}finally{setBusy(false);}}
 async function download(){setBusy(true);setError('');try{const data=await request<PortfolioIndicators>(`/api/portfolio/indicators?days=${days}`);const url=URL.createObjectURL(new Blob([indicatorsCsv(data)],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='indicadores-cartera.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus(`Exportación preparada: ${data.patient_count} pacientes, ${data.days} días.`);}catch(e){setError(friendlyError(e));}finally{setBusy(false);}}
 return <NvCard title="Configuración y reportes" className="care-panel ops-panel"><p>Guardá el período preferido para los indicadores y descargá registros, pendientes y comparación entre períodos. Una exportación contiene datos de pacientes: guardala en un lugar privado.</p><label>Período predeterminado<select disabled={busy||!loaded} value={days} onChange={e=>setDays(Number(e.target.value) as 7|30|90)}>{[7,30,90].map(d=><option key={d} value={d}>{d} días</option>)}</select></label><div className="care-actions"><NvButton disabled={busy||!loaded} onClick={()=>void save()}>Guardar período</NvButton><NvButton disabled={busy} onClick={()=>void download()}>Descargar indicadores</NvButton><NvButton className="nv-soft" onClick={()=>onOpen('/crm/desarrollo?modulo=comunicaciones')}>Preferencias y difusiones</NvButton></div>{status&&<p role="status">{status}</p>}{error&&<p role="alert">{error}</p>}</NvCard>;
}
