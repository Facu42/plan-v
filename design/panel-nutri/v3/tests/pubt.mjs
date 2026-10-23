// Página pública (Nutreando 0.5): cada botón de las tres vistas abre un panel, avisa o cambia algo; 900 de alto en claro y oscuro.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});const pg=await b.newPage({viewport:{width:1472,height:1100}});
await pg.emulateMedia({reducedMotion:'reduce'});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+D+'/panel.html');await pg.waitForTimeout(800);
const prep=async v=>{await pg.evaluate(v=>{go('publica');PUB.view=v;pubDraw();},v);await pg.waitForTimeout(60);};
for(const v of [0,1,2]){await prep(v);const n=await pg.evaluate(()=>[...document.querySelectorAll('#s-publica button,#s-publica tr[data-psv]')].filter(e=>e.offsetParent).length);const out=[];
 for(let i=0;i<n;i++){const r=await pg.evaluate(i=>{const e=[...document.querySelectorAll('#s-publica button,#s-publica tr[data-psv]')].filter(e=>e.offsetParent)[i];if(!e)return null;const t=(e.getAttribute('aria-label')||e.textContent).trim().replace(/\s+/g,' ').slice(0,24);const h=document.querySelector('.app').innerHTML;document.getElementById('atoast').textContent='';e.click();return [t,h]},i);if(!r)continue;await pg.waitForTimeout(90);
  const res=await pg.evaluate(h=>{const w=document.getElementById('actw');if(!w.hidden)return 'PANEL:'+document.getElementById('actt').textContent;const t=document.getElementById('atoast').textContent;if(t)return 'AVISO';return document.querySelector('.app').innerHTML!==h?'cambia':'—'},r[1]);
  out.push(r[0]+' → '+res);if(res.startsWith('PANEL')){await pg.keyboard.press('Escape');await pg.waitForTimeout(260);}await prep(v);}
 console.log('== vista '+v+'\n  '+out.join('\n  '));}
for(const th of ['light','dark'])for(const v of [0,1,2]){await pg.evaluate(([th,v])=>{document.documentElement.dataset.theme=th;go('publica');PUB.view=v;pubDraw();},[th,v]);await pg.waitForTimeout(200);
 console.log(th,v,await pg.evaluate(()=>{const o=[];document.querySelectorAll('#s-publica .fxp').forEach(p=>{if(p.scrollHeight>p.clientHeight+1)o.push('ovf:'+p.querySelector('h3').textContent)});return [document.querySelector('.main').scrollHeight,o]}));}
console.log('errors',errs);await b.close();
