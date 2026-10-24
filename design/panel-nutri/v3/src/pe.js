/* Planes · editor del plan como Nutreando, mejorado (pedido de Facundo, 24/10).
   Arriba, igual que el resto del panel: pestañas, «Nuevo plan», avisos y un solo botón negro.
   Vista Día (nueva, por defecto): días, total del día con barra de macros, comidas con hora, kcal, % y barra;
   alimentos con cantidad, unidad, medida casera, kcal, nota de preparación y alternativas; agregar, duplicar día, deshacer y rehacer.
   Vista Semana: la grilla de siempre. Columna derecha con scroll propio: Análisis, App y PDF; compartir; gestión; pedidos; cambios. */
IC.redo||='<path d="M15 7l4 4-4 4"/><path d="M19 11h-9a5 5 0 0 0 0 10h2"/>';
IC.copy||='<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/>';
const PE={mode:'dia',fotos:1,rt:0,FD:{},hr:{},undo:[],redo:[],log:[],saved:1};
const PEHR=['08:00','10:30','13:00','17:00','20:30'];
const PEG={p:['Proteínas','var(--rojo-ink)',165,1.2,[.55,.05,.4]],c:['Cereales','var(--azaf)',140,1,[.12,.78,.1]],l:['Lácteos','var(--azul-ink)',70,.9,[.3,.42,.28]],g:['Grasas','var(--ink3)',600,.55,[.06,.12,.82]],f:['Frutas','var(--lima-ink)',60,.6,[.05,.9,.05]],v:['Verduras','var(--hatch)',35,.5,[.2,.7,.1]]};
const PET=[['g',/palta|almendra|nuec|aceite|chía|chia|frutos secos|semillas/],['l',/yogur|queso|leche|licuado/],['p',/pollo|carne|huevo|merluza|pescado|atún|atun|hamburguesa|tofu|lentejas|revuelto|tortilla/],['c',/arroz|quinoa|pan\b|pan |tostada|avena|fideo|galleta|papa|puré|pure|tarta|pizza|panqueque|granola|cereal|pastel/],['f',/fruta|banana|manzana|mandarina|frutill|frutos rojos|naranja|gelatina|bowl/],['v',/verdura|ensalada|espinaca|zapallo|vegetal|sopa|tomate|rúcula|morrón|wok|zapallito/]];
const peType=n=>{const s=n.toLowerCase();return (PET.find(([,re])=>re.test(s))||['v'])[0];};
const peFr=q=>{const w=Math.floor(q),f=q-w;const h=f>=.75?1:f>=.25?.5:0;const n=w+(h===1?1:0);return (n?n:'')+(h===.5?(n?' 1/2':'1/2'):'')||'1';};
const peCas=(n,g)=>{const s=n.toLowerCase(),u=(d,t,t1)=>{const q=Math.max(.5,Math.round(g/d*2)/2);return `${peFr(q)} ${q<=1?t1||t:t}`;};
 if(/tostada|pan/.test(s))return u(30,'rodajas','rodaja');if(/huevo|revuelto|tortilla/.test(s))return u(55,'unidades','unidad');if(/yogur/.test(s))return u(190,'potes','pote');
 if(/arroz|quinoa|fideo|puré|pure|lentejas/.test(s))return u(150,'tazas cocidas','taza cocida');if(/frutos rojos|frutill/.test(s))return u(140,'tazas','taza');
 if(/fruta|banana|manzana|mandarina|naranja/.test(s))return u(150,'unidades medianas','unidad mediana');if(/almendra/.test(s))return u(1.2,'unidades');if(/nuec/.test(s))return u(5,'mitades');
 if(/aceite|chía|chia/.test(s))return u(10,'cucharadas','cucharada');if(/palta/.test(s))return u(100,'medias paltas','media palta');
 if(/pollo|carne|merluza|pescado|hamburguesa/.test(s))return g<=170?'1 porción del tamaño de la palma':'1 porción grande';
 if(/licuado|leche/.test(s))return u(250,'vasos','vaso');if(PEG[peType(n)]&&peType(n)==='v')return g<=160?'medio plato':'1 plato playo';return '1 porción';};
const peUnit=n=>/yogur|leche|licuado/.test(n.toLowerCase())?'ml':'g';
const peDens=(n,t)=>{const s=n.toLowerCase();return /tostada|pan\b|pan /.test(s)?260:/avena|granola/.test(s)?370:/galleta/.test(s)?390:PEG[t][2];};
const PEIMG=n=>{const s=n.toLowerCase();return /pollo|carne|hamburguesa/.test(s)?'pollo':/merluza|pescado/.test(s)?'pescado':/bowl|yogur|frutos rojos|licuado/.test(s)?'bowl':/tostada|panqueque|huevo/.test(s)?'tostadas':/vianda|wok|tarta|pastel/.test(s)?'viandas':/fruta|almendra|nuec|galleta|mandarina|manzana|gelatina/.test(s)?'snack':'cocina';};
const peKey=(d,r)=>`${pPi}-${pWeek}-${r}-${d}`;
function peItems(d,r){const k=peKey(d,r);if(PE.FD[k])return PE.FD[k];const name=pMeal(d,r),kc=pKc(d,r);
 let parts=name.replace(/^(una|un) /i,'').split(/,\s*| con | y /i).map(x=>x.trim()).filter(Boolean).slice(0,3);
 if((r===2||r===4)&&parts.length>1)parts.push('Aceite de oliva');
 const ts=parts.map(peType),ws=ts.map(t=>PEG[t][3]),W=ws.reduce((a,b)=>a+b,0);let left=kc;
 return parts.map((p,i)=>{const k1=i===parts.length-1?left:Math.round(kc*ws[i]/W/5)*5;left-=k1;const t=ts[i],g=Math.max(5,Math.round(k1/peDens(p,t)*100/5)*5);
  return {n:p.charAt(0).toUpperCase()+p.slice(1),t,g,g0:g,k0:k1,u:peUnit(p),note:''};});}
const peK=it=>Math.round(it.k0*it.g/it.g0);
const peMac=its=>its.reduce((m,it)=>{const k=peK(it),f=PEG[it.t][4];m[0]+=k*f[1]/4;m[1]+=k*f[0]/4;m[2]+=k*f[2]/9;m[3]+=k;return m;},[0,0,0,0]);
const peDayItems=d=>PMEALS.map((_,r)=>peItems(d,r));
const peSnap=()=>JSON.stringify({PED:Object.fromEntries(Object.entries(PED).filter(([k])=>k.startsWith(pPi+'-'))),FD:Object.fromEntries(Object.entries(PE.FD).filter(([k])=>k.startsWith(pPi+'-'))),hr:PE.hr});
function peLoad(s){const o=JSON.parse(s);Object.keys(PED).filter(k=>k.startsWith(pPi+'-')).forEach(k=>delete PED[k]);Object.keys(PE.FD).filter(k=>k.startsWith(pPi+'-')).forEach(k=>delete PE.FD[k]);Object.assign(PED,o.PED);Object.assign(PE.FD,o.FD);PE.hr=o.hr;}
function peDo(fn,what){PE.undo.push(peSnap());if(PE.undo.length>30)PE.undo.shift();PE.redo=[];fn();PE.log.unshift([what,'Ahora']);pDirty(pPi);PE.saved=0;pDraw();setTimeout(()=>{PE.saved=1;const s=document.getElementById('pesaved');if(s)s.innerHTML=`${svg('check',12)}Todo guardado`;},700);}
const peSet=(d,r,its)=>{const k=peKey(d,r);PE.FD[k]=its;PED[k]=[pMeal(d,r),its.reduce((a,it)=>a+peK(it),0)];};
/* Vista Día */
const peBar=(m)=>{const t=m[0]*4+m[1]*4+m[2]*9||1;return `<span class="pemb2"><i style="width:${m[0]*400/t}%;background:var(--azaf)"></i><i style="width:${m[1]*400/t}%;background:var(--rojo-ink)"></i><i style="width:${m[2]*900/t}%;background:var(--azul-ink)"></i></span>`;};
const peN=x=>String(Math.round(x));
function peDay(){const o=pO(),d=pDay,its=peDayItems(d),M=peMac(its.flat()),pct=Math.round(M[3]/o[4]*100),off=Math.abs(pct-100)>4;
 const head=`<div class="pedays">${PDAYS.map((x,i)=>{const ch=Object.keys(PED).some(k=>k.startsWith(`${pPi}-${pWeek}-`)&&k.endsWith('-'+i));return `<button type="button" data-ped="${i}" class="${i===d?'on':''}"><small>${x}</small><b class="num">${(13+pWeek*7+i)%31+1}</b>${ch?'<i></i>':''}</button>`;}).join('')}</div>
  <span class="sp"></span><div class="iaseg">${['Día','Semana'].map((t,j)=>`<button type="button" role="radio" aria-checked="${j===0}" data-pem="${j?'semana':'dia'}">${t}</button>`).join('')}</div>`;
 const tool=`<div class="petool"><span class="pewk">Semana ${[0,1,2,3].map(w=>`<button type="button" data-pw="${w}" class="${w===pWeek?'on':''}">${w+1}</button>`).join('')}</span>
  <button type="button" class="lnk" data-pg="dup">${svg('copy',13)}Duplicar día</button><button type="button" class="lnk" data-pg="metas">${svg('pen',13)}Ajustes del plan</button>
  <span class="sp"></span><label class="pefot"><span>Fotos</span><button type="button" class="sw" role="switch" aria-checked="${!!PE.fotos}" data-pefot aria-label="Mostrar fotos"></button></label></div>
  <div class="petot"><div><b class="num">${pFmt(Math.round(M[3]))}</b><span>de ${pFmt(o[4])} kcal</span>${pill(off?(pct>100?'+':'')+(pct-100)+'%':'En la meta',off?'p-wait':'p-conf')}</div>
  <div class="pemc"><span><i style="background:var(--azaf)"></i>C ${peN(M[0])} g</span><span><i style="background:var(--rojo-ink)"></i>P ${peN(M[1])} g</span><span><i style="background:var(--azul-ink)"></i>G ${peN(M[2])} g</span><span>Fibra ${peN(M[3]/75)} g</span></div>${peBar(M)}</div>`;
 const meal=(r)=>{const L=its[r],m=peMac(L),hr=PE.hr[`${pPi}-${r}`]||PEHR[r],ch=!!PED[peKey(d,r)];
  return `<div class="pemeal${ch?' ch':''}"><div class="pemh">${PE.fotos?pImg(PEIMG(pMeal(d,r)),'44px','44px'):''}<div class="pemt"><div><b>${PMEALS[r]}</b><input type="text" inputmode="numeric" maxlength="5" value="${hr}" data-peh="${r}" aria-label="Hora de ${PMEALS[r]}"><em class="num">${peN(m[3])} kcal · ${Math.round(m[3]/Math.max(1,M[3])*100)}%</em></div><small>${pMeal(d,r)} · C ${peN(m[0])} g · P ${peN(m[1])} g · G ${peN(m[2])} g</small>${peBar(m)}</div>
   <div class="pema"><button type="button" class="sbtn" data-pealt="${r}">${svg('swap',12)}Cambiar plato</button><button type="button" class="sbtn" data-peadd="${r}">${svg('plus',12)}Agregar</button></div></div>
   <div class="peis">${L.map((it,i)=>`<div class="pei"><i class="peg" style="background:${PEG[it.t][1]}" title="${PEG[it.t][0]}"></i><span class="pen"><b>${it.n}</b><small>${peCas(it.n,it.g)}${it.note?` · ${it.note}`:''}</small></span>
    <input class="num" type="number" min="5" step="5" value="${it.g}" data-peq="${r},${i}" aria-label="Cantidad de ${it.n}"><select data-peu="${r},${i}" aria-label="Unidad">${['g','ml','unidad'].map(u=>`<option${u===it.u?' selected':''}>${u}</option>`).join('')}</select>
    <em class="num">${peK(it)} kcal</em><button type="button" class="ibtn" data-penote="${r},${i}" aria-label="Nota de preparación">${svg('pen',12)}</button><button type="button" class="ibtn" data-pedel="${r},${i}" aria-label="Quitar ${it.n}">${svg('x',12)}</button></div>`).join('')}
    ${IA.made[pPi]?`<p class="iawhy">${svg('spark',12)}<span><b>Por qué:</b> ${iaWhy(r,d)}</span></p>`:''}</div></div>`;};
 return `<div class="c pel">${fxP(`${PDAYL[d].charAt(0).toUpperCase()+PDAYL[d].slice(1)}`,'',head,`${tool}<div class="pemeals">${PMEALS.map((_,r)=>meal(r)).join('')}</div>`,'g pedit')}</div><div class="c per">${peRight(M,its)}</div>`;}
/* Columna derecha: Análisis · App · PDF, compartir, gestión, pedidos y cambios */
function pePlate(its){const G={v:0,f:0,c:0,p:0,l:0,g:0};its.flat().forEach(it=>G[it.t]+=peK(it));const T=Object.values(G).reduce((a,b)=>a+b,0)||1;
 const S=[['Verduras y frutas',G.v+G.f,'var(--lima-ink)',50],['Cereales y legumbres',G.c,'var(--azaf)',25],['Proteínas',G.p,'var(--rojo-ink)',25],['Lácteos',G.l,'var(--azul-ink)',0],['Grasas buenas',G.g,'var(--ink3)',0]];
 let a=0;const arcs=S.map(([,v,c])=>{const f=v/T,st=a;a+=f;return `<circle r="15.9" cx="20" cy="20" fill="none" stroke="${c}" stroke-width="7" stroke-dasharray="${f*100} ${100-f*100}" stroke-dashoffset="${25-st*100}"/>`;}).join('');
 return `<div class="peplate"><svg viewBox="0 0 40 40" aria-hidden="true">${arcs}</svg><div>${S.map(([t,v,c,ref])=>`<span><i style="background:${c}"></i>${t}<b class="num">${Math.round(v/T*100)}%</b>${ref?`<small>ideal ${ref}%</small>`:''}</span>`).join('')}</div></div>`;}
function peRight(M,its){const o=pO(),f=pFirst(pPi),T=['Análisis','App','PDF'];let body;
 if(PE.rt===0)body=`<div class="pemt2">${[['Calorías',pFmt(Math.round(M[3]))+' kcal',o[4]+' kcal',M[3]/o[4]*100],['Carbohidratos',peN(M[0])+' g',Math.round(o[4]*.45/4)+' g',M[0]/(o[4]*.45/4)*100],['Proteínas',peN(M[1])+' g',Math.round(o[4]*.25/4)+' g',M[1]/(o[4]*.25/4)*100],['Grasas',peN(M[2])+' g',Math.round(o[4]*.3/9)+' g',M[2]/(o[4]*.3/9)*100],['Fibra',peN(M[3]/75)+' g','25 g',M[3]/75/25*100]].map(([t,v,m,p])=>`<div><span>${t}</span>${fxBar(p,p>105?'a':'')}<b class="num">${v}</b><small class="num">meta ${m}</small></div>`).join('')}</div>
  <div class="plab">Plato del día</div>${pePlate(its)}
  <div class="plab">Nutrientes a cuidar</div><div class="pemt2">${[['Hierro','14 mg','18 mg',78],['Calcio','820 mg','1.000 mg',82],['Sodio','1.650 mg','< 2.000 mg',82],['Vitamina C','140 mg','75 mg',100]].map(([t,v,m,p])=>`<div><span>${t}</span>${fxBar(p)}<b class="num">${v}</b><small class="num">${m}</small></div>`).join('')}</div>
  <div class="iactl">${[`Sin gluten en las 5 comidas`,`Sin lactosa`,`Calorías del día ${Math.abs(M[3]/o[4]*100-100)<5?'dentro de la meta':'fuera de la meta'}`].map((t,j)=>`<div class="${j===2&&Math.abs(M[3]/o[4]*100-100)>=5?'wa':'ok'}">${svg(j===2&&Math.abs(M[3]/o[4]*100-100)>=5?'alert':'check',13)}<span>${t}</span></div>`).join('')}</div>`;
 else if(PE.rt===1)body=`<div class="aphone peph"><div><small>Hoy · ${PDAYL[pDay]}</small><b>Tu plan</b>${PMEALS.map((m,r)=>`<p><time>${PE.hr[`${pPi}-${r}`]||PEHR[r]}</time><span><small>${m}</small>${pMeal(pDay,r)}<em>${peItems(pDay,r).map(it=>peCas(it.n,it.g)+' de '+it.n.toLowerCase()).join(' · ')}</em></span></p>`).join('')}</div></div><p class="mhelp">Así lo ve ${f} en su app, con medidas caseras y alternativas. Solo ve la última versión publicada.</p>`;
 else body=`<div class="pepdf"><div class="pepg"><header><span class="mk">V</span><b>Plan de ${o[0]}</b><small>${o[3]} · Lic. Verónica Trenti</small></header>${PMEALS.map((m,r)=>`<div><span>${m}</span><b>${pMeal(pDay,r)}</b></div>`).join('')}<footer>Semana ${pWeek+1} · página 1 de 4</footer></div></div>
  <div class="pepo">${[['Logo y colores del consultorio',1],['Medidas caseras',1],['Lista de compras',1],['Recetas del plan',0],['Una semana por hoja',1]].map(([t,on])=>`<div class="tog"><span class="tx"><b>${t}</b></span><button type="button" class="sw" role="switch" aria-checked="${!!on}" aria-label="${t}"></button></div>`).join('')}</div>
  <div class="macts"><button type="button" class="sbtn k" data-pa="pdf">${svg('dl',13)}Descargar PDF</button><button type="button" class="sbtn" data-pg="print">Imprimir</button></div>`;
 const G=[['plus','Nuevo plan','nuevo'],['spark','Asistente con IA','ia'],['copy','Guardar como plantilla','tpl'],['users','Copiar a otra paciente','copiar'],['cal','Programar publicación','prog'],['eye','Ver como '+f,'vista'],['swap','Versiones','ver'],['pen','Ajustes del plan','metas']];
 const req=(pPi===0&&pReq[0])||(pPi===2&&pReq[1]);
 return fxP('',`<div class="iaseg">${T.map((t,j)=>`<button type="button" role="radio" aria-checked="${PE.rt===j}" data-pert="${j}">${t}</button>`).join('')}</div>`,'',body,'pert')
  +fxP('Compartir con '+f,'','',`<div class="peshare">${[['send','En su app','le llega el aviso al publicar'],['chat','Por mail','con el plan en PDF adjunto'],['dl','PDF descargable','para guardar o mandar vos'],['file','Impreso','para pacientes sin celular']].map(([i,t,s])=>`<div>${svg(i,14)}<span><b>${t}</b><small>${s}</small></span></div>`).join('')}</div><div class="macts"><button type="button" class="sbtn k" data-pa="publicar">${svg('send',13)}Compartir ahora</button></div>`)
  +fxP('Gestión del plan','','',`<div class="pegest">${G.map(([i,t,k])=>`<button type="button" data-pg="${k}">${svg(i,14)}<span>${t}</span></button>`).join('')}</div>`)
  +(req?fxP('Pedido de cambio','','',`<div class="fxr preq"><div class="a"><span class="t"><b>${pPi===0?'Cena del jueves':'Arroz por quinoa'}</b><small>${pPi===0?'«Tengo poco tiempo esa noche». Propuesta: revuelto rápido con verduras.':'En los almuerzos, misma porción cocida.'}</small></span><button type="button" class="sbtn k" data-pq="${pPi===0?0:1}">Aprobar</button></div></div>`):'')
  +fxP('Últimos cambios','','',`<div class="fxs">${fxTl((PE.log.length?PE.log.slice(0,4).map(([t,w])=>[t,'en el borrador',w]):[]).concat([['Versión 3 publicada','la abrió el mismo día','12/10'],['Semanas 3 y 4 con más hierro','Verónica','12/10']]).slice(0,5))}</div>`);}
/* Encabezado de la pantalla igual al resto: pestañas · «Nuevo plan» · avisos · botón negro */
const _peHead=pHead;pHead=function(){_peHead();const pa=document.getElementById('pacts');
 if(pV===1&&pO()[5]!=='Sin plan'&&!pa.querySelector('[data-pa="nuevo"]'))pa.insertAdjacentHTML('afterbegin',`<button class="chip" type="button" data-pa="nuevo">${svg('plus',13)}Nuevo plan</button>`);
};
const _peNew=PA.nuevo;PA.nuevo=()=>{const ci=PP[pPi][5]==='Sin plan'?pPi:Math.max(0,PP.findIndex(p=>p[5]==='Sin plan'));return ntWithDiet({t:'Nuevo plan',s:'Queda en borrador; si tenía uno, el anterior se guarda en Versiones',ok:'Empezar',
 body:aF('Paciente',aS(PP.map(p=>p[0]),PP[pV===1?pPi:ci][0]))+aF('Cómo empezar',aSeg(['Con IA','Plantilla','Copiar el vigente','Desde cero']))+aF('Duración',aSeg(['1 día','7 días','14 días','4 semanas'],1)),
 after:b=>{const i=PP.findIndex(p=>p[0]===aVal(b,0)),j=[...b.querySelectorAll('.aseg')][0].querySelector('[aria-checked=true]');const m=[...j.parentElement.children].indexOf(j);
  if(m===0)return iaOpen(i);if(m===1){pPi=i;return pView(3);}const o=PP[i];o[3]=m===2&&o[3]?o[3]+' (nueva versión)':'Plan en blanco '+pFmt(o[4]||1700)+' kcal';o[4]=o[4]||1700;o[5]='Borrador';o[6]=1;o[8]='Ahora';pDirty(i);pWeek=0;pOpen(i);},
 done:b=>`Plan nuevo en borrador para ${aVal(b,0).split(' ')[0]}.`});};
/* La barra del plan: pestañas, estado, para revisar, deshacer, rehacer, guardado y asistente */
const _pePlan=pPlan;pPlan=function(){let h=_pePlan();if(pO()[5]==='Sin plan')return h;
 h=h.replace(/<button type="button" class="sbtn" data-pa="vista">[\s\S]*?<\/button>/,'').replace(/<button type="button" class="sbtn" data-pa="guardar-tpl"[\s\S]*?<\/button>/,'');
 return h.replace('<div class="pacts2">',`<div class="pacts2"><span class="pesaved" id="pesaved">${PE.saved?`${svg('check',12)}Todo guardado`:'Guardando…'}</span><button type="button" class="ibtn" data-peundo aria-label="Deshacer"${PE.undo.length?'':' disabled'}>${svg('undo',14)}</button><button type="button" class="ibtn" data-peredo aria-label="Rehacer"${PE.redo.length?'':' disabled'}>${svg('redo',14)}</button>`);};
PVIEWS[1]=pPlan;
const _peSem=pSemana;pSemana=function(){return PE.mode==='dia'?peDay():_peSem().replace(/(<span class="psaved">)/,`<div class="iaseg">${['Día','Semana'].map((t,j)=>`<button type="button" role="radio" aria-checked="${j===1}" data-pem="${j?'semana':'dia'}">${t}</button>`).join('')}</div>$1`);};
const _peDraw=pDraw;pDraw=function(a){_peDraw(a);const w=document.getElementById('pwrap');w.classList.toggle('pe-dia',pV===1&&pTab==='semana'&&PE.mode==='dia'&&pO()[5]!=='Sin plan');};
(function(){const S=document.getElementById('s-planes');
 const ri=s=>s.split(',').map(Number);
 S.addEventListener('click',e=>{const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  const mine=['ped','pem','pefot','pert','pealt','peadd','penote','pedel','pg','peundo','peredo'].some(k=>d[k]!==undefined);if(!mine)return;e.stopPropagation();
  if(d.ped!==undefined){pDay=+d.ped;pCell=[pCell[0],pDay];return pDraw();}
  if(d.pem){PE.mode=d.pem;return pDraw(1);}
  if(d.pefot!==undefined){PE.fotos=PE.fotos?0:1;return pDraw();}
  if(d.pert!==undefined){PE.rt=+d.pert;return pDraw();}
  if(d.peundo!==undefined){if(!PE.undo.length)return;PE.redo.push(peSnap());peLoad(PE.undo.pop());pDraw();return toast('Cambio deshecho.');}
  if(d.peredo!==undefined){if(!PE.redo.length)return;PE.undo.push(peSnap());peLoad(PE.redo.pop());pDraw();return toast('Cambio rehecho.');}
  if(d.pedel){const [r,i]=ri(d.pedel),L=peItems(pDay,r).slice(),it=L[i];return peDo(()=>{L.splice(i,1);peSet(pDay,r,L);},`Quitaste ${it.n.toLowerCase()} del ${PMEALS[r].toLowerCase()}`);}
  if(d.penote){const [r,i]=ri(d.penote),it=peItems(pDay,r)[i];return aOpen({t:'Nota de preparación',s:it.n,ok:'Guardar',body:aF('Cómo se prepara',aT(it.note,'Por ejemplo: a la plancha, sin sal, con limón'))+'<p class="mhelp">La ve en su app y en el PDF, debajo del alimento.</p>',after:bx=>{const v=aVal(bx,0).replace(/</g,'').trim();const L=peItems(pDay,r).map(x=>({...x}));L[i].note=v;peDo(()=>peSet(pDay,r,L),'Nota en '+it.n.toLowerCase());},done:'Nota guardada en el borrador.'});}
  if(d.peadd){const r=+d.peadd,F=Object.entries(PEQ).flatMap(([g,l])=>l.map(x=>`${x[0]} · ${g}`));
   return aOpen({t:'Agregar alimento',s:`${PMEALS[r]} del ${PDAYL[pDay]}`,ok:'Agregar',body:aF('Alimento',aS(F))+aF('Cantidad (g)',aI('100','','number'))+'<p class="mhelp">Sale de tu base y de SARA. Calcula calorías y medida casera solo.</p>',
    after:bx=>{const [n,g]=aVal(bx,0).split(' · '),q=Math.max(5,+aVal(bx,1)||100),x=PEQ[g].find(y=>y[0]===n),k=Math.round(x[2]*q/x[1]);const L=peItems(pDay,r).map(y=>({...y}));L.push({n,t:peType(n),g:q,g0:q,k0:k,u:peUnit(n),note:''});peDo(()=>peSet(pDay,r,L),`Agregaste ${n.toLowerCase()} al ${PMEALS[r].toLowerCase()}`);},done:'Alimento agregado en el borrador.'});}
  if(d.pealt){const r=+d.pealt,cur=pMeal(pDay,r),A=PALT[r].filter(x=>x[0]!==cur);
   return aOpen({t:'Cambiar plato',s:`${PMEALS[r]} del ${PDAYL[pDay]} · ${pKc(pDay,r)} kcal`,ok:false,body:`<div class="palt">${A.map(([t,img],j)=>`<div>${pImg(img,'40px','40px')}<span><b>${t}</b><small class="num">${pKc(pDay,r)} kcal · misma porción</small></span><button type="button" class="sbtn" data-pealtu="${j}">Usar</button></div>`).join('')}</div><p class="mhelp">También podés pedírselo al asistente con una frase.</p>`,
    click:x=>{if(x.dataset.pealtu===undefined)return;const a=A[+x.dataset.pealtu];aClose();peDo(()=>{const k=peKey(pDay,r);delete PE.FD[k];PED[k]=[a[0],pKc(pDay,r)];},`${PMEALS[r]} del ${PDAYL[pDay]}: ${a[0].toLowerCase()}`);toast('Plato cambiado en el borrador.');}});}
  const g=d.pg;
  if(g==='dup')return aOpen({t:'Duplicar el '+PDAYL[pDay],s:'Copia las cinco comidas con sus cantidades',ok:'Duplicar',body:aF('Copiar a',aCh(PDAYS.filter((_,i)=>i!==pDay),[PDAYS[(pDay+1)%7]])),
   after:bx=>{const to=[...bx.querySelectorAll('.ach [aria-pressed=true]')].map(x=>PDAYS.indexOf(x.textContent));const src=PMEALS.map((_,r)=>[pMeal(pDay,r),peItems(pDay,r)]);peDo(()=>to.forEach(t=>src.forEach(([n,L],r)=>{const k=peKey(t,r);PED[k]=[n,L.reduce((a,it)=>a+peK(it),0)];PE.FD[k]=L.map(x=>({...x}));})),`Duplicaste el ${PDAYL[pDay]}`);},done:'Día duplicado en el borrador.'});
  if(g==='metas')return aOpen(PA.metas());
  if(g==='nuevo')return aOpen(PA.nuevo());
  if(g==='ia'){iaDrawer(1);return;}
  if(g==='tpl')return aOpen(PA['guardar-tpl']());
  if(g==='vista')return aOpen(PA.vista());
  if(g==='ver'){pTab='ver';return pDraw(1);}
  if(g==='print')return toast('Se abre la vista para imprimir.');
  if(g==='copiar')return aOpen({t:'Copiar a otra paciente',s:'Queda en borrador para ella; los datos de '+pFirst(pPi)+' no se copian',ok:'Copiar',body:aF('Paciente',aS(PP.filter((_,i)=>i!==pPi).map(p=>p[0]))),after:bx=>{const i=PP.findIndex(p=>p[0]===aVal(bx,0)),o=PP[i];o[3]=pO()[3];o[4]=pO()[4];o[5]='Borrador';o[8]='Ahora';pDirty(i);},done:bx=>`Plan copiado en borrador para ${aVal(bx,0).split(' ')[0]}.`});
  if(g==='prog')return aOpen({t:'Programar publicación',s:'Le llega el aviso por la app y por mail ese día',ok:'Programar',body:aRow(aF('Día',aS(['Lun 27/10','Mar 28/10','Mié 29/10','Después de la próxima consulta'])),aF('Hora',aS(['8:00','12:00','18:00']))),done:bx=>`Publicación programada: ${aVal(bx,0)} a las ${aVal(bx,1)}.`});
 });
 S.addEventListener('change',e=>{const t=e.target,d=t.dataset;
  if(d.peh!==undefined){e.stopPropagation();const r=+d.peh,v=t.value.trim();if(!/^([01]?\d|2[0-3]):[0-5]\d$/.test(v)){t.value=PE.hr[`${pPi}-${r}`]||PEHR[r];return toast('Escribí la hora así: 08:30');}return peDo(()=>{PE.hr[`${pPi}-${r}`]=v;},`${PMEALS[r]} a las ${v}`);}
  if(d.peq){e.stopPropagation();const [r,i]=ri(d.peq),q=Math.max(5,+t.value||5),L=peItems(pDay,r).map(x=>({...x}));const n=L[i].n;L[i].g=q;return peDo(()=>peSet(pDay,r,L),`${n}: ${q} ${L[i].u}`);}
  if(d.peu){e.stopPropagation();const [r,i]=ri(d.peu),L=peItems(pDay,r).map(x=>({...x}));L[i].u=t.value;return peDo(()=>peSet(pDay,r,L),`${L[i].n} en ${t.value}`);}
 },true);
 S.addEventListener('keydown',e=>{if(e.target.dataset&&e.target.dataset.peq!==undefined&&e.key==='Enter')e.target.blur();});
})();
if(!document.getElementById('s-planes').hidden)pDraw();
