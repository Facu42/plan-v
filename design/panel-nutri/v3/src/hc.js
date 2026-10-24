/* Ficha · Historia clínica y Laboratorio (pedido de Facundo, 23/10).
   Historia: un índice de temas y el tema abierto para editar en el lugar; cada dato con su fecha y de dónde salió;
   lo que la IA escuchó en la consulta grabada llega como propuesta y no se guarda sin aceptarlo; vista por fecha y
   «cómo estaba» en una fecha pasada. Laboratorio: valores por fecha de análisis, detalle con las fechas de lo que
   cambió en la historia, lo dicho en la consulta como propuesta, y vista por fecha con análisis y estudios. */
const HOY='2026-10-23';
const hcD=s=>{if(!s)return '';const [y,m,d]=s.split('-');return d?`${d}/${m}/${y.slice(2)}`:y;};
const HCSRC={g:'Consulta grabada',v:'Vos',s:'Sofía, en la app',i:'Importado',r:'Formulario'};
/* [clave, tema, estado si está vacío, datos: [texto, desde, de dónde, cargado, se dio de baja, por qué]] */
const HCS=[
 ['motivo','Motivo y objetivo','',[['Bajar grasa y tener más energía. Probó dietas estrictas y las dejó al mes.','','v','2026-03-12']]],
 ['diag','Diagnósticos','',[['Celiaquía, con biopsia','desde 2019','v','2026-03-12'],['Hipotiroidismo compensado','desde 2021','v','2026-03-12'],['Anemia leve','desde 2024','v','2026-09-16']]],
 ['med','Medicación y suplementos','',[['Levotiroxina 25 µg en ayunas','','i','2025-06-10','2026-03-12','la endocrinóloga subió la dosis'],['Levotiroxina 50 µg en ayunas','desde marzo 2026','v','2026-03-12'],['Sin suplementos','','v','2026-03-12','2026-10-14','empezó hierro'],['Hierro, 1 por día','desde el 20/08/26','v','2026-10-14']]],
 ['alerg','Alergias e intolerancias','',[['Gluten (celiaquía)','desde 2019','v','2026-03-12'],['Lactosa','','v','2026-03-12']]],
 ['fam','Antecedentes familiares','',[['Madre con diabetes tipo 2','','v','2026-03-12'],['Padre hipertenso','','v','2026-03-12']]],
 ['halim','Historia alimentaria','',[['Dietas de 1.200 kcal en 2023 y 2025, abandonadas al mes','','v','2026-03-12'],['Come rápido y saltea comidas con estrés','','v','2026-03-12']]],
 ['r24','Recordatorio de 24 h','',[['Mate solo · tostadas con queso · fideos con salsa','','v','2026-03-12','2026-10-12','cargó uno nuevo'],['Mate solo · tostadas sin TACC con queso · ensalada con pollo · galletitas · fideos de arroz con salsa','','s','2026-10-12']]],
 ['hab','Hábitos','',[['Fuma 5 cigarrillos por día','','i','2025-06-10','2026-03-12','dejó en enero'],['Almuerza en la oficina y cena tarde. Pica a la tarde.','','v','2026-03-12'],['Alcohol: 1 copa los sábados','','v','2026-03-12']]],
 ['act','Actividad física','',[['Camina 3 veces por semana, 40 min','','v','2026-03-12']]],
 ['sue','Sueño y estrés','',[['Duerme 6 h','','v','2026-03-12'],['Estrés laboral alto','','v','2026-03-12']]],
 ['dig','Digestión','',[['Hinchazón después de legumbres. Tránsito normal.','','v','2026-03-12']]],
 ['ciclo','Ciclo menstrual','',[['Regular, sin anticonceptivos','','v','2026-03-12']]],
 ['emb','Embarazo y lactancia','na',[]],
 ['pref','Preferencias y rechazos','miss',[]]
].map(([k,t,st,l])=>({k,t,st,l:l.map(([x,de,src,on,off,why])=>({x,de,src,on,off,why}))}));
/* Lo que la IA sacó de la consulta grabada del 14/10: [tema, texto, frase, minuto, reemplaza a] */
const HCSG=[['med','Omeprazol 20 mg en ayunas, se lo indicó la gastroenteróloga','la gastro me dio omeprazol, lo tomo a la mañana','12:40'],
 ['dig','Acidez a la noche, 2 o 3 veces por semana, peor si cena tarde','a la noche me da acidez, sobre todo si ceno tarde','13:05'],
 ['act','Empezó el gimnasio: fuerza martes y jueves, 1 hora','arranqué el gimnasio, voy martes y jueves','21:30'],
 ['sue','Duerme 7 h desde que cena más temprano','ahora duermo como 7 horas','24:10','Duerme 6 h']].map(([k,x,q,m,rep])=>({k,x,q,m,rep,st:''}));
const HC={sec:'med',view:0,snap:null};
const hcSec=k=>HCS.find(s=>s.k===k);
const hcAt=()=>HC.snap||HOY;
const hcLive=s=>s.l.map((e,i)=>[e,i]).filter(([e])=>e.on<=hcAt()&&(!e.off||e.off>hcAt()));
const hcPast=s=>s.l.map((e,i)=>[e,i]).filter(([e])=>e.off&&e.off<=hcAt());
const hcLast=s=>s.l.reduce((m,e)=>[e.on,e.off||'',e.ed||''].filter(d=>d&&d<=hcAt()).reduce((a,b)=>b>a?b:a,m),'');
const hcDone=()=>HCS.filter(s=>s.st!=='miss'||s.l.length).length;

function hcIdx(){return `<nav class="hcidx" aria-label="Temas">${HCS.map(s=>{const n=hcLive(s).length,l=hcLast(s),nw=!HC.snap&&HCSG.some(g=>g.k===s.k&&!g.st);
  const st=s.st==='miss'&&!s.l.length?'miss':s.st==='na'?'na':'ok';
  return `<button type="button" data-hcs="${s.k}" class="${HC.sec===s.k?'on':''}"><i class="st ${st}"></i><span><b>${s.t}</b><small>${st==='miss'?'Falta completar':st==='na'?'No aplica':`${n} dato${n===1?'':'s'} · ${hcD(l)}`}</small></span>${nw?'<em title="Hay una propuesta de la consulta">IA</em>':''}</button>`;}).join('')}
  <div class="hcidxf"><button type="button" class="lnk" data-hctpl>Plantilla: General + Celiaquía</button><button class="lnk" type="button">Ver respuestas</button></div></nav>`;}
function hcEd(){const s=hcSec(HC.sec),live=hcLive(s),past=hcPast(s),ro=!!HC.snap,l=hcLast(s);
 const ent=([e,i])=>`<div class="hce${e.src==='g'?' g':''}"><div class="hcin" data-hci="${i}" ${ro?'':'contenteditable="true"'} spellcheck="false" role="textbox" aria-label="${s.t}">${e.x}</div>
  <div class="hcm">${e.de?`<span class="hcde">${svg('cal',12)}${e.de}</span>`:''}<span class="hcsrc s-${e.src}">${HCSRC[e.src]} · ${hcD(e.on)}</span>${e.ed?`<span class="hcsrc">editado ${hcD(e.ed)}</span>`:''}<span class="sp"></span>${ro?'':`<button type="button" class="lnk" data-hcoff="${i}">Dar de baja</button>`}</div></div>`;
 const empty=s.st==='na'?`<div class="hcemp"><b>No aplica por ahora</b><span>Se vuelve a preguntar en cada consulta.</span>${ro?'':`<button type="button" class="sbtn" data-hcadd>Cargar un dato</button>`}</div>`
  :`<div class="hcemp"><b>Todavía no hay datos</b><span>Podés mandarle el formulario a Sofía o cargarlo vos en la consulta.</span>${ro?'':`<div class="hcemb"><button type="button" class="sbtn" data-hcform>Mandar formulario</button><button type="button" class="sbtn k" data-hcadd>Cargar yo</button></div>`}</div>`;
 return `<div class="hced"><header><div><h4>${s.t}</h4><small>${l?`Último cambio el ${hcD(l)}`:'Sin cambios todavía'}</small></div><span class="sp"></span>${ro?'':`<button type="button" class="sbtn cbtn" data-hcadd>${svg('plus',13)}Agregar dato</button>`}</header>
  <div class="hcel">${live.length?live.map(ent).join(''):empty}
  ${past.length?`<div class="hcpast"><span class="sect">Antes</span>${past.map(([e])=>`<div><s>${e.x}</s><small>${hcD(e.on)} → ${hcD(e.off)}${e.why?` · ${e.why}`:''}</small></div>`).join('')}</div>`:''}</div></div>`;}
function hcByDate(){const ev=[];HCS.forEach(s=>s.l.forEach(e=>{if(e.on<=hcAt())ev.push([e.on,s.t,e.x,'n',e.src]);if(e.off&&e.off<=hcAt())ev.push([e.off,s.t,e.x,'b',e.why]);if(e.ed&&e.ed<=hcAt())ev.push([e.ed,s.t,e.x,'e','v']);}));
 const g={};ev.sort((a,b)=>b[0].localeCompare(a[0])).forEach(x=>(g[x[0]]=g[x[0]]||[]).push(x));
 const what={'2026-03-12':'Primera consulta','2025-06-10':'Importado de otro consultorio','2026-10-14':'Consulta del 14/10','2026-10-12':'Desde la app de Sofía','2026-09-16':'Consulta del 16/09'};
 return `<div class="fxs hcbd">${Object.entries(g).map(([d,l])=>`<div class="hcday"><div class="hcdh"><b>${hcD(d)}</b><span>${what[d]||(d===HOY?'Hoy':'Cambios')}</span><span class="sp"></span><button type="button" class="lnk" data-hcsnapd="${d}">Ver cómo estaba</button></div>
  ${l.map(([,t,x,k,w])=>`<div class="hcdi ${k}"><span class="hctag">${t}</span><span>${k==='b'?`<s>${x}</s> <small>se dio de baja${w?` · ${w}`:''}</small>`:k==='e'?`${x} <small>editado</small>`:x}</span></div>`).join('')}</div>`).join('')}</div>`;}
function hcMain(){const snap=HC.snap?`<div class="hcsnap">${svg('clock',14)}<span>Así estaba la historia el <b>${hcD(HC.snap)}</b>. Solo para leer.</span><button type="button" class="sbtn" data-hcsnapd="">Volver a hoy</button></div>`:'';
 return fxP('Historia clínica',pill(`${hcDone()} de ${HCS.length} temas`,'p-conf'),
  `<div class="tabs hcv"><button type="button" data-hcv="0" class="${HC.view?'':'on'}">Por tema</button><button type="button" data-hcv="1" class="${HC.view?'on':''}">Por fecha</button></div><button type="button" class="sbtn cbtn" data-hcsnap>${svg('clock',13)}${HC.snap?hcD(HC.snap):'Hoy'}</button>${sb('Formularios','','send')}`,
  snap+(HC.view?hcByDate():`<div class="hcdoc">${hcIdx()}${hcEd()}</div>`),'g');}
function hcSug(){const pend=HCSG.filter(g=>!g.st).length;
 return fxP('De la consulta grabada','14/10 · 38 min',pend>1?`<button type="button" class="sbtn k" data-hcall>Aceptar ${pend}</button>`:'',
  `<small class="fxhint hcnote">${svg('spark',13)}La IA escuchó la consulta y propone estos cambios. Nada entra a la historia hasta que lo aceptes.</small>
  <div class="fxs hcsgl">${HCSG.map((g,i)=>`<div class="hcsg ${g.st}"><div class="hcsgh"><span class="hctag">${hcSec(g.k).t}</span><span class="sp"></span>${g.st==='ok'?`${pill('Agregado','p-conf')}<button type="button" class="lnk" data-hcs="${g.k}">Ver</button>`:g.st==='no'?`${pill('Descartado','p-ok')}<button type="button" class="lnk" data-hcundo="${i}">Recuperar</button>`:`<button type="button" class="sbtn k" data-hcok="${i}">Aceptar</button><button type="button" class="sbtn" data-hced="${i}">Editar</button><button type="button" class="sbtn" data-hcno="${i}" aria-label="Descartar">${svg('x',11)}</button>`}</div>
   <b>${g.x}</b>${g.rep&&!g.st?`<small class="hcrep">Reemplaza: <s>${g.rep}</s></small>`:''}
   <button type="button" class="hcq" data-hcq="${i}">${svg('play',11)}<span class="num">${g.m}</span><em>«${g.q}»</em></button></div>`).join('')}
  <small class="fxhint">La consulta de hoy se suma acá cuando la firmes.</small></div>`,'g');}
const hcSide=()=>fxP('Datos que cambian el plan',HCSG[0].st==='ok'?'7':'6','',`<div class="fxchips">${['Sin gluten','Sin lactosa','Hierro con vitamina C','Levotiroxina lejos del desayuno',...(HCSG[0].st==='ok'?['Omeprazol: separar del hierro']:[]),'Legumbres solo a la noche','Cena antes de las 21'].map(t=>`<span>${t}</span>`).join('')}</div>`);
FT.historia=()=>`<div class="fx hcx" style="grid-template-columns:1.62fr 1fr"><div class="c">${hcMain()}</div><div class="c">${hcSug()}${hcSide()}</div></div>`;

/* Laboratorio */
const LBD=[['2024-07-15','Otro consultorio','Importado'],['2026-03-20','Lab. Hidalgo','PDF leído por la IA'],['2026-10-12','Lab. Hidalgo','PDF leído por la IA']];
/* [grupo, valor, unidad, mínimo, máximo, referencia, valores por fecha, eventos de la historia] */
const LBV=[['Hierro y anemia','Ferritina','ng/ml',30,200,'30–200',[9,11,14],['hierro']],['Hierro y anemia','Hemoglobina','g/dl',12,16,'12–16',[11.4,11.9,12.3],['hierro']],
 ['Vitaminas','Vitamina D','ng/ml',30,100,'30–100',[22,25,28],[]],['Vitaminas','Vitamina B12','pg/ml',200,900,'200–900',[300,310,352],[]],
 ['Metabolismo','Glucemia','mg/dl',70,100,'70–100',[90,88,86],[]],['Metabolismo','Colesterol total','mg/dl',0,200,'< 200',[195,188,182],[]],
 ['Tiroides','TSH','µUI/ml',0.4,4,'0,4–4',[2.1,2.2,2.3],['levo']],['Celiaquía','Anticuerpos celíacos','U/ml',0,10,'< 10',[18,12,8],['tacc']]];
const LBEV={hierro:['2026-08-20','Hierro'],levo:['2026-03-12','Levotiroxina 50 µg'],tacc:['2026-03-12','Sin TACC estricto']};
const LBES=[['2026-09-02','Ecografía abdominal','Hígado graso leve. Vesícula y páncreas normales.','Ecografía abdominal.jpg','Subido por Sofía'],['2025-05-20','Densitometría','Normal para la edad.','Densitometría 2025.pdf','Importado']];
const LBSG=[{x:'Glucemia 98 mg/dl en ayunas, en la clínica el 30/09',q:'me hice glucemia en la clínica el 30, me dio 98',m:'17:20',k:'dato',st:''},
 {x:'Análisis completo en el Hospital Alemán, en septiembre',q:'en septiembre me hice un análisis completo en el Alemán',m:'18:05',k:'pedir',st:''}];
const LB={view:0,row:0,col:null};
const lbFmt=x=>x==null?'—':String(x).replace('.',',');
const lbOut=(r,x)=>x!=null&&(x<r[3]||x>r[4]);
const lbCols=()=>LBSG[0].st==='ok'?[...LBD.slice(0,2),['2026-09-30','Clínica','Dicho por Sofía'],LBD[2]]:LBD;
const lbVals=r=>LBSG[0].st==='ok'?[r[6][0],r[6][1],r[1]==='Glucemia'?98:null,r[6][2]]:r[6];
const lbSt=r=>{const v=r[6][2];return v<r[3]?['Bajo','p-bad']:v>r[4]?['Alto','p-bad']:(v-r[3])/(r[4]-r[3])<.1?['Límite','p-wait']:['Normal','p-conf'];};
function lbTable(){const C=lbCols();let g='';
 return `<div class="fxs fxtb tall lbt"><table><thead><tr><th>Valor</th><th>Referencia</th>${C.map(([d,lab,s],k)=>`<th class="${LB.col===k?'colsel':''}"><button type="button" class="lbch" data-lbc="${k}"><b class="num">${hcD(d)}</b><small>${s.startsWith('Dicho')?'dicho':lab}</small></button></th>`).join('')}<th>Tendencia</th><th>Estado</th></tr></thead><tbody>${LBV.map((r,i)=>{const v=lbVals(r),[s,pc]=lbSt(r);
  const h=r[0]!==g?(g=r[0],`<tr class="lbg"><td colspan="${C.length+4}">${r[0]}</td></tr>`):'';
  return h+`<tr data-lbr="${i}" class="${LB.col==null&&LB.row===i?'sel':''}"><td><b>${r[1]}</b> <span class="u">${r[2]}</span></td><td class="num u">${r[5]}</td>${v.map((x,k)=>`<td class="num${k===v.length-1?' last':''}${lbOut(r,x)?' out':''}${C[k][2].startsWith('Dicho')?' said':''}${LB.col===k?' colsel':''}">${lbFmt(x)}</td>`).join('')}<td style="width:78px">${fxCurve(r[6],null,{w:70,h:22,mini:1,warn:s!=='Normal'})}</td><td>${pill(s,pc)}</td></tr>`;}).join('')}</tbody></table></div>`;}
function lbByDate(){const L=[...LBD.map(([d,lab,s],k)=>({d,t:`Laboratorio · ${lab}`,f:k===0?'Laboratorio 07-24.pdf':k===1?'Laboratorio 03-26.pdf':'Laboratorio 12-10.pdf',s:`${LBV.length} valores · ${LBV.filter(r=>lbOut(r,r[6][k])).length} fuera de rango · ${s}`,k})),
  ...LBES.map(([d,t,c,f,s])=>({d,t,f,s:`${c} ${s}`})),...(LBSG[0].st==='ok'?[{d:'2026-09-30',t:'Glucemia dicha en la consulta',f:'',s:'98 mg/dl · sin estudio, lo contó Sofía el 14/10'}]:[])].sort((a,b)=>b.d.localeCompare(a.d));
 return `<div class="fxs"><div class="fxr lbbd">${L.map(o=>`<div class="${o.f.endsWith('.pdf')&&o.k!=null?'b':o.f?'l':'a'}"><time class="num">${hcD(o.d)}</time><span class="t"><b>${o.f||o.t}</b><small>${o.f?o.t+' · ':''}${o.s}</small></span>${o.k!=null?`<button type="button" class="sbtn" data-lbc="${o.k}">Valores</button>`:''}${o.f?sb('Ver','','eye'):''}</div>`).join('')}</div></div>`;}
function lbChart(r){const C=lbCols(),v=lbVals(r),pts=C.map((c,k)=>[c[0],v[k],c[2].startsWith('Dicho')]).filter(p=>p[1]!=null);
 const W=340,H=124,pl=8,pr=44,pt=22,pb=20,T=d=>Date.parse(d),t0=T('2024-05-01'),t1=T('2026-12-15');
 const vals=pts.map(p=>p[1]),lo=Math.min(...vals,r[3]),hi=Math.max(...vals,r[3]),pad=(hi-lo)*.25||1,mn=Math.max(0,lo-pad),mx=Math.min(r[4]+pad,Math.max(hi+pad,r[3]*1.4));
 const X=d=>pl+(T(d)-t0)/(t1-t0)*(W-pl-pr),Y=x=>pt+(mx-Math.min(x,mx))/(mx-mn)*(H-pt-pb);
 const band=`<rect class="lbband" x="${pl}" width="${W-pl-pr}" y="${Y(Math.min(r[4],mx)).toFixed(1)}" height="${(Y(Math.max(r[3],mn))-Y(Math.min(r[4],mx))).toFixed(1)}"/>`;
 const ev=r[7].map(k=>{const [d,t]=LBEV[k],x=X(d).toFixed(1);return `<line class="lbev" x1="${x}" x2="${x}" y1="${pt-6}" y2="${H-pb}"/><text class="lbevt" x="${(+x+4).toFixed(1)}" y="${pt-9}">${t}</text>`;}).join('');
 const P=pts.map(([d,x])=>[X(d),Y(x)]),dd=P.map((p,k)=>(k?'L':'M')+p[0].toFixed(1)+' '+p[1].toFixed(1)).join(' ');
 return `<svg class="lbchart" viewBox="0 0 ${W} ${H}" aria-hidden="true">${band}<text class="lbbt" x="${W-pr+6}" y="${(Y(Math.max(r[3],mn))-2).toFixed(1)}">${r[5]}</text>${ev}<path class="lbln" d="${dd}"/>
  ${pts.map(([d,x,said],k)=>`<circle class="lbpt${lbOut(r,x)?' out':''}${said?' said':''}" cx="${P[k][0].toFixed(1)}" cy="${P[k][1].toFixed(1)}" r="4"/><text class="lbpv" x="${P[k][0].toFixed(1)}" y="${(P[k][1]-9).toFixed(1)}" text-anchor="middle">${lbFmt(x)}</text>`).join('')}
  ${['2024','2025','2026'].map(y=>`<text class="lbx" x="${X(y+'-07-01').toFixed(1)}" y="${H-6}" text-anchor="middle">${y}</text>`).join('')}</svg>`;}
function lbDet(){if(LB.col!=null){const C=lbCols(),c=C[LB.col];
  return fxP(`Análisis del ${hcD(c[0])}`,`${c[1]} · ${c[2]}`,`<button type="button" class="lnk" data-lbr="${LB.row}">Ver por valor</button>`,`<div class="fxs"><div class="lbcmp">${LBV.map(r=>{const v=lbVals(r),x=v[LB.col];if(x==null)return '';const p=v.slice(0,LB.col).filter(y=>y!=null).pop();
   const d=p==null?'':x>p?'↑':x<p?'↓':'=';return `<div class="${lbOut(r,x)?'out':''}"><span>${r[1]}</span><b class="num">${lbFmt(x)} <small>${r[2]}</small></b><em class="num">${p==null?'primera vez':`${d} antes ${lbFmt(p)}`}</em></div>`;}).join('')}</div></div>`,'g');}
 const r=LBV[LB.row],[s,pc]=lbSt(r),C=lbCols(),v=lbVals(r);
 return fxP(r[1],pill(s,pc),'',`${lbChart(r)}${r[7].length?`<small class="fxhint lbevh">${svg('clip',12)}Línea punteada: ${r[7].map(k=>`${LBEV[k][1]} desde el ${hcD(LBEV[k][0])}`).join(', ')}, según la historia clínica.</small>`:''}
  <div class="fxs lbhist">${C.map((c,k)=>v[k]==null?'':`<div class="${lbOut(r,v[k])?'out':''}"><time class="num">${hcD(c[0])}</time><b class="num">${lbFmt(v[k])} <small>${r[2]}</small></b><span>${c[1]} · ${c[2]}</span></div>`).reverse().join('')}</div>
  ${r[1]==='Ferritina'?fxAi('Sugerencia de la IA:','sumar lentejas, carne magra y espinaca con cítricos 4 veces por semana.',sb('Aplicar al plan','k')):''}`,'g');}
const lbSug=()=>fxP('De la consulta grabada','14/10 · lo que Sofía contó de sus análisis','',`<div class="hcsgl lbsg">${LBSG.map((g,i)=>`<div class="hcsg ${g.st}"><b>${g.x}</b><button type="button" class="hcq" data-lbq="${i}">${svg('play',11)}<span class="num">${g.m}</span><em>«${g.q}»</em></button>
 <div class="hcsga">${g.st==='ok'?pill(g.k==='dato'?'Agregado como dato dicho':'Pedido enviado a su app','p-conf'):g.st==='no'?`${pill('Descartado','p-ok')}<button type="button" class="sbtn" data-lbundo="${i}">Recuperar</button>`:`<button type="button" class="sbtn k" data-lbok="${i}">${g.k==='dato'?'Agregar como dato dicho':'Pedirle que lo suba'}</button><button type="button" class="sbtn" data-lbno="${i}">Descartar</button>`}</div></div>`).join('')}</div>`);
const lbPed=()=>fxP('Pedidos de estudios','',sb('Nuevo pedido','k','plus'),fxRows([['a','Hierro, ferritina y vitamina D','pedido hoy · para mediados de diciembre',pill('Por enviar','p-wait')],['l','Perfil tiroideo','pedido el 12/03',pill('Recibido','p-conf')]]));
FT.laboratorio=()=>`<div class="fx hcx" style="grid-template-columns:1.62fr 1fr"><div class="c">${fxP('Laboratorio y estudios','',
 `<div class="tabs lbv"><button type="button" data-lbv="0" class="${LB.view?'':'on'}">Valores</button><button type="button" data-lbv="1" class="${LB.view?'on':''}">Por fecha</button></div>${sb('Agregar valor','','plus')}${sb('Analizar con IA','','spark')}${sb('Cargar análisis','k','up')}`,
 LB.view?lbByDate():`${lbTable()}<small class="fxhint">Tocá una fecha para ver ese análisis entero, o un valor para ver cómo cambió.</small>`,'g')}${lbSug()}</div><div class="c">${lbDet()}${lbPed()}</div></div>`;

/* Lo que se toca en estas dos pestañas */
const hcRe=()=>{const w=document.getElementById('fwrap'),s=w.querySelector('.hced .hcel,.hcbd'),y=s?s.scrollTop:0;w.innerHTML=FT[ftab]();const n=w.querySelector('.hced .hcel,.hcbd');if(n)n.scrollTop=y;};
const hcAdd=(k,x,src,rep)=>{const s=hcSec(k);if(rep){const o=s.l.find(e=>e.x===rep&&!e.off);if(o){o.off=src==='g'?'2026-10-14':HOY;o.why=src==='g'?'lo cambió la consulta del 14/10':'reemplazado por vos';}}s.l.push({x,de:'',src,on:src==='g'?'2026-10-14':HOY});};
const hcTr=(m,q)=>({t:'Consulta grabada del 14/10',s:`Desde el minuto ${m} · 38 min en total`,ok:false,body:`<div class="hctr">${[['Vero','¿Cómo venís con la medicación?'],['Sofía',q],['Vero','Bien, lo anoto. ¿Algo más que te hayan indicado?'],['Sofía','No, eso nomás.']].map(([w,t],k)=>`<p class="${k===1?'hl':''}"><b>${w}</b>${t}</p>`).join('')}</div><small class="nthint">La grabación y la transcripción quedan solo en la ficha. Sofía puede pedir que se borren.</small>`});
document.getElementById('fwrap').addEventListener('click',e=>{const b=e.target.closest('[data-hcs],[data-hcv],[data-hcsnap],[data-hcsnapd],[data-hcadd],[data-hcoff],[data-hcok],[data-hcno],[data-hced],[data-hcundo],[data-hcall],[data-hcq],[data-hctpl],[data-hcform],[data-lbv],[data-lbc],[data-lbr],[data-lbok],[data-lbno],[data-lbundo],[data-lbq]');
 if(!b||b.closest('.hcin'))return;e.stopPropagation();const d=b.dataset;
 if(d.hcs){HC.sec=d.hcs;HC.view=0;hcRe();return}
 if(d.hcv){HC.view=+d.hcv;hcRe();return}
 if(d.hcsnapd!==undefined){HC.snap=d.hcsnapd||null;HC.view=0;hcRe();if(HC.snap)toast(`Mostrando la historia como estaba el ${hcD(HC.snap)}.`);return}
 if(d.hcsnap!==undefined){const O=[['Hoy',''],['14/10/26 · consulta','2026-10-14'],['16/09/26 · consulta','2026-09-16'],['12/03/26 · primera consulta','2026-03-12'],['10/06/25 · importado','2025-06-10']];
  aOpen({t:'Ver cómo estaba',s:'Elegí una fecha: la historia se muestra como estaba ese día',ok:'Ver',body:aF('Fecha',aS(O.map(o=>o[0]),HC.snap?O.find(o=>o[1]===HC.snap)?.[0]:'Hoy'))+`<small class="nthint">Solo para leer. Para cambiar algo, volvé a hoy.</small>`,
   done:w=>{HC.snap=O.find(o=>o[0]===aVal(w,0))[1]||null;HC.view=0;setTimeout(hcRe,0);return HC.snap?`Historia al ${hcD(HC.snap)}.`:'Historia de hoy.';}});return}
 if(d.hcadd!==undefined){const s=hcSec(HC.sec);s.l.push({x:'',de:'',src:'v',on:HOY});if(s.st==='na')s.st='';hcRe();const n=[...document.querySelectorAll('#fwrap .hcin')].pop();if(n){n.focus();n.dataset.ph='Escribí el dato';}return}
 if(d.hcoff){const s=hcSec(HC.sec),x=s.l[+d.hcoff];x.off=HOY;x.why='dado de baja por vos';hcRe();toast(`«${x.x.slice(0,40)}» pasó a «Antes» con la fecha de hoy.`);return}
 if(d.hcok){const g=HCSG[+d.hcok];hcAdd(g.k,g.x,'g',g.rep);g.st='ok';HC.sec=g.k;hcRe();toast(`Agregado a ${hcSec(g.k).t}, con la fecha de la consulta.`);return}
 if(d.hcall!==undefined){HCSG.filter(g=>!g.st).forEach(g=>{hcAdd(g.k,g.x,'g',g.rep);g.st='ok';});hcRe();toast('Se agregaron todos los cambios de la consulta del 14/10.');return}
 if(d.hcno){HCSG[+d.hcno].st='no';hcRe();return}
 if(d.hcundo){HCSG[+d.hcundo].st='';hcRe();return}
 if(d.hced){const g=HCSG[+d.hced];aOpen({t:'Editar antes de agregar',s:hcSec(g.k).t,ok:'Agregar',body:aF('Dato',aT(g.x))+aF('Tema',aS(HCS.map(s=>s.t),hcSec(g.k).t))+`<small class="nthint">«${g.q}» · minuto ${g.m}</small>`,
  done:w=>{const t=w.querySelector('textarea').value.trim()||g.x,k=HCS.find(s=>s.t===aVal(w,1)).k;g.x=t;g.k=k;hcAdd(k,t,'g',g.rep);g.st='ok';HC.sec=k;setTimeout(hcRe,0);return `Agregado a ${hcSec(k).t}.`;}});return}
 if(d.hcq){const g=HCSG[+d.hcq];aOpen(hcTr(g.m,g.q));return}
 if(d.lbq){const g=LBSG[+d.lbq];aOpen(hcTr(g.m,g.q));return}
 if(d.hctpl!==undefined){aOpen({t:'Plantilla de la historia',s:'Suma o saca temas según el caso',ok:'Guardar',body:aF('Casos',aCh(['General','Celiaquía','Embarazo','Niños','Deportista','Bariátrico','Diabetes','Renal'],['General','Celiaquía'])),done:'Plantilla guardada. Los temas nuevos aparecen en el índice.'});return}
 if(d.hcform!==undefined){ACT['ficha-historia:Formularios']&&aOpen(ACT['ficha-historia:Formularios']());return}
 if(d.lbv){LB.view=+d.lbv;hcRe();return}
 if(d.lbc){LB.col=+d.lbc;LB.view=0;hcRe();return}
 if(d.lbr){LB.row=+d.lbr;LB.col=null;hcRe();return}
 if(d.lbok){const g=LBSG[+d.lbok];g.st='ok';hcRe();toast(g.k==='dato'?'Glucemia 98 sumada al 30/09 como dato dicho por Sofía, sin estudio.':'A Sofía le llegó en la app el pedido para subir el análisis.');return}
 if(d.lbno){LBSG[+d.lbno].st='no';hcRe();return}
 if(d.lbundo){LBSG[+d.lbundo].st='';hcRe();return}
});
document.getElementById('fwrap').addEventListener('focusout',e=>{const n=e.target.closest('.hcin');if(!n)return;const s=hcSec(HC.sec),x=s.l[+n.dataset.hci],t=n.textContent.trim();
 if(!x)return;if(!t&&!x.x){s.l.splice(+n.dataset.hci,1);hcRe();return}
 if(t===x.x)return;const nw=!x.x;x.x=t;if(!nw)x.ed=HOY;hcRe();toast(nw?`Dato agregado a ${s.t} con la fecha de hoy.`:'Guardado. El cambio queda en «Por fecha» con la fecha de hoy.');});
document.getElementById('fwrap').addEventListener('keydown',e=>{if(e.target.closest('.hcin')&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.target.blur();}});
document.getElementById('fwrap').addEventListener('click',e=>{if(e.target.closest('.hcin'))e.stopPropagation();});
