import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});const pg=await b.newPage({viewport:{width:1472,height:1100}});
await pg.emulateMedia({reducedMotion:'reduce'});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+D+'/panel.html');await pg.waitForTimeout(800);
const prep=async(scr,tab)=>{await pg.evaluate(([s,t])=>{go(s);if(t){ftab=t;drawFicha();}document.getElementById('chatd')?.classList.remove('open');},[scr,tab]);await pg.waitForTimeout(60);};
const run=async(scr,tab)=>{await prep(scr,tab);const n=await pg.evaluate(()=>{const m=[...document.querySelectorAll('.main')].find(x=>x.offsetParent);return [...m.querySelectorAll('button,.lnk')].filter(e=>e.offsetParent&&!e.closest('#ftabs,.chatd')).length});const out=[];
 for(let i=0;i<n;i++){const r=await pg.evaluate(i=>{const m=[...document.querySelectorAll('.main')].find(x=>x.offsetParent);const e=[...m.querySelectorAll('button,.lnk')].filter(e=>e.offsetParent&&!e.closest('#ftabs,.chatd'))[i];if(!e)return null;const t=(e.getAttribute('aria-label')||e.textContent).trim().replace(/\s+/g,' ').slice(0,24);const h=document.querySelector('.app').innerHTML;document.getElementById('atoast').textContent='';e.click();return [t,h]},i);if(!r)continue;await pg.waitForTimeout(90);
  const res=await pg.evaluate(h=>{const w=document.getElementById('actw');if(!w.hidden)return 'PANEL:'+document.getElementById('actt').textContent;const t=document.getElementById('atoast').textContent;if(t)return 'AVISO';return document.querySelector('.app').innerHTML!==h?'cambia':'—'},r[1]);
  out.push(r[0]+' → '+res+(errs.length?' ERR '+errs.splice(0).join(';'):''));
  if(res.startsWith('PANEL')){await pg.keyboard.press('Escape');await pg.waitForTimeout(260);}await prep(scr,tab);}
 console.log('== '+scr+(tab?'/'+tab:'')+'\n  '+out.join('\n  '));};
for(const s of ['inicio','pacientes','agenda','cobranzas'])await run(s);
for(const t of ['resumen','historia','mediciones','objetivos','consultas','plan','alimentario','laboratorio','archivos','cobros'])await run('ficha',t);
console.log('errors',errs);await b.close();
