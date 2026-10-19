import {useEffect,useRef,useState} from 'react';
import {careErrorMessage} from '../../api/care';
import {FigmaRecordDialog} from './FigmaPatientFront';
export type RecordFileView={url:string;filename:string;mime:string};
export function useRecordDocument(scope:string){
 const current=useRef(scope);current.current=scope;
 const serial=useRef(0),[view,setView]=useState<{scope:string;file:RecordFileView}|null>(null),[status,setStatus]=useState<{scope:string;error:string;busy:boolean}>({scope,error:'',busy:false});
 useEffect(()=>{serial.current+=1;setView(null);setStatus({scope,error:'',busy:false});return()=>{serial.current+=1;};},[scope]);
 useEffect(()=>{if(!view)return;const timer=window.setTimeout(()=>setView(null),60000);return()=>window.clearTimeout(timer);},[view]);
 async function open(load:()=>Promise<RecordFileView>){const key=current.current,request=++serial.current;setView(null);setStatus({scope:key,error:'',busy:true});try{const file=await load();if(current.current!==key||request!==serial.current)return;const url=new URL(file.url,window.location.href);if(url.protocol!=='https:'&&!(url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))throw Error('El enlace del archivo no es válido.');setView({scope:key,file:{...file,url:url.href}});}catch(caught){if(current.current===key&&request===serial.current)setStatus({scope:key,error:careErrorMessage(caught),busy:false});}finally{if(current.current===key&&request===serial.current)setStatus(value=>({...value,busy:false}));}}
 return {file:view?.scope===scope?view.file:null,error:status.scope===scope?status.error:'',busy:status.scope===scope&&status.busy,open,close:()=>{serial.current+=1;setView(null);}};
}
export function RecordDocumentViewer({file,onClose}:{file:RecordFileView;onClose:()=>void}){
 return <FigmaRecordDialog title={file.filename} onClose={onClose}><div className="pn-record-file-view">{file.mime.startsWith('image/')?<img src={file.url} alt={file.filename}/>:<object data={file.url} type={file.mime}><p>El visor no pudo abrir este archivo.</p></object>}<a href={file.url} target="_blank" rel="noopener noreferrer">Abrir o descargar {file.filename}</a><small>Enlace privado disponible durante un minuto.</small></div></FigmaRecordDialog>;
}
