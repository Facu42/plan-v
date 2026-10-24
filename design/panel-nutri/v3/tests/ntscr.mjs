// Pantallas nuevas de Nutreando (0.5 a 0.7): Página pública, Equipo y Ajustes.
// Cada botón de cada vista abre un panel, avisa o cambia algo; cada vista mide 900 de alto en claro y oscuro.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});const pg=await b.newPage({viewport:{width:1472,height:1100}});
await pg.emulateMedia({reducedMotion:'reduce'});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+D+'/panel.html');await pg.waitForTimeout(800);
const SC=[['publica','PUB','pubDraw',3],['equipo','EQ','eqDraw',3],['ajustes','AJ','ajDraw',5]];
const SEL=s=>`#s-${s} button,#s-${s} tr[data-psv],#s-${s} tr[data-eqp],#s-${s} [data-ajav]`;
const show=(scr,st,dr,v,th='light')=>pg.evaluate(([scr,st,dr,v,th])=>{document.documentElement.dataset.theme=th;go(scr);eval(st+'.view='+v+';'+dr+'()');},[scr,st,dr,v,th]);
let total=0;
for(const [scr,st,dr,nv] of SC)for(let v=0;v<nv;v++){
 await show(scr,st,dr,v);await pg.waitForTimeout(60);
 const n=await pg.evaluate(sel=>[...document.querySelectorAll(sel)].filter(e=>e.offsetParent).length,SEL(scr));const out=[];
 for(let i=0;i<n;i++){
  const r=await pg.evaluate(([sel,i])=>{const e=[...document.querySelectorAll(sel)].filter(e=>e.offsetParent)[i];if(!e)return null;const t=(e.getAttribute('aria-label')||e.textContent).trim().replace(/\s+/g,' ').slice(0,26);const h=document.querySelector('.app').innerHTML;document.getElementById('atoast').textContent='';e.click();return [t,h]},[SEL(scr),i]);
  if(!r)continue;await pg.waitForTimeout(90);
  const res=await pg.evaluate(h=>{const w=document.getElementById('actw');if(!w.hidden)return 'PANEL:'+document.getElementById('actt').textContent;const t=document.getElementById('atoast').textContent;if(t)return 'AVISO';return document.querySelector('.app').innerHTML!==h?'cambia':'—'},r[1]);
  out.push(r[0]+' → '+res);total++;
  if(res.startsWith('PANEL')){await pg.keyboard.press('Escape');await pg.waitForTimeout(260);}
  await show(scr,st,dr,v);}
 console.log(`== ${scr} / vista ${v}\n  `+out.join('\n  '));}
for(const th of ['light','dark'])for(const [scr,st,dr,nv] of SC)for(let v=0;v<nv;v++){await show(scr,st,dr,v,th);await pg.waitForTimeout(150);
 console.log(th,scr,v,await pg.evaluate(scr=>{const o=[];document.querySelectorAll('#s-'+scr+' .fxp').forEach(p=>{if(p.scrollHeight>p.clientHeight+1)o.push('ovf:'+p.querySelector('h3').textContent)});return [document.querySelector('.main').scrollHeight,o]},scr));}
await pg.evaluate(()=>setT('light'));
console.log('botones',total,'errors',errs);await b.close();
