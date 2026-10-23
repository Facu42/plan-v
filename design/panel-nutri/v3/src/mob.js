/* Celular (Nutreando 0.8): el mismo panel a 390 de ancho.
   Arriba una barra con menú, logo, buscar, avisos y cuenta; abajo cinco accesos; el menú lateral entero se abre como cajón.
   En una pantalla angosta entra solo; en la computadora se elige «Celular» arriba para verlo dentro de un teléfono. */
const MOB={on:false,real:false};
IC.menu||='<path d="M4 7h16M4 12h16M4 17h10"/>';IC.dots||='<circle cx="6" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18" cy="12" r="1.3"/>';
(()=>{const app=document.querySelector('.app'),side=app.querySelector('.side'),main=app.querySelector('.main');
 const bar=document.querySelector('.bar');
 bar.insertAdjacentHTML('afterbegin',`<div class="seg" role="group" aria-label="Tamaño" id="mvw"><button type="button" data-mv="0" aria-pressed="true">Computadora</button><button type="button" data-mv="1" aria-pressed="false">Celular</button></div>`);
 app.insertAdjacentHTML('afterbegin',`<header class="mhd"><button class="ibtn" type="button" id="mmenu" aria-label="Abrir menú" aria-expanded="false">${svg('menu')}</button><span class="mk">V</span><b>Plan V</b><span class="sp"></span><button class="ibtn" type="button" id="msrch" aria-label="Buscar">${svg('search')}</button><button class="ibtn" type="button" aria-label="Avisos">${svg('bell')}<i></i></button><span class="av" style="background:var(--azaf)">VT</span></header><div class="mscrim" id="mscrim"></div>`);
 const NAV=[['inicio','grid','Inicio'],['pacientes','users','Pacientes'],['agenda','cal','Agenda'],['mensajes','chat','Mensajes',4],['mas','dots','Más']];
 app.insertAdjacentHTML('beforeend',`<nav class="mnav" aria-label="Accesos">${NAV.map(([k,i,t,n])=>`<button type="button" ${k==='mas'?'id="mmas"':`data-mgo="${k}"`}>${svg(i,19)}<span>${t}</span>${n?`<b class="num">${n}</b>`:''}</button>`).join('')}</nav>`);
 const drawer=on=>{app.classList.toggle('mdr',on);document.getElementById('mmenu').setAttribute('aria-expanded',on);if(on)side.querySelector('.nv.on')?.focus({preventScroll:true});};
 const mark=id=>{const k=id==='ficha'?'pacientes':id;app.querySelectorAll('.mnav [data-mgo]').forEach(b=>b.classList.toggle('on',b.dataset.mgo===k));
  document.getElementById('mmas').classList.toggle('on',!NAV.some(n=>n[0]===k));};
 app.addEventListener('click',e=>{
  const g=e.target.closest('.mnav [data-mgo]');if(g){e.stopPropagation();go(g.dataset.mgo);return}
  if(e.target.closest('#mmas,#mmenu')){e.stopPropagation();drawer(!app.classList.contains('mdr'));return}
  if(e.target.closest('#mscrim')){drawer(false);return}
  if(e.target.closest('#msrch')){e.stopPropagation();toast('Buscá pacientes, turnos, planes o pagos desde acá');return}
  if(MOB.on&&e.target.closest('.side [data-go],.side .si'))setTimeout(()=>drawer(false),120);
 });
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&app.classList.contains('mdr'))drawer(false);});
 const _g=go;go=function(id){_g(id);mark(id);if(MOB.on){main.scrollTop=0;mobFix();}};
 mark((location.hash||'#inicio').slice(1));
 const size=()=>{const st=document.getElementById('stage');
  if(!MOB.on){st.style.height='';return}
  st.style.height=MOB.real?Math.max(560,innerHeight-16)+'px':'844px';};
 window.mobSet=on=>{MOB.on=on;MOB.real=on&&innerWidth<760;const r=document.documentElement;r.classList.toggle('mob',on);r.classList.toggle('mreal',MOB.real);
  document.querySelectorAll('#mvw button').forEach(b=>b.setAttribute('aria-pressed',(b.dataset.mv==='1')===on));
  drawer(false);size();if(on)mobFix();else fit();
  if(typeof layout==='function')layout();};
 document.getElementById('mvw').addEventListener('click',e=>{const b=e.target.closest('[data-mv]');if(!b)return;e.stopPropagation();mobSet(b.dataset.mv==='1');});
 addEventListener('resize',()=>{if(MOB.on)size();});
 /* Lo que en la computadora va lado a lado, en el celular se apila: se decide una vez por bloque, mirando cuántas columnas tenía. */
 const PANEL='h2,h3,h4,.card,.fxp,.dk,table,.next';
 /* calendarios y tablas que se desplazan de costado quedan como están */
 const SKIP='.days,.hrs,.mg,table,.pgrid,.pdays';
 window.mobFix=()=>{if(!MOB.on)return;
  main.querySelectorAll('table:not(.mst)').forEach(t=>{if(!t.closest('#s-pacientes,.hoy,.lbt')&&!t.matches('.eqm'))t.classList.add('mst');});
  main.querySelectorAll('*').forEach(el=>{if(el.dataset.mk!==undefined||!el.offsetParent)return;if(el.closest(SKIP)){el.dataset.mk='';return}const cs=getComputedStyle(el);
   if(cs.display==='grid'||cs.display==='inline-grid'){const tw=cs.gridTemplateColumns.split(' ').filter(Boolean).map(parseFloat),n=tw.length;if(n<2){el.dataset.mk='';return}
    const even=Math.max(...tw)<=Math.min(...tw)*1.6;
    const big=[...el.children].some(c=>c.matches(PANEL)||c.querySelector(PANEL));
    el.dataset.mk=big?'1':even&&n>2&&el.children.length<=n&&el.clientWidth/n<104?'2':'';}
   else if(cs.display==='flex'&&cs.flexDirection==='row'&&cs.flexWrap==='nowrap'&&el.children.length>1){
    if(el.scrollWidth<=el.clientWidth+2){el.dataset.mk='';return}
    const big=[...el.children].filter(c=>c.matches(PANEL)||c.querySelector(PANEL)).length>1;
    if(big){el.dataset.mk='c';return}
    if(el.matches('.tabs,.seg,.ftabs,[role="tablist"]')){el.dataset.mk='s';return}
    el.dataset.mk='n';if(el.scrollWidth>el.clientWidth+2)el.dataset.mk='w';}
   else el.dataset.mk='';});};
 let q=0;new MutationObserver(()=>{if(!MOB.on||q)return;q=requestAnimationFrame(()=>{q=0;mobFix();});}).observe(main,{childList:true,subtree:true});
 if(innerWidth<760)mobSet(true);
})();
