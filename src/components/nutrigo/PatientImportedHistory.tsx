import { useEffect,useState } from 'react';
import { patientImportApi } from '../../api/patient-import';
import { careErrorMessage } from '../../api/care';
import type { ImportedHistory } from '../../types/patient-import';
import { NvButton } from './primitives';
import './patient-import.css';
export function PatientImportedHistory({patientId}:{patientId:string}){
  const [items,setItems]=useState<ImportedHistory[]>([]);const [error,setError]=useState('');const [loading,setLoading]=useState(true);const [reload,setReload]=useState(0);
  useEffect(()=>{const controller=new AbortController();setLoading(true);setItems([]);setError('');patientImportApi.history(patientId,controller.signal).then(data=>setItems(data.history)).catch(caught=>{if(!controller.signal.aborted)setError(careErrorMessage(caught));}).finally(()=>{if(!controller.signal.aborted)setLoading(false);});return()=>controller.abort();},[patientId,reload]);
  return <section className="pi-history" aria-label="Historia importada"><h3>Historia importada</h3>{loading?<p role="status">Cargando registros importados…</p>:error?<><p role="alert">{error}</p><NvButton className="nv-ghost" onClick={()=>setReload(n=>n+1)}>Reintentar</NvButton></>:!items.length?<p>Sin antecedentes, estudios o planes históricos importados.</p>:items.map(item=><article key={item.id}><h4>{item.category==='plan'?'Plan histórico · privado, sin publicar':item.category==='study'?'Estudio':'Antecedentes'}</h4><small>{item.origin.file} · {item.origin.sheet?`${item.origin.sheet} · `:''}{item.origin.page?`Página ${item.origin.page} · `:''}{item.origin.row?`Fila ${item.origin.row} · `:''}{new Date(item.created_at).toLocaleDateString('es-AR')}</small><p>{item.body}</p></article>)}</section>;
}
