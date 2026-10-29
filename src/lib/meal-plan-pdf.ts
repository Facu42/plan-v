import { planPrintHtml,type PlanPrintCopy } from '../components/nutrigo/PlanPrintDocument';
import { analyzePlanDay,type DayAnalysisLine } from '../types/plan-day-analysis';
import { eachIsoDate } from '../types/plans';
import { buildClinicalPdf } from './clinical-pdf';

/** Extrae sólo texto del HTML escapado que prepara la vista previa de la misma copia. */
export function planPdfLines(copy:PlanPrintCopy):string[] {
  const body=planPrintHtml(copy).split('<body>')[1].split('</body>')[0];
  return body.replace(/<section[^>]*data-week-break="true"[^>]*>/g,'\n__WEEK_BREAK__\n')
    .replace(/<svg\b[\s\S]*?<\/svg>/g,'')
    .replace(/<\/(?:h[1-6]|p|li|section|article|header|footer|div|ul|ol)>|<br\s*\/?\s*>/g,'\n')
    .replace(/<[^>]*>/g,'')
    // Decodificar una vez, después de retirar etiquetas: texto del usuario nunca es marcado.
    .replace(/&(?:amp|lt|gt|quot|apos|#39|#x27);/g,entity=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&#x27;':"'"}[entity]??entity))
    .split('\n').map(line=>line.trim()).filter(Boolean);
}
export async function buildPlanPdf(copy:PlanPrintCopy,options:{fontBytes?:Uint8Array}={}) {
  const points=eachIsoDate(copy.version.period_start,copy.version.period_end).flatMap(date=>{
    const lines=copy.version.items.filter(item=>item.for_date===date).flatMap<DayAnalysisLine>(item=>item.components?item.components.map(component=>({portions:'',component})):[{portions:String(item.portions??''),recipe:item.recipe,proposal:item.recipe_proposal??undefined}]);
    const day=analyzePlanDay(lines),kcal=day.nutrients.find(n=>n.key==='kcal');
    return kcal?.total==null?[]:[{date,value:kcal.total}];
  });
  const sections: {title:string;lines:string[];pageBreak?:boolean}[] = [{title:'Copia seleccionada del plan',lines:[]}];
  for (const line of planPdfLines(copy)) {
    if (line === '__WEEK_BREAK__') sections.push({title:'Continuación del plan',lines:[],pageBreak:true});
    else sections[sections.length-1].lines.push(line);
  }
  const fontBytes=options.fontBytes??new Uint8Array(await(await fetch('/clinical-pdf/Inter-Regular.ttf')).arrayBuffer());
  const brand=copy.options?.logo === false ? undefined : copy.brand;
  return buildClinicalPdf({title:`Plan de alimentación · v${copy.version.version}`,patientName:copy.patientName,brand:{name:brand?.name||'Nutridash',contact:brand?.contact||'',logo:brand?.logo||null,license:''},sections,charts:points.length?[{title:'Energía de los días con composición completa (incluye estimaciones declaradas)',unit:'kcal',points}]:[],fontBytes,monochrome:copy.options?.logo === false});
}
