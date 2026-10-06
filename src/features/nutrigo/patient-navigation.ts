import type { ShowroomPage } from '../../components/nutrigo/ShowroomPanels';
import { nodeName, renderSource, sourceText, type SourceNode, type SourceBinding } from './SourceView';
import { translateSource } from './translation';

export const patientNavigation: Record<string,ShowroomPage> = {
  Dashboard:'inicio',Calendar:'agenda',Messages:'mensajes','Healthy Menu':'recetas',
  'Meal Plan':'plan','Grocery List':'compras','Food Diary':'diario',Progress:'progreso',
  Exercises:'ejercicio','Health Insights':'recursos',
};

export function patientNavBinding(node:SourceNode,onNavigate:(page:ShowroomPage)=>void,unread:number):SourceBinding|undefined {
  const name=nodeName(node),text=sourceText(node);
  if(name==='Button Nav'&&node.children.some(child=>typeof child==='object'&&nodeName(child)==='SubMenu'))
    return {tag:'div',props:{role:'group','aria-label':'Plan y compras'}};
  if(!['Button Nav','Menu','SubMenu'].includes(name))return undefined;
  const entry=Object.entries(patientNavigation).find(([label])=>text===label||name==='Button Nav'&&text.startsWith(`${label} `));
  if(!entry)return undefined;
  return {
    onClick:()=>onNavigate(entry[1]),label:translateSource(entry[0]),
    children:node.children.map((child,index)=>renderSource(child,current=>
      nodeName(current)==='Badge'&&!unread?{hidden:true}:current.tag==='p'&&sourceText(current)==='6'?{text:unread}:undefined,translateSource,index)),
  };
}
