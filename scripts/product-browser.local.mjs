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
const identities=[]; const evidence=[]; let apiProcess; let webProcess; let phase='preparar identidades';let lastAction='preparación';
async function identity(label) {
  const email=label.toLowerCase().replaceAll(' ','-')+'-'+randomUUID()+'@example.test';
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true,user_metadata:{full_name:label,legal_version:'2026-09-29',legal_accepted_at:new Date().toISOString()}});
  if(created.error) throw Error('Identidad ficticia no creada');
  const client=createClient(env.SUPABASE_URL,env.SUPABASE_ANON_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  const signed=await client.auth.signInWithPassword({email,password});
  if(signed.error) throw Error('Sesión ficticia no iniciada');
  const actor={id:created.data.user.id,email,client,token:signed.data.session.access_token};identities.push(actor);return actor;
}
async function B(...args) { lastAction=args[0]+(['wait','fill','click','select','upload'].includes(args[0])?' '+args[1]:'');return (await run(browse,args,{env,timeout:45000,maxBuffer:2*1024*1024})).stdout.trim(); }
async function until(expression) {
  const deadline=Date.now()+20000;
  while(Date.now()<deadline) { if((await B('js',expression)).includes('true')) return; await new Promise(r=>setTimeout(r,250)); }
  throw Error('No se confirmó el estado de la interfaz');
}
async function button(text) {
  await until(`Array.from(document.querySelectorAll('button')).some(e=>e.textContent.trim()===${JSON.stringify(text)}&&!e.disabled&&e.getClientRects().length)`);
  await B('js',`Array.from(document.querySelectorAll('button')).find(e=>e.textContent.trim()===${JSON.stringify(text)}&&!e.disabled&&e.getClientRects().length).click()`);
}
async function login(actor,path='/') {
  await B('goto',origin+path);await B('wait','input[placeholder="Email"]');
  await B('fill','input[placeholder="Email"]',actor.email);await B('fill','input[placeholder="Contraseña"]',password);
  await B('click','button.primary-button');
  await until('!document.querySelector("input[placeholder=Email]")');
}
async function logout() {
  // El control de cuenta puede estar dentro de su menú original.
  const ready=await B('js',"Array.from(document.querySelectorAll('button')).some(e=>/^(Cerrar sesión|Salir)$/.test(e.textContent.trim())&&e.getClientRects().length)");
  if(!ready.includes('true')) await B('click','[aria-label="Abrir menú"], [aria-label="Abrir el menú"]');
  await B('js',"Array.from(document.querySelectorAll('button')).find(e=>/^(Cerrar sesión|Salir)$/.test(e.textContent.trim())&&e.getClientRects().length).click()");await B('wait','input[placeholder="Email"]');
}
async function read(actor,path) {
  const response=await fetch(apiOrigin+path,{headers:{Authorization:'Bearer '+actor.token}});
  if(!response.ok) throw Error('Nueva lectura del servidor falló: '+response.status);
  return response.json();
}
async function readUntil(actor,path,predicate) {
  const deadline=Date.now()+20000;
  while(Date.now()<deadline){const result=await read(actor,path);if(predicate(result))return result;await new Promise(r=>setTimeout(r,250));}
  throw Error('El servidor no confirmó el guardado');
}
function check(condition,label) { if(!condition) throw Error(label);evidence.push(label);console.log('Verificado: '+label); }
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
  const rows=await pool.query('select p.id,i.id as invite,i.status,i.expires_at>now() as vigente from public.patients p join public.patient_invites i on i.patient_id=p.id where p.email=$1',[patient.email]);
  check(rows.rows.length===1&&rows.rows[0].invite===visibleInvite&&rows.rows[0].status==='pending'&&rows.rows[0].vigente,'alta única y enlace visible de invitación vigente y persistente');const pid=rows.rows[0].id;const invite=rows.rows[0].invite;
  // Exención ficticia de cuota para ensayar salud; nunca crea pagos ni suscripciones.
  await pool.query("update public.patients set billing_status='waived' where id=$1",[pid]);
  await logout();phase='aceptar invitación y onboarding';await login(patient,'/?invite='+invite);
  await button('Comenzar');await B('click','.nvon-privacy input[type="checkbox"]');await button('Continuar');
  await field('¿Cómo preferís que te nombremos?','Prueba');await button('Continuar');
  const none=await B('js',"JSON.stringify(Array.from(document.querySelectorAll('.nvon-health button')).map(e=>e.textContent))");
  if(!none.includes('No')) throw Error('No se encontraron controles de alergias');
  await B('js',"Array.from(document.querySelectorAll('.nvon-health fieldset')).forEach(section=>{ const choices=Array.from(section.querySelectorAll('button'));const none=choices.find(e=>/no tengo|ninguna|ninguno/i.test(e.textContent));if(none)none.click(); })");
  await button('Continuar');await button('Enviar a mi nutricionista');await button('Ir al inicio');
  const intake=await read(professional,`/api/patients/${pid}/intake?audience=pro`);
  check(intake.intake.status==='submitted','consentimiento y ficha enviados desde el navegador');
  await B('goto',origin+'/app/ficha');await B('wait','.nvt-body-form');
  await field('Fecha de nacimiento','1990-05-10','.nvt-body-form ');await field('Talla (cm)','165','.nvt-body-form ');await field('Peso (kg)','65','.nvt-body-form ');await button('Guardar mis datos');
  await readUntil(patient,`/api/patients/${pid}/body-data`,r=>r.data?.weight_kg===65);
  await reloadContains('Mi ficha');check((await read(patient,`/api/patients/${pid}/body-data`)).data?.weight_kg===65,'datos corporales conservados después de recargar');
  await logout();phase='ficha y meta profesional';await login(professional,`/crm/ficha?paciente=${pid}`);
  await button('Marcar ingreso como revisado');await button('Confirmar y compartir');await until("document.body.innerText.includes('Meta confirmada:')");
  const target=await read(patient,`/api/patients/${pid}/nutrition-target`);check(Boolean(target.target?.published_at),'meta confirmada visible sólo al publicarse');
  phase='receta manual y asignación';
  await B('goto',origin+`/crm/recetas?paciente=${pid}`);await button('Nueva receta');await B('click','.recipe-choice button:first-child');
  await field('Título','Arroz con vegetales','.recipe-form ');await field('Rinde (porciones)','2','.recipe-form ');await field('Fuente nutricional','Tabla declarada de prueba','.recipe-form ');
  await field('KCAL','200','.recipe-form ');await field('PROT g','10','.recipe-form ');await field('CARBS g','35','.recipe-form ');await field('GRASAS g','3','.recipe-form ');
  await B('fill','[aria-label="Ingrediente 1"]','Arroz');await B('fill','[aria-label="Cantidad 1"]','100');await B('fill','[aria-label="Pasos de la receta"]','Cocinar el arroz y servir.');
  await button('Guardar borrador');await until("document.body.innerText.includes('Borrador guardado en el catálogo')");
  const catalog=await read(professional,'/api/recipes');const recipe=catalog.recipes.find(r=>r.title==='Arroz con vegetales');check(recipe?.current.card.macros.kcal===200,'receta manual conserva calorías declaradas');
  await button('Cerrar');await button('Publicar');await until("document.body.innerText.includes('Revisión publicada')");
  await button('Agregar al plan');await field('Día',today,'.recipe-overlay ');await button('Confirmar asignación');await until("document.body.innerText.includes('Asignada al día')");
  check((await read(patient,`/api/patients/${pid}/recipe-days?date=${today}`)).assignments.length===1,'receta publicada asignada por fecha');
  phase='plan manual';await B('goto',origin+`/crm/plan?paciente=${pid}`);await B('click','[aria-label="Crear o editar plan"]');
  await field('Desde',today,'.meal-plan-form ');await field('Hasta',today,'.meal-plan-form ');
  await B('fill','[aria-label="Fecha 1"]',today);await B('select','[aria-label="Receta 1"]',recipe.id);await B('fill','[aria-label="Nota 1"]','Indicación publicada');
  await B('click','.meal-plan-form button[type="submit"]');await until("document.body.innerText.includes('Borrador guardado')");
  await button('Publicar v1');await until("document.body.innerText.includes('Plan publicado')");
  let published=await read(patient,`/api/patients/${pid}/plans`);check(published.plan?.items[0].public_note==='Indicación publicada','publicación del contenido revisado');
  await B('fill','[aria-label="Nota 1"]','Borrador privado nuevo');await B('click','.meal-plan-form button[type="submit"]');await until("document.body.innerText.includes('Borrador guardado')");
  published=await read(patient,`/api/patients/${pid}/plans`);check(published.plan?.items[0].public_note==='Indicación publicada','nuevo borrador conserva la versión publicada');
  await logout();phase='paciente y recarga';await login(patient,'/app/plan');await reloadContains('Arroz con vegetales');
  for(const size of ['1440x1000','390x844']){await B('viewport',size);await until("document.body.innerText.includes('Arroz con vegetales')");check(!(await B('js',"document.body.innerText.includes('Borrador privado nuevo')")).includes('true'),'borrador oculto para paciente '+size);}
  phase='comidas y hábitos';await B('goto',origin+'/app/diario');await button('Registrar esta comida');await until("document.body.innerText.includes('Ya registraste esta comida')");
  const mealRead=await read(professional,`/api/patients/${pid}`);check(mealRead.patient.meal_logs.length===1&&mealRead.patient.meal_logs[0].nutrition_origin==='declared','comida guardada desde receta y visible para profesional');
  await button('Registrar agua');await field('Vasos tomados hoy','3');await button('Guardar registro');await readUntil(patient,`/api/patients/${pid}`,r=>r.patient.hydration===3);
  await button('Registrar descanso');await field('Minutos dormidos','480');await button('Guardar registro');await readUntil(patient,`/api/patients/${pid}`,r=>r.patient.sleep_minutes===480);
  await reloadContains('Agua: 3 vasos');check((await read(professional,`/api/patients/${pid}`)).patient.sleep_minutes===480,'hidratación y descanso conservados al recargar y releer');
  phase='compras';await B('goto',origin+'/app/compras');await B('click','[aria-label="Agregar producto"]');await field('Producto','Manzana de prueba');await field('Cantidad','2');await button('Guardar');await until("document.body.innerText.includes('Producto agregado.')");
  await B('click','[aria-label="Marcar como comprado: Manzana de prueba"]');await until("document.body.innerText.includes('Lista guardada.')");await reloadContains('Manzana de prueba');
  check((await read(patient,`/api/patients/${pid}/shopping`)).list.items.some(i=>i.name==='Manzana de prueba'&&i.checked),'compras y marcas sobreviven a recarga');
  phase='receta y favoritos';await B('goto',origin+'/app/recetas');await B('click','[aria-label="Ver Arroz con vegetales"]');await button('Guardar en favoritos');await until("document.body.innerText.includes('Guardada')");
  check((await read(patient,`/api/patients/${pid}/library`)).library.favorites.some(f=>f.item_id===recipe.id),'favorito guardado con la receta publicada');
  phase='mensajes';await B('goto',origin+'/app/mensajes');await B('fill','[aria-label="Escribir mensaje"]','Consulta ficticia del recorrido');await B('click','[aria-label="Enviar mensaje"]');await until("document.body.innerText.includes('Mensaje enviado.')");await reloadContains('Consulta ficticia del recorrido');
  check((await read(professional,`/api/patients/${pid}`)).patient.messages.some(m=>m.text==='Consulta ficticia del recorrido'),'mensaje persistente visible desde ambos roles');
  phase='actividad';await B('goto',origin+'/app/ejercicio');await button('Registrar actividad');await field('Actividad','Caminata');await button('Guardar');await until("document.body.innerText.includes('Actividad guardada.')");
  await reloadContains('Caminata');check((await read(professional,`/api/patients/${pid}/exercise?audience=pro`)).exercise.activities.length===1,'actividad visible desde ambos roles tras recarga');
  await logout();await login(patient,'/app/plan');await reloadContains('Indicación publicada');check(true,'sesión cerrada y nuevo ingreso conservan el plan');
  phase='recuperación de contraseña';
  const recovery=await admin.auth.admin.generateLink({type:'recovery',email:patient.email,options:{redirectTo:origin}});
  if(recovery.error) throw Error('No se pudo preparar el enlace ficticio');
  await B('goto',recovery.data.properties.action_link);await until("document.body.innerText.includes('Elegí tu nueva contraseña')");
  password='Local-new-'+randomBytes(24).toString('base64url')+'-A1!';
  await field('Nueva contraseña',password);await field('Repetir contraseña',password);await button('Guardar y volver al ingreso');
  await B('wait','input[placeholder="Email"]');await login(patient,'/app/plan');await reloadContains('Indicación publicada');
  check(true,'recuperación real de contraseña y nuevo ingreso conservan datos');
  await writeFile('.gstack/product-browser-evidence.json',JSON.stringify({result:'passed',screenshots:false,provider:'disabled',checks:evidence},null,2));
} catch {
  console.error('Falló la comprobación del navegador en: '+phase+'; control: '+lastAction+'. No se imprimen cuentas, tokens ni contenido de sesión.');
  if(phase==='arranque de servicios temporales')console.error('Salida local API: '+(apiProcess?.exitCode??'en ejecución')+'; web: '+(webProcess?.exitCode??'en ejecución'));
  process.exitCode=1;
} finally {
  try {await B('stop');}catch{}
  for(const child of [webProcess,apiProcess]) if(child&&!child.killed)child.kill();
  await pool.end();
}
