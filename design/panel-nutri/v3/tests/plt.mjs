import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});const pg=await b.newPage({viewport:{width:1472,height:1100}});
await pg.route('**/gsap.min.js',r=>r.fulfill({path:D+'/tests/.gsap/package/dist/gsap.min.js',contentType:'application/javascript'}));
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto('file://'+D+'/panel.html');await pg.waitForTimeout(900);
const chk=()=>pg.evaluate(()=>{const m=[...document.querySelectorAll('.main')].find(x=>x.offsetParent);const r=[];
  document.querySelectorAll('#pwrap .fxp,#pwrap .fx>.c,#pwrap .fx').forEach(e=>{if(e.scrollHeight>e.clientHeight+2)r.push(e.className+' "'+(e.querySelector('h3')?.textContent||'').slice(0,20)+'" '+e.scrollHeight+'/'+e.clientHeight)});
  document.querySelectorAll('#pwrap .fxs').forEach(e=>{if(e.scrollHeight>e.clientHeight+2)r.push('scroll:'+e.className+e.id+' '+e.scrollHeight+'/'+e.clientHeight)});
  return [m.scrollHeight,m.clientHeight,r]});
for(const th of ['light','dark']){await pg.evaluate(t=>document.documentElement.dataset.theme=t,th);
 await pg.evaluate(()=>document.querySelector('.nv[data-go="planes"]').click());await pg.waitForTimeout(1500);
 for(const v of [0,1,2,3,4]){await pg.evaluate(v=>document.querySelector(`#pview [data-pv="${v}"]`).click(),v);await pg.waitForTimeout(1300);
  console.log(th,v,JSON.stringify(await chk()));await (await pg.$('.app')).screenshot({path:`pl-${th}-${v}.png`});}
 await pg.evaluate(()=>document.querySelector('#mview [data-mv="0"]').click());await pg.waitForTimeout(600);}
console.log('errors',errs);await b.close();
