/* Planes · armado con IA (pedido de Facundo, 23/10, a partir del video de Nutreando).
   1) «¿Qué plan querés crear hoy?»: se pide con palabras, dictado o un adjunto, y se eligen duración, formato, alimentación,
      necesidades clínicas, medidas e inclusiones. Al costado, «Esto voy a tener en cuenta»: lo que sale de la ficha, con su origen.
   2) Armando: pasos a la vista. 3) El plan queda en borrador con el porqué de cada comida y «para revisar».
   4) Asistente al costado: cambios con una frase, viendo qué sale y qué entra antes de aplicar, con historial y deshacer.
   5) Control antes de publicar y la vista de la paciente con qué cambió y sus alternativas. Avisos por la app y por mail. */
IC.undo||='<path d="M9 7 5 11l4 4"/><path d="M5 11h9a5 5 0 0 1 0 10h-2"/>';
const IADUR=['1 día','7 días','14 días','4 semanas'],IAFMT=['Grilla semanal','Lista por día','Cuadro para imprimir'];
const IADIET=['General','Mediterránea','Vegetariana','Vegana','Pescetariana','Flexitariana','DASH'];
const IASTR=['Alta en proteínas','Baja en carbohidratos','Alta en fibra','Baja en fibra','Cetogénica'];
const IANEC=['Celiaquía','Sin lactosa','Hierro bajo','Hipotiroidismo','Acidez o reflujo','Hígado graso','Prediabetes','Hipertensión','Colesterol alto','Menopausia','Embarazo','Lactancia','Colon irritable','Sin azúcar agregada'];
const IAUNI=['Gramos','Medidas caseras','Las dos'],IAINC=['Grupos de intercambio','Mi recetario','Alternativas por alimento','Lista de compras','Costo estimado'];
const IASRC={f:'Ficha',h:'Historia clínica',l:'Laboratorio',g:'Consulta grabada',r:'Registro alimentario',c:'Cuestionario'};
/* Lo que la IA toma de la ficha: [origen, qué hace con eso, de dónde exactamente] */
const IACTX0=[['f','Meta de 1.800 kcal: 25% proteínas, 45% carbohidratos, 30% grasas','Requerimiento · Mifflin-St Jeor'],
 ['h','Celiaquía con biopsia: todo sin TACC','Diagnósticos · desde 2019'],['h','Sin lactosa','Alergias e intolerancias'],
 ['h','Levotiroxina en ayunas: el desayuno va 30 minutos después','Medicación · 12/03/26'],
 ['l','Ferritina 14, baja: hierro con vitamina C y lejos del mate','Análisis del 16/09/26'],
 ['l','Hígado graso leve: pocos azúcares y harinas','Ecografía del 02/09/26'],
 ['g','Acidez si cena tarde: cenas livianas, antes de las 21','Consulta del 14/10 · minuto 13:05'],
 ['g','Gimnasio martes y jueves: merienda antes de entrenar','Consulta del 14/10 · minuto 21:30'],
 ['h','Las legumbres le dan hinchazón: poca cantidad y remojadas','Digestión'],
 ['h','Almuerza en la oficina: viandas fáciles de llevar','Hábitos'],
 ['h','Pica a la tarde: merienda con proteína','Hábitos'],
 ['r','Ya come tostadas sin TACC, ensalada con pollo y fideos de arroz','Recordatorio de 24 h · 12/10/26']];
const IACTXQ=[['c','Sin lactosa','Cuestionario del lunes'],['c','4 comidas por día, sin colación','Cuestionario del lunes'],['c','No le gusta el pescado ni el hígado','Cuestionario del lunes'],['c','Cocina los fines de semana: viandas','Cuestionario del lunes'],['c','Trabaja de 9 a 18 y almuerza afuera','Cuestionario del lunes'],['c','Toma menos de 1 litro de agua','Cuestionario del lunes']];
const IA={pi:0,txt:'',dur:1,fmt:0,diet:0,str:[],nec:[],uni:2,inc:[0,1,1,1,0],off:{},files:[],run:0,made:{},rev:{},dr:0,tab:0,scope:2,msgs:[],hist:[],mic:0};
const iaCtx=i=>{const o=PP[i];if(i===0)return IACTX0;const l=[['f',`Meta de ${o[4]?pFmt(o[4]):'1.700'} kcal y objetivo «${o[9]}»`,'Ficha']];
 o[12].filter(t=>t!=='Sin restricciones').forEach(t=>l.push(['f',t,'Cuidados de la ficha']));return o[5]==='Sin plan'?l.concat(IACTXQ):l;};
const iaNec0=i=>i===0?['Celiaquía','Sin lactosa','Hierro bajo','Hipotiroidismo','Acidez o reflujo','Hígado graso']:PP[i][12].map(t=>({'Sin gluten':'Celiaquía','Sin lactosa':'Sin lactosa','Hierro':'Hierro bajo','Hierro con vitamina C':'Hierro bajo','Poco sodio':'Hipertensión','Sin azúcar agregada':'Sin azúcar agregada','Lactancia':'Lactancia'}[t])).filter(Boolean).concat(PP[i][5]==='Sin plan'?['Sin lactosa']:[]);
function iaReset(i){Object.assign(IA,{pi:i,txt:'',dur:1,fmt:0,diet:0,str:i===0?['Alta en proteínas']:[],nec:iaNec0(i),uni:2,inc:[0,1,1,1,0],off:{},files:[],run:0});}
const iaSeg=(k,l,v)=>`<div class="iaseg" role="radiogroup">${l.map((t,j)=>`<button type="button" role="radio" aria-checked="${v===j}" data-ias="${k}:${j}">${t}</button>`).join('')}</div>`;
const iaChips=(k,l,on)=>`<div class="iachips">${l.map((t,j)=>`<button type="button" aria-pressed="${on(t,j)}" data-iac="${k}:${j}">${t}</button>`).join('')}</div>`;
/* 1. Pedido */
function pIA(){const o=PP[IA.pi],f=pFirst(IA.pi),ctx=iaCtx(IA.pi),use=ctx.filter((_,j)=>!IA.off[j]).length;
 const left=IA.run?iaRun():`<section class="fxp iaask"><div class="iahero"><span class="iabadge">${svg('spark',12)}Armado con IA</span><h2>¿Qué plan querés crear hoy?</h2><p>Contalo con tus palabras. Armo la estructura completa con alimentos de la base y tus recetas, y después editás todo.</p></div>
  <button type="button" class="iagoal" data-iaa="metas">${svg('trend',14)}<b>Objetivo: ${pFmt(o[4]||1700)} kcal por día</b><span>25% proteínas · 45% carbohidratos · 30% grasas</span><em>de la ficha de ${f} · cambiar</em></button>
  <div class="iabox"><textarea id="iatxt" rows="3" aria-label="Qué plan querés" placeholder="Por ejemplo: plan de 7 días para bajar de a poco, 4 comidas, desayunos rápidos y viandas para el trabajo">${IA.txt}</textarea>
   ${IA.files.length?`<div class="iafiles">${IA.files.map((x,j)=>`<span>${svg('file',12)}${x}<button type="button" data-iarmf="${j}" aria-label="Quitar ${x}">${svg('x',10)}</button></span>`).join('')}</div>`:''}
   <div class="iabar"><button type="button" class="lnk" data-iaa="adj">${svg('clip',13)}Adjuntar (PDF, foto o planilla)</button><button type="button" class="lnk${IA.mic?' on':''}" data-iaa="mic">${svg('mic',13)}${IA.mic?'Escuchando…':'Dictar'}</button><span class="sp"></span>
    <div class="iapick"><button type="button" class="iafor" data-iaa="pac">${cAv(o[1],o[2])}Para ${o[0]}${svg('chev',11)}</button></div></div></div>
  <div class="iaideas"><span>Ideas:</span>${['Plan de 7 días para bajar de a poco, desayunos rápidos y viandas para el trabajo','Cenas livianas y temprano','Usá mis recetas y lo que ya come'].map(t=>`<button type="button" data-iaidea="${t}">${t}</button>`).join('')}</div>
  <div class="iaopts">
   <div><h5>Duración</h5>${iaSeg('dur',IADUR,IA.dur)}</div>
   <div><h5>Formato</h5>${iaSeg('fmt',IAFMT,IA.fmt)}</div>
   <div class="w"><h5>Tipo de alimentación</h5>${iaChips('diet',IADIET,(t,j)=>IA.diet===j)}</div>
   <div class="w"><h5>Estrategia <small>podés elegir más de una</small></h5>${iaChips('str',IASTR,t=>IA.str.includes(t))}</div>
   <div class="w"><h5>Necesidades clínicas <small>salen de la ficha; sumá o sacá</small></h5><div class="iachips">${IA.nec.map(t=>`<button type="button" aria-pressed="true" data-ianec="${t}">${t}${svg('x',10)}</button>`).join('')}<button type="button" class="add" data-iaa="nec">${svg('plus',11)}Agregar</button></div></div>
   <div><h5>Medidas</h5>${iaSeg('uni',IAUNI,IA.uni)}</div>
   <div><h5>Incluir en el plan</h5>${iaChips('inc',IAINC,(t,j)=>!!IA.inc[j])}</div>
  </div>
  <div class="iago"><button type="button" class="cta" data-iaa="go">${svg('spark',13)}Armar plan con IA</button><small>Tarda menos de un minuto. Queda en borrador: nada le llega a ${f} hasta que lo publiques.</small></div></section>`;
 return `<div class="c">${left}</div><div class="c">${fxP('Esto voy a tener en cuenta',`${use} de ${ctx.length} datos`,'',`<div class="iactx">${ctx.map(([s,t,w],j)=>`<div class="${IA.off[j]?'off':''}"><span class="iasrc s-${s}">${IASRC[s]}</span><b>${t}</b><small>${w}</small><button type="button" class="lnk" data-iaoff="${j}">${IA.off[j]?'Volver a usar':'No usar'}</button></div>`).join('')}</div>`,'g')}
  ${fxP('Uso de IA este mes','','',`<div class="iause"><b class="num">US$ 1,20</b><span>de US$ 5 · este plan usa unos 4 centavos</span></div>${fxBar(24)}`)}</div>`;}
/* 2. Armando */
const IASTEP=['Leyendo la ficha, la historia y el laboratorio','Armando las comidas con tus recetas y la base','Calculando calorías y nutrientes','Revisando alergias, repeticiones y horarios'];
function iaRun(){return `<section class="fxp iaask iarun"><div class="iahero"><span class="iabadge">${svg('spark',12)}Armando</span><h2>${IADUR[IA.dur]} para ${pFirst(IA.pi)}</h2><p>${IA.txt?`«${IA.txt.replace(/</g,'')}»`:'Con lo que dice la ficha.'}</p></div>
 <div class="iasteps">${IASTEP.map((t,j)=>`<div class="${j<IA.run-1?'ok':j===IA.run-1?'now':''}"><i>${j<IA.run-1?svg('check',12):''}</i>${t}</div>`).join('')}</div>${fxBar(Math.min(100,(IA.run-1)/IASTEP.length*100))}</section>`;}
function iaGo(){IA.txt=(document.getElementById('iatxt')||{}).value||IA.txt;IA.run=1;pDraw();const fast=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const tick=()=>{if(pV!==5||!IA.run)return;if(IA.run<=IASTEP.length){IA.run++;pDraw();setTimeout(tick,fast?60:520);}else iaDone();};setTimeout(tick,fast?60:420);}
function iaDone(){const i=IA.pi,o=PP[i],k=o[4]||1700,was=o[5];IA.run=0;
 o[3]=(IA.nec.includes('Celiaquía')?'Sin TACC':IADIET[IA.diet]==='General'?'Plan':IADIET[IA.diet])+(IA.nec.includes('Sin lactosa')?' y sin lactosa ':' ')+pFmt(k)+' kcal';o[4]=k;if(!o[12].length)o[12]=IA.nec.slice(0,2);
 if(IA.nec.includes('Celiaquía'))o[13]='sg';o[5]='Borrador';o[6]=1;o[8]='Ahora';PDIRTY.add(i);IA.made[i]=1;IA.rev[i]=3;
 Object.keys(PED).filter(x=>x.startsWith(i+'-')).forEach(x=>delete PED[x]);
 IA.msgs=[{a:1,t:`Armé ${IADUR[IA.dur]==='1 día'?'el día':IADUR[IA.dur]} en borrador${was==='Publicado'?`; ${pFirst(i)} sigue viendo el plan publicado`:''}. Usé ${iaCtx(i).filter((_,j)=>!IA.off[j]).length} datos de la ficha. Hay 2 cosas para revisar antes de publicar.`}];
 IA.hist=[{t:'Plan armado con IA',w:'Ahora',d:IA.txt||'con lo que dice la ficha',n:35}];
 pPi=i;pWeek=0;pTab='semana';pCell=[4,3];pDay=3;pV=1;pDraw(1);iaDrawer(1);toast('Plan armado en borrador. Revisalo antes de publicar.');}
/* 3. Porqué de cada comida y «para revisar» */
const IAWHY0=['Sin TACC ni lactosa, 30 minutos después de la levotiroxina. Rápido, como pidió.','Fruta con vitamina C: ayuda a absorber el hierro.','Se lleva en vianda a la oficina. Carne o pollo por la ferritina baja.','Con proteína, porque a la tarde pica.','Liviana y antes de las 21, por la acidez que contó el 14/10.'];
const iaWhy=(r,d)=>{if(pPi===0)return r===3&&(d===1||d===3)?'Antes del gimnasio de los martes y jueves: carbohidratos y proteína.':IAWHY0[r];const o=pO(),c=o[12].filter(t=>t!=='Sin restricciones');
 return [`Desayuno simple para empezar el día${c.length?', '+c[0].toLowerCase():''}.`,'Colación chica para llegar con menos hambre al almuerzo.','Plato completo: proteína, verduras y un cereal.','Merienda con proteína para no picar a la tarde.','Cena liviana para '+o[9].toLowerCase()+'.'][r];};
const IAREV=i=>i===0?[['Cena del sábado: pizza sin TACC casera','Con acidez a la noche conviene algo más liviano.',[4,5],'Sopa de verduras y huevo',400],['Desayunos: tostadas el lunes y el jueves','Se repite. Te propongo variar el jueves.',[0,3],'Bowl de frutos rojos y chía',360]]
 :[['Cena del sábado: pizza casera','Es la cena más pesada de la semana.',[4,5],'Pollo al limón con ensalada',440],['Desayunos: tostadas el lunes y el jueves','Se repite. Te propongo variar el jueves.',[0,3],'Bowl de frutos rojos y avena',360]];
const iaRevLeft=i=>IAREV(i).filter((_,j)=>!(IA.rev[i]&(1<<j))?false:true);
const _iaSem=pSemana;pSemana=function(){let h=_iaSem();if(!IA.made[pPi])return h;const [r,d]=pCell;
 h=h.replace(/<div><img(?:(?!<div><img)[\s\S])*?data-palt="2">Usar<\/button><\/div>/,'');return h.replace(/(<div class="pmeal"><b>[^<]*<\/b>)/,`$1<p class="iawhy">${svg('spark',12)}<span><b>Por qué:</b> ${iaWhy(r,d)}</span></p>`);};
const _iaPlan=pPlan;pPlan=function(){let h=_iaPlan();if(pO()[5]==='Sin plan')return h;const n=IA.made[pPi]?iaRevLeft(pPi).length:0;
 return h.replace('<span class="sp"></span>',`${n?`<button type="button" class="iarev" data-iaa="rev">${n} para revisar</button>`:''}<span class="sp"></span><button type="button" class="sbtn k cbtn" data-iaa="dr">${svg('spark',13)}Asistente</button>`);};
PVIEWS[1]=pPlan;
const iaFix=(i,j)=>{const x=IAREV(i)[j];PED[`${i}-${pWeek}-${x[2][0]}-${x[2][1]}`]=[x[3],x[4]];IA.rev[i]&=~(1<<j);pDirty(i);IA.hist.unshift({t:x[0].split(':')[0]+' → '+x[3],w:'Ahora',d:'arreglado desde «para revisar»',n:1});};
const iaRevBody=i=>{const L=IAREV(i);return `<div class="iactl">${[['Sin gluten en todas las comidas',1],['Sin lactosa',1],['Calorías por día entre 1.760 y 1.840',1],['Horarios: desayuno después de la medicación',i===0]].filter(x=>x[1]).map(([t])=>`<div class="ok">${svg('check',13)}<span>${t}</span></div>`).join('')}
 ${L.map((x,j)=>IA.rev[i]&(1<<j)?`<div class="wa">${svg('alert',13)}<span><b>${x[0]}</b><small>${x[1]} Cambio propuesto: ${x[3]}.</small></span><button type="button" class="sbtn" data-iafix="${j}">Cambiar</button></div>`:`<div class="ok">${svg('check',13)}<span>${x[0].split(':')[0]}: cambiado por ${x[3].charAt(0).toLowerCase()+x[3].slice(1)}</span></div>`).join('')}</div>`;};
const iaRevOpen=()=>aOpen({t:'Para revisar',s:'Control del plan de '+pFirst(pPi),ok:false,body:iaRevBody(pPi),click:(b,box)=>{if(b.dataset.iafix!==undefined){iaFix(pPi,+b.dataset.iafix);box.querySelector('.abody').innerHTML=iaRevBody(pPi);pDraw();iaDrawer();toast('Cambiado en el borrador.');}}});
/* Control antes de publicar y lo que ve la paciente */
const _iaPub=PA.publicar;PA.publicar=()=>{const r=_iaPub();if(IA.made[pPi]){const n=iaRevLeft(pPi).length;r.body=`<div class="sect">Control antes de publicar</div>${iaRevBody(pPi)}${n?`<p class="mhelp">${n===1?'Queda 1':'Quedan '+n} para revisar. Podés publicar igual.</p>`:''}`+r.body;
 r.click=(b,box)=>{if(b.dataset.iafix!==undefined){iaFix(pPi,+b.dataset.iafix);box.querySelector('.iactl').outerHTML=iaRevBody(pPi);pDraw();}};}
 r.body=r.body.replace('Avisarle en su app','Avisarle por la app y por mail');r.done='Plan publicado. Le llega el aviso por la app y por mail.';return r;};
const _iaVis=PA.vista;PA.vista=()=>{const r=_iaVis(),ch=Object.keys(PED).filter(x=>x.startsWith(pPi+'-'+pWeek+'-')).map(x=>x.split('-').map(Number));
 const note=ch.length?`<div class="iaupd">${svg('swap',12)}Actualizado hoy. Cambió: ${ch.slice(0,2).map(([,,rr,dd])=>PMEALS[rr].toLowerCase()+' del '+PDAYL[dd]).join(' y ')}</div>`:'';
 r.body=r.body.replace('<b>Tu plan</b>',`<b>Tu plan</b>${note}`).replace(/(<p><time>[^<]*<\/time><span><small>([^<]*)<\/small>([^<]*))<\/span><\/p>/g,(m,a,meal,txt)=>{const rr=PMEALS.indexOf(meal),alt=PALT[rr].filter(x=>x[0]!==txt.trim()).slice(0,2).map(x=>x[0].charAt(0).toLowerCase()+x[0].slice(1)).join(' o ');return `${a}<em>Podés cambiarla por ${alt}</em></span></p>`;})
  +`<p class="mhelp">Desde su app puede pedirte un cambio; te llega a «Pedidos de cambio» y lo aprobás vos.</p>`;return r;};
/* 4. Asistente con cambios en una frase */
document.getElementById('s-planes').insertAdjacentHTML('beforeend',`<aside class="iadr" id="iadr" aria-label="Asistente del plan" aria-hidden="true"></aside>`);
const IASUG=['Cambiá la merluza por pollo','Más hierro en los almuerzos','Bajá las calorías de la cena','Completá el día con una colación'];
function iaDrawer(open){const d=document.getElementById('iadr');if(open!==undefined){IA.dr=open?1:0;d.classList.toggle('open',!!open);d.setAttribute('aria-hidden',!open);}
 if(!IA.dr)return;const qo=document.getElementById('iaq'),qv=qo?qo.value:'',qf=qo&&document.activeElement===qo;const f=pFirst(pPi),sc=[`El ${PDAYL[pDay]}`,`${PMEALS[pCell[0]]} del ${PDAYL[pCell[1]].slice(0,3)}`,'Todo el plan'];
 d.innerHTML=`<header><span class="iabadge">${svg('spark',12)}Asistente</span><div class="iatab" role="tablist">${['Chat','Historial de cambios'].map((t,j)=>`<button type="button" role="tab" aria-selected="${IA.tab===j}" data-iatab="${j}">${t}</button>`).join('')}</div><span class="sp"></span><button type="button" class="ibtn" data-iaa="drx" aria-label="Cerrar asistente">${svg('x',13)}</button></header>
 ${IA.tab?`<div class="iahist">${IA.hist.map((h,j)=>`<div><time>${h.w}</time><span><b>${h.t}</b><small>${h.d}${h.n?` · ${h.n} comida${h.n===1?'':'s'}`:''}</small></span>${h.u?`<button type="button" class="sbtn" data-iaundo="${h.u}">${svg('undo',12)}Deshacer</button>`:''}</div>`).join('')}</div>`
 :`<div class="iascope"><span>Cambios en</span>${iaSeg('scope',sc,IA.scope)}</div><div class="iachat" id="iachat">
  ${IA.msgs.map((m,j)=>m.a?`<div class="iam a">${m.t}${m.p?iaProp(m,j):''}</div>`:`<div class="iam u">${m.t}</div>`).join('')}${IA.typing?'<div class="iam a iatyp"><i></i><i></i><i></i></div>':''}</div>
  <div class="iasug">${IASUG.map(t=>`<button type="button" data-iasug="${t}">${t}</button>`).join('')}</div>
  <form class="iain" id="iain"><input id="iaq" autocomplete="off" placeholder="Pedile un cambio a la IA para ${f}…" aria-label="Pedile un cambio"><button type="submit" class="ibtn go" aria-label="Enviar">${svg('send',14)}</button></form>`}`;
 const c=document.getElementById('iachat');if(c)c.scrollTop=c.scrollHeight;const qn=document.getElementById('iaq');if(qn&&qv){qn.value=qv;if(qf)qn.focus();}}
const iaProp=(m,j)=>`<div class="iaprop${m.st?' '+m.st:''}">${m.p.map(x=>`<div><small>${x.lab}</small>${x.out?`<s>${x.out}</s>`:''}<b>${x.in}</b>${x.k?`<em class="num">${x.k}</em>`:''}</div>`).join('')}
 <div class="iapa">${m.st==='ok'?`<span>${svg('check',12)}Aplicado en el borrador</span><button type="button" class="lnk" data-iaundo="${m.u}">Deshacer</button>`:m.st==='no'?'<span>Descartado</span>':`<button type="button" class="sbtn k" data-iaok="${j}">Aplicar</button><button type="button" class="sbtn" data-iano="${j}">Descartar</button>`}</div></div>`;
const iaCells=()=>IA.scope===1?[pCell]:IA.scope===0?PMEALS.map((_,r)=>[r,pDay]):PMEALS.flatMap((_,r)=>PDAYS.map((_,d)=>[r,d]));
const iaCap=s=>s.charAt(0).toUpperCase()+s.slice(1);
function iaAsk(q){q=q.trim();if(!q)return;IA.tab=0;IA.msgs.push({a:0,t:q.replace(/</g,'')});IA.typing=1;iaDrawer();
 setTimeout(()=>{IA.typing=0;const s=q.toLowerCase(),cells=iaCells(),P=[];let t;
  const m=s.match(/(?:cambi[aá]|reemplaz[aá]|sac[aá])\s+(?:el |la |los |las )?(.+?)\s+por\s+(.+)/);
  if(m){const a=m[1].trim(),b=m[2].replace(/[.!]$/,'').trim();cells.forEach(([r,d])=>{const x=pMeal(d,r);if(x.toLowerCase().includes(a))P.push({r,d,lab:`${PMEALS[r]} del ${PDAYL[d]}`,out:x,in:iaCap(x.toLowerCase().replace(a,b)),k:pKc(d,r)+' kcal'});});
   t=P.length?`Encontré ${P.length===1?'una comida':P.length+' comidas'} con ${a}. Mismas calorías:`:`No encontré ${a} en ${IA.scope===2?'el plan':'lo elegido'}. Te propongo cambiar la comida elegida:`;
   if(!P.length){const [r,d]=pCell;P.push({r,d,lab:`${PMEALS[r]} del ${PDAYL[d]}`,out:pMeal(d,r),in:iaCap(b),k:pKc(d,r)+' kcal'});}}
  else if(s.includes('hierro')){const H=['Carne magra con ensalada de espinaca y limón','Pollo con lentejas remojadas y morrón','Hamburguesa casera con ensalada de rúcula y tomate'];
   (IA.scope===2?[1,3,5]:[IA.scope===1?pCell[1]:pDay]).forEach((d,j)=>P.push({r:2,d,lab:`Almuerzo del ${PDAYL[d]}`,out:pMeal(d,2),in:H[j%3],k:pKc(d,2)+' kcal'}));t='Sumo hierro con vitamina C en los almuerzos. Las lentejas van remojadas y en poca cantidad, por la hinchazón:';}
  else if(s.includes('sodio')||s.includes('sal ')){(IA.scope===2?[0,2,4]:[IA.scope===1?pCell[1]:pDay]).forEach(d=>P.push({r:4,d,lab:`Cena del ${PDAYL[d]}`,out:pMeal(d,4),in:pMeal(d,4)+', sin sal agregada, con hierbas y limón',k:pKc(d,4)+' kcal'}));t='Bajo el sodio en las cenas: sin sal agregada, con hierbas y limón. Sin fiambres ni caldos en cubo:';}
  else if(s.includes('semana')){P.push({lab:'Semana 4 · 35 comidas',in:'Semana nueva con las mismas reglas y sin repetir platos de la semana 3',k:'1.780 a 1.820 kcal por día',add:1});t='Completo la semana 4 respetando todo lo que tuve en cuenta:';}
  else if(s.includes('meriend')){(IA.scope===2?[1,3]:[IA.scope===1?pCell[1]:pDay]).forEach((d,j)=>P.push({r:3,d,lab:`Merienda del ${PDAYL[d]}`,out:pMeal(d,3),in:['Tostadas sin TACC con queso untable y tomate','Licuado de banana sin lactosa con avena sin TACC'][j%2],k:pKc(d,3)+' kcal'}));t='Te propongo meriendas nuevas con proteína, mismas calorías:';}
  else if(s.includes('calor')||s.includes('bajá')||s.includes('baja')){const d=IA.scope===1?pCell[1]:pDay,k=pKc(d,4);P.push({r:4,d,lab:`Cena del ${PDAYL[d]}`,out:pMeal(d,4),in:pMeal(d,4)+', con media porción de cereal',k:`${k} → ${k-60} kcal`,kn:k-60});t='Bajo 60 kcal la cena sin cambiar el plato:';}
  else if(s.includes('complet')||s.includes('colaci')){P.push({lab:'Colación de media tarde · todos los días',in:'Yogur sin lactosa con frutos rojos',k:'+150 kcal',add:1});t='El día queda en 1.650 kcal. Sumo una colación para llegar a la meta:';}
  else{const [r,d]=pCell,a=PALT[r].find(x=>x[0]!==pMeal(d,r));P.push({r,d,lab:`${PMEALS[r]} del ${PDAYL[d]}`,out:pMeal(d,r),in:a[0],k:pKc(d,r)+' kcal'});t='Te propongo este cambio, con las mismas calorías:';}
  IA.msgs.push({a:1,t,p:P,q});iaDrawer();},matchMedia('(prefers-reduced-motion: reduce)').matches?50:650);}
let iaU=0;const IAUNDO={};
function iaApply(j){const m=IA.msgs[j],u=++iaU,prev=[];m.p.forEach(x=>{if(x.add)return;const k=`${pPi}-${pWeek}-${x.r}-${x.d}`;prev.push([k,PED[k]]);PED[k]=[x.in,x.kn||pKc(x.d,x.r)];});
 IAUNDO[u]=prev;m.st='ok';m.u=u;pDirty(pPi);IA.hist.unshift({t:m.q,w:'Ahora',d:'pedido en el chat',n:m.p.length,u});pDraw();iaDrawer();toast('Cambio aplicado en el borrador.');}
function iaUndo(u){(IAUNDO[u]||[]).forEach(([k,v])=>{if(v)PED[k]=v;else delete PED[k];});delete IAUNDO[u];IA.msgs.forEach(m=>{if(m.u===u){m.st='';m.u=0;}});IA.hist.forEach(h=>{if(h.u===u){h.u=0;h.d+=' · deshecho';}});pDraw();iaDrawer();toast('Cambio deshecho.');}
/* Entradas: nuevo plan, «con el asistente», botones del pie y vista propia */
PVIEWS.push(pIA);
const _iaHead=pHead;pHead=function(){if(pV!==5){_iaHead();if(pV===0)document.getElementById('pacts').insertAdjacentHTML('afterbegin',`<button class="chip" type="button" data-iaa="new">${svg('spark',13)}Armar con IA</button>`);return;}
 document.getElementById('pacts').innerHTML=PP[IA.pi][5]==='Sin plan'?'':`<button class="chip" type="button" data-iaa="back">Volver al plan</button>`;
 document.getElementById('ptitle').textContent='· armar con IA';document.querySelectorAll('#pview button').forEach(b=>b.classList.remove('on'));};
const iaOpen=i=>{iaReset(i);pPi=i;iaDrawer(0);pView(5);};
(function(){const S=document.getElementById('s-planes');
 S.addEventListener('click',e=>{const st=e.target.closest('[data-pstart="0"],[data-pai]');if(st){e.stopPropagation();e.preventDefault();if(st.dataset.pai){iaDrawer(1);iaAsk(st.dataset.pai);}else iaOpen(pPi);}},true);
 S.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||!b.closest('.iaask,.iactx,#iadr,[data-iaa],.iarev'))return;e.stopPropagation();const d=b.dataset;
  if(d.ias){const [k,j]=d.ias.split(':');if(k==='scope'){IA.scope=+j;return iaDrawer();}IA.txt=document.getElementById('iatxt').value;IA[k]=+j;return pDraw();}
  if(d.iac){const [k,j]=d.iac.split(':');IA.txt=document.getElementById('iatxt').value;if(k==='diet')IA.diet=+j;else if(k==='str'){const t=IASTR[+j];IA.str=IA.str.includes(t)?IA.str.filter(x=>x!==t):[...IA.str,t];}else IA.inc[+j]=IA.inc[+j]?0:1;return pDraw();}
  if(d.ianec){IA.txt=document.getElementById('iatxt').value;IA.nec=IA.nec.filter(x=>x!==d.ianec);return pDraw();}
  if(d.iaoff!==undefined){IA.txt=document.getElementById('iatxt').value;IA.off[d.iaoff]=!IA.off[d.iaoff];return pDraw();}
  if(d.iaidea){const t=document.getElementById('iatxt');t.value=d.iaidea;IA.txt=d.iaidea;t.focus();return;}
  if(d.iarmf!==undefined){IA.files.splice(+d.iarmf,1);return pDraw();}
  if(d.iatab!==undefined){IA.tab=+d.iatab;return iaDrawer();}
  if(d.iasug)return iaAsk(d.iasug);
  if(d.iaok!==undefined)return iaApply(+d.iaok);
  if(d.iano!==undefined){IA.msgs[+d.iano].st='no';return iaDrawer();}
  if(d.iaundo)return iaUndo(+d.iaundo);
  const a=d.iaa,t=document.getElementById('iatxt');if(t)IA.txt=t.value;
  if(a==='go')return iaGo();
  if(a==='new')return iaOpen(PP.findIndex(p=>p[5]==='Sin plan')>=0?PP.findIndex(p=>p[5]==='Sin plan'):pPi);
  if(a==='back'){pV=1;return pDraw(1);}
  if(a==='dr')return iaDrawer(!IA.dr);
  if(a==='drx')return iaDrawer(0);
  if(a==='rev')return iaRevOpen();
  if(a==='mic'){IA.mic=1;pDraw();setTimeout(()=>{IA.mic=0;IA.txt=(IA.txt?IA.txt+' ':'')+'Plan de 7 días para bajar de a poco, con desayunos rápidos y viandas para llevar al trabajo.';if(pV===5)pDraw();},matchMedia('(prefers-reduced-motion: reduce)').matches?50:1300);return;}
  if(a==='adj')return aOpen({t:'Adjuntar',s:'La IA lo lee y lo usa como base',ok:'Usar',body:`<button type="button" class="adrop">${svg('file',18)}<b>Elegir archivo</b><span>Plan anterior en PDF, foto de un plan en papel o planilla de Excel</span></button>`,click:x=>{if(x.classList.contains('adrop')){x.innerHTML=`${svg('check',18)}<b>plan-anterior.pdf</b><span>Listo</span>`;x.classList.add('ok');}},after:()=>{IA.files.push('plan-anterior.pdf');pDraw();},done:'Archivo sumado al pedido.'});
  if(a==='nec')return aOpen({t:'Necesidades clínicas',s:'Lo que la IA tiene que respetar',ok:'Listo',body:aCh(IANEC,IA.nec),after:bx=>{IA.nec=[...bx.querySelectorAll('.ach [aria-pressed=true]')].map(x=>x.textContent);pDraw();}});
  if(a==='pac')return aOpen({t:'Para quién es el plan',s:'Se usan los datos de su ficha',ok:'Elegir',body:aF('Paciente',aS(PP.map(p=>p[0]),PP[IA.pi][0])),after:bx=>{const i=PP.findIndex(p=>p[0]===aVal(bx,0));if(i>=0){iaReset(i);pPi=i;pDraw();}}});
  if(a==='metas'){const r=PA.metas();const af=r.after;r.after=bx=>{af(bx);pV=5;pDraw();};return aOpen(r);}
 });
 S.addEventListener('submit',e=>{if(e.target.id!=='iain')return;e.preventDefault();const q=document.getElementById('iaq');const v=q.value;q.value='';iaAsk(v);setTimeout(()=>{const n=document.getElementById('iaq');n&&n.focus();},20);});
 S.addEventListener('keydown',e=>{if(e.key==='Escape'&&IA.dr&&AW.hidden){iaDrawer(0);}});
})();
const _iaGo2=go;go=function(id){_iaGo2(id);if(id!=='planes')iaDrawer(0);};
const _iaDraw=pDraw;pDraw=function(a){_iaDraw(a);if(IA.dr&&pV===1)iaDrawer();};
/* Plan más aireado (pedido de Facundo, 23/10 23:36): el submenú va en una barra con fondo y letra más grande,
   las semanas pasan al encabezado de la semana y los botones quedan agrupados a la derecha con su ícono. */
const _iaPlan2=pPlan;pPlan=function(){let h=_iaPlan2();if(pO()[5]==='Sin plan')return h;
 const wk=(h.match(/<div class="tabs" id="pweek">[\s\S]*?<\/div>/)||[''])[0];
 h=h.replace(wk,'').replace('<div class="tabs" id="ptabs">','<div class="ptabs2" id="ptabs" role="tablist">')
  .replace(/<button type="button" data-pt="(\w+)" class="(on)?">/g,(m,k,on)=>`<button type="button" role="tab" aria-selected="${!!on}" data-pt="${k}" class="${on||''}">`)
  .replace(/(<button type="button" class="sbtn") data-pa="vista">/,`$1 data-pa="vista">${svg('eye',13)}`).replace(/(<button type="button" class="sbtn") data-pa="guardar-tpl">Guardar como plantilla/,`$1 data-pa="guardar-tpl" title="Guardar como plantilla">${svg('copy',13)}Plantilla`)
  ;
 h=h.replace(/<span class="sp"><\/span>([\s\S]*?)<\/div>(?=<div class="c|<div class="pspan)/,(m,mid)=>`<span class="sp"></span><div class="pacts2">${mid}</div></div>`);
 if(wk&&(pTab==='semana'||pTab==='compras'))h=h.replace(/(<section class="fxp[^"]*"><header><h3>(?:Semana|Lista de compras)[^<]*<\/h3>(?:<span class="m">[^<]*<\/span>)?<span class="sp"><\/span>)/,`$1${wk.replace('class="tabs"','class="tabs pwk"').replace(/>Semana (\d)</g,'>$1<')}`);
 return h;};
PVIEWS[1]=pPlan;
