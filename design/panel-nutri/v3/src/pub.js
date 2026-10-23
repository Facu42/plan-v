/* Página pública: Mi página, Servicios y Reservas en línea (Nutreando 0.5, docs/nutreando/plan.md). */
Object.assign(IC,{star:'<path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
 link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
 qr:'<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
 pin:'<path d="M12 21s-6.5-6.2-6.5-11a6.5 6.5 0 0 1 13 0c0 4.8-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'});
const PUB={url:'verotrenti.planv.app',dirty:0,view:0,sv:0,ask:1};
const PSV=[ // nombre, tipo, duración, modalidad, precio, quién reserva, estado, instrucciones previas, acepta obra social, link
 ['Primera consulta','Consulta','60 min','Consultorio o videollamada',40000,'Cualquier persona','Publicado','Traé tus últimos análisis. Si hacemos bioimpedancia, vení con 3 horas de ayuno.',1,'primera-consulta'],
 ['Seguimiento','Consulta','40 min','Consultorio o videollamada',30000,'Solo pacientes','Publicado','Cargá en la app lo que comiste esta semana antes del turno.',1,'seguimiento'],
 ['Programa mensual','Membresía','2 consultas y chat','Consultorio o videollamada',54000,'Solo pacientes','Publicado','Se renueva cada mes y lo podés dar de baja cuando quieras.',0,'programa'],
 ['Paquete de 3 seguimientos','Paquete','3 × 40 min','Consultorio o videollamada',81000,'Solo pacientes','Publicado','Vence a los 90 días de la primera consulta del paquete.',0,'paquete'],
 ['Antropometría ISAK','Consulta','30 min','Consultorio',18000,'Cualquier persona','Publicado','Vení con ropa cómoda y sin entrenar las 12 horas anteriores.',1,'antropometria'],
 ['Plan para deportistas','Consulta','60 min','Consultorio o videollamada',45000,'Cualquier persona','Borrador','Traé tu plan de entrenamiento de la semana.',1,'deportistas']];
const POS=[['OSDE','Reintegro','b'],['Swiss Medical','Copago $8.000','l'],['Galeno','Copago $10.000','l'],['OMINT','Reintegro','b'],['Particular','Precio completo','n']];
const POP=[['Camila M.','Seguimiento','ayer',4,'Me encantó la consulta. Me gustaría tener más recetas rápidas para la semana.',0],
 ['Valeria N.','Primera consulta','hace 3 días',5,'Me explicó todo sin retos y el plan se adapta a mis horarios de trabajo.',1],
 ['Julia S.','Seguimiento','hace 1 semana',5,'Muy atenta. Responde rápido por la app y los planes son fáciles de seguir.',1],
 ['Ana L.','Programa mensual','hace 2 semanas',5,'Bajé la glucemia sin pasar hambre. Súper recomendable.',1]];
const PRES=[['Valeria Núñez','VN','Primera consulta','Vie 24 · 11:45','Swiss Medical · copago $8.000','Confirmada'],
 ['Agustina Díaz','AD','Primera consulta','Vie 24 · 15:00','Particular','Por confirmar'],
 ['Florencia Romero','FR','Seguimiento','Lun 27 · 9:30','OSDE · reintegro','Confirmada'],
 ['Rocío Paz','RP','Antropometría ISAK','Mar 28 · 18:00','Galeno · copago $10.000','Por confirmar'],
 ['Martina Díaz','MD','Seguimiento','Mié 29 · 10:00','Particular','Confirmada'],
 ['Lucía Ferrero','LF','Seguimiento','Jue 30 · 17:30','Particular','Cambió el horario']];
const PHRS=[['Lunes','9 a 13 · 15 a 19',1],['Martes','9 a 13 · 15 a 19',1],['Miércoles','15 a 19 · videollamada',1],['Jueves','9 a 13 · 15 a 19',1],['Viernes','9 a 15',1],['Sábado','9 a 13',1],['Domingo','No atiendo',0]];
const pMoney=n=>'$'+n.toLocaleString('es-AR');
const pStars=n=>`<span class="pubst" aria-label="${n} de 5">${[1,2,3,4,5].map(i=>`<i class="${i<=n?'on':''}">${svg('star',11)}</i>`).join('')}</span>`;
const pSw=(l,on,k)=>`<button type="button" class="sw" role="switch" aria-checked="${!!on}" aria-label="${l}" data-pubsw="${k||''}"></button>`;
const pB=(t,a,k='',i='')=>`<button type="button" class="sbtn${k?' '+k:''} cbtn" data-pa="${a}">${i?svg(i,13):''}${t}</button>`;
function pQr(){let h=2166136261,r='';const N=25,c=7;for(let y=0;y<N;y++)for(let x=0;x<N;x++){const f=(x<c&&y<c)||(x>=N-c&&y<c)||(x<c&&y>=N-c);
  if(f){const ox=x<c?0:N-c,oy=y<c?0:N-c,dx=x-ox,dy=y-oy,on=dx===0||dy===0||dx===6||dy===6||(dx>=2&&dx<=4&&dy>=2&&dy<=4);if(on)r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`;continue;}
  h=Math.imul(h^(x*31+y*17),16777619);if((h>>>7)%5<2)r+=`<rect x="${x}" y="${y}" width="1" height="1"/>`;}
 return `<svg class="pubqr" viewBox="-1 -1 27 27" role="img" aria-label="Código QR de ${PUB.url}">${r}</svg>`;}

function pubPhone(){const p=PSV.filter(s=>s[6]==='Publicado').slice(0,3);
 return `<div class="pubph" aria-label="Vista previa en celular"><div class="pubsc">
  <div class="pubhero"><span class="av">VT</span><b>Lic. Verónica Trenti</b><small>Nutricionista · MN 4521</small><span class="pubrt">${pStars(5)}<em>4,9 · 23 opiniones</em></span></div>
  <div class="pubtg"><span>Celiaquía</span><span>Descenso de peso</span><span>Deportistas</span></div>
  <div class="pubsec"><h5>Turnos</h5>${p.map(s=>`<div class="pubsvc"><span><b>${s[0]}</b><small>${s[2]} · ${s[3].replace(' o ',' / ')}</small></span><em>${pMoney(s[4])}</em></div>`).join('')}</div>
  <div class="pubsec"><h5>Próximos lugares</h5><div class="pubsl"><span>Vie 24 · 15:00</span><span>Lun 27 · 11:00</span><span>Mar 28 · 9:30</span></div></div>
  <div class="pubsec"><h5>Obras sociales</h5><small class="pubos">${POS.filter(o=>o[0]!=='Particular').map(o=>o[0]).join(' · ')}</small></div>
  <div class="pubsec"><h5>Dónde</h5><small class="pubos">${svg('pin',11)} Av. Cabildo 2040, 3.º B · Belgrano<br>${svg('video',11)} También por videollamada</small></div>
  <div class="pubsec"><h5>Opiniones</h5><p class="pubq">«${POP[1][4]}»<small>${POP[1][0]} · ${POP[1][1]}</small></p></div>
 </div><div class="pubcta">Reservar turno</div></div>`;}

function pubV0(){const pend=POP.filter(o=>!o[5]).length;
 return `<div class="fx" style="grid-template-columns:1.12fr 312px 1fr">
 <div class="c">
  ${fxP('Perfil',pill(PUB.dirty?'Cambios sin publicar':'Publicada',PUB.dirty?'p-wait':'p-conf'),pB('Editar','perfil','','pen'),`<div class="pubpf"><span class="av">VT</span><span><b>Lic. Verónica Trenti</b><small>Nutricionista · MN 4521 · Belgrano, CABA</small></span></div>
   <p class="pubbio">Acompaño a mujeres que quieren comer mejor sin dietas imposibles. Especialista en celiaquía y en planes para deportistas.</p>
   <div class="pubchips"><span>Celiaquía</span><span>Descenso de peso</span><span>Deportistas</span><span>Hipotiroidismo</span></div>`)}
  ${fxP('Dónde atendés','2 lugares',pB('Cambiar','lugar'),fxKv([['Consultorio','Av. Cabildo 2040, 3.º B · Belgrano'],['Videollamada','Meet, con el link en la app de la paciente'],['Horarios','Lun a vie 9 a 19 · sáb 9 a 13']]))}
  ${fxP('Obras sociales',POS.length-1+' y particular',pB('Editar','os'),`<div class="pubosl">${POS.map(o=>`<span class="${o[2]}"><b>${o[0]}</b>${o[1]}</span>`).join('')}</div>`)}
  ${fxP('Opiniones','4,9 · 23 verificadas',`<span class="pubask">Pedir después del turno ${pSw('Pedir opinión después del turno',PUB.ask,'ask')}</span>`,`<div class="fxs"><div class="pubop">${POP.map((o,i)=>`<div class="${o[5]?'':'nw'}"><span class="t"><b>${o[0]} ${pStars(o[3])}</b><small>${o[1]} · ${o[2]}</small><q>${o[4]}</q></span>${o[5]?pB('Responder','op-r','',''):pB('Publicar','op-p','k','')}</div>`.replace(/data-pa="op-(r|p)"/,`data-pa="op-$1" data-i="${i}"`)).join('')}</div></div>`,'g')}
 </div>
 <div class="c">${fxP('Así la ve una paciente nueva','',`<button class="lnk" type="button" data-pa="abrir">Abrir ${svg('chev',11)}</button>`,pubPhone(),'g pubprev')}</div>
 <div class="c">
  ${fxP('Compartir','',``,`<div class="pubsh">${pQr()}<div><small>Tu link</small><b>${PUB.url}</b><div class="pubshb">${pB('Copiar link','copy','k','copy')}${pB('Descargar QR','qr','','dl')}</div><small class="nthint">El QR sirve para la puerta del consultorio o una tarjeta.</small></div></div>`)}
  ${fxP('Links por servicio','para Instagram o tu estado','',`<div class="publk">${PSV.filter(s=>s[6]==='Publicado').slice(0,4).map((s,i)=>`<div><span class="t"><b>${s[0]}</b><small>${PUB.url}/${s[9]}</small></span><button type="button" class="ibtn" data-pa="copy" data-u="${s[9]}" aria-label="Copiar link de ${s[0]}">${svg('copy',14)}</button></div>`).join('')}</div>`)}
  ${fxP('Este mes','visitas y reservas','',`<div class="pubkp"><div><small>Visitas</small><b class="num">412</b><em>+18%</em></div><div><small>Reservas</small><b class="num">18</b><em>+5</em></div><div><small>Reservan</small><b class="num">4,4%</b><em>de las visitas</em></div></div>${fxCurve([210,260,248,301,349,412],['may','jun','jul','ago','sep','oct'],{w:300,h:92,pr:26})}<div class="pubsrc"><small>De dónde llegan</small>${[['Instagram',58],['Google',24],['Link directo y QR',18]].map(([t,p])=>`<div><span>${t}</span>${fxBar(p)}<b class="num">${p}%</b></div>`).join('')}</div>`,'g')}
 </div></div>`;}

function pubV1(){const s=PSV[PUB.sv];
 return `<div class="fx" style="grid-template-columns:1.55fr 1fr">
 <div class="c">${fxP('Servicios',`${PSV.length} · ${PSV.filter(x=>x[6]==='Publicado').length} publicados`,'',`<div class="fxs pubts"><table class="pubt"><thead><tr><th>Servicio</th><th>Tipo</th><th>Duración</th><th>Quién reserva</th><th>Precio</th><th>Estado</th></tr></thead><tbody>${PSV.map((x,i)=>`<tr data-psv="${i}" class="${i===PUB.sv?'on':''}" tabindex="0"><td><b>${x[0]}</b><small>${x[3]}</small></td><td>${x[1]}</td><td>${x[2]}</td><td>${x[5]}</td><td class="num">${pMoney(x[4])}${x[1]==='Membresía'?'<small>por mes</small>':''}</td><td>${pill(x[6],x[6]==='Publicado'?'p-conf':'p-wait')}</td></tr>`).join('')}</tbody></table></div>`,'g')}
  ${fxP('Descuentos por medio de pago','se ven al reservar',pB('Editar','desc'),`<div class="pubkp"><div><small>Transferencia</small><b class="num">10%</b><em>menos</em></div><div><small>Efectivo</small><b class="num">10%</b><em>menos</em></div><div><small>Tarjeta</small><b class="num">0%</b><em>precio de lista</em></div></div>`)}
 </div>
 <div class="c">${fxP(s[0],pill(s[6],s[6]==='Publicado'?'p-conf':'p-wait'),pB('Editar','sv-ed','','pen'),`${fxKv([['Tipo',s[1]],['Duración',s[2]],['Dónde',s[3]],['Precio',pMoney(s[4])+(s[1]==='Membresía'?' por mes':'')],['Quién reserva',s[5]],['Obra social',s[8]?'Acepta (copago o reintegro)':'Solo particular'],['Link',PUB.url+'/'+s[9]]])}
   <div class="pubins"><small>Obras sociales</small>${s[8]?`<div class="pubosl sm">${POS.map(o=>`<span class="${o[2]}"><b>${o[0]}</b>${o[1]}</span>`).join('')}</div>`:'<p>Solo particular. Se puede pedir reintegro con la factura.</p>'}</div>
   <div class="pubins"><small>Le llega a la paciente al reservar</small><p>${s[7]}</p></div>
   <div class="fxfoot pubft">${pB('Duplicar','sv-dup')}${pB(s[6]==='Publicado'?'Pasar a borrador':'Publicar',s[6]==='Publicado'?'sv-off':'sv-on')}<span class="sp" style="flex:1"></span>${pB('Copiar link','copy','k','copy').replace('data-pa="copy"',`data-pa="copy" data-u="${s[9]}"`)}</div>`,'g')}
  ${fxP('Cancelar o cambiar','reglas para todos los servicios',pB('Editar','reglas'),fxKv([['Cambiar','hasta 24 h antes, desde la app'],['Cancelar','hasta 24 h antes, sin cargo'],['Si avisa tarde','queda como ausente; la seña llega con Mercado Pago']]))}
 </div></div>`;}

function pubV2(){return `<div class="fx" style="grid-template-columns:1fr 1fr 1.15fr">
 <div class="c">
  ${fxP('Reglas para reservar','',pB('Editar','reglas'),fxKv([['Anticipación','mínimo 12 h antes'],['Hasta','30 días adelante'],['Por día','hasta 8 turnos'],['Primera vez','solo turnos de 60 min'],['Cambiar o cancelar','hasta 24 h antes'],['Seña','se activa al conectar Mercado Pago']]))}
  ${fxP('Qué le pedimos al reservar','',pB('Editar','pide'),`<div class="pubpide">${[['Nombre, teléfono y mail',1],['Obra social y número de afiliada',1],['Motivo de la consulta',1],['Formulario «Primera consulta» antes del turno',1],['Foto del último análisis',0]].map(([t,o])=>`<div class="${o?'':'off'}">${svg(o?'check':'x',13)}<span>${t}</span></div>`).join('')}</div>`)}
  ${fxP('Obras sociales en la reserva','la paciente ve el copago antes de confirmar',pB('Editar','os'),`<div class="pubhr pubev">${POS.map(o=>`<div><b>${o[0]}</b><span>${o[1]}</span>${pill(o[2]==='n'?'Sin cobertura':o[1].startsWith('Copago')?'Copago':'Reintegro',o[2]==='l'?'p-conf':o[2]==='b'?'p-vid':'p-ok')}</div>`).join('')}</div>`,'g')}
 </div>
 <div class="c">
  ${fxP('Horarios de atención','reservas en línea',pB('Editar','hrs'),`<div class="pubhr">${PHRS.map((h,i)=>`<div class="${h[2]?'':'off'}"><b>${h[0]}</b><span>${h[1]}</span>${pSw('Atiende el '+h[0].toLowerCase(),h[2],'d'+i)}</div>`).join('')}</div>`)}
  ${fxP('Confirmación y recordatorio','por la app y por mail','',`<div class="pubhr pubev">${[['Al reservar','le llega la confirmación con las indicaciones',1],['24 h antes','recordatorio con «Confirmo» o «Necesito cambiar»',1],['Si no confirma','te avisamos 12 h antes del turno',1],['Si cancela','el lugar vuelve a quedar libre para reservar',1],['Después del turno','le pedimos una opinión para tu página',1]].map((r,i)=>`<div><b>${r[0]}</b><span>${r[1]}</span>${pSw(r[0],r[2],'r'+i)}</div>`).join('')}</div>`,'g')}
 </div>
 <div class="c">${fxP('Reservas en línea','18 este mes · 2 por confirmar',`<button class="lnk" type="button" data-go="agenda">Agenda ${svg('chev',11)}</button>`,`<div class="fxs"><div class="pubrs">${PRES.map((r,i)=>`<div><span class="av">${r[1]}</span><span class="t"><b>${r[0]}</b><small>${r[2]} · ${r[3]}</small><small>${r[4]}</small></span>${r[5]==='Por confirmar'?`<button type="button" class="sbtn k" data-pa="res-ok" data-i="${i}">Aceptar</button>`:pill(r[5],r[5]==='Confirmada'?'p-conf':'p-vid')}</div>`).join('')}</div></div>`,'g')}
 </div></div>`;}

const PUBT=['Mi página','Servicios','Reservas en línea'];
function pubDraw(an){const v=PUB.view;document.getElementById('pubwrap').innerHTML=[pubV0,pubV1,pubV2][v]();
 document.querySelectorAll('#pubview button').forEach((b,i)=>b.classList.toggle('on',i===v));
 document.getElementById('pubcta').innerHTML=v===1?svg('plus')+'Nuevo servicio':svg('globe')+'Publicar cambios';
 document.querySelectorAll('.nv[data-go="publica"]+.subw .si').forEach((s,i)=>s.classList.toggle('on',[0,2,1][i]===v));
 if(an)fxAnim(document.getElementById('pubwrap'));}
function pubDirty(){PUB.dirty=1;}
function pubCopy(u){const t='https://'+PUB.url+(u?'/'+u:'');try{navigator.clipboard&&navigator.clipboard.writeText(t).catch(()=>{});}catch(e){}toast('Link copiado: '+t.replace('https://',''));}
const PUBA={
 copy:b=>pubCopy(b.dataset.u),
 qr:async()=>{const dl=window.claude?await claude.use('downloads').catch(()=>null):null;const q=pQr().replace('class="pubqr"','xmlns="http://www.w3.org/2000/svg" width="600" height="600" style="background:#fff"');
  if(!dl)return toast('QR listo. La descarga no está disponible en esta vista.');try{await dl.save({name:'qr-'+PUB.url+'.svg',type:'image/svg+xml',content:q});toast('QR descargado.');}catch(e){toast('No se pudo descargar el QR.');}},
 abrir:()=>({t:'Tu página pública',s:PUB.url,ok:false,body:`<div class="pubbig">${pubPhone()}</div>`}),
 perfil:()=>({t:'Editar perfil',s:'Se ve en tu página y en la app de tus pacientes',ok:'Guardar',body:aF('Nombre',aI('Lic. Verónica Trenti'))+aRow(aF('Matrícula',aI('MN 4521')),aF('Barrio',aI('Belgrano, CABA')))+aF('Sobre vos',aT('Acompaño a mujeres que quieren comer mejor sin dietas imposibles. Especialista en celiaquía y en planes para deportistas.'))+aF('Especialidades',aCh(['Celiaquía','Descenso de peso','Deportistas','Hipotiroidismo','Embarazo','Diabetes','Vegetariana'],['Celiaquía','Descenso de peso','Deportistas','Hipotiroidismo'])),after:pubDirty,done:'Perfil guardado. Publicalo para que se vea.'}),
 lugar:()=>({t:'Dónde atendés',ok:'Guardar',body:aF('Consultorio',aI('Av. Cabildo 2040, 3.º B · Belgrano'))+aF('Videollamada',aSeg(['Sí, con Meet','No']))+aF('Horarios que se muestran',aI('Lun a vie 9 a 19 · sáb 9 a 13'),'Los turnos libres salen de tu agenda.'),after:pubDirty,done:'Lugares guardados.'}),
 os:()=>({t:'Obras sociales',s:'Qué ve la paciente al elegir la suya',ok:'Guardar',body:POS.map(o=>aRow(aF(o[0],aS(['Copago','Reintegro','Precio completo','No la acepto'],o[1].startsWith('Copago')?'Copago':o[1])),aF('Copago',aI(o[1].startsWith('Copago')?o[1].replace('Copago ',''):'','—')))).join('')+aF('Sumar otra',aS(['Elegir…','Medifé','Sancor Salud','Accord Salud','OSPE','IOMA'],'Elegir…'))+`<small class="nthint">Para facturar, Cobranzas arma la planilla de cada obra social.</small>`,after:pubDirty,done:'Obras sociales guardadas.'}),
 'op-p':b=>{POP[+b.dataset.i][5]=1;pubDraw();toast('Opinión publicada en tu página.');},
 'op-r':b=>({t:'Responder a '+POP[+b.dataset.i][0],s:'Tu respuesta se ve debajo de la opinión',ok:'Publicar respuesta',body:`<p class="pubq">«${POP[+b.dataset.i][4]}»</p>`+aF('Respuesta',aT('','Gracias por tu confianza…')),done:'Respuesta publicada.'}),
 publish:()=>{if(PUB.view===1)return aOpen(PUBA.nuevo());if(!PUB.dirty)return toast('Tu página ya está al día.');PUB.dirty=0;pubDraw();toast('Cambios publicados en '+PUB.url+'.');},
 nuevo:()=>({t:'Nuevo servicio',s:'Consulta, paquete o membresía',ok:'Crear en borrador',body:aF('Nombre',aI('','Ej.: Consulta de embarazo'))+aF('Tipo',aSeg(['Consulta','Paquete','Membresía']))+aRow(aF('Duración',aS(['30 min','40 min','60 min','90 min'],'60 min')),aF('Precio',aI('','$ 0')))+aF('Dónde',aSeg(['Consultorio','Videollamada','Las dos'],2))+aF('Quién reserva',aSeg(['Cualquier persona','Solo pacientes']))+aF('Obra social',aSeg(['Acepta','Solo particular']))+aF('Instrucciones previas',aT('','Le llega a la paciente al reservar')),
  after:b=>{const n=aVal(b,0)||'Servicio nuevo',pr=+String(aVal(b,2)).replace(/\D/g,'')||0,t=b.querySelectorAll('.aseg')[0].querySelector('[aria-checked=true]').textContent;PSV.push([n,t,b.querySelector('select').value,'Consultorio o videollamada',pr,'Cualquier persona','Borrador',aVal(b,3)||'Sin indicaciones.',1,n.toLowerCase().normalize('NFD').replace(/[^a-z0-9 ]/g,'').trim().replace(/ +/g,'-')]);PUB.sv=PSV.length-1;pubDraw();},done:b=>`«${aVal(b,0)||'Servicio nuevo'}» quedó en borrador.`}),
 'sv-ed':()=>{const s=PSV[PUB.sv];return {t:'Editar «'+s[0]+'»',ok:'Guardar',body:aF('Nombre',aI(s[0]))+aRow(aF('Duración',aI(s[2])),aF('Precio',aI(pMoney(s[4]))))+aF('Quién reserva',aSeg(['Cualquier persona','Solo pacientes'],s[5]==='Solo pacientes'?1:0))+aF('Instrucciones previas',aT(s[7])),after:b=>{s[0]=aVal(b,0)||s[0];s[2]=aVal(b,1)||s[2];s[4]=+String(aVal(b,2)).replace(/\D/g,'')||s[4];s[7]=aVal(b,3)||s[7];s[5]=b.querySelector('.aseg [aria-checked=true]').textContent;pubDirty();pubDraw();},done:'Servicio guardado.'};},
 'sv-dup':()=>{const s=PSV[PUB.sv];PSV.splice(PUB.sv+1,0,[s[0]+' (copia)',...s.slice(1,6),'Borrador',s[7],s[8],s[9]+'-copia']);PUB.sv++;pubDraw();toast('Servicio duplicado en borrador.');},
 'sv-off':()=>{PSV[PUB.sv][6]='Borrador';pubDraw();toast('Pasó a borrador: ya no se puede reservar.');},
 'sv-on':()=>{PSV[PUB.sv][6]='Publicado';pubDraw();toast('Servicio publicado: ya se puede reservar.');},
 desc:()=>({t:'Descuentos por medio de pago',ok:'Guardar',body:aRow(aF('Transferencia',aI('10%')),aF('Efectivo',aI('10%')),aF('Tarjeta',aI('0%')))+aF('Se aplican a',aCh(PSV.map(s=>s[0]),PSV.slice(0,4).map(s=>s[0]))),done:'Descuentos guardados.'}),
 reglas:()=>({t:'Reglas para reservar',ok:'Guardar',body:aRow(aF('Anticipación mínima',aS(['2 h','6 h','12 h','24 h'],'12 h')),aF('Hasta',aS(['15 días','30 días','60 días'],'30 días')))+aRow(aF('Turnos por día',aI('8')),aF('Cambiar o cancelar',aS(['Hasta 12 h antes','Hasta 24 h antes','Hasta 48 h antes'],'Hasta 24 h antes')))+aF('Primera vez',aSeg(['Solo turnos de 60 min','Cualquier turno']))+aF('Si cancela tarde',aSeg(['Queda como ausente','Pierde la seña']),'La seña se activa cuando conectes Mercado Pago.'),done:'Reglas guardadas.'}),
 pide:()=>({t:'Qué le pedimos al reservar',ok:'Guardar',body:aCk([['Nombre, teléfono y mail',1],['Obra social y número de afiliada',1],['Motivo de la consulta',1],['Formulario «Primera consulta» antes del turno',1],['Foto del último análisis',0],['Fecha de nacimiento',0]]),done:'Guardado.'}),
 hrs:()=>({t:'Horarios de atención',s:'Los lugares libres salen de acá y de tu agenda',ok:'Guardar',body:PHRS.map(h=>aF(h[0],aI(h[1]))).join(''),after:b=>{PHRS.forEach((h,i)=>{h[1]=aVal(b,i)||h[1];});pubDraw();},done:'Horarios guardados.'}),
 'res-ok':b=>{const r=PRES[+b.dataset.i];r[5]='Confirmada';pubDraw();toast(`Turno de ${r[0]} confirmado. Le llega el aviso a su app y su mail.`);}
};
(function(){
 document.getElementById('s-ficha').insertAdjacentHTML('beforebegin',`<div class="scr" id="s-publica" hidden>
  <div class="top"><div><h1>Página pública <span>· ${PUB.url}</span></h1><div class="date">Publicada · 412 visitas este mes · 18 reservas en línea</div></div><div class="sp"></div>
   <div class="tabs" id="pubview">${PUBT.map((t,i)=>`<button type="button" data-pbv="${i}" class="${i?'':'on'}">${t}</button>`).join('')}</div>
   <button class="chip" type="button" data-pa="copy">${svg('link')}Copiar link</button>
   <button class="ibtn" type="button" aria-label="Avisos">${svg('bell')}<i></i></button>
   <button class="cta" type="button" id="pubcta" data-pa="publish"></button></div>
  <div id="pubwrap"></div></div>`);
 const nv=[...document.querySelectorAll('.side .nv')].find(n=>n.textContent.trim().startsWith('Página pública'));nv.dataset.go='publica';nv.addEventListener('click',()=>go('publica'));
 const sg=document.querySelector('.bar .seg [data-go="planes"]');if(sg){sg.insertAdjacentHTML('afterend','<button type="button" data-go="publica" aria-pressed="false">Página pública</button>');sg.nextElementSibling.addEventListener('click',()=>go('publica'));}
 const S=document.getElementById('s-publica');
 S.addEventListener('click',e=>{if(e.target.closest('[aria-label="Avisos"]'))return;const b=e.target.closest('button,tr[data-psv]');if(!b)return;e.stopPropagation();const d=b.dataset;
  if(d.go)return go(d.go);
  if(d.pbv!==undefined){PUB.view=+d.pbv;return pubDraw(1);}
  if(d.psv!==undefined){PUB.sv=+d.psv;return pubDraw();}
  if(b.classList.contains('sw')){const on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);if(d.pubsw==='ask')PUB.ask=on;const r=b.closest('.pubhr>div');if(r&&d.pubsw.startsWith('d'))r.classList.toggle('off',!on);
   return toast(`${b.getAttribute('aria-label')}: ${on?'prendido':'apagado'}.`);}
  const f=PUBA[d.pa];if(!f)return;const r=f(b);if(r&&r.t)aOpen(r);});
 S.addEventListener('keydown',e=>{const t=e.target.closest('tr[data-psv]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();t.click();}});
 document.querySelectorAll('.nv[data-go="publica"]+.subw .si').forEach((s,i)=>s.addEventListener('click',()=>{go('publica');PUB.view=[0,2,1][i];pubDraw(1);}));
 pubDraw();})();
const _gpub=go;go=function(id){_gpub(id);if(id==='publica')fxAnim(document.getElementById('pubwrap'));};
if(location.hash==='#publica')go('publica');
