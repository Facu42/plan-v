/** Recorridos de Pacientes con /browse, sólo demostración local. */
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const binary=process.env.BROWSE_BIN;if(!binary)throw Error('Indicá BROWSE_BIN.');
const base=process.env.PANEL_QA_URL||'http://127.0.0.1:5173';if(!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Solo demostración local.');
const output=resolve('design/panel-nutri/fase-3');mkdirSync(output,{recursive:true});
const env={...process.env,BROWSE_PARENT_PID:'0'};
const browse=(...args)=>execFileSync(binary,args,{env,encoding:'utf8',windowsHide:true,timeout:30000}).trim();
const js=source=>browse('js',source), checks=[],measurements=[];
const check=(source,name)=>{const value=js(source);if(value!=='true')throw Error(`${name}: ${value}`);checks.push(name);};
const settle=()=>js('Promise.all(document.getAnimations().map(a=>a.finished.catch(()=>{}))).then(()=>true)');
const row=id=>`.pn-patient-row[aria-label="Ver resumen de ${id}"]`;
const open=name=>{browse('click',`button[aria-label="Desplegar resumen de ${name}"]`);browse('wait','.pn-open .pn-preview-links');settle();};
const theme=value=>{browse('click','button[aria-label="Opciones de la cuenta"]');browse('click',`.nv-user-menu input[value="${value}"]`);browse('click','button[aria-label="Opciones de la cuenta"]');settle();};
const capture=name=>{settle();browse('screenshot','--viewport',resolve(output,`${name}.png`));};
const patients=()=>{browse('click','.pn-nav-row>a[href="/crm/pacientes"]');browse('wait','button[aria-label="Desplegar resumen de Sofía R."]');settle();};
browse('goto',`${base}/crm/pacientes`);if(js('Boolean(document.querySelector(".pn-panel"))')!=='true')browse('click','text=Continuar en modo demo');
browse('wait','button[aria-label="Desplegar resumen de Sofía R."]');
browse('viewport','1440x900');browse('console','--clear');browse('network','--clear');settle();
check('document.querySelector(".pn-col-plan").textContent==="Plan"&&document.querySelector(".pn-patient-row .pn-col-plan").textContent.includes("Publicado")','Plan visible sin abrir la ficha');
for(const name of ['Sofía R.','Marina C.']){open(name);check('document.querySelectorAll(".pn-open").length===1&&document.querySelectorAll(".pn-open .pn-preview-links a").length===14','Una fila abierta con 14 destinos: '+name);}
browse('press','Escape');settle();check('document.querySelectorAll(".pn-open").length===0&&document.activeElement.getAttribute("aria-label")==="Ver resumen de Marina C."','Escape cierra y devuelve foco a su fila');
browse('press','Enter');browse('wait','.pn-open .pn-preview-links');check('document.querySelectorAll(".pn-open").length===1','Enter vuelve a abrir desde la fila');browse('press','Escape');
browse('fill','input[aria-label="Buscar pacientes"]','sofia');check('document.querySelectorAll(".pn-patient-row").length===1','Búsqueda ignora acentos');browse('click','input[aria-label="Buscar pacientes"]');browse('press','Control+a');browse('press','Backspace');
browse('click','.nv-directory-filters button:nth-child(3)');check('document.querySelectorAll(".pn-patient-row").length===2','Necesitan atención conserva regla de revisión semanal');
browse('click','.nv-directory-filters button:nth-child(4)');check('document.querySelectorAll(".pn-patient-row").length===0&&document.body.textContent.includes("Sin coincidencias")','Acceso pendiente muestra vacío real');browse('click','.nv-directory-filters button:first-child');
browse('click','button:text-is("Nuevo paciente")');browse('wait','[role="dialog"]');check('Boolean(document.querySelector("#nv-create-title"))','Alta real disponible');browse('click','button:text-is("Cancelar")');
browse('click','button:text-is("Importar pacientes")');browse('wait','button[aria-label="Cerrar importación"]');check('Boolean(document.querySelector(".pi-dialog"))','Importación real disponible');browse('click','button[aria-label="Cerrar importación"]');
browse('click','summary[aria-label="Más opciones de Sofía R."]');check('document.querySelector(".pn-row-options[open]").textContent.includes("Editar")','Más opciones conserva edición');browse('click','button[aria-label="Editar ficha de Sofía R."]');browse('wait','[role="dialog"]');browse('click','button:text-is("Cancelar")');
// Archivo/restauración reales en memoria local. Siempre restaurar la fixture.
try{
  open('Sofía R.');
  browse('click','summary[aria-label="Más opciones de Sofía R."]');browse('click','button[aria-label="Archivar Sofía R."]');browse('click','button[aria-label="Confirmar archivo de Sofía R."]');browse('wait','.pn-open .pn-preview-archived');check('document.querySelectorAll(".pn-open .pn-preview-links a").length===0','Archivar oculta inmediatamente el resumen abierto');
  browse('click','.nv-directory-filters button:nth-child(5)');check('document.querySelectorAll(".pn-patient-row").length===1','Archivadas contiene la ficha recién archivada');
  browse('click','button[aria-label="Desplegar resumen de Sofía R."]');browse('wait','.pn-preview-archived');check('document.querySelectorAll(".pn-open .pn-preview-links a").length===0','Archivada no expone accesos clínicos');
  browse('click','summary[aria-label="Más opciones de Sofía R."]');browse('click','button[aria-label="Restaurar Sofía R."]');browse('wait','.nv-state');browse('click','.nv-directory-filters button:first-child');
}finally{js('fetch("/api/patients/pat-sofia/archive",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({archived:false})}).then(r=>r.status)');}
patients();open('Sofía R.');
check('Math.abs(new DOMMatrix(getComputedStyle(document.querySelector(".pn-selected .pn-row-arrow")).transform).b)>0.9','La flecha gira al abrir la fila');
check('document.querySelector(".pn-open").textContent.includes("66,3 kg")','Peso autorizado reaparece después de restaurar');
browse('click','.pn-open .pn-preview-links a[href$="seccion=alimentario"]');browse('wait','.pw-record');check('new URLSearchParams(location.search).get("paciente")==="pat-sofia"&&new URLSearchParams(location.search).get("seccion")==="alimentario"','Destino abre registro alimentario de esa paciente');patients();
// Un fallo de red local debe ofrecer reintento, sin dejar datos de otra paciente.
js('window.__pnFetch=window.fetch;window.fetch=(...args)=>String(args[0]).includes("/preview")?Promise.resolve(new Response("Fallo de prueba",{status:503})):window.__pnFetch(...args);true');
browse('click','button[aria-label="Desplegar resumen de Marina C."]');browse('wait','.pn-open [role="alert"]');check('document.querySelector(".pn-open").textContent.includes("Reintentar resumen")&&!document.querySelector(".pn-open").textContent.includes("66,3 kg")','Error visible sin mostrar datos de otra paciente');
js('window.fetch=window.__pnFetch;delete window.__pnFetch;true');browse('click','button:text-is("Reintentar resumen")');browse('wait','.pn-open .pn-preview-links');checks.push('Reintento recupera el resumen');browse('press','Escape');
for(const value of ['light','dark']){
 browse('viewport','1440x900');theme(value);
 for(const size of ['1440x900','390x844','1280x800']){
  browse('viewport',size);settle();
  const m=JSON.parse(js('JSON.stringify({width:innerWidth,pageWidth:document.documentElement.scrollWidth,table:document.querySelector(".pn-patients-table").getBoundingClientRect().toJSON()})'));
  if(m.pageWidth>m.width+1)throw Error(`Desborde ${value} ${size}`);measurements.push({theme:value,...m});
  if(size!=='1280x800')capture(`pacientes-${value}-${m.width}`);
 }
 browse('viewport','1440x900');open('Sofía R.');capture(`resumen-${value}-1440`);
 browse('viewport','390x844');settle();capture(`resumen-${value}-390`);check('document.documentElement.scrollWidth<=innerWidth+1','Resumen sin desborde móvil '+value);browse('press','Escape');
}
browse('viewport','390x844');browse('click','.nv-directory-columns>summary');browse('click','.nv-directory-columns fieldset:first-child label:first-of-type input');settle();check('document.documentElement.scrollWidth<=innerWidth+1','Ocultar próxima consulta mantiene tabla móvil sin desborde');browse('click','.nv-directory-columns fieldset:first-child label:first-of-type input');browse('click','.nv-directory-columns>summary');
const consoleErrors=browse('console','--errors');const failed=browse('network').split('\n').filter(line=>/→ [45]\d\d/.test(line));
if(failed.some(line=>!line.includes('/consultations/completions?')||!line.includes('→ 403'))||consoleErrors.split('\n').filter(line=>line.includes('[error]')).some(line=>!line.includes('status of 403')))throw Error('Error inesperado en consola o red');
writeFileSync(resolve(output,'resultados.json'),JSON.stringify({date:new Date().toISOString(),checks,measurements,consoleErrors,failed},null,2));
console.log(`${checks.length} comprobaciones y ${measurements.length} combinaciones aprobadas. Revisar fallos esperados del ensayo de red y permisos demo.`);
