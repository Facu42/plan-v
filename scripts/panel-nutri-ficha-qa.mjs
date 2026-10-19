/** QA reproducible de ficha, sólo demo local; /browse maneja el navegador. */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const binary=process.env.BROWSE_BIN;if(!binary)throw Error('Indicá BROWSE_BIN.');
const base=process.env.PANEL_QA_URL||'http://127.0.0.1:5173';if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Sólo demo local.');
const out=resolve('design/panel-nutri/fase-4');mkdirSync(out,{recursive:true});
const env={...process.env,BROWSE_PARENT_PID:'0'},checks=[],measurements=[];
const B=(...args)=>execFileSync(binary,args,{env,encoding:'utf8',windowsHide:true,timeout:30000}).trim(),js=source=>B('js',source);
const check=(source,label)=>{if(js(source)!=='true')throw Error(label);checks.push(label);};
const settle=()=>js('Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))).then(()=>true)');
const open=section=>{B('goto',base+`/crm/ficha?paciente=pat-sofia&seccion=${section}`);B('wait','.pn-record, button:has-text("Continuar en modo demo")');if(js('Boolean(document.querySelector(".pn-record"))')!=='true'&&js('document.body.innerText.includes("Continuar en modo demo")')==='true')B('click','text=Continuar en modo demo');B('wait','.pw-record-content');settle();};
const theme=value=>{B('click','button[aria-label="Opciones de la cuenta"]');B('click',`.nv-user-menu input[value="${value}"]`);B('press','Escape');settle();};
open('resumen');B('console','--clear');B('network','--clear');
const sections=['resumen','historia','evolucion','notas','plan','alimentario','laboratorio','archivos','consultas','cobros','chat'];
const expected={resumen:'.pn-record-overview',historia:'.pn-record-history-grid',evolucion:'.pn-record-evolution',notas:'.pn-record-notes',plan:'.pn-record-plan',alimentario:'.pn-record-diary',laboratorio:'.pn-record-laboratory',archivos:'.pn-record-files',consultas:'.pn-record-consultations',cobros:'.pn-record-billing',chat:'.pn-record-chat'};
for(const value of ['light','dark']){
 B('viewport','1440x900');theme(value);
 for(const size of ['1440x900','390x844']){
  B('viewport',size);
  for(const section of sections){console.log(value,size,section);open(section);B('wait',expected[section]);settle();const m=JSON.parse(js('JSON.stringify({width:innerWidth,pageWidth:document.documentElement.scrollWidth,tabs:document.querySelectorAll(".pw-tabs>button").length,active:document.querySelector(".pw-tabs [aria-current]")?.textContent,activeVisible:(()=>{const a=document.querySelector(".pw-tabs [aria-current]").getBoundingClientRect(),n=document.querySelector(".pw-tabs").getBoundingClientRect();return a.left>=n.left-1&&a.right<=n.right+1})()})'));if(m.pageWidth>m.width+1)throw Error(`Desborde ${section} ${value} ${size}: ${m.pageWidth}`);if(m.tabs!==11)throw Error('No hay once pestañas');if(!m.activeVisible)throw Error('Pestaña activa oculta: '+section);measurements.push({section,theme:value,...m});B('screenshot','--viewport',resolve(out,`${section}-${value}-${m.width}.png`));}
 }
}
for(const section of ['ingreso','registros','mensajes','semanal','planificacion','compras']){open(section);check('Boolean(document.querySelector(".pw-tabs [aria-current]"))',`Alias y subpestaña conservada: ${section}`);}
open('plan');B('click','button:has-text("Abrir en el editor")');B('wait','.meal-plan-form');check('Array.from(document.querySelectorAll("input")).some(e=>e.getAttribute("aria-label")==="Hora de Desayuno")','Editor completo conserva horarios');B('click','button:has-text("Volver al plan actual")');B('wait','.pn-record-plan-date');
open('alimentario');B('click','button:has-text("Mes")');B('wait','.pn-record-diary table tbody tr:first-child');check('document.querySelector(".pn-record-diary button[aria-pressed=true]").textContent==="Mes"','Filtro mensual activo');B('select','.pn-record-diary-tools select','pending_review');check('document.querySelector(".pn-record-diary-tools select").value==="pending_review"','Filtro de pendientes activo');
open('evolucion');B('click','summary:has-text("Registros compartidos por revisar")');B('wait','.care-panel');check('document.querySelector(".care-panel").textContent.includes("Registros y seguimiento")','Revisión de registros sigue disponible');
open('chat');check('!document.querySelector(".pn-record-chat .nm-contacts")&&Boolean(document.querySelector("#nm-message"))','Chat de ficha conserva compositor sin lista duplicada');
B('viewport','390x844');open('chat');check('(()=>{const a=document.querySelector(".nm-compose").getBoundingClientRect(),b=document.querySelector(".pn-record-chat").getBoundingClientRect();return a.bottom<=b.bottom+1&&a.top>=b.top})()','Compositor dentro del chat móvil');check('document.querySelector(".nm-thread").clientHeight>80&&Boolean(document.querySelector(".nm-bubble"))','Hilo móvil tiene altura útil y mensajes visibles');B('click','button[aria-label="Mostrar perfil"]');B('wait','dialog[open]');B('click','button[aria-label="Cerrar perfil"]');check('!document.querySelector("dialog[open]")','Perfil móvil abre y cierra con diálogo accesible');
B('viewport','1440x900');open('resumen');
writeFileSync(resolve(out,'resultados.json'),JSON.stringify({date:new Date().toISOString(),checks,measurements},null,2));
console.log(`${checks.length} comprobaciones y ${measurements.length} pantallas/tamaños/temas aprobados.`);
