// Celular (Nutreando 0.8): todo el boceto a 390 × 844.
// Recorre cada pantalla y vista, toca cada botón (panel, aviso o cambio), revisa que nada se salga de costado,
// y prueba los accesos de abajo, el cajón del menú y el cambio Computadora / Celular.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});
const pg=await b.newPage({viewport:{width:390,height:844}});await pg.emulateMedia({reducedMotion:'reduce'});
const errs=[];pg.on('pageerror',e=>errs.push(e.message+(process.env.ST?' @'+(e.stack||'').split('\n').slice(1,3).join(' '):'')));
await pg.goto('file://'+D+'/panel.html');await pg.waitForFunction(()=>typeof mobSet==='function');await pg.waitForTimeout(400);
const L=[['inicio'],['pacientes'],['agenda'],['ficha'],['cobranzas'],...[0,1,2].map(i=>['mensajes',`#mview [data-mv="${i}"]`]),...[0,1,2,3,4].map(i=>['planes',`#pview [data-pv="${i}"]`]),
 ...[0,1,2].map(i=>['publica',`PUB.view=${i};pubDraw()`]),...[0,1,2].map(i=>['equipo',`EQ.view=${i};eqDraw()`]),...[0,1,2,3,4].map(i=>['ajustes',`AJ.view=${i};ajDraw()`])];
const show=(scr,act)=>pg.evaluate(([scr,act])=>{go(scr);if(act){if(act[0]==='#')document.querySelector(act).click();else eval(act);}},[scr,act]);
const SEL=s=>`#s-${s} button`;
console.log('celular:',await pg.evaluate(()=>[MOB.on,document.querySelector('.app').getBoundingClientRect().width]));
let total=0,mudos=[];
// Mensajes guarda lo que se archiva o se manda: se vuelve a abrir la página antes de cada botón para no archivar todo en cadena.
const fresh=async()=>{await pg.reload();await pg.waitForFunction(()=>typeof mobSet==='function');await pg.waitForTimeout(200);};
for(const [scr,act] of L){await fresh();await show(scr,act);await pg.waitForTimeout(80);
 const side=await pg.evaluate(()=>{const m=document.querySelector('.main');return m.scrollWidth-m.clientWidth});
 const n=await pg.evaluate(sel=>[...document.querySelectorAll(sel)].filter(e=>e.offsetParent).length,SEL(scr));
 for(let i=0;i<n;i++){
  const r=await pg.evaluate(([sel,i])=>{const e=[...document.querySelectorAll(sel)].filter(e=>e.offsetParent)[i];if(!e)return null;const t=(e.getAttribute('aria-label')||e.textContent).trim().replace(/\s+/g,' ').slice(0,26);const h=document.querySelector('.app').innerHTML;document.getElementById('atoast').textContent='';e.click();return [t,h]},[SEL(scr),i]);
  if(!r)continue;await pg.waitForTimeout(60);const ne=errs.length;
  const res=await pg.evaluate(h=>{const w=document.getElementById('actw');if(!w.hidden)return 'PANEL';if(document.getElementById('atoast').textContent)return 'AVISO';return document.querySelector('.app').innerHTML!==h?'cambia':'—'},r[1]);
  total++;if(res==='—')mudos.push(scr+': '+r[0]);if(errs.length>ne&&!errs[errs.length-1].startsWith('['))errs.push('['+scr+' '+(act||'')+' «'+r[0]+'»]');
  if(res==='PANEL'){const w=await pg.evaluate(()=>{const a=document.getElementById('act').getBoundingClientRect(),p=document.querySelector('.app').getBoundingClientRect();return a.left>=p.left-1&&a.right<=p.right+1});if(!w)errs.push('panel fuera: '+scr+' '+r[0]);await pg.keyboard.press('Escape');await pg.waitForTimeout(240);}
  if(scr==='mensajes')await fresh();await show(scr,act);await pg.waitForTimeout(40);}
 console.log(scr,act||'','botones',n,'de costado',side);if(side>0)errs.push('se sale de costado: '+scr+' '+(act||''));}
// accesos de abajo y cajón
for(const k of ['inicio','pacientes','agenda','mensajes']){await pg.click(`.mnav [data-mgo="${k}"]`);await pg.waitForTimeout(80);
 if(!await pg.evaluate(k=>!document.getElementById('s-'+k).hidden,k))errs.push('acceso '+k);}
await pg.click('#mmas');await pg.waitForTimeout(320);
if(!await pg.evaluate(()=>document.querySelector('.app').classList.contains('mdr')))errs.push('cajón no abre');
await pg.click('.side [data-go="cobranzas"]');await pg.waitForTimeout(320);
if(!await pg.evaluate(()=>!document.getElementById('s-cobranzas').hidden&&!document.querySelector('.app').classList.contains('mdr')))errs.push('cajón no lleva a Cobranzas');
await pg.click('#mvw [data-mv="0"]');await pg.waitForTimeout(200);
if(await pg.evaluate(()=>document.documentElement.classList.contains('mob')))errs.push('no vuelve a computadora');
console.log('botones',total,'sin respuesta',mudos,'errors',errs);await b.close();
