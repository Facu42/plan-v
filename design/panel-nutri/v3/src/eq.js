/* Equipo: integrantes, permisos por módulo y registro de accesos (Nutreando 0.6, docs/nutreando/plan.md). */
const EQ={view:0,p:0,f:0,acc:'Todo'};
const EQP=[ // nombre, iniciales, color, rol, detalle, mail, pacientes que ve, último ingreso, dos pasos, estado
 ['Verónica Trenti','VT','azaf','Dueña','Nutricionista · MN 4521','vero@consultoriotrenti.com.ar','Todas','Hoy 8:02',1,'Activa'],
 ['Lucía Paz','LP','lima','Nutricionista','Asociada · MN 7810','lucia.paz@gmail.com','Las suyas (12)','Ayer 19:40',1,'Activa'],
 ['Carla Gómez','CG','azul','Recepción','Turnos y cobros','recepcion@consultoriotrenti.com.ar','Solo datos de contacto','Hoy 9:15',0,'Activa'],
 ['Martín Ruiz','MR','rojo','Contador','Planillas para facturar','mruiz.contable@gmail.com','Ninguna','—',0,'Invitada']];
const EQM=['Inicio','Pacientes','Ficha clínica','Planes','Mensajes','Agenda','Cobranzas','Página pública','Equipo','Ajustes'];
const EQL=['Todo','Ver','Sin acceso'];
let EQX=[ // nivel por módulo (0 todo, 1 ver, 2 sin acceso) para cada persona
 [0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,1,1,1,2,2],[1,1,2,2,0,0,0,1,2,2],[2,2,2,2,2,2,1,2,2,2]];
const EQR=[['Dueña','Todo, incluido Equipo y Ajustes',1],['Nutricionista','Fichas, planes y mensajes de sus pacientes',1],['Recepción','Agenda, cobros y mensajes; nunca la ficha clínica',1],['Contador','Solo ve Cobranzas y descarga planillas',1]];
const EQA=[ // hora, persona, qué, tipo, desde
 ['Hoy 10:12','Verónica Trenti','Cambió el plan de Sofía Gómez','Cambios','Chrome · consultorio'],
 ['Hoy 9:58','Verónica Trenti','Abrió la ficha de Sofía Gómez','Fichas','Chrome · consultorio'],
 ['Hoy 9:31','Carla Gómez','Confirmó el turno de Valeria Núñez','Cambios','Chrome · recepción'],
 ['Hoy 9:15','Carla Gómez','Entró al panel','Ingresos','Chrome · recepción'],
 ['Hoy 8:40','Verónica Trenti','Abrió la ficha de Martina Díaz','Fichas','iPhone · app'],
 ['Hoy 8:02','Verónica Trenti','Entró al panel','Ingresos','iPhone · app'],
 ['Ayer 21:40','Carla Gómez','Entró desde un dispositivo nuevo','Ingresos','Android · Quilmes'],
 ['Ayer 19:40','Lucía Paz','Abrió la ficha de Rocío Paz','Fichas','Chrome · casa'],
 ['Ayer 19:22','Lucía Paz','Firmó la consulta de Rocío Paz','Cambios','Chrome · casa'],
 ['Ayer 17:05','Carla Gómez','Descargó la planilla de cobros de octubre','Cambios','Chrome · recepción'],
 ['Ayer 12:10','Verónica Trenti','Abrió la ficha de Paula Acosta','Fichas','Chrome · consultorio']];
const EQF=['Todo','Fichas','Cambios','Ingresos'];
const eqAv=(a,c,s=30)=>`<span class="av" style="background:var(--${c}-t);color:var(--${c}-ink);width:${s}px;height:${s}px;font-size:${s>34?13:11}px">${a}</span>`;
const eqB=(t,a,k='',i='')=>`<button type="button" class="sbtn${k?' '+k:''} cbtn" data-eqa="${a}">${i?svg(i,13):''}${t}</button>`;
const eqLv=l=>`<span class="eqlv l${l}">${EQL[l]}</span>`;

function eqV0(){const p=EQP[EQ.p];
 return `<div class="fx" style="grid-template-columns:1.5fr 1fr">
 <div class="c">${fxP('Integrantes',`${EQP.length} personas · 1 invitación`,'',`<div class="fxs"><table class="pubt eqt"><thead><tr><th>Persona</th><th>Rol</th><th>Pacientes que ve</th><th>Último ingreso</th><th>Dos pasos</th><th>Estado</th></tr></thead><tbody>${EQP.map((x,i)=>`<tr data-eqp="${i}" class="${i===EQ.p?'on':''}" tabindex="0"><td><span class="eqwho">${eqAv(x[1],x[2])}<span><b>${x[0]}</b><small>${x[4]}</small></span></span></td><td>${x[3]}</td><td>${x[6]}</td><td>${x[7]}</td><td>${x[8]?`<span class="ntsig">${svg('shield',13)}Activa</span>`:'<span class="ntsig n">Sin activar</span>'}</td><td>${pill(x[9],x[9]==='Activa'?'p-conf':x[9]==='Pausada'?'p-ok':'p-wait')}</td></tr>`).join('')}</tbody></table></div>`)}
  ${fxP('Roles','qué puede hacer cada uno',eqB('Editar roles','roles'),`<div class="eqroles">${EQR.map(r=>`<div><b>${r[0]}</b><small>${r[1]}</small></div>`).join('')}</div>`)}
  ${fxP('Actividad del equipo','hoy',`<button class="lnk" type="button" data-eqa="verac">Registro ${svg('chev',11)}</button>`,`<div class="fxs">${fxTl(EQA.filter(a=>a[0].startsWith('Hoy')).map(a=>[a[1].split(' ')[0]+': '+a[2].charAt(0).toLowerCase()+a[2].slice(1),a[4],a[0].replace('Hoy ','')]))}</div>`,'g')}
 </div>
 <div class="c">${fxP(p[0],pill(p[9],p[9]==='Activa'?'p-conf':p[9]==='Pausada'?'p-ok':'p-wait'),eqB('Permisos','perm','','lock'),`<div class="eqhd">${eqAv(p[1],p[2],44)}<span><b>${p[3]}</b><small>${p[4]}</small></span></div>
   ${fxKv([['Mail',p[5]],['Pacientes',p[6]],['Último ingreso',p[7]],['Dos pasos',p[8]?'Activa':'Sin activar · se lo pedimos al entrar']])}
   <div class="eqmods">${EQM.map((m,i)=>`<span class="l${EQX[EQ.p][i]}">${m}</span>`).join('')}</div>
   ${p[7]!=='—'?`<div class="eqsub"><small>Sesiones abiertas</small><div class="publk">${(p[0]==='Verónica Trenti'?[['iPhone · app','ahora'],['Chrome · consultorio','hace 20 min']]:p[0]==='Carla Gómez'?[['Chrome · recepción','ahora'],['Android · Quilmes','ayer 21:40']]:[['Chrome · casa','ayer 19:40']]).map(x=>`<div><span class="t"><b>${x[0]}</b><small>${x[1]}</small></span><button type="button" class="sbtn" data-eqa="ses">Cerrar</button></div>`).join('')}</div></div>`:''}
   <div class="eqsub"><small>Lo último que hizo</small>${(l=>l.length?fxTl(l):'<span class="ntempty">Todavía no entró.</span>')(EQA.filter(a=>a[1]===p[0]).slice(0,3).map(a=>[a[2],a[4],a[0].replace('Hoy ','').replace('Ayer ','ayer ')]))}</div>
   <div class="fxfoot pubft">${p[9]==='Invitada'?eqB('Reenviar invitación','reinv','','send'):p[3]==='Dueña'?'<span class="ntsig n">La dueña no se puede pausar</span>':eqB(p[9]==='Pausada'?'Reactivar acceso':'Pausar acceso',p[9]==='Pausada'?'react':'pausa')}<span style="flex:1"></span>${eqB('Ver sus accesos','verac','k','eye')}</div>`,'g')}
 </div></div>`;}

function eqV1(){return `<div class="fx" style="grid-template-columns:1fr 330px">
 <div class="c">${fxP('Permisos por módulo','tocá un casillero para cambiarlo',`<span class="eqleg">${EQL.map((l,i)=>eqLv(i)).join('')}</span>`,`<div class="fxs pubts"><table class="eqm"><thead><tr><th>Módulo</th>${EQP.map(p=>`<th><span class="eqwho">${eqAv(p[1],p[2],24)}<span><b>${p[0].split(' ')[0]}</b><small>${p[3]}</small></span></span></th>`).join('')}</tr></thead><tbody>${EQM.map((m,r)=>`<tr><td>${m}</td>${EQP.map((p,c)=>`<td><button type="button" class="eqc l${EQX[c][r]}" data-eqc="${c},${r}" ${c===0?'disabled':''} aria-label="${m} para ${p[0]}: ${EQL[EQX[c][r]]}">${EQL[EQX[c][r]]}</button></td>`).join('')}</tr>`).join('')}</tbody></table></div>`,'g')}</div>
 <div class="c">
  ${fxP('Pacientes que ve cada uno','',eqB('Cambiar','pacs'),`<div class="pubhr">${EQP.map(p=>`<div><b>${p[0].split(' ')[0]}</b><span>${p[6]}</span><span></span></div>`).join('')}</div>`)}
  ${fxP('Reglas que no se cambian','',``,`<div class="pubpide">${[['La ficha clínica solo la ven nutricionistas'],['Recepción ve el contacto, nunca las notas'],['Cada cambio en la ficha queda firmado'],['Quien sale del equipo pierde el acceso al instante']].map(([t])=>`<div>${svg('lock',13)}<span>${t}</span></div>`).join('')}</div>`)}
  ${fxP('Cambios de permisos','últimos','',`<div class="fxs">${fxTl([['Carla: Mensajes pasó a «Todo»','lo cambió Verónica','14/10'],['Lucía: Agenda pasó a «Ver»','lo cambió Verónica','02/10'],['Martín: invitación como contador','lo invitó Verónica','ayer'],['Lucía entró al equipo','nutricionista asociada','12/09']])}</div>`,'g')}
  ${fxAi('Sugerencia:','Martín todavía no aceptó la invitación. Si solo necesita las planillas, podés mandárselas desde Cobranzas sin darle acceso.')}
 </div></div>`;}

function eqV2(){const l=EQA.filter(a=>EQ.f===0||a[3]===EQF[EQ.f]);
 return `<div class="fx" style="grid-template-columns:1.6fr 1fr">
 <div class="c">${fxP('Registro de accesos','quién abrió cada ficha y qué cambió',`<div class="tabs">${EQF.map((f,i)=>`<button type="button" data-eqf="${i}" class="${i===EQ.f?'on':''}">${f}</button>`).join('')}</div>${eqB('Descargar','dl','','dl')}`,`<div class="fxs"><table class="pubt eqt"><thead><tr><th>Cuándo</th><th>Quién</th><th>Qué hizo</th><th>Desde</th></tr></thead><tbody>${l.map(a=>{const p=EQP.find(x=>x[0]===a[1]);return `<tr><td class="num">${a[0]}</td><td><span class="eqwho">${eqAv(p[1],p[2],24)}<b>${a[1]}</b></span></td><td>${a[2]}</td><td><small>${a[4]}</small></td></tr>`}).join('')}</tbody></table></div>`,'g')}</div>
 <div class="c">
  ${fxP('Hoy','',``,`<div class="pubkp"><div><small>Fichas abiertas</small><b class="num">14</b><em>3 personas</em></div><div><small>Cambios</small><b class="num">9</b><em>todos firmados</em></div><div><small>Fuera de horario</small><b class="num">0</b><em>ingresos</em></div></div>`)}
  ${fxP('Para revisar','1',``,`<div class="eqal"><b>Carla entró desde un dispositivo nuevo</b><small>Ayer 21:40 · Android · Quilmes</small><div class="pubshb">${eqB('Fue ella','okdev','k')}${eqB('Cerrar su sesión','cerrar')}</div></div>`)}
  ${fxP('Fichas más abiertas','esta semana',``,`<div class="pubsrc">${[['Sofía Gómez',9],['Martina Díaz',6],['Rocío Paz',4],['Paula Acosta',3],['Julia Sosa',2]].map(([t,n])=>`<div><span>${t}</span>${fxBar(n/9*100)}<b class="num">${n}</b></div>`).join('')}</div>`)}
  ${fxP('Ingresos por persona','esta semana','',`<div class="pubsrc">${[['Verónica',18],['Carla',11],['Lucía',6],['Martín',0]].map(([t,n])=>`<div><span>${t}</span>${fxBar(n/18*100)}<b class="num">${n}</b></div>`).join('')}</div><small class="nthint">Martín todavía no aceptó la invitación.</small>`,'g')}
 </div></div>`;}

const EQT=['Integrantes','Permisos','Registro de accesos'];
function eqDraw(an){document.getElementById('eqwrap').innerHTML=[eqV0,eqV1,eqV2][EQ.view]();
 document.querySelectorAll('#eqview button').forEach((b,i)=>b.classList.toggle('on',i===EQ.view));
 document.querySelectorAll('.nv[data-go="equipo"]+.subw .si').forEach((s,i)=>s.classList.toggle('on',i===EQ.view));
 if(an)fxAnim(document.getElementById('eqwrap'));}
const EQAC={
 invitar:()=>({t:'Invitar a alguien',s:'Le llega un mail con el link para entrar',ok:'Mandar invitación',body:aF('Nombre',aI('','Ej.: Sol Fernández'))+aF('Mail',aI('','nombre@mail.com','email'))+aF('Rol',aSeg(['Nutricionista','Recepción','Contador']))+aF('Pacientes que ve',aSeg(['Las suyas','Todas','Ninguna']))+`<small class="nthint">Le pedimos verificación en dos pasos al entrar. Podés ajustar cada módulo en Permisos.</small>`,
  after:b=>{const n=aVal(b,0)||'Persona nueva',r=b.querySelector('.aseg [aria-checked=true]').textContent;EQP.push([n,n.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase(),'lima',r,r==='Nutricionista'?'Asociada':r==='Recepción'?'Turnos y cobros':'Planillas para facturar',aVal(b,1)||'—',r==='Nutricionista'?'Las suyas (0)':r==='Recepción'?'Solo datos de contacto':'Ninguna','—',0,'Invitada']);EQX.push(r==='Nutricionista'?[0,0,0,0,0,1,1,1,2,2]:r==='Recepción'?[1,1,2,2,0,0,0,1,2,2]:[2,2,2,2,2,2,1,2,2,2]);EQ.p=EQP.length-1;EQ.view=0;eqDraw();},done:b=>`Invitación enviada a ${aVal(b,0)||'la persona nueva'}.`}),
 perm:()=>{EQ.view=1;eqDraw(1);},
 verac:()=>{EQ.view=2;EQ.f=0;eqDraw(1);},
 roles:()=>({t:'Roles',s:'Lo que ve cada rol al invitar a alguien',ok:'Guardar',body:EQR.map(r=>aF(r[0],aI(r[1]))).join(''),done:'Roles guardados.'}),
 pacs:()=>({t:'Pacientes que ve cada uno',ok:'Guardar',body:EQP.slice(1).map(p=>aF(p[0],aS(['Todas','Las suyas','Solo datos de contacto','Ninguna'],p[6].startsWith('Las suyas')?'Las suyas':p[6]))).join(''),after:b=>{EQP.slice(1).forEach((p,i)=>{const v=b.querySelectorAll('select')[i].value;p[6]=v==='Las suyas'?'Las suyas (12)':v;});eqDraw();},done:'Guardado.'}),
 ses:b=>{const r=b.closest('div');b.replaceWith(Object.assign(document.createElement('span'),{className:'ntsig n',textContent:'Cerrada'}));toast('Sesión cerrada en ese dispositivo.');},
 reinv:()=>{toast(`Invitación reenviada a ${EQP[EQ.p][5]}.`);},
 pausa:()=>({t:'Pausar el acceso de '+EQP[EQ.p][0],s:'No se borra nada: sus notas y cambios quedan firmados',ok:'Pausar acceso',body:aF('Desde',aSeg(['Ahora','Al final del día']))+aF('Motivo (solo lo ves vos)',aI('','Ej.: licencia')),after:()=>{EQP[EQ.p][9]='Pausada';eqDraw();},done:'Acceso pausado. Su sesión se cerró.'}),
 react:()=>{EQP[EQ.p][9]='Activa';eqDraw();toast('Acceso reactivado.');},
 dl:async()=>{const t='Cuándo;Quién;Qué hizo;Desde\n'+EQA.map(a=>[a[0],a[1],a[2],a[4]].join(';')).join('\n');const dl=window.claude?await claude.use('downloads').catch(()=>null):null;if(!dl)return toast('Registro listo. La descarga no está disponible en esta vista.');try{await dl.save({name:'registro-de-accesos.csv',type:'text/csv',content:t});toast('Registro descargado.');}catch(e){toast('No se pudo descargar.');}},
 okdev:b=>{b.closest('.eqal').innerHTML='<span class="ntsig">'+svg('check',13)+'Revisado: fue Carla.</span>';toast('Listo, queda anotado.');},
 cerrar:b=>{b.closest('.eqal').innerHTML='<span class="ntsig">'+svg('check',13)+'Sesión cerrada en ese dispositivo.</span>';toast('Cerramos la sesión de Carla en el dispositivo nuevo. Le pedimos entrar de nuevo con dos pasos.');}
};
(function(){
 document.getElementById('s-ficha').insertAdjacentHTML('beforebegin',`<div class="scr" id="s-equipo" hidden>
  <div class="top"><div><h1>Equipo <span>· ${EQP.length} personas</span></h1><div class="date">Cada persona ve solo lo que le habilitás · todo queda registrado</div></div><div class="sp"></div>
   <div class="tabs" id="eqview">${EQT.map((t,i)=>`<button type="button" data-eqv="${i}" class="${i?'':'on'}">${t}</button>`).join('')}</div>
   <button class="ibtn" type="button" aria-label="Avisos">${svg('bell')}<i></i></button>
   <button class="cta" type="button" data-eqa="invitar">${svg('plus')}Invitar a alguien</button></div>
  <div id="eqwrap"></div></div>`);
 const nv=[...document.querySelectorAll('.side .nv')].find(n=>n.textContent.trim().startsWith('Equipo'));nv.dataset.go='equipo';nv.addEventListener('click',()=>go('equipo'));
 const subw=nv.nextElementSibling;if(subw&&subw.classList.contains('subw')&&subw.querySelectorAll('.si').length===2)subw.querySelector('.subi').insertAdjacentHTML('beforeend','<button class="si" type="button" style="--i:2"><span>Registro de accesos</span></button>');
 const sg=document.querySelector('.bar .seg [data-go="publica"]');if(sg){sg.insertAdjacentHTML('afterend','<button type="button" data-go="equipo" aria-pressed="false">Equipo</button>');sg.nextElementSibling.addEventListener('click',()=>go('equipo'));}
 const S=document.getElementById('s-equipo');
 S.addEventListener('click',e=>{if(e.target.closest('[aria-label="Avisos"]'))return;const b=e.target.closest('button,tr[data-eqp]');if(!b||b.disabled)return;e.stopPropagation();const d=b.dataset;
  if(d.eqv!==undefined){EQ.view=+d.eqv;return eqDraw(1);}
  if(d.eqp!==undefined){EQ.p=+d.eqp;return eqDraw();}
  if(d.eqf!==undefined){EQ.f=+d.eqf;return eqDraw();}
  if(d.eqc){const [c,r]=d.eqc.split(',').map(Number);if(r===2&&EQP[c][3]==='Recepción'&&EQX[c][r]===2)return toast('La ficha clínica solo la ven nutricionistas.');EQX[c][r]=(EQX[c][r]+1)%3;if(r===2&&EQP[c][3]!=='Nutricionista'&&EQX[c][r]!==2)EQX[c][r]=2;eqDraw();return toast(`${EQM[r]} para ${EQP[c][0].split(' ')[0]}: ${EQL[EQX[c][r]].toLowerCase()}.`);}
  const f=EQAC[d.eqa];if(!f)return;const r=f(b);if(r&&r.t)aOpen(r);});
 S.addEventListener('keydown',e=>{const t=e.target.closest('tr[data-eqp]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();t.click();}});
 document.querySelectorAll('.nv[data-go="equipo"]+.subw .si').forEach((s,i)=>s.addEventListener('click',()=>{go('equipo');EQ.view=i;eqDraw(1);}));
 eqDraw();})();
const _geq=go;go=function(id){_geq(id);if(id==='equipo')fxAnim(document.getElementById('eqwrap'));};
if(location.hash==='#equipo')go('equipo');
