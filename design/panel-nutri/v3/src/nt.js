/* Funciones sumadas desde el plan de Nutreando (docs/nutreando/plan.md, etapa 0).
   Paso 0.1: campana en todas las pantallas, «Consulta en curso» en el menú, cumpleaños en Inicio y grupos de pacientes. */
IC.gift='<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M4 13h16M12 9c-1.5-3-5-4-5-1.5S9.5 9 12 9zm0 0c1.5-3 5-4 5-1.5S14.5 9 12 9z"/>';
IC.bell=IC.bell||'<path d="M6 16V11a6 6 0 0112 0v5l1.5 2h-15z"/><path d="M10 20a2 2 0 004 0"/>';

/* Campana de avisos: la misma en todas las pantallas, con filtros por tipo */
const NTAV=[['msg','Julia Sosa te escribió','«¿Puedo cambiar el arroz por quinoa?» · hace 25 min',1],
 ['reg','Sofía Gómez cargó el desayuno','Tostadas con palta y huevo · hoy 8:10',1],
 ['tur','Carolina Ríos pidió un turno','Primera vez · jueves 23, 17:00 · desde tu página',1],
 ['for','Martina Díaz completó un formulario','Preferencias y rechazos · hoy 9:02',1],
 ['cum','Lucía Ferrero cumple 29 mañana','Mandale un saludo por la app',0],
 ['lab','Ferritina baja de Sofía Gómez','Laboratorio nuevo · leído por la IA · hace 2 h',0],
 ['tur','Laura Ruiz no confirmó su turno','Hoy 16:00 · videollamada',0],
 ['reg','Paula Acosta registró 3 comidas fuera del plan','Ayer · la IA lo marcó para revisar',0]];
const NTTY={msg:['b','chat','Mensajes'],reg:['l','clip','Registros'],tur:['a','cal','Turnos'],for:['n','file','Formularios'],cum:['l','gift','Cumpleaños'],lab:['r','drop','Laboratorio']};
const ntAvH=f=>`<div class="ntav">${NTAV.filter(a=>f==='Todos'||(f==='Sin leer'?a[3]:NTTY[a[0]][2]===f)).map(([k,t,s,u])=>`<div class="${u?'u':''}"><span class="ico ${NTTY[k][0]}">${svg(NTTY[k][1],14)}</span><span class="t"><b>${t}</b><small>${s}</small></span>${u?'<i aria-label="Sin leer"></i>':''}</div>`).join('')||'<p class="ntempty">No hay avisos de este tipo.</p>'}</div>`;
const NTAVISOS=()=>{const n=NTAV.filter(a=>a[3]).length;return {t:'Avisos',s:n?`${n} sin leer`:'Todo leído',ok:'Marcar todo como leído',
 body:`<div class="ntf">${aF('Mostrar',aSeg(['Todos','Sin leer','Mensajes','Registros','Turnos','Formularios','Cumpleaños']))}</div>`+`<div id="ntavl">${ntAvH('Todos')}</div>`,
 pick:b=>{document.getElementById('ntavl').innerHTML=ntAvH(b.textContent);},
 after:()=>{NTAV.forEach(a=>a[3]=0);document.querySelectorAll('.ibtn[aria-label="Avisos"] i').forEach(i=>i.remove());},
 done:'Avisos marcados como leídos.'};};
ACT['Avisos']=NTAVISOS;
document.querySelectorAll('.scr .top').forEach(t=>{if(t.querySelector('[aria-label="Avisos"]'))return;const c=t.querySelector(':scope>.cta');
 const h=`<button class="ibtn" type="button" aria-label="Avisos">${svg('bell')}<i></i></button>`;c?c.insertAdjacentHTML('beforebegin',h):t.insertAdjacentHTML('beforeend',h);});
(()=>{const c=document.querySelector('#s-ficha .fh [data-chat="open"]');if(c)c.insertAdjacentHTML('beforebegin',`<button class="ibtn" type="button" aria-label="Avisos">${svg('bell')}<i></i></button>`);})();
document.addEventListener('click',e=>{const b=e.target.closest('.ibtn[aria-label="Avisos"]');if(!b||e.target.closest('#actw'))return;e.stopPropagation();aOpen(NTAVISOS());},true);

/* Consulta en curso: aviso fijo en el menú para volver a la consulta desde cualquier pantalla */
document.querySelector('.side .acct').insertAdjacentHTML('beforebegin',`<button type="button" class="ntlive" id="ntlive" hidden><i></i><span class="lbl"><b>Consulta en curso</b><small>Sofía Gómez · <span class="num" id="ntlt">0:00</span></small></span><span class="lbl go">Retomar</span></button>`);
let ntT0=0,ntTi;const ntL=document.getElementById('ntlive');
const ntTick=()=>{const s=Math.floor((Date.now()-ntT0)/1000);document.getElementById('ntlt').textContent=`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
const _ntStart=aStart;aStart=function(b){_ntStart(b);const on=b.classList.contains('live');ntL.hidden=!on;clearInterval(ntTi);if(on){ntT0=Date.now();ntTick();ntTi=setInterval(ntTick,1000);}};
ntL.addEventListener('click',()=>{go('ficha');ftab='consultas';drawFicha();});

/* Cumpleaños: entra en Pendientes con el filtro «Felicitar» */
PEN.splice(PEN.findIndex(p=>p[1]==='fel'),0,['cumple','fel','l','gift','Lucía Ferrero cumple 29 mañana','Mandale un saludo por la app','Felicitar']);
DET.cumple={hd:'Cumpleaños',live:'mañana',av:'LF',n:'Lucía Ferrero',s:'Cumple 29 el viernes 24/10 · paciente desde abril',r:'29',rs:'años',
 ns:[['Cumple','Vie 24','mañana'],['Avance','−4,2','kg desde abril'],['Adherencia','78%','esta semana'],['Próxima','30/10','consulta']],
 note:['Idea:','un saludo corto por la app. Ya está escrito; lo podés cambiar antes de mandarlo.'],act:[['file','Ficha','ficha'],['chat','Mandar saludo',0,1]]};
if(typeof GHEAD==='object')GHEAD.cumple='Lucía cumple años mañana';
if(typeof PCT==='object')PCT.cumple=78;
if(typeof PLAB==='object')PLAB.cumple='adherencia';
ACT['Mandar saludo']=()=>({...MSG('Lucía Ferrero','¡Feliz cumpleaños, Lucía! Que tengas un gran día. Te mando un abrazo.'),t:'Saludo de cumpleaños',s:'Le llega a su app mañana a las 9:00',ok:'Programar saludo',done:'Saludo programado para mañana a las 9:00.'});
drawPen();

/* Grupos de pacientes: filtro en Pacientes y destinatarias en «Mensaje a varias» */
const NTGR=[['Celíacas',6],['Programa verano',8],['Embarazo',2],['Equipo de running',5],['Primera vez',5]];
(()=>{const i=document.querySelector('#s-pacientes .top [data-ic="up"]');if(i)i.insertAdjacentHTML('beforebegin',`<button class="chip" type="button">${svg('users')}Grupos</button>`);})();
ACT['pacientes:Grupos']=()=>({t:'Grupos de pacientes',s:'Sirven para filtrar y para escribirles a todas juntas',ok:'Ver este grupo',
 body:aF('Mostrar',aSeg(['Todas',...NTGR.map(([g,n])=>`${g} · ${n}`)]))+aF('Nuevo grupo',aI('','Por ejemplo: Taller de cocina'))+aF('Sumar al nuevo grupo',aCh(PAC.slice(0,6)),'Una paciente puede estar en varios grupos.'),
 after:b=>{const g=b.querySelector('.aseg [aria-checked=true]').textContent,nw=aVal(b,0).trim();if(nw)NTGR.push([nw,b.querySelectorAll('.ach [aria-pressed=true]').length]);
  document.querySelector('#s-pacientes h1 span').textContent=g==='Todas'?'· 48 activas':'· grupo '+g;},
 done:b=>{const nw=aVal(b,0).trim();return nw?`Grupo «${nw}» creado.`:'Lista filtrada por grupo.';}});
const _ntVar=MACT.varias;MACT.varias=b=>{const r=_ntVar(b);r.body=r.body.replace('<div class="ach">',`<div class="ach">${NTGR.slice(0,3).map(([g,n])=>`<button type="button" aria-pressed="false">Grupo ${g} · ${n}</button>`).join('')}`);return r;};
/* Con la campana y Grupos, los subtítulos de Mensajes y Pacientes se acortan para seguir en una línea */
(()=>{const p=document.querySelector('#s-pacientes .top .date');if(p)p.textContent='Adherencia 82 % · 7 en su objetivo este año · 7 sin registrar hace 3 días';const d=document.querySelector('#s-mensajes .top .date');if(d)d.textContent='Chat en la app · respondés en 1 h 20 min en promedio';})();
