import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('..',import.meta.url)).replace(/\/$/,'');
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});const pg=await b.newPage({viewport:{width:1472,height:1100}});
await pg.route('**/gsap.min.js',r=>r.fulfill({path:D+'/tests/.gsap/package/dist/gsap.min.js',contentType:'application/javascript'}));
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.goto('file://'+D+'/panel.html#planes');await pg.waitForTimeout(900);
const chk=()=>pg.evaluate(()=>{const r=[];document.querySelectorAll('#pwrap .fxp,#pwrap .fx>.c,#pwrap .fx').forEach(e=>{if(e.scrollHeight>e.clientHeight+2)r.push(e.className+' "'+(e.querySelector('h3')?.textContent||'').slice(0,20)+'" '+e.scrollHeight+'/'+e.clientHeight)});return r});
const th=process.argv[2]||'light';await pg.evaluate(t=>document.documentElement.dataset.theme=t,th);
for(const [n,js] of [['compras',"pOpen(0,'compras')"],['ind',"pOpen(0,'ind')"],['ver',"pOpen(0,'ver')"],['start',"pOpen(12)"],['menu',"pOpen(0);document.querySelector('[data-pmenu]').click()"]]){
 await pg.evaluate(js);await pg.waitForTimeout(1200);console.log(n,JSON.stringify(await chk()));await (await pg.$('.app')).screenshot({path:`pl2-${th}-${n}.png`});}
console.log('errors',errs);await b.close();
