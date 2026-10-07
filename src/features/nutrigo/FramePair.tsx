import { useEffect, useState, type ReactNode } from 'react';
import { SourceView, nodeName, sourceText, renderSource, type SourceNode, type SourceResolver } from './SourceView';
import { translateSource } from './translation';
import { planVBrandBinding } from './branding';
import { patientNavigation as nav, patientNavBinding } from './patient-navigation';
import type { ShowroomPage } from '../../components/nutrigo/ShowroomPanels';
import { FigmaRecordDialog } from '../../components/nutrigo/FigmaPatientFront';
import { feeBannerBinding, useFeeNotice } from './fee-notice';
import './nutrigo.generated.css';

const frames = import.meta.glob<{default:SourceNode}>('./source/*.json');
export function FramePair({ nodes, resolve, patientName, onNavigate, onSignOut, children, onSearch, query = '', unread = 0 }: {
  nodes: [string,string]; resolve:SourceResolver; patientName:string; onNavigate:(page:ShowroomPage)=>void; onSignOut?:()=>void; children?:ReactNode; onSearch?:(query:string)=>void; query?:string; unread?:number;
}) {
  const [mobile,setMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 799px)').matches);
  const [source,setSource] = useState<SourceNode|null>(null);
  const [loadError,setLoadError] = useState(false);
  const [menu,setMenu] = useState(false);
  const [attempt,setAttempt] = useState(0);
  const feeNotice = useFeeNotice();
  useEffect(() => { const media = window.matchMedia('(max-width: 799px)'); const update=()=>setMobile(media.matches); media.addEventListener('change',update); return ()=>media.removeEventListener('change',update); },[]);
  const id = nodes[mobile ? 1 : 0];
  useEffect(() => { let active=true; setSource(null);setLoadError(false); const load=frames[`./source/${id.replace(':','-')}.json`]; if (!load) {setLoadError(true);return;} load().then(module=>{if(active)setSource(module.default);}).catch(()=>{if(active)setLoadError(true);});return()=>{active=false;}; },[id,attempt]);
  const common:SourceResolver = node => {
    const brand=planVBrandBinding(node);if(brand)return brand;
    const specific=resolve(node);if(specific)return specific;
    const navigation=patientNavBinding(node,onNavigate,unread);if(navigation)return navigation;
    const name=nodeName(node), text=sourceText(node);
    if(name==='Button Nav') {
      if(!text)return {onClick:()=>setMenu(true),label:'Abrir menú'};
      if(text==='Logout')return onSignOut ? {onClick:onSignOut,label:'Salir'} : {hidden:true};
    }
    if(name==='User Profile')return {onClick:()=>onNavigate('ficha'),label:'Mi ficha',children:node.children.map((child,i)=>renderSource(child,n=>{
      if(n.tag==='p'&&/Adam|Wingman/.test(sourceText(n)))return {text:patientName};return undefined;
    },translateSource,i))};
    if(node.tag==='p'&&/^Hello,/.test(text))return {text:`Hola, ${patientName.split(' ')[0] || 'bienvenida'} 👋`};
    if(node.tag==='p'&&text==='Privacy Policy')return {tag:'a',text:'Privacidad',props:{href:'/legal/privacidad.html',target:'_blank',rel:'noreferrer'}};
    if(node.tag==='p'&&text==='Term and conditions')return {tag:'a',text:'Términos y condiciones',props:{href:'/legal/terminos.html',target:'_blank',rel:'noreferrer'}};
    if(node.tag==='p'&&text==='Contact')return {onClick:()=>onNavigate('mensajes'),text:'Contacto'};
    const fee=feeBannerBinding(node,feeNotice,onNavigate);if(fee)return fee;
    if(name==='Button'&&text==='Claim Now!')return {onClick:()=>onNavigate('plan'),label:'Ver mi plan'};
    if(name==='Social Media')return {props:{'aria-hidden':true}};
    if(node.tag==='p'&&/Adam Vasylenko/.test(text))return {text:patientName};
    if(node.tag==='p'&&/Search (anything|placeholder|articles|food|recipes)/.test(text))return onSearch?{tag:'input',props:{type:'search',value:query,placeholder:translateSource(text),'aria-label':'Buscar',onChange:(event:{target:{value:string}})=>onSearch(event.target.value)}}:{onClick:()=>onNavigate('recetas'),label:'Buscar recetas',text:'Buscar recetas'};
    // Source icon-only menu controls gain an explicit, reversible action.
    if((name==='Button Icon'||name==='Button More')&&!text)return {onClick:()=>setMenu(true),label:'Abrir acciones'};
    return undefined;
  };
  return <div className="mcp-nutrigo" data-figma-frame={id}>
    {loadError?<div className="mcp-state" role="alert"><p>No se pudo cargar esta pantalla.</p><button onClick={()=>setAttempt(v=>v+1)}>Reintentar</button></div>:source?<SourceView source={source} resolve={common} translate={translateSource}/>:<p className="mcp-state" role="status">Cargando pantalla…</p>}
    {children}
    {menu&&<FigmaRecordDialog title="Plan V" onClose={()=>setMenu(false)}><nav aria-label="Navegación">{Object.entries(nav).map(([label,page])=><button className="mcp-action" key={page} onClick={()=>{setMenu(false);onNavigate(page);}}>{translateSource(label)}</button>)}<button className="mcp-action" onClick={()=>{setMenu(false);onNavigate('pagos');}}>Pagos{feeNotice&&<small className="mcp-action-note">{feeNotice}</small>}</button><button className="mcp-action" onClick={()=>{setMenu(false);onNavigate('ficha');}}>Mi ficha y permisos</button>{onSignOut&&<button onClick={onSignOut}>Salir</button>}</nav></FigmaRecordDialog>}
  </div>;
}
