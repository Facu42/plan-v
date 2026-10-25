// Seis pantallas de la fase 0B, en la copia de trabajo de la v29.
// Cada botón abre un panel, avisa o cambia algo. Cada vista mide 900 en claro y oscuro.
// En el celular, nada se sale de costado.
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
const D=fileURLToPath(new URL('../../v29/',import.meta.url));
const GSAP=fileURLToPath(new URL('./.gsap/package/dist/gsap.min.js',import.meta.url));
const IDS=['asistente','seguimiento','progreso','alimentos','biblioteca','ayuda'];
const b=await chromium.launch(process.env.PW_CHROMIUM?{executablePath:process.env.PW_CHROMIUM}:{});
const pg=await b.newPage({viewport:{width:1600,height:1200}});
await pg.emulateMedia({reducedMotion:'reduce'});
const errs=[];pg.on('pageerror',e=>errs.push(e.message));
await pg.route('**/gsap.min.js',r=>r.fulfill({path:GSAP,contentType:'application/javascript'}));
const fresh=async id=>{
 await pg.goto('file://'+D+'panel-trabajo.html');
 await pg.waitForSelector('#s-asistente',{state:'attached'});
 await pg.evaluate(id=>go(id),id);
};
const SEL=id=>`#s-${id} button`;
let total=0;
for(const id of IDS){
 await fresh(id);
 const n=await pg.evaluate(sel=>[...document.querySelectorAll(sel)].filter(e=>e.offsetParent).length,SEL(id));
 const out=[];
 for(let i=0;i<n;i++){
  if(i)await fresh(id);
  const r=await pg.evaluate(([sel,i,id])=>{
   const e=[...document.querySelectorAll(sel)].filter(e=>e.offsetParent)[i];
   if(!e)return null;
   const t=(e.getAttribute('aria-label')||e.textContent).trim().replace(/\s+/g,' ').slice(0,32);
   const shot=()=>{
    const w=document.getElementById('actw');
    const shown=[...document.querySelectorAll('.scr')].find(s=>!s.hidden);
    return [w&&!w.hidden?'1':'0',document.getElementById('atoast').textContent,location.hash,shown?shown.id:'',document.querySelector('#s-'+id).innerHTML].join('\u0001');
   };
   document.getElementById('atoast').textContent='';
   const before=shot();
   e.click();
   return [t,before];
  },[SEL(id),i,id]);
  if(!r){errs.push('botón desapareció: '+id+' '+i);continue;}
  await pg.waitForTimeout(80);
  const res=await pg.evaluate(([id,before])=>{
   const w=document.getElementById('actw');
   if(w&&!w.hidden)return 'PANEL';
   if(document.getElementById('atoast').textContent)return 'AVISO';
   const shown=[...document.querySelectorAll('.scr')].find(s=>!s.hidden);
   const now=[w&&!w.hidden?'1':'0',document.getElementById('atoast').textContent,location.hash,shown?shown.id:'',document.querySelector('#s-'+id).innerHTML].join('\u0001');
   return now!==before?'cambia':'—';
  },[id,r[1]]);
  out.push(r[0]+' → '+res);total++;
  if(res==='—')errs.push('sin respuesta: '+id+' '+r[0]);
  if(res==='PANEL'){await pg.keyboard.press('Escape');await pg.waitForTimeout(200);}
 }
 console.log('== '+id+' ('+n+')\n  '+out.join('\n  '));
}
for(const th of ['light','dark'])for(const id of IDS){
 await pg.evaluate(([id,th])=>{setT(th);go(id);},[id,th]);
 await pg.waitForTimeout(80);
 const m=await pg.evaluate(id=>{
  const main=document.querySelector('.main');
  const ovf=[];
  document.querySelectorAll('#s-'+id+' .fxp').forEach(p=>{
   if(p.scrollHeight<=p.clientHeight+2)return;
   const inner=p.querySelector('.fxs');
   if(inner&&inner.scrollHeight>inner.clientHeight)return;
   ovf.push((p.querySelector('h3')?.textContent||'tarjeta').trim().slice(0,40));
  });
  return [main.scrollHeight,main.clientHeight,ovf];
 },id);
 console.log(th,id,m[0]+'/'+m[1],m[2]);
 if(m[0]>m[1]+1)errs.push('alto: '+th+' '+id+' '+m[0]);
 if(m[2].length)errs.push('se sale de la tarjeta: '+th+' '+id+' '+m[2].join(', '));
}
await pg.setViewportSize({width:390,height:844});
await pg.goto('file://'+D+'panel-trabajo.html');
await pg.waitForFunction(()=>typeof mobSet==='function');
await pg.evaluate(()=>mobSet(true));
await pg.waitForTimeout(250);
for(const id of IDS){
 await pg.evaluate(id=>go(id),id);
 await pg.waitForTimeout(180);
 const side=await pg.evaluate(()=>{
  const html=document.documentElement;
  const app=document.querySelector('.app');
  const m=document.querySelector('.main');
  return {
   mob:html.classList.contains('mob'),
   pressed:document.querySelector('#mvw [data-mv="1"]')?.getAttribute('aria-pressed')==='true',
   w:Math.round(app.getBoundingClientRect().width),
   side:m.scrollWidth-m.clientWidth
  };
 });
 console.log('celular',id,JSON.stringify(side));
 if(!side.mob||!side.pressed)errs.push('no activó celular: '+id);
 if(side.w>420)errs.push('sigue en escritorio: '+id+' '+side.w);
 if(side.side>1)errs.push('se sale de costado: '+id+' '+side.side);
}
console.log('botones',total,'errors',errs);
await b.close();
if(errs.length)process.exit(1);
