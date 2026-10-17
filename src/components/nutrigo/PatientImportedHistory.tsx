import { useEffect,useState } from 'react';
import { patientImportApi } from '../../api/patient-import';
import { careErrorMessage } from '../../api/care';
import type { ImportedHistory } from '../../types/patient-import';
import type {ImportedMeasurement} from '../../types/import-authorization';
import {ImportAuthorizationControl} from './ImportAuthorizationControl';
import {ImportHistoryPdfExport} from './ImportHistoryPdfExport';
import { NvButton } from './primitives';
import './patient-import.css';
export function PatientImportedHistory({patientId}:{patientId:string}){
  const [items,setItems]=useState<ImportedHistory[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [reload,setReload]=useState(0);
  const [measurements,setMeasurements]=useState<ImportedMeasurement[]>([]);
  useEffect(()=>{const controller=new AbortController();setLoading(true);setItems([]);setMeasurements([]);setError('');patientImportApi.history(patientId,controller.signal).then(data=>{if(!controller.signal.aborted){setItems(data.history);setMeasurements(data.measurements??[]);}}).catch(caught=>{if(!controller.signal.aborted)setError(careErrorMessage(caught));}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[patientId,reload]);
  return <section className="pi-history" aria-label="Historia importada"><h3>Historia importada</h3><ImportAuthorizationControl key={patientId} patientId={patientId} required={['history','study','plan','measurement']} onChanged={()=>setReload(n=>n+1)}/>{loading?<p role="status">Cargando registros importados…</p>:error?<><p role="alert">{error}</p><NvButton className="nv-ghost" onClick={()=>setReload(n=>n+1)}>Reintentar</NvButton></>:!items.length&&!measurements.length?<p>Sin antecedentes, estudios, planes o medidas históricas disponibles.</p>:<><ImportHistoryPdfExport key={patientId} patientId={patientId}/>{items.map(item=><article key={item.id}><h4>{item.category==='plan'?'Plan histórico · privado, sin publicar':item.category==='study'?'Estudio':'Antecedentes'}</h4><small>{item.origin.file} · {item.origin.sheet?`${item.origin.sheet} · `:''}{item.origin.page?`Página ${item.origin.page} · `:''}{item.origin.row?`Fila ${item.origin.row} · `:''}{new Date(item.created_at).toLocaleDateString('es-AR')}</small><p>{item.body}</p></article>)}{measurements.map(item=><article key={item.id}><h4>{item.kind==='weight'?'Peso':item.kind==='waist'?'Cintura':'Cadera'} histórico · {item.value} {item.unit}</h4><p>{item.recorded_on} · {item.origin.file}{item.origin.row?` · Fila ${item.origin.row}`:''}{item.origin.page?` · Página ${item.origin.page}`:''}</p><p className="pi-hint">Dato original importado; no reemplaza las mediciones actuales.</p></article>)}</>}</section>;
}
