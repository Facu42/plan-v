import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomUUID, randomBytes } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import pg from 'pg';

// Sólo la pila descartable del runner: sin URLs hospedadas, proveedores ni capturas.
const run = promisify(execFile);
const browse = process.env.PLANV_GSTACK_CLI;
for (const key of ['SUPABASE_URL', 'PLANV_LOCAL_AUTH_DB_URL']) {
  const value = new URL(process.env[key]);
  const protocols=key==='SUPABASE_URL'?['http:']:['postgres:','postgresql:'];
  if(value.search||value.hash||!protocols.includes(value.protocol)||!['127.0.0.1','localhost','[::1]'].includes(value.hostname))throw Error('Entorno de navegador no local');
}
if (process.env.PLANV_LOCAL_SIGNED_AUTH !== '1' || !browse) throw Error('Falta el entorno descartable de navegador');
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const origin = 'http://127.0.0.1:5596'; const apiOrigin = 'http://127.0.0.1:5597';
const env = { ...process.env, PORT:'5597', VITE_API_PROXY:apiOrigin, CORS_ORIGINS:origin,
  PROVISION_SECRET:'local-'+randomBytes(32).toString('hex'),WORKER_SEPARATE:'1',
  BROWSE_STATE_FILE:resolve('.gstack/product-browser-state.json') };
const pool = new pg.Pool({ connectionString:env.PLANV_LOCAL_AUTH_DB_URL });
const admin = createClient(env.SUPABASE_URL,env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let password = 'Local-' + randomBytes(24).toString('base64url') + '-A1!';
const identities=[]; const evidence=[]; let apiProcess; let webProcess; let phase='preparar identidades';let lastAction='preparación';let failedCheck='ninguna';let lastReadStatus=null;
async function identity(label) {
  const email=label.toLowerCase().replaceAll(' ','-')+'-'+randomUUID()+'@example.test';
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:label,legal_version:'2026-09-29',legal_accepted_at:new Date().toISOString()}});
  if(created.error) throw Error('Identidad ficticia no creada');
  const client=createClient(env.SUPABASE_URL,env.SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const signed=await client.auth.signInWithPassword({email,password});
  if(signed.error) throw Error('Sesión ficticia no iniciada');
  const actor={id:created.data.user.id,email,password,client,token:signed.data.session.access_token};identities.push(actor);return actor;
}
async function B(...args) { if(args[0]!=='js')lastAction=args[0]+(['wait','fill','click','select','upload'].includes(args[0])?' '+args[1]:'');return (await run(browse,args,{env,timeout:45000,maxBuffer:2*1024*1024})).stdout.trim(); }
async function until(expression) {
  const deadline=Date.now()+20000;
  while(Date.now()<deadline) { if((await B('js',expression)).includes('true')) return; await new Promise(r=>setTimeout(r,250)); }
  throw Error('No se confirmó el estado de la interfaz');
}
async function button(text) {
  lastAction='botón '+text;
  // Nombre accesible: texto visible o aria-label (los botones de ícono del diseño Nutrigo lo nombran así).
  await until(`(()=>{const e=Array.from(document.querySelectorAll('button')).find(e=>(e.textContent.trim()===${JSON.stringify(text)}||e.getAttribute('aria-label')===${JSON.stringify(text)})&&!e.matches(':disabled')&&e.getClientRects().length);if(!e)return false;e.click();return true;})()`);
}
async function control(selector) {
  lastAction='control '+selector;
  await until(`(()=>{const e=Array.from(document.querySelectorAll(${JSON.stringify(selector)})).find(e=>!e.matches(':disabled')&&e.getClientRects().length);if(!e)return false;e.click();return true;})()`);
}
async function login(actor,path='/') {
  await B('goto',origin+path);await B('wait','input[placeholder="Email"]');
  await B('fill','input[placeholder="Email"]',actor.email);await B('fill','input[placeholder="Contraseña"]',actor.password);
  await B('click','button.primary-button');
  await until('!document.querySelector("input[placeholder=Email]")');
}
async function logout() {
  // El control de cuenta puede estar dentro de su menú original.
  lastAction='cerrar sesión';
  await until(`(()=>{const b=Array.from(document.querySelectorAll('button')).find(e=>/^(Cerrar sesión|Salir)$/.test(e.textContent.trim())&&!e.matches(':disabled')&&e.getClientRects().length);if(b){b.click();return true;}const menu=Array.from(document.querySelectorAll('[aria-label="Abrir menú"], [aria-label="Abrir el menú"]')).find(e=>!e.matches(':disabled')&&e.getClientRects().length&&e.getAttribute('aria-expanded')!=='true');if(menu)menu.click();return false;})()`);
  await B('wait','input[placeholder="Email"]');
}
async function read(actor,path) {
  let response=await fetch(apiOrigin+path,{headers:{Authorization:'Bearer '+actor.token}});
  // Salir de la app revoca las sesiones del usuario, incluida la del lector de prueba.
  // Comprobar tras un nuevo ingreso exige una sesión nueva, sin eludir la revocación.
  if(response.status===401){
    const signed=await actor.client.auth.signInWithPassword({email:actor.email,password:actor.password});
    if(signed.error||!signed.data.session)throw Error('No se pudo renovar la sesión ficticia de lectura');
    actor.token=signed.data.session.access_token;
    response=await fetch(apiOrigin+path,{headers:{Authorization:'Bearer '+actor.token}});
  }
  lastReadStatus=response.status;
  if(!response.ok) throw Error('Nueva lectura del servidor falló: '+response.status);
  return response.json();
}
async function readUntil(actor,path,predicate) {
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){const result=await read(actor,path);if(predicate(result))return result;await new Promise(r=>setTimeout(r,250));}
  throw Error('El servidor no confirmó el guardado');
}
function check(condition,label) { if(!condition) {failedCheck=label;throw Error(label);}evidence.push(label);console.log('Verificado: '+label); }
async function reloadContains(text) {await B('reload');await until(`document.body.innerText.includes(${JSON.stringify(text)})`);}
async function field(label,value,scope='') {await B('fill',`${scope}label:has-text("${label}") input`,value);}
try {
  await mkdir('.gstack',{recursive:true});
  const professional=await identity('Nutricionista ficticia');const patient=await identity('Paciente ficticia');
  await pool.query("select public.provision_nutritionist($1,'Profesional de prueba')",[professional.id]);
  phase='arranque de servicios temporales';
  apiProcess=spawn(process.execPath,['--import','tsx','server/index.ts'],{env,stdio:'ignore'});
  webProcess=spawn(process.execPath,['node_modules/vite/bin/vite.js','--host','127.0.0.1','--port','5596'],{env,stdio:'ignore'});
  for(const endpoint of [apiOrigin+'/api/health',origin]) { let ready=false;for(let i=0;i<80;i++){try{if((await fetch(endpoint)).ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}if(!ready)throw Error('Servicio local no disponible'); }
  phase='alta profesional';await B('viewport','1440x1000');await login(professional,'/crm/pacientes');
  await button('Nuevo paciente');await field('Nombre completo','Paciente ficticia');await field('Email para la invitación',patient.email);
  await B('fill','label:has-text("Objetivo declarado") textarea','Organizar las comidas');await button('Crear alta');
  await until('!document.querySelector("#nv-create-title")');
  if((await B('js',"Array.from(document.querySelectorAll('button')).some(e=>e.textContent.trim()==='Reintentar preparar invitación')")).includes('true')) await button('Reintentar preparar invitación');
  await B('wait','input[aria-label="Enlace de invitación"]');
  const link=await B('js','document.querySelector(\'input[aria-label="Enlace de invitación"]\').value');
  const visibleInvite=new URL(link.replace(/^"|"$/g,'')).searchParams.get('invite');
  const rows=await pool.query('select p.id,i.id as invite,i.status,i.expires_at>now() as vigente from public.patients p join public.patient_invites i on i.patient_id=p.id where i.email=$1',[patient.email]);
  check(rows.rows.length===1&&rows.rows[0].invite===visibleInvite&&rows.rows[0].status==='pending'&&rows.rows[0].vigente,'alta única y enlace visible de invitación vigente y persistente');const pid=rows.rows[0].id;const invite=rows.rows[0].invite;
  // Exención ficticia de cuota para ensayar salud; nunca crea pagos ni suscripciones.
  await pool.query("update public.patients set billing_status='waived' where id=$1",[pid]);
  await logout();phase='aceptar invitación y onboarding';await login(patient,'/?invite='+invite);
  await button('Comenzar');await B('wait','.nvon-privacy input[type="checkbox"]');
  phase='onboarding: consentimiento';await B('click','.nvon-privacy input[type="checkbox"]');await button('Continuar');
  await B('wait','.nvon-profile input');phase='onboarding: nombre';
  await field('¿Cómo preferís que te nombremos?','Prueba');await button('Continuar');await B('wait','.nvon-health');
  const none=await B('js',"JSON.stringify(Array.from(document.querySelectorAll('.nvon-health button')).map(e=>e.textContent))");
  if(!none.includes('No')) throw Error('No se encontraron controles de alergias');
  await B('js',"Array.from(document.querySelectorAll('.nvon-health fieldset')).forEach(section=>{ const choices=Array.from(section.querySelectorAll('button'));const none=choices.find(e=>/no tengo|ninguna|ninguno/i.test(e.textContent));if(none)none.click(); })");
  phase='onboarding: alimentos';await button('Continuar');await B('wait','.nvon-review');
  phase='onboarding: envío';await button('Enviar a mi nutricionista');await button('Ir al inicio');
  phase='onboarding: lectura profesional';const intake=await read(professional,`/api/patients/${pid}/intake/professional`);
  check(intake.intake.status==='submitted','consentimiento y ficha enviados desde el navegador');
  await B('goto',origin+'/app/ficha');await B('wait','.nvt-body-form');
  await field('Fecha de nacimiento','1990-05-10','.nvt-body-form ');await field('Talla (cm)','165','.nvt-body-form ');await field('Peso (kg)','65','.nvt-body-form ');await button('Guardar mis datos');
  await readUntil(patient,`/api/patients/${pid}/body-data`,r=>r.data?.weight_kg===65);
  await reloadContains('Mi ficha');check((await read(patient,`/api/patients/${pid}/body-data`)).data?.weight_kg===65,'datos corporales conservados después de recargar');
  phase='permiso opcional de IA en la ficha';
  const aiPermission='section[aria-label="Permisos para la IA"] label:has-text("Mi nutricionista puede usar IA") input';
  await B('wait',aiPermission);await B('click',aiPermission);
  await readUntil(patient,`/api/patients/${pid}/care`,r=>r.consented.includes('ai_menu_draft'));
  await B('reload');await B('wait',aiPermission);await until(`document.querySelector('section[aria-label="Permisos para la IA"] input')?.checked===true`);
  check(true,'permiso de IA habilitado desde Mi ficha y confirmado después de recargar');
  await B('viewport','390x844');await B('wait',aiPermission);await B('click',aiPermission);
  await readUntil(patient,`/api/patients/${pid}/care`,r=>!r.consented.includes('ai_menu_draft'));
  await B('reload');await B('wait',aiPermission);await until(`document.querySelector('section[aria-label="Permisos para la IA"] input')?.checked===false`);
  check(true,'retiro del permiso de IA desde celular persiste y se muestra desactivado');
  const deniedAi=await fetch(apiOrigin+'/api/ai/jobs',{method:'POST',headers:{Authorization:'Bearer '+professional.token,'Content-Type':'application/json'},body:JSON.stringify({patient_id:pid,job_type:'menu_draft',period_start:today,period_end:today,slots:['Almuerzo']})});
  check(deniedAi.status===403,'retirar el permiso bloquea la generación profesional antes de llamar al proveedor');
  phase='recuperar catálogo de permisos tras un error';await B('viewport','1440x1000');await B('goto',origin+'/app/plan');await B('wait','[aria-label="Mi ficha"]');
  await B('js',`(()=>{const original=window.fetch;window.fetch=(input,options)=>{const url=typeof input==='string'?input:input.url;if(String(url).includes('/api/consents/catalog')){window.fetch=original;return Promise.resolve(new Response(JSON.stringify({error:'Fallo temporal de prueba'}),{status:503,headers:{'Content-Type':'application/json'}}));}return original(input,options);};})()`);
  await B('click','[aria-label="Mi ficha"]');await button('Reintentar permisos');await B('wait',aiPermission);
  check((await read(patient,`/api/patients/${pid}/care`)).consented.includes('ai_menu_draft')===false,'catálogo de permisos recuperado en la misma pantalla tras un error sin alterar la decisión guardada');
  await B('viewport','1440x1000');
  await logout();phase='ficha y meta profesional';await login(professional,`/crm/ficha?paciente=${pid}&seccion=ingreso`);
  await button('Marcar ingreso como revisado');await until("document.body.innerText.includes('Ya revisado')" );await button('Planificación');await button('Confirmar y compartir');await until("document.body.innerText.includes('Meta confirmada:')");
  const target=await read(patient,`/api/patients/${pid}/nutrition-target`);check(Boolean(target.target?.published_at),'meta confirmada visible sólo al publicarse');
  phase='receta manual y asignación';
  await B('goto',origin+`/crm/recetas?paciente=${pid}`);await button('Nueva receta');await B('click','.recipe-choice button:first-child');
  await field('Título','Arroz con vegetales','.recipe-form ');await field('Rinde (porciones)','2','.recipe-form ');await field('Fuente nutricional','Tabla declarada de prueba','.recipe-form ');
  await B('fill','.recipe-form label:text-is("KCAL") input','200');await field('PROT g','10','.recipe-form ');await field('CARBS g','35','.recipe-form ');await field('GRASAS g','3','.recipe-form ');
  await B('fill','[aria-label="Ingrediente 1"]','Arroz');await B('fill','[aria-label="Cantidad 1"]','100');await B('fill','[aria-label="Pasos de la receta"]','Cocinar el arroz y servir.');
  await button('Guardar borrador');await until("document.body.innerText.includes('Borrador guardado en el catálogo')");
  const catalog=await read(professional,'/api/recipes');const recipe=catalog.recipes.find(r=>r.title==='Arroz con vegetales');check(recipe?.current.card.macros.kcal===200,'receta manual conserva calorías declaradas');
  await button('Cerrar creación de receta');await until('!document.querySelector(".recipe-form")');await control('[aria-label="Ver receta Arroz con vegetales"]');await button('Publicar borrador');await until("document.body.innerText.includes('Revisión publicada')");
  await button('Asignar versión publicada');await B('select','.recipe-overlay label:has-text("Asignar a") select',pid);await field('Día',today,'.recipe-overlay ');phase='asignación incompatible bloqueada';
  try {
    await pool.query("update public.intake_sessions set payload=jsonb_set(payload,'{allergies}',$2::jsonb) where patient_id=$1",[pid,JSON.stringify({state:'reported',items:['Arroz']})]);
    await button('Confirmar asignación');await until("document.body.innerText.includes('antes de asignar')");
    check((await read(patient,`/api/patients/${pid}/recipe-days?date=${today}`)).assignments.length===0,'asignación incompatible rechazada sin llegar al día de la paciente');
    check(!(await read(patient,`/api/patients/${pid}/recipes`)).recipes.some(r=>r.id===recipe.id),'receta incompatible no entra en las recetas asignadas');
    await until('!!document.querySelector(".recipe-overlay")');
  } finally {
    await pool.query("update public.intake_sessions set payload=jsonb_set(payload,'{allergies}',$2::jsonb) where patient_id=$1",[pid,JSON.stringify({state:'none',items:[]})]);
  }
  phase='asignación compatible';await button('Confirmar asignación');await until("document.body.innerText.includes('Asignada al día')");
  check((await read(patient,`/api/patients/${pid}/recipe-days?date=${today}`)).assignments.length===1,'receta publicada asignada por fecha');
  phase='plan manual';await B('goto',origin+`/crm/plan?paciente=${pid}`);await B('wait','.meal-plan-form');
  await field('Desde',today,'.meal-plan-form ');await field('Hasta',today,'.meal-plan-form ');
  await B('fill','[aria-label="Fecha 1"]',today);await control('[aria-label="Elegir receta para indicación 1"]');await B('wait','.plan-recipe-picker-results');await B('click','.plan-recipe-picker-results button:has-text("Arroz con vegetales")');await field('Porciones a agregar','1','.plan-recipe-picker ');await button('Agregar al borrador');await until('!document.querySelector(".plan-recipe-picker")');await B('fill','[aria-label="Nota 1"]','Indicación publicada');
  await B('click','.meal-plan-form button[type="submit"]');await until("document.body.innerText.includes('Borrador guardado')");
  await button('Publicar v1');await until("document.body.innerText.includes('Plan publicado')");
  let published=await read(patient,`/api/patients/${pid}/plans`);check(published.plan?.items[0].public_note==='Indicación publicada','publicación del contenido revisado');
  await B('fill','[aria-label="Nota 1"]','Borrador privado nuevo');await B('click','.meal-plan-form button[type="submit"]');await until("document.body.innerText.includes('Borrador guardado')");
  published=await read(patient,`/api/patients/${pid}/plans`);check(published.plan?.items[0].public_note==='Indicación publicada','nuevo borrador conserva la versión publicada');
  phase='turno, cuota y recurso profesionales';await B('goto',origin+`/crm/consultas?paciente=${pid}`);
  const weekday=new Intl.DateTimeFormat('es-AR',{timeZone:'America/Argentina/Buenos_Aires',weekday:'long'}).format(new Date());
  await B('select','[aria-label="Día de la consulta"]',weekday[0].toUpperCase()+weekday.slice(1));await B('fill','[aria-label="Hora de la consulta"]','16:00');await B('select','[aria-label="Modalidad de la consulta"]','video');await B('fill','[aria-label="Enlace de videollamada"]','https://example.test/consulta');await button('Guardar turno');
  await readUntil(patient,`/api/patients/${pid}`,r=>r.patient.appointment?.meet_url==='https://example.test/consulta');await reloadContains('Abrir videollamada');
  await B('goto',origin+'/crm/cobranzas');await B('click','[aria-label="Ver cobranzas de Paciente ficticia"]');await B('fill','#cbz-fee-amount','1000');await B('fill','#cbz-fee-due',today);await button('Guardar cuota');
  await readUntil(patient,`/api/patients/${pid}/ledger?audience=patient`,r=>r.ledger.fee?.amount===1000);
  await B('goto',origin+'/crm/biblioteca?biblioteca=recursos');await B('click','.nvw-resource-picker button:first-child');await B('click','[aria-label="Seleccionar Paciente ficticia"]');await button('Asignar a 1');await until("document.body.innerText.includes('1 asignación creada.')");
  const assignedLibrary=(await read(patient,`/api/patients/${pid}/library`)).library;const resourceAssignment=assignedLibrary.assignments[0];const resource=[...assignedLibrary.resources,...assignedLibrary.articles].find(r=>r.id===resourceAssignment.resource_id||r.slug===resourceAssignment.slug);
  check(Boolean(resource),'turno, cuota y recurso guardados por la profesional');
  await logout();phase='paciente y recarga';await login(patient,'/app/plan');await reloadContains('Arroz con vegetales');
  for(const size of ['1440x1000','390x844']){await B('viewport',size);await until("document.body.innerText.includes('Arroz con vegetales')");check(!(await B('js',"document.body.innerText.includes('Borrador privado nuevo')")).includes('true'),'borrador oculto para paciente '+size);}
  phase='comidas y hábitos';await B('goto',origin+'/app/diario');await control('[aria-label="Registrar comida, agua o descanso"]');await button('Registrar esta comida');await until("document.body.innerText.includes('Ya registraste esta comida')");
  const mealRead=await read(professional,`/api/patients/${pid}`);check(mealRead.patient.meal_logs.length===1&&mealRead.patient.meal_logs[0].nutrition_origin==='declared','comida guardada desde receta y visible para profesional');
  await button('Registrar agua');await field('Vasos tomados hoy','3');await button('Guardar registro');await readUntil(patient,`/api/patients/${pid}`,r=>r.patient.hydration===3);
  await control('[aria-label="Registrar comida, agua o descanso"]');await button('Registrar descanso');await field('Minutos dormidos','480');await button('Guardar registro');await readUntil(patient,`/api/patients/${pid}`,r=>r.patient.sleep_minutes===480);
  await B('reload');await control('[aria-label="Registrar comida, agua o descanso"]');await until("document.body.innerText.includes('Agua: 3 vasos')");check((await read(professional,`/api/patients/${pid}`)).patient.sleep_minutes===480,'hidratación y descanso conservados al recargar y releer');
  phase='compras';await B('goto',origin+'/app/compras');await B('click','[aria-label="Agregar producto"]');await field('Producto','Manzana de prueba');await field('Cantidad','2');await button('Guardar');await until("document.body.innerText.includes('Producto agregado.')");
  await control('[aria-label="Marcar como comprado: Manzana de prueba"]');await until("document.body.innerText.includes('Lista guardada.')");await reloadContains('Manzana de prueba');
  check((await read(patient,`/api/patients/${pid}/shopping`)).list.items.some(i=>i.name==='Manzana de prueba'&&i.checked),'compras y marcas sobreviven a recarga');
  phase='receta y favoritos';await B('goto',origin+'/app/recetas');await control('[aria-label="Ver Arroz con vegetales"]');await button('Guardar en favoritas');await until('!!document.querySelector(\'[aria-label="Quitar de favoritas"][aria-pressed="true"]\')');
  check((await read(patient,`/api/patients/${pid}/library`)).library.favorites.some(f=>f.item_id===recipe.id),'favorito guardado con la receta publicada');
  phase='mensajes';await B('goto',origin+'/app/mensajes');await B('fill','[aria-label="Escribir mensaje"]','Consulta ficticia del recorrido');await B('click','[aria-label="Enviar mensaje"]');await until("document.body.innerText.includes('Mensaje enviado.')");await reloadContains('Consulta ficticia del recorrido');
  check((await read(professional,`/api/patients/${pid}`)).patient.messages.some(m=>m.text==='Consulta ficticia del recorrido'),'mensaje persistente visible desde ambos roles');
  const pdfPath=resolve('.gstack/plan-v-prueba.pdf');
  let pdf='%PDF-1.4\n';const offsets=[0];const pieces=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] >>'];
  pieces.forEach((content,index)=>{offsets.push(Buffer.byteLength(pdf));pdf+=`${index+1} 0 obj\n${content}\nendobj\n`;});const xref=Buffer.byteLength(pdf);pdf+='xref\n0 4\n0000000000 65535 f \n'+offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;await writeFile(pdfPath,pdf);
  phase='adjunto privado';await B('upload','[aria-label="Archivo adjunto"]',pdfPath);await until("document.body.innerText.includes('Adjunto: plan-v-prueba.pdf')");await B('fill','[aria-label="Escribir mensaje"]','Adjunto ficticio del recorrido');await B('click','[aria-label="Enviar mensaje"]');await until("document.body.innerText.includes('Mensaje enviado.')");await reloadContains('plan-v-prueba.pdf');
  const attached=(await read(professional,`/api/patients/${pid}`)).patient.messages.find(m=>m.text==='Adjunto ficticio del recorrido');check(attached?.attachment?.filename==='plan-v-prueba.pdf','adjunto guardado y visible desde ambos roles');
  await control('button[aria-label^="Abrir plan-v-prueba.pdf (mensaje de"]');await until("Array.from(document.querySelectorAll('a')).some(a=>a.getAttribute('aria-label')==='Abrir plan-v-prueba.pdf')");
  const documentUrl=await B('js',"Array.from(document.querySelectorAll('a')).find(a=>a.getAttribute('aria-label')==='Abrir plan-v-prueba.pdf').href");
  const documentResponse=await fetch(documentUrl);check(documentResponse.ok&&Buffer.from(await documentResponse.arrayBuffer()).equals(Buffer.from(pdf)),'paciente abre y descarga el PDF real del almacenamiento temporal');
  const proDocumentResponse=await fetch(apiOrigin+`/api/patients/${pid}/messages/${attached.id}/attachment`,{method:'POST',headers:{Authorization:'Bearer '+professional.token}});if(!proDocumentResponse.ok)throw Error('No se pudo abrir el adjunto profesional');const proDocument=await proDocumentResponse.json();const proResponse=await fetch(proDocument.url);check(proResponse.ok&&Buffer.from(await proResponse.arrayBuffer()).equals(Buffer.from(pdf)),'profesional descarga el mismo adjunto privado');
  const stranger=await identity('Paciente ajena ficticia');const denied=await fetch(apiOrigin+`/api/patients/${pid}/messages/${attached.id}/attachment`,{method:'POST',headers:{Authorization:'Bearer '+stranger.token}});check(denied.status===403,'otra paciente no obtiene el enlace del adjunto');
  phase='actividad';await B('goto',origin+'/app/ejercicio');await button('Registrar actividad');await field('Actividad','Caminata');await button('Guardar');await until("document.body.innerText.includes('Actividad guardada.')");
  await reloadContains('Caminata');check((await read(professional,`/api/patients/${pid}/exercise?audience=pro`)).exercise.activities.length===1,'actividad visible desde ambos roles tras recarga');
  phase='medidas';await B('goto',origin+'/app/progreso');await button('Registrar peso y medidas');await B('click','.care-consent label:has-text("Puedo cargar peso o medidas") input');await readUntil(patient,`/api/patients/${pid}/care?audience=patient`,r=>r.consented.includes('measurement'));await button('Registrar peso');await field('Peso','63','.care-form ');await button('Guardar registro');await until("document.body.innerText.includes('Registro guardado y disponible')");await B('click','[aria-label="Cerrar registros"]');await B('reload');
  check((await read(professional,`/api/patients/${pid}/care?audience=pro`)).measurements.some(m=>m.kind==='weight'&&m.value_numeric===63&&m.unit==='kg'&&m.source==='patient'),'medida opcional persistente con consentimiento y origen paciente');
  phase='fotos y estudios privados';await button('Registrar peso y medidas');
  // El catálogo abre el acordeón al cargar y puede cerrarlo al terminar si ya
  // existe el permiso de medidas. Esperar los controles antes de abrirlo evita
  // intentar pulsar una casilla mientras cambia ese estado de carga.
  await until('(()=>{const e=document.querySelector(".care-consent");if(!e||e.querySelector("[role=status]")||e.querySelectorAll("input[type=checkbox]").length!==3)return false;if(!e.open)e.querySelector("summary").click();return e.open;})()');
  await B('click','.care-consent label:has-text("Las fotos corporales") input');await readUntil(patient,`/api/patients/${pid}/care`,r=>r.consented.includes('body_progress'));
  await B('click','.care-consent label:has-text("Puedo compartir estudios") input');await readUntil(patient,`/api/patients/${pid}/care`,r=>r.consented.includes('clinical_document'));
  const pngPath=resolve('.gstack/plato-ficticio.png');await writeFile(pngPath,Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a3uoAAAAASUVORK5CYII=','base64'));
  await button('Agregar foto corporal');await B('upload','.care-form input[type="file"]',pngPath);await until('!!document.querySelector(".care-upload-preview")');await button('Guardar registro');await until('!document.querySelector(".care-form")');
  const photoRecord=(await readUntil(professional,`/api/patients/${pid}/care?audience=pro`,r=>r.records.some(x=>x.data.kind==='body_photo'))).records.find(x=>x.data.kind==='body_photo');
  await button('Ver foto privada');await B('wait','.care-photo-view img');const photoUrl=await B('js','document.querySelector(".care-photo-view img").src');const photoResponse=await fetch(photoUrl);check(photoResponse.ok&&(await photoResponse.arrayBuffer()).byteLength>0,'foto privada guardada, releída y descargada con permiso');await button('Cerrar foto');
  await button('Subir un estudio');await B('upload','.care-form input[type="file"]',pdfPath);await until("document.body.innerText.includes('Archivo listo: plan-v-prueba.pdf')");await button('Guardar registro');await until('!document.querySelector(".care-form")');
  const documentRecord=(await readUntil(professional,`/api/patients/${pid}/care?audience=pro`,r=>r.records.some(x=>x.data.kind==='clinical_document'))).records.find(x=>x.data.kind==='clinical_document');
  await button('Ver estudio');await B('wait','.care-document-view');const clinicalUrl=await B('js','document.querySelector(".care-document-view").data');const clinicalResponse=await fetch(clinicalUrl);check(clinicalResponse.ok&&Buffer.from(await clinicalResponse.arrayBuffer()).equals(Buffer.from(pdf)),'estudio privado conserva el PDF original');await button('Cerrar estudio');await control('[aria-label="Cerrar registros"]');await B('reload');
  for(const [kind,id] of [['photos',photoRecord.id],['documents',documentRecord.id]]){const forbidden=await fetch(apiOrigin+`/api/patients/${pid}/care/${kind}/${id}`,{headers:{Authorization:'Bearer '+stranger.token}});check(forbidden.status===403,'paciente ajena no abre archivo privado '+kind);}
  phase='recurso leído y guardado';await B('goto',origin+'/app/recursos');await control(`[aria-label="Leer ${resource.title}"]`);await button('Guardar recurso');await until("document.body.innerText.includes('Recurso guardado.')");await B('reload');
  const rereadLibrary=await readUntil(professional,`/api/patients/${pid}/library?audience=pro`,r=>r.library.assignments.some(a=>a.id===resourceAssignment.id&&a.read_at));check(rereadLibrary.library.favorites.some(f=>f.item_id===resource.id),'recurso leído y favorito persisten y se revisan desde consultorio');
  phase='confirmación y aviso de pago';
  const appointment=(await read(patient,`/api/patients/${pid}`)).patient.appointment;
  const appointmentDay=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Argentina/Buenos_Aires',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(appointment.starts_at));
  await B('goto',origin+'/app/agenda');await B('fill','[aria-label="Elegir mes"]',appointmentDay.slice(0,7));await B('click',`[data-calendar-date="${appointmentDay}"]`);await button('Confirmar');await readUntil(professional,`/api/patients/${pid}`,r=>r.patient.appointment?.patient_reply==='attending');await B('reload');check(true,'confirmación de turno persistente');
  await B('goto',origin+'/app/pagos');await B('fill','#cbz-report-amount','1000');await B('fill','#cbz-report-note','Aviso ficticio del recorrido');await button('Avisar que pagué');await readUntil(patient,`/api/patients/${pid}/ledger?audience=patient`,r=>r.ledger.payments.some(p=>p.status==='reported'));
  await logout();await B('viewport','1440x1000');await login(professional,'/crm/cobranzas');await B('click','[aria-label="Ver cobranzas de Paciente ficticia"]');await button('Confirmar');await readUntil(patient,`/api/patients/${pid}/ledger?audience=patient`,r=>r.ledger.payments.some(p=>p.status==='confirmed'&&p.amount===1000));await B('reload');check(true,'aviso de pago confirmado por profesional persiste sin cobro automático');
  phase='seguimiento profesional';await B('goto',origin+`/crm/ficha?paciente=${pid}&seccion=registros`);await button('Marcar revisado');await readUntil(patient,`/api/patients/${pid}/care`,r=>r.records.some(x=>x.reviewed_at));await B('reload');check(true,'revisión profesional de un registro conserva su estado');
  phase='respuesta profesional';await B('goto',origin+`/crm/mensajes?paciente=${pid}`);await B('wait','#nm-message');await B('fill','#nm-message','Respuesta ficticia profesional');await button('Enviar');await readUntil(patient,`/api/patients/${pid}`,r=>r.patient.messages.some(m=>m.text==='Respuesta ficticia profesional'&&m.from==='vero'));await reloadContains('Respuesta ficticia profesional');check(true,'respuesta profesional persistente visible para la paciente');
  phase='editar receta publicada';await B('goto',origin+`/crm/recetas?paciente=${pid}`);await control('[aria-label="Editar Arroz con vegetales"]');await field('Título','Borrador privado de receta','.recipe-form ');await button('Guardar borrador');await readUntil(professional,'/api/recipes',r=>r.recipes.some(x=>x.id===recipe.id&&x.title==='Borrador privado de receta'&&x.current.version===2&&x.published.version===1));
  const frozenPlan=(await read(patient,`/api/patients/${pid}/plans`)).plan;check(frozenPlan.items[0].recipe.title==='Arroz con vegetales'&&frozenPlan.items[0].recipe.nutrition.per_portion.kcal===200,'editar receta conserva título y calorías de la versión publicada en el plan');
  phase='edición y archivo de ficha';await B('goto',origin+'/crm/pacientes');await control('[aria-label="Editar ficha de Paciente ficticia"]');await B('fill','label:has-text("Próximo foco") textarea','Foco ficticio guardado');await button('Guardar cambios');await until('!document.querySelector("#nv-edit-title")');await readUntil(professional,`/api/patients/${pid}`,r=>r.patient.next_focus==='Foco ficticio guardado');await B('reload');
  await control('[aria-label="Archivar Paciente ficticia"]');await control('[aria-label="Confirmar archivo de Paciente ficticia"]');await until(`!Array.from(document.querySelectorAll('[aria-label="Archivar Paciente ficticia"]')).some(e=>e.getClientRects().length)`);
  await control('.nv-directory-filters button:last-child');await control('[aria-label="Restaurar Paciente ficticia"]');await readUntil(professional,`/api/patients/${pid}`,r=>!r.patient.archived_at);await B('reload');check(true,'ficha editada, archivada y restaurada conserva datos y plan');
  await logout();await login(patient,'/app/pagos');await reloadContains('Confirmado');
  await B('goto',origin+'/app/mensajes');await reloadContains('Respuesta ficticia profesional');
  await logout();await login(patient,'/app/plan');await reloadContains('Indicación publicada');check(true,'sesión cerrada y nuevo ingreso conservan el plan');
  phase='recuperación de contraseña';
  const recovery=await admin.auth.admin.generateLink({type:'recovery',email:patient.email,options:{redirectTo:origin}});
  if(recovery.error) throw Error('No se pudo preparar el enlace ficticio');
  await B('goto',recovery.data.properties.action_link);await until("document.body.innerText.includes('Elegí tu nueva contraseña')");
  password='Local-new-'+randomBytes(24).toString('base64url')+'-A1!';
  await field('Nueva contraseña',password);await field('Repetir contraseña',password);await button('Guardar y volver al ingreso');
  await B('wait','input[placeholder="Email"]');patient.password=password;await login(patient,'/app/plan');await reloadContains('Indicación publicada');
  check(true,'recuperación real de contraseña y nuevo ingreso conservan datos');
  phase='corregir ficha enviada';await B('goto',origin+'/app/ficha');await button('Editar mi ficha inicial');await button('Corregir mi ficha enviada');await B('wait','.nvon-profile input');await field('¿Cómo preferís que te nombremos?','Prueba corregida');await button('Continuar');await B('wait','.nvon-health');await button('Continuar');await B('wait','.nvon-review');await button('Enviar a mi nutricionista');await readUntil(patient,`/api/patients/${pid}/intake`,r=>r.intake.status==='submitted'&&r.intake.payload.preferred_name==='Prueba corregida');await readUntil(professional,`/api/patients/${pid}/intake/professional`,r=>r.intake.status==='submitted'&&r.intake.payload.preferred_name==='Prueba corregida');await button('Ver mi plan');await reloadContains('Indicación publicada');check(true,'corrección de ficha enviada recibida por profesional conserva consentimiento y plan publicado');
  phase='persistencia tras reiniciar la API';
  const beforeRestart=(await read(patient,`/api/patients/${pid}/plans`)).plan;
  const oldApi=apiProcess;
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('La API temporal no cerró')),10000);oldApi.once('exit',()=>{clearTimeout(timeout);resolve();});oldApi.kill();});
  apiProcess=spawn(process.execPath,['--import','tsx','server/index.ts'],{env,stdio:'ignore'});
  let restarted=false;for(let i=0;i<80;i++){try{if((await fetch(apiOrigin+'/api/health')).ok){restarted=true;break;}}catch{}await new Promise(r=>setTimeout(r,250));}if(!restarted)throw Error('La API temporal no reinició');
  const afterRestart=(await read(patient,`/api/patients/${pid}/plans`)).plan;
  const ledgerAfterRestart=(await read(patient,`/api/patients/${pid}/ledger?audience=patient`)).ledger;
  check(afterRestart.id===beforeRestart.id&&afterRestart.version===beforeRestart.version&&afterRestart.items[0].public_note==='Indicación publicada'&&ledgerAfterRestart.payments.some(p=>p.status==='confirmed'&&p.amount===1000),'reinicio del servidor conserva el plan publicado y el pago confirmado');
  await B('goto',origin+'/app/plan');await reloadContains('Indicación publicada');check(true,'paciente recupera el plan desde el navegador después del reinicio');
  await writeFile('.gstack/product-browser-evidence.json',JSON.stringify({result:'passed',screenshots:false,provider:'disabled',checks:evidence},null,2));
} catch (error) {
  console.error('Falló la comprobación del navegador en: '+phase+'; control: '+lastAction+'. No se imprimen cuentas, tokens ni contenido de sesión.');
  console.error('Tipo de fallo: '+(error instanceof Error?error.name:'desconocido')+'; código: '+(Number.isInteger(error?.code)?error.code:'sin código'));
  console.error('Última lectura HTTP: '+(lastReadStatus??'sin lectura')+'; comprobación fallida: '+failedCheck);
  // Diagnóstico limitado a controles, sin valores, texto libre ni enlaces de sesión.
  try{console.error('Controles al detenerse: '+await B('js',"JSON.stringify({privacy:!!document.querySelector('.nvon-privacy'),profile:!!document.querySelector('.nvon-profile'),health:!!document.querySelector('.nvon-health'),review:!!document.querySelector('.nvon-review'),alerts:document.querySelectorAll('.nvon-error').length,planForms:document.querySelectorAll('.meal-plan-form').length,planErrors:document.querySelectorAll('.meal-plan-error').length,planDirty:document.body.innerText.includes('Tenés cambios sin guardar'),publish:Array.from(document.querySelectorAll('button')).filter(e=>/^Publicar v/.test(e.textContent.trim())).map(e=>({disabled:e.matches(':disabled'),visible:!!e.getClientRects().length})),continue:Array.from(document.querySelectorAll('button')).filter(e=>e.textContent.trim()==='Continuar').map(e=>({disabled:e.matches(':disabled'),visible:!!e.getClientRects().length})),attach:Array.from(document.querySelectorAll('button,a,span')).filter(e=>/plan-v-prueba|adjunto/i.test((e.getAttribute('aria-label')||'')+e.textContent)).slice(0,8).map(e=>e.tagName+'|'+(e.getAttribute('aria-label')||e.textContent.trim().slice(0,60))+'|'+e.getClientRects().length+'|'+(e.disabled===true)),width:innerWidth})"));}catch{}
  if(phase==='arranque de servicios temporales')console.error('Salida local API: '+(apiProcess?.exitCode??'en ejecución')+'; web: '+(webProcess?.exitCode??'en ejecución'));
  process.exitCode=1;
} finally {
  try {await B('stop');}catch{}
  for(const child of [webProcess,apiProcess]) if(child&&!child.killed)child.kill();
  await pool.end();
}
