// Editor del plan (vista Día): cantidades, quitar, deshacer, agregar, hora, duplicar, cambiar plato, columna derecha y gestión.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});const pg=await b.newPage({viewport:{width:1472,height:1000}});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+D+'/panel.html#planes');await pg.waitForTimeout(900);
const st=()=>pg.evaluate(()=>({kc:document.querySelector('.petot b')?.textContent,items:document.querySelectorAll('.pei').length,undo:!document.querySelector('[data-peundo]')?.disabled,toast:document.getElementById('atoast').textContent,h:document.querySelector('.main').scrollHeight}));
const c=async(sel,label)=>{await pg.click(sel);await pg.waitForTimeout(300);const s=await st();console.log((label||sel).padEnd(24),JSON.stringify(s));return s;};
const ck=(ok,m)=>{if(!ok)errs.push(m);};
await pg.evaluate(()=>pOpen(0));await pg.waitForTimeout(300);
let s0=await st();ck(s0.items>8,'vista Día sin alimentos');ck(s0.h<=900,'no entra en 900');
await pg.fill('[data-peq="0,0"]','140');await pg.press('[data-peq="0,0"]','Tab');await pg.waitForTimeout(300);let s1=await st();console.log('cantidad'.padEnd(24),JSON.stringify(s1));ck(s1.kc!==s0.kc&&s1.undo,'la cantidad no cambia las calorías');
let s2=await c('[data-pedel="1,0"]','quitar');ck(s2.items===s1.items-1,'no quita');
let s3=await c('[data-peundo]','deshacer');ck(s3.items===s1.items,'no deshace');
await c('[data-peredo]','rehacer');await c('[data-peundo]','deshacer');
await c('[data-peadd="3"]','agregar');let s4=await c('#act [data-ok]','agregar ok');ck(s4.items===s3.items+1,'no agrega');
await pg.fill('[data-peh="0"]','07:30');await pg.press('[data-peh="0"]','Tab');await pg.waitForTimeout(250);ck(await pg.inputValue('[data-peh="0"]')==='07:30','no guarda la hora');
await c('[data-penote="2,0"]','nota');await pg.fill('#act textarea','a la plancha');await c('#act [data-ok]','nota ok');ck(await pg.evaluate(()=>document.querySelector('.pemeal:nth-child(3) .pen small').textContent.includes('a la plancha')),'sin nota');
await c('[data-pealt="4"]','cambiar plato');await c('#act [data-pealtu="0"]','usar plato');
await c('[data-ped="1"]','martes');await c('[data-pg="dup"]','duplicar');await c('#act [data-ok]','duplicar ok');
await c('[data-pefot]','fotos');await c('[data-pert="1"]','app');await c('[data-pert="2"]','pdf');await c('[data-pert="0"]','análisis');
for(const g of ['tpl','copiar','prog','vista','metas','nuevo']){await c(`[data-pg="${g}"]`,g);ck(await pg.evaluate(()=>!document.getElementById('actw').hidden),'no abre '+g);await pg.click('#act [data-x]');await pg.waitForTimeout(250);}
await c('[data-pg="ia"]','asistente');ck(await pg.evaluate(()=>document.getElementById('iadr').classList.contains('open')),'no abre el asistente');await c('[data-iaa="drx"]','cerrar');
await c('[data-pem="semana"]','semana');ck(await pg.evaluate(()=>!!document.querySelector('.pgrid')),'no muestra la grilla');await c('[data-pem="dia"]','día');
await c('#pacts [data-pa="nuevo"]','nuevo plan arriba');ck(await pg.evaluate(()=>!document.getElementById('actw').hidden),'arriba sin Nuevo plan');await pg.click('#act [data-x]');
console.log('errors',errs);await b.close();
