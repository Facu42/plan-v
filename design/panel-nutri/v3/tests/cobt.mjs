import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1472,height:1100}});
await pg.route('**/gsap.min.js',r=>r.fulfill({path:D+'/tests/.gsap/package/dist/gsap.min.js',contentType:'application/javascript'}));
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto('file://'+D+'/panel.html');await pg.waitForTimeout(900);
for(const th of ['light','dark']){await pg.evaluate(t=>document.documentElement.dataset.theme=t,th);
await pg.evaluate(()=>document.querySelector('.nv[data-go="cobranzas"]').click());await pg.waitForTimeout(2300);
const o=await pg.evaluate(()=>{const m=[...document.querySelectorAll('.main')].find(x=>x.offsetParent);const r=[];
  document.querySelectorAll('#cwrap .fxp,#cwrap .fx>.c,#cwrap .fx').forEach(e=>{if(e.scrollHeight>e.clientHeight+2)r.push(e.className+' "'+(e.querySelector('h3')?.textContent||'').slice(0,20)+'" '+e.scrollHeight+'/'+e.clientHeight)});
  document.querySelectorAll('#cwrap .fxs').forEach(e=>{if(e.scrollHeight>e.clientHeight+2)r.push('scroll:'+(e.closest('.fxp').querySelector('h3')?.textContent||'').slice(0,20)+' '+e.scrollHeight+'/'+e.clientHeight)});
  return [m.scrollHeight,r]});
console.log(th,JSON.stringify(o));await (await pg.$('.app')).screenshot({path:`cob-${th}.png`});}
console.log('errors',errs);await b.close();
