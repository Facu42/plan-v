/** Permisos y acciones privadas de ficha en demo local, mediante /browse. */
import {execFileSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
const binary=process.env.BROWSE_BIN,base=process.env.PANEL_QA_URL||'http://127.0.0.1:5173';if(!binary||!['127.0.0.1','localhost'].includes(new URL(base).hostname))throw Error('Sólo demo local con BROWSE_BIN.');
const env={...process.env,BROWSE_PARENT_PID:'0'},checks=[];
const B=(...args)=>execFileSync(binary,args,{env,encoding:'utf8',windowsHide:true,timeout:30000}).trim(),js=source=>B('js',source);
const check=(source,label)=>{if(js(source)!=='true')throw Error(label);checks.push(label);};
const open=section=>{B('goto',base+`/crm/ficha?paciente=pat-sofia&seccion=${section}`);B('wait','.pn-record, button:has-text("Continuar en modo demo")');if(js('document.body.innerText.includes("Continuar en modo demo")')==='true')B('click','text=Continuar en modo demo');B('wait','.pw-record-content');};
const consent=(purpose,decision)=>js(`fetch('/api/consents/catalog').then(r=>r.json()).then(async v=>{const c=v.consents.find(c=>c.purpose===${JSON.stringify(purpose)});const r=await fetch('/api/patients/pat-sofia/consents',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({purpose:c.purpose,text_version:c.text_version,text_hash:c.text_hash,decision:${JSON.stringify(decision)}})});if(!r.ok)throw Error('Permiso de prueba rechazado');window.dispatchEvent(new Event('plan-v:care-changed'));return true;})`);
B('viewport','1440x900');open('archivos');
const initial=JSON.parse(js('fetch("/api/patients/pat-sofia/care?audience=pro").then(r=>r.json()).then(v=>JSON.stringify({source:v.source,consented:v.consented}))'));if(initial.source!=='memory')throw Error('Se requiere la demo en memoria.');const original=initial.consented;
try{
 consent('care_relationship','granted');consent('clinical_document','granted');
 B('wait','.pn-record-dropzone input:not(:disabled)');
 mkdirSync('.gstack',{recursive:true});const fixture=resolve('.gstack/archivo-fase-4.png');writeFileSync(fixture,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jCkcAAAAASUVORK5CYII=','base64'));
 B('upload','.pn-record-dropzone input',fixture);B('click','button:has-text("Guardar archivo privado")');B('wait','.pn-record-files tbody tr:first-child');
 check('document.querySelector(".pn-record-files tbody").textContent.includes("archivo-fase-4.png")','Carga privada confirmada y listada');
 B('click','.pn-record-files tbody tr:first-child button:last-child');B('wait','dialog[open] .pn-record-file-view');check('Promise.all(Array.from(document.querySelectorAll("dialog[open] img")).map(img=>img.decode())).then(()=>document.querySelector("dialog[open] img").naturalWidth===1)','Visor privado decodifica la imagen real de prueba');
 B('screenshot','--viewport',resolve('design/panel-nutri/fase-4/archivo-visor-1440.png'));
 consent('care_relationship','withdrawn');B('wait','.pn-record-dropzone input:disabled');check('!document.querySelector(".pn-record-file-view")&&!document.querySelector(".pn-record-files tbody").textContent.includes("archivo-fase-4.png")','Retirar Atención cierra visor y elimina fuente del consultorio');
 consent('care_relationship','granted');B('wait','.pn-record-files tbody tr:first-child');
 js('window.__recordFetch=window.fetch;window.fetch=(...args)=>{const p=String(args[0]);return window.__recordFetch(...args).then(response=>p.includes("/clinical-workspace/documents/")?new Promise(resolve=>{window.__releaseRecord=()=>resolve(response)}):response)};true');
 B('click','.pn-record-files tbody tr:first-child button:last-child');
 check('Boolean(window.__releaseRecord)','La apertura puede quedar en vuelo antes del retiro');
 consent('care_relationship','withdrawn');B('wait','.pn-record-dropzone input:disabled');js('window.__releaseRecord();window.fetch=window.__recordFetch;delete window.__recordFetch;delete window.__releaseRecord;true');
 check('!document.querySelector(".pn-record-file-view")','Una respuesta anterior al retiro no reabre el visor');
 consent('care_relationship','granted');
 js(`fetch('/api/patients/pat-sofia/clinical-workspace').then(r=>r.json()).then(async snapshot=>{const doc=snapshot.documents.find(d=>d.filename==='archivo-fase-4.png');if(!doc)throw Error('Falta fixture');for(let i=0;i<3;i++){const date=new Date(Date.now()-i*86400000).toLocaleDateString('en-CA',{timeZone:'America/Argentina/Buenos_Aires'});const value=12-i*2;const r=await fetch('/api/patients/pat-sofia/clinical-workspace/records',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:crypto.randomUUID(),recorded_on:date,reviewed:true,note:'Fixture ficticia de QA local',data:{kind:'laboratory',document_id:doc.id,values:[{id:crypto.randomUUID(),name:'Valor ficticio local',value,operator:'',unit:'u',range_text:'4–14 (fixture)',raw_value:String(value),source_line:'Valor ficticio de la prueba local',page:1,reviewed:true}]}})});if(!r.ok)throw Error('No se guardó fixture');}return true;})`);
 open('laboratorio');B('wait','.pn-record-laboratory tbody tr:first-child');check('document.querySelectorAll(".pn-record-laboratory thead th").length===6','Laboratorio compara tres fechas con rango original');B('screenshot','--viewport',resolve('design/panel-nutri/fase-4/laboratorio-datos-1440.png'));consent('care_relationship','withdrawn');B('wait','text=Permisos de atención y estudios pendientes.');check('!document.querySelector(".pn-record-laboratory tbody")','Retirar Atención limpia la comparación de laboratorio');consent('care_relationship','granted');
 open('notas');B('click','button:has-text("Nueva nota manual")');B('wait','label:has-text("Notas y resumen privado") textarea');B('fill','label:has-text("Notas y resumen privado") textarea','Nota privada ficticia para verificar la ficha.');B('click','button:has-text("Guardar notas")');B('wait','text=Notas guardadas.');
 B('fill','label:has-text("Versión para compartir con la paciente") textarea','Resumen ficticio revisado del recorrido local.');B('click','button:has-text("Publicar resumen revisado")');B('wait','.pn-note-shared');check('document.querySelector(".pn-note-shared").textContent.includes("Resumen ficticio revisado")','Nota manual guardada y resumen revisado publicado');
 B('screenshot','--viewport',resolve('design/panel-nutri/fase-4/notas-manual-1440.png'));B('click','label:has-text("Versión para compartir con la paciente") textarea');B('press','Control+a');B('press','Backspace');
 open('archivos');B('click','button:has-text("Exportar ficha en PDF")');B('wait','.cw-workspace');check('document.querySelector(".cw-workspace").textContent.includes("Descargar ficha PDF")','Exportación PDF existente accesible desde Archivos');
}finally{
 try{js('if(window.__recordFetch)window.fetch=window.__recordFetch;if(window.__releaseRecord)window.__releaseRecord();true');}catch{}
 for(const purpose of ['care_relationship','clinical_document'])try{consent(purpose,original.includes(purpose)?'granted':'withdrawn');}catch{}
}
writeFileSync(resolve('design/panel-nutri/fase-4/acciones-privadas.json'),JSON.stringify({date:new Date().toISOString(),checks},null,2));
console.log(`${checks.length} acciones privadas aprobadas; permisos originales restaurados.`);
