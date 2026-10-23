import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const theme=process.argv[2]||'light';
const b=await chromium.launch();const pg=await b.newPage({viewport:{width:1472,height:1100}});
await pg.route('**/gsap.min.js',r=>r.fulfill({path:D+'/tests/.gsap/package/dist/gsap.min.js',contentType:'application/javascript'}));
const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await pg.goto('file://'+D+'/panel.html');await pg.waitForTimeout(900);
await pg.evaluate(t=>document.documentElement.dataset.theme=t,theme);
await pg.evaluate(()=>go('ficha'));await pg.waitForTimeout(400);
for(const t of ['resumen','historia','mediciones','objetivos','consultas','plan','alimentario','laboratorio','archivos','cobros']){
 await pg.evaluate(k=>document.querySelector(`#ftabs [data-ft="${k}"]`).click(),t);await pg.waitForTimeout(2200);
 const o=await pg.evaluate(()=>{const m=[...document.querySelectorAll('.main')].find(x=>x.offsetParent);const r=[];
  document.querySelectorAll('#fwrap .fxp,#fwrap .fx>.c,#fwrap .fx').forEach(e=>{if(e.scrollHeight>e.clientHeight+2)r.push(e.className+' "'+(e.querySelector('h3')?.textContent||'').slice(0,20)+'" '+e.scrollHeight+'/'+e.clientHeight)});
  document.querySelectorAll('#fwrap .fxs').forEach(e=>{if(e.scrollHeight>e.clientHeight+2)r.push('scroll:'+(e.closest('.fxp').querySelector('h3')?.textContent||'').slice(0,20)+' '+e.scrollHeight+'/'+e.clientHeight)});
  document.querySelectorAll('#fwrap *').forEach(e=>{if(e.scrollWidth>e.clientWidth+2&&getComputedStyle(e).overflowX!=='visible'&&!['TD','B','SMALL','SPAN','TIME'].includes(e.tagName))r.push('W:'+e.tagName+'.'+e.className+' '+e.scrollWidth+'/'+e.clientWidth)});
  return [m.scrollHeight,r]});
 console.log(t,JSON.stringify(o));await (await pg.$('.app')).screenshot({path:`fx-${theme}-${t}.png`});}
await pg.evaluate(()=>go('inicio'));await pg.waitForTimeout(4000);await (await pg.$('#det')).screenshot({path:`fx-${theme}-card.png`});
console.log('btns',JSON.stringify(await pg.evaluate(()=>{const d=document.querySelector('#det').getBoundingClientRect();return [...document.querySelectorAll('#det .xacts button')].map(x=>{const r=x.getBoundingClientRect();return [Math.round(r.width),Math.round(r.height),Math.round(d.bottom-r.bottom)]})})));
console.log('errors',errs);await b.close();
