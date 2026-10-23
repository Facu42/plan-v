
/* Acciones: cada botón del boceto abre su panel lateral, cambia algo en el lugar o filtra. */
const PAC=['Sofía Gómez','Martina Díaz','Camila Méndez','Romina Benítez','Paula Acosta','Lucía Ferrero','Ana López','Laura Ruiz','Natalia Ríos','Julia Sosa'];
const aF=(l,c,h='')=>`<label class="af"><span>${l}</span>${c}${h?`<small>${h}</small>`:''}</label>`;
const aI=(v='',p='',t='text')=>`<input class="ai" type="${t}" value="${v}" placeholder="${p}">`;
const aS=(o,v)=>`<select class="ai">${o.map(x=>`<option${x===v?' selected':''}>${x}</option>`).join('')}</select>`;
const aT=(v='',p='')=>`<textarea class="ai" rows="4" placeholder="${p}">${v}</textarea>`;
const aSeg=(o,k=0)=>`<div class="aseg" role="radiogroup">${o.map((x,i)=>`<button type="button" role="radio" aria-checked="${i===k}">${x}</button>`).join('')}</div>`;
const aCh=(o,on=[])=>`<div class="ach">${o.map(x=>`<button type="button" aria-pressed="${on.includes(x)}">${x}</button>`).join('')}</div>`;
const aCk=(o)=>`<div class="ack">${o.map(([t,v])=>`<label><input type="checkbox"${v?' checked':''}><span>${t}</span></label>`).join('')}</div>`;
const aRow=(...c)=>`<div class="arow">${c.join('')}</div>`;
const aSlots=(o,k)=>`<div class="aslots">${o.map((x,i)=>`<button type="button" aria-pressed="${i===k}">${x}</button>`).join('')}</div>`;
const aPac=v=>aF('Paciente',aS(PAC,v||PAC[0]));

/* Panel lateral y aviso */
document.querySelector('.app').insertAdjacentHTML('beforeend',`<div id="actw" hidden><div class="ascrim"></div><aside id="act" role="dialog" aria-modal="true" aria-labelledby="actt"><header><div><h2 id="actt"></h2><p id="acts"></p></div><button type="button" class="ibtn" data-x aria-label="Cerrar">${svg('x',13)}</button></header><div class="abody" id="actb"></div><footer id="actf"></footer></aside></div><div id="atoast" role="status" aria-live="polite"></div>`);
const AW=document.getElementById('actw');let aCur=null,aLast=null;
function aOpen(o){aCur=o;aLast=document.activeElement;document.getElementById('actt').textContent=o.t;document.getElementById('acts').textContent=o.s||'';
 document.getElementById('actb').innerHTML=o.body;
 document.getElementById('actf').innerHTML=o.ok===false?`<button type="button" class="chip" data-x>Cerrar</button>`:`<button type="button" class="chip" data-x>Cancelar</button><span style="flex:1"></span><button type="button" class="cta" data-ok${o.lock?' disabled':''}>${o.ok||'Guardar'}</button>`;
 AW.hidden=false;requestAnimationFrame(()=>AW.classList.add('on'));
 if(o.open)o.open(document.getElementById('act'));
 setTimeout(()=>(document.querySelector('#act .abody .ai')||document.querySelector('#act [data-x]')).focus({preventScroll:true}),60);}
function aClose(){AW.classList.remove('on');setTimeout(()=>{AW.hidden=true},220);aCur=null;if(aLast&&aLast.focus)aLast.focus({preventScroll:true});}
let aTo;function toast(t){const e=document.getElementById('atoast');e.textContent=t;e.classList.add('on');clearTimeout(aTo);aTo=setTimeout(()=>e.classList.remove('on'),3600);}
AW.addEventListener('click',e=>{
 if(e.target.closest('[data-x]')||e.target.classList.contains('ascrim'))return aClose();
 const sg=e.target.closest('.aseg button,.aslots button');if(sg){const p=sg.parentElement;p.querySelectorAll('button').forEach(b=>b.setAttribute(p.classList.contains('aseg')?'aria-checked':'aria-pressed',b===sg));if(aCur&&aCur.pick)aCur.pick(sg);return;}
 const ch=e.target.closest('.ach button');if(ch){ch.setAttribute('aria-pressed',ch.getAttribute('aria-pressed')!=='true');if(aCur&&aCur.pick)aCur.pick(ch);return;}
 const ok=e.target.closest('[data-ok]');if(ok&&aCur){const c=aCur,body=document.getElementById('act');if(c.after)c.after(body);aClose();if(c.done)toast(typeof c.done==='function'?c.done(body):c.done);return;}
 const b=e.target.closest('button');if(b&&aCur&&aCur.click)aCur.click(b,document.getElementById('act'));});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!AW.hidden)aClose();});
const aVal=(b,i)=>{const x=b.querySelectorAll('.abody .ai')[i];return x?x.value:''};

/* Dónde está la acción y de quién habla */
const aScr=()=>{const s=[...document.querySelectorAll('.scr')].find(x=>!x.hidden).id.slice(2);return s==='ficha'?'ficha-'+ftab:s};
const aWho=e=>{const r=e.closest('tr.det');if(r){const b=r.previousElementSibling&&r.previousElementSibling.querySelector('.who b');if(b)return b.textContent.trim();}
 if(e.closest('#s-ficha'))return 'Sofía Gómez';const li=e.closest('.li,.fxr>*,tr');const b=li&&li.querySelector('b');if(b&&PAC.some(p=>b.textContent.includes(p.split(' ')[0])))return PAC.find(p=>b.textContent.includes(p.split(' ')[0]));
 const d=document.querySelector('#det .who b,#det .xname b');return d?d.textContent.trim():PAC[0];};

/* Formularios que se repiten */
const TURNO=(who,day,hour)=>({t:'Nuevo turno',s:'Se agenda y le llega el aviso a su app',ok:'Agendar turno',
 body:aPac(who)+aF('Tipo',aSeg(['Seguimiento','Primera consulta']))+aF('Modalidad',aSeg(['Consultorio','Videollamada']))+aF('Día',aS(['Mié 22/10','Jue 23/10','Vie 24/10','Sáb 25/10','Lun 27/10'],day||'Mié 22/10'))
  +aF('Horarios libres ese día',aSlots(['9:00','10:30','12:00','15:00','16:30','18:00'],hour?Math.max(0,['9:00','10:30','12:00','15:00','16:30','18:00'].indexOf(hour)):0))
  +aRow(aF('Duración',aS(['40 min','60 min','30 min'])),aF('Precio',aI('$30.000')))+aCk([['Recordarle 24 h antes',1],['Pedirle que registre peso antes de la consulta',0]]),
 done:b=>`Turno agendado para ${aVal(b,0)}. Le llega el aviso a su app.`});
const COBRO=who=>({t:'Registrar cobro',s:'La plata ya está en tu cuenta; esto lo anota',ok:'Registrar cobro',
 body:aPac(who)+aF('Concepto',aS(['Programa mensual · noviembre','Seguimiento','Primera consulta','Programa trimestral','Seña de turno']))+aRow(aF('Monto',aI('$54.000')),aF('Fecha',aI('22/10/2026')))+aF('Cómo pagó',aSeg(['Transferencia','Mercado Pago','Efectivo']))+aCk([['Enviarle el recibo a su app',1]]),
 after:b=>{const tb=document.querySelector('#cwrap tbody');if(!tb)return;const n=aVal(b,0),c=aVal(b,1),m=aVal(b,2),me=b.querySelector('.aseg [aria-checked=true]').textContent;
  tb.insertAdjacentHTML('afterbegin',`<tr class="anew"><td class="num" style="color:var(--ink2)">22/10</td><td><div class="who">${cAv(n.split(' ').map(x=>x[0]).join(''),'lima')}<b>${n}</b></div></td><td><div class="fxwhen"><b style="font-weight:400">${c}</b><small>${me}</small></div></td><td class="num" style="text-align:right;font-weight:500">${m}</td><td>${pill('Cobrado','p-conf')}</td></tr>`);},
 done:b=>`Cobro de ${aVal(b,2)} de ${aVal(b,0)} registrado.`});
const MSG=(who,txt='')=>({t:'Mensaje',s:'Le llega a su app; si no la abre en 2 h, por mail',ok:'Enviar',
 body:aF('Para',aS(PAC,who))+aF('Respuestas guardadas',aCh(['Recordatorio de registro','Felicitación','Pedido de análisis','Cambio de horario']))+aF('Mensaje',aT(txt,'Escribí el mensaje…')),
 pick:c=>{const T={'Recordatorio de registro':'¡Hola! Acordate de cargar tus comidas de hoy, así ajustamos lo que haga falta.','Felicitación':'¡Qué buen avance esta semana! Seguí así.','Pedido de análisis':'Te dejo el pedido de análisis en la app. Hacelo antes de la próxima consulta.','Cambio de horario':'¿Podemos pasar el turno a otro horario? Te dejo opciones en la app.'};const a=c.closest('#act').querySelector('textarea');if(c.getAttribute('aria-pressed')==='true')a.value=T[c.textContent];},
 after:b=>{if(window.mFromDrawer)mFromDrawer(aVal(b,0),b.querySelector('textarea').value);},
 done:b=>`Mensaje enviado a ${aVal(b,0)}.`});
const EXPORT=(what,name)=>({t:'Exportar',s:what,ok:'Descargar',
 body:aF('Formato',aSeg(['Excel','PDF','CSV']))+aF('Período',aS(['Octubre 2026','Últimos 3 meses','2026 completo']))+aCk([['Incluir datos de contacto',0],['Separar por paciente',0]]),
 after:()=>aCSV(name)});
async function aCSV(name){const t=document.querySelector('.scr:not([hidden]) table');if(!t){toast('No hay una tabla para descargar en esta vista.');return;}
 const rows=[...t.querySelectorAll('tr')].filter(r=>r.offsetParent).map(r=>[...r.children].map(c=>'"'+c.innerText.replace(/\s+/g,' ').trim().replace(/"/g,'""')+'"').join(','));
 const dl=window.claude?await claude.use('downloads').catch(()=>null):null;
 if(!dl){toast('La descarga no está disponible en esta vista.');return;}
 try{await dl.save({filename:name+'.csv',data:'\ufeff'+rows.join('\n')});toast('Archivo descargado.');}
 catch(e){toast(e&&e.code==='declined'?'Descarga cancelada.':'No se pudo descargar.');}}
const FILEV=n=>({t:n,s:'Vista previa · solo la ven vos y Sofía',ok:false,body:`<div class="apdf"><b>${n.replace(/\.\w+$/,'')}</b>${'<i></i>'.repeat(9)}<i class="s"></i>${'<i></i>'.repeat(5)}</div><div class="arow">${sb('Descargar','','dl')}${sb('Enviar a Sofía','','send')}</div>`,click:b=>{if(/Descargar|Enviar/.test(b.textContent)){toast(/Descargar/.test(b.textContent)?'Descargado.':'Enviado a Sofía.');}}});
const DROP=(t,s,ok,done,found)=>({t,s:'Elegí el archivo para empezar',ok,lock:1,body:`<button type="button" class="adrop">${svg('up',18)}<b>Elegí o arrastrá el archivo</b><span>PDF, foto o planilla</span></button><div class="afound" hidden>${found}</div>`,
 click:(b,p)=>{if(b.classList.contains('adrop')){b.innerHTML=`${svg('file',18)}<b>${s}</b><span>Listo para cargar</span>`;b.classList.add('ok');p.querySelector('.afound').hidden=false;p.querySelector('[data-ok]').disabled=false;}},done});

/* Registro de acciones: pantalla:etiqueta o solo etiqueta */
const ACT={
 'Nuevo plan':e=>({t:'Nuevo plan',s:'Se abre en el editor con lo que elijas',ok:'Crear y abrir',
  body:aPac(aWho(e))+aF('Empezar desde',aSeg(['Plantilla','Copiar el vigente','En blanco']))+aF('Plantilla',aS(['Sin gluten 1.800 kcal','Descenso de grasa 1.600 kcal','Deportista 2.400 kcal','Embarazo 2.º trimestre']))+aRow(aF('Calorías',aI('1.800')),aF('Duración',aS(['4 semanas','2 semanas','8 semanas'])))+aF('Cuidados que respeta',aCh(['Sin gluten','Sin lactosa','Hierro con vitamina C','Legumbres a la noche'],['Sin gluten','Sin lactosa'])),
  after:()=>{go('ficha');ftab='plan';drawFicha();},done:b=>`Plan creado para ${aVal(b,0)}.`}),
 'Cargar pago':e=>COBRO(aWho(e)),'Registrar cobro':e=>COBRO(aWho(e)),'Registrar pago':e=>COBRO(aWho(e)),
 'Mensaje':e=>MSG(aWho(e)),
 'Avisos':()=>({t:'Avisos',s:'4 sin leer',ok:'Marcar todo como leído',body:fxRows([['r','Ferritina baja de Sofía Gómez','laboratorio nuevo · hace 2 h'],['a','Laura Ruiz no confirmó su turno','hoy 16:00'],['a','2 pedidos de cambio de plan','Martina y Sofía'],['l','Natalia Ríos llegó a su objetivo','−6,0 kg desde marzo']]),done:'Avisos leídos.',after:()=>document.querySelectorAll('[aria-label="Avisos"]').forEach(x=>x.classList.add('read'))}),
 'Nueva consulta':e=>TURNO(aWho(e)),'Nuevo turno':()=>TURNO(),'Agendar':e=>TURNO(aWho(e)),'Próxima consulta':e=>TURNO(aWho(e)),
 'Cobranzas':()=>{go('cobranzas')},'Agenda':()=>{go('agenda')},
 'Recordarle':(e,b)=>aSent(b,'Recordatorio enviado a su app.'),'Recordar':(e,b)=>aSent(b,`Recordatorio enviado a ${aWho(b)}.`),
 'Recordar a todas':(e,b)=>{document.querySelectorAll('#cwrap .fxr .sbtn').forEach(x=>aSent(x));aSent(b);toast('Recordatorio enviado a 3 pacientes.');},
 'Importar':()=>DROP('Importar pacientes','pacientes.xlsx · 32 filas','Importar 32 pacientes','32 pacientes importadas. Quedan en «Acceso pendiente».',aF('Columnas encontradas',fxKv([['Nombre y apellido','Nombre'],['Celular','Teléfono'],['Nacimiento','Fecha de nacimiento'],['Obra social','Notas']]))+aCk([['Saltear las que ya existen (3)',1]])),
 'Nueva paciente':()=>({t:'Nueva paciente',s:'Queda en «Acceso pendiente» hasta que elijas su acceso',ok:'Crear paciente',
  body:aRow(aF('Nombre',aI('','Nombre')),aF('Apellido',aI('','Apellido')))+aRow(aF('Nacimiento',aI('','dd/mm/aaaa')),aF('Celular',aI('','11 5555 5555','tel')))+aF('Email',aI('','nombre@mail.com','email'))+aF('Motivo de consulta',aS(['Bajar grasa','Celiaquía','Embarazo','Deportista','Diabetes','Otro']))+aF('Acceso a la app',aSeg(['Sin cargo','Con su programa','Sin acceso']))+aCk([['Enviarle la invitación a la app',1],['Enviarle el cuestionario de primera vez',1]]),
  done:b=>`${(aVal(b,0)+' '+aVal(b,1)).trim()||'La paciente'} quedó creada. Le llega la invitación.`}),
 'Plan':e=>{go('ficha');ftab='plan';drawFicha();},
 'Semana anterior':()=>aWeek(-1),'Semana siguiente':()=>aWeek(1),
 'Bloquear horario':()=>({t:'Bloquear horario',s:'Nadie puede reservar en ese rato',ok:'Bloquear',body:aF('Día',aS(['Vie 24/10','Mié 22/10','Jue 23/10','Sáb 25/10']))+aRow(aF('Desde',aI('13:00')),aF('Hasta',aI('15:00')))+aF('Motivo',aSeg(['Personal','Feriado','Capacitación']))+aCk([['Repetir todas las semanas',0]]),done:b=>`Bloqueado el ${aVal(b,0)} de ${aVal(b,1)} a ${aVal(b,2)}.`}),
 'Aceptar':(e,b)=>{const li=b.closest('.li');if(li){li.classList.add('adone');b.parentElement.innerHTML='<span class="aok">Confirmado · se le avisó</span>';}toast('Turno confirmado. Se le avisó en su app.');},
 'Proponer otro':e=>({t:'Proponer otro horario',s:aWho(e),ok:'Enviar propuesta',body:aF('Horarios para ofrecer',aCh(['Mié 22 · 12:00','Mié 22 · 18:00','Jue 23 · 10:30','Vie 24 · 15:00'],['Mié 22 · 18:00','Jue 23 · 10:30']))+aF('Mensaje',aT('Ese horario ya está tomado. Te dejo dos opciones; elegí la que te quede mejor en la app.')),done:'Propuesta enviada. Elige el horario desde la app.'}),
 'Exportar':()=>EXPORT('Movimientos de cobranzas','cobranzas-octubre-2026'),
 '6 meses':()=>aIng(6),'12 meses':()=>aIng(12),
 'cobranzas:Mes':()=>aPer('octubre 2026'),'cobranzas:Trimestre':()=>aPer('4.º trimestre'),'cobranzas:Año':()=>aPer('2026'),
 'cobranzas:Todos':(e,b)=>aFilt(b,''),'cobranzas:Cobrados':(e,b)=>aFilt(b,'Cobrado'),'cobranzas:Pendientes':(e,b)=>aFilt(b,'Vence'),'cobranzas:Vencidos':(e,b)=>aFilt(b,'Vencido'),
 '+ etiqueta':()=>({t:'Etiquetas de Sofía',s:'Sirven para filtrar en Pacientes',ok:'Guardar',body:aF('Elegí',aCh(['Celíaca','Sin lactosa','Hipotiroidismo','Programa mensual','Deportista','Embarazo','Vegetariana','Prioridad'],['Celíaca','Sin lactosa','Hipotiroidismo','Programa mensual']))+aF('Nueva etiqueta',aI('','Ej.: Running')),
  after:b=>{const r=document.querySelector('#s-ficha .tagsr');const on=[...b.querySelectorAll('.ach [aria-pressed=true]')].map(x=>x.textContent);const nw=aVal(b,0).trim();if(nw)on.push(nw);r.querySelectorAll('.tg2:not(.add)').forEach(x=>x.remove());r.insertAdjacentHTML('afterbegin',on.map((t,i)=>`<span class="tg2${i>1?' n':''}">${t}</span>`).join(''));},done:'Etiquetas guardadas.'}),
 /* Ficha */
 'ficha-historia:Enviar cuestionario':()=>({t:'Enviar cuestionario',s:'Sofía lo completa desde la app',ok:'Enviar',body:aF('Cuestionario',aS(['Preferencias y rechazos','Seguimiento semanal','Primera vez completo','Calidad de sueño']))+aF('Cuándo',aSeg(['Ahora','2 días antes de la consulta']))+aCk([['Recordarle si no lo completa en 48 h',1]]),done:'Cuestionario enviado a Sofía.'}),
 'ficha-historia:Editar':(e,b)=>aEdit(b,'.fxanam span'),'Completar':(e,b)=>{const p=document.querySelector('.fxanam');aEdit(document.querySelector('#fwrap .fxp header .sbtn.k'),'.fxanam span');const m=p.querySelector('.miss span');m.textContent='';m.focus();},
 'ficha-mediciones:Importar balanza':()=>DROP('Importar de la balanza','InBody 270 · 14/10 10:42','Cargar medición','Medición de la balanza cargada.',aF('Valores leídos',fxKv([['Peso','68,4 kg'],['Grasa','27,8%'],['Músculo','26,4 kg'],['Agua','49,8%']]))),
 'Nueva medición':()=>({t:'Nueva medición',s:'Sofía Gómez · hoy',ok:'Guardar medición',body:aRow(aF('Peso',aI('68,4')),aF('Altura',aI('168')))+aRow(aF('Cintura',aI('78')),aF('Cadera',aI('97')))+aF('Pliegues (mm)',aRow(aI('18,0','Tríceps'),aI('8,5','Bíceps'),aI('14,0','Subescapular'),aI('19,0','Cresta')))+aF('Fórmula',aS(['Durnin-Womersley + Siri','Jackson-Pollock 3','Jackson-Pollock 7','Faulkner'])),done:'Medición guardada. Los gráficos se actualizaron.'}),
 'Durnin-Womersley + Siri':(e,b)=>({t:'Fórmula de grasa',s:'Cambia el cálculo de todas las mediciones',ok:'Usar esta fórmula',body:aF('Fórmula',aSeg(['Durnin-Womersley + Siri','Jackson-Pollock 3','Jackson-Pollock 7','Faulkner']))+fxKv([['Con 4 pliegues','27,8% de grasa'],['Con J-P 3','26,9% de grasa'],['Con Faulkner','24,1% de grasa']]),after:p=>{b.textContent=p.querySelector('.aseg [aria-checked=true]').textContent;},done:'Fórmula cambiada.'}),
 'ficha-mediciones:Pliegues':(e,b)=>aMed(b,0),'ficha-mediciones:Perímetros':(e,b)=>aMed(b,1),'ficha-mediciones:Composición':(e,b)=>aMed(b,2),'ficha-mediciones:Segmental':(e,b)=>aMed(b,3),
 'ficha-mediciones:Peso':(e,b)=>aEvo(b,[74,72.2,70.9,70.1,69.6,68.4],66.5,'66,5'),'ficha-mediciones:Grasa':(e,b)=>aEvo(b,[31.4,30.6,29.9,29.3,28.6,27.8],26,'26%'),
 'Generar':()=>({t:'Informe de mediciones',s:'Con tu logo, para Sofía',ok:'Enviar a Sofía',body:`<div class="apdf"><b>Informe de progreso · Sofía Gómez</b>${fxCurve([74,72.2,70.9,70.1,69.6,68.4],['mar','may','jul','ago','sep','oct'],{w:320,h:90,goal:66.5,gl:'66,5'})}${'<i></i>'.repeat(5)}</div>`+aCk([['Incluir fotos de progreso',0],['Incluir pliegues',1]]),done:'Informe enviado a Sofía.'}),
 'Comparar':()=>({t:'Fotos de progreso',s:'Privadas · solo las ven vos y Sofía',ok:false,body:aRow(aF('Antes',aS(['12/03','07/05','02/07'])),aF('Ahora',aS(['14/10','03/09'])))+`<div class="aph"><i></i><i></i></div>`}),
 'ficha-objetivos:Agregar':()=>({t:'Nuevo objetivo',s:'Se actualiza solo con lo que carga Sofía',ok:'Agregar objetivo',body:aF('Qué medir',aS(['Peso','Grasa','Cintura','Comidas con proteína','Pasos','Agua','Sueño']))+aRow(aF('Meta',aI('','Ej.: 8.000')),aF('Para cuándo',aI('','dd/mm')))+aCk([['Mostrárselo a Sofía en la app',1]]),done:'Objetivo agregado.'}),
 'Grabar':(e,b)=>aRec(b),'ficha-consultas:Iniciar consulta':(e,b)=>aStart(b),
 'ficha-consultas:Nota':(e,b)=>aSoap(0),'ficha-consultas:Transcripción':(e,b)=>aSoap(1),'ficha-consultas:Para Sofía':(e,b)=>aSoap(2),
 'Plantilla: Seguimiento SOAP':(e,b)=>({t:'Plantilla de la nota',s:'Ordena lo que escribe la IA',ok:'Usar plantilla',body:aF('Plantilla',aSeg(['Seguimiento SOAP','Primera consulta','Deportista','Embarazo']))+aCk([['Recordar para las próximas consultas de Sofía',1]]),after:p=>{const t=p.querySelector('.aseg [aria-checked=true]').textContent;document.querySelectorAll('#fwrap .chip').forEach(c=>{if(c.textContent.startsWith('Plantilla'))c.textContent='Plantilla: '+t;});},done:'Plantilla cambiada.'}),
 'ficha-consultas:Editar':(e,b)=>aEdit(b,'.fxsoap p'),
 'Copiar versión para Sofía':()=>{const t=[...document.querySelectorAll('.fxsoap p')].map(p=>p.textContent).join('\n');navigator.clipboard&&navigator.clipboard.writeText(t).catch(()=>{});toast('Copiado. La versión para Sofía no incluye tus notas internas.');},
 'Aprobar y publicar':(e,b)=>{const p=document.querySelector('#fwrap .fxp header .pill');if(p){p.className='pill p-conf';p.textContent='Publicada';}b.disabled=true;b.lastChild.textContent='Publicada';toast('Nota publicada. Sofía ve su versión en la app.');},
 'ficha-plan:Hoy':(e,b)=>aPlan(b,0),'ficha-plan:Semana':(e,b)=>aPlan(b,1),'ficha-plan:Vista de Sofía':(e,b)=>aPlan(b,2),
 'Abrir en el editor':()=>({t:'Editar comidas de hoy',s:'Sin gluten 1.800 kcal · semana 3',ok:'Guardar y avisarle',body:[['Desayuno','Tostadas sin TACC con huevo y tomate','410'],['Colación','Una fruta de estación','60'],['Almuerzo','Ensalada completa con pollo','610'],['Merienda','Yogur sin lactosa con frutos secos','260'],['Cena','Tortilla de papa y espinaca','460']].map(([m,f,k])=>aRow(aF(m,aI(f)),`<label class="af kc"><span>kcal</span>${aI(k)}</label>`)).join(''),done:'Plan actualizado. Le avisamos a Sofía.'}),
 'ficha-plan:Aprobar':(e,b)=>{const a=b.closest('.fxask');if(a){a.classList.add('ok');a.innerHTML=`<span><b>Aprobado:</b> el jueves cena revuelto de verduras con huevo, en 15 minutos.</span>`;}toast('Cambio aprobado. Sofía ya lo ve en su plan.');},
 'Proponer otra':()=>({t:'Proponer otra cena',s:'Jueves · «tengo poco tiempo esa noche»',ok:'Enviar a Sofía',body:aF('Opciones rápidas, sin gluten ni lactosa',aSeg(['Revuelto con verduras · 15 min','Wrap sin TACC de pollo · 10 min','Ensalada de atún y huevo · 10 min']))+aF('Mensaje',aT('Te propongo esta opción para el jueves. Si no te convence, avisame.')),done:'Propuesta enviada a Sofía.'}),
 'ficha-plan:Editar':()=>({t:'Requerimiento',s:'Cambia las calorías del plan',ok:'Recalcular',body:aF('Fórmula',aS(['Mifflin-St Jeor','Harris-Benedict','FAO/OMS']))+aF('Actividad',aSeg(['Sedentaria','Leve','Moderada','Alta'],1))+aRow(aF('Déficit',aS(['−16%','−10%','−20%','Sin déficit'])),aF('Proteína',aS(['1,6 g/kg','1,2 g/kg','2,0 g/kg']))),done:'Requerimiento recalculado: 1.800 kcal.'}),
 'Enviar a Sofía':()=>toast('Lista de compras enviada a Sofía.'),
 'ficha-alimentario:Todo':(e,b)=>aRev(b,0),'ficha-alimentario:Por revisar':(e,b)=>aRev(b,1),
 'Descargar':()=>EXPORT('Registro de comidas de Sofía','registro-sofia-gomez'),
 'Confirmar':(e,b)=>{const td=b.closest('td');td.innerHTML='<span style="color:var(--ink3);font-size:11.5px">Revisada</span>';const n=document.querySelector('#ftabs [data-ft="alimentario"] .n');if(n){const v=+n.textContent-1;v>0?n.textContent=v:n.remove();}toast('Comida revisada.');},
 'Agregar valor':()=>({t:'Agregar valor de laboratorio',s:'Sofía Gómez',ok:'Agregar',body:aF('Valor',aS(['Ferritina','Hemoglobina','Vitamina D','Glucemia','Colesterol total','TSH','Vitamina B12','Otro']))+aRow(aF('Resultado',aI('','Ej.: 18')),aF('Unidad',aS(['ng/ml','g/dl','mg/dl','µUI/ml','pg/ml'])))+aF('Fecha del análisis',aI('22/10/2026')),done:b=>`${aVal(b,0)} agregado.`}),
 'Cargar análisis':()=>DROP('Cargar análisis','Laboratorio 22-10.pdf','Cargar 7 valores','Análisis cargado: 7 valores en la tabla.',aF('La IA leyó estos valores',aCk([['Ferritina 18 ng/ml',1],['Hemoglobina 12,5 g/dl',1],['Vitamina D 31 ng/ml',1],['Glucemia 85 mg/dl',1],['TSH 2,2 µUI/ml',1],['Vitamina B12 360 pg/ml',1],['Colesterol total 180 mg/dl',1]]))),
 'Ver':(e,b)=>{const r=b.closest('.fxr>*,.fxfiles>div');return FILEV(r?r.querySelector('b').textContent:'Archivo');},
 'Aplicar al plan':(e,b)=>{b.disabled=true;b.textContent='Aplicado';toast('Sumado al plan: lentejas, carne magra y espinaca con cítricos 4 veces por semana.');},
 'Nuevo pedido':()=>({t:'Pedido de estudios',s:'Sale en PDF con tu firma y matrícula',ok:'Generar pedido',body:aF('Estudios',aCk([['Hemograma completo',1],['Ferritina',1],['Vitamina D',1],['Perfil tiroideo',0],['Anticuerpos celíacos',0],['Glucemia y perfil lipídico',0]]))+aF('Indicaciones',aT('Ayuno de 8 horas.'))+aCk([['Mandárselo a Sofía por la app',1]]),done:'Pedido generado y enviado a Sofía.'}),
 'ficha-archivos:Todos':(e,b)=>aFiles(b,''),'ficha-archivos:Análisis':(e,b)=>aFiles(b,'Análisis'),'ficha-archivos:Estudios':(e,b)=>aFiles(b,'Estudio'),'ficha-archivos:Planes':(e,b)=>aFiles(b,'Plan'),'ficha-archivos:Documentos':(e,b)=>aFiles(b,'Documento'),'ficha-archivos:Fotos':(e,b)=>aFiles(b,'Foto'),
 'Exportar PDF':()=>({t:'Exportar ficha en PDF',s:'Sofía Gómez',ok:'Descargar PDF',body:aF('Qué incluir',aCk([['Resumen',1],['Historia clínica',1],['Mediciones y gráficos',1],['Plan vigente',1],['Notas de consultas',0],['Laboratorio',1],['Cobros',0]])),done:'Ficha descargada en PDF.'}),
 'Elegir archivos':(e,b)=>{const l=document.querySelector('.fxfiles');if(l)l.insertAdjacentHTML('afterbegin',`<div class="l anew"><span class="ico l">${svg('file')}</span><span class="t"><b>Resumen de alta.pdf</b><small>Documento · subido por vos</small></span><time class="num">22/10</time><span class="sz num">310 KB</span>${sb('Ver','','eye')}</div>`);toast('Archivo subido. La IA lo ordenó en Documentos.');},
 'Cambiar programa':()=>({t:'Programa de Sofía',s:'Cambia lo que paga desde el próximo mes',ok:'Cambiar programa',body:aF('Programa',aSeg(['Mensual · $54.000','Trimestral · $153.000','Por consulta · $30.000']))+aF('Desde',aS(['Noviembre','Diciembre']))+aCk([['Avisarle en su app',1]]),done:'Programa cambiado.'}),
 'Empezar consulta':()=>{go('ficha');ftab='consultas';drawFicha();}
};

/* Cambios en el lugar */
function aSent(b,t){if(!b)return;b.disabled=true;b.classList.add('sent');b.innerHTML='Enviado';if(t)toast(t);}
let aWk=0;function aWeek(d){aWk+=d;const W=['6 al 11','13 al 18','20 al 25','27 de octubre al 1','3 al 8'];const h=document.querySelector('#s-agenda h1 span');h.textContent='· '+(W[2+aWk]||'otra semana')+(aWk>=2?' de noviembre':' de octubre');}
function aPer(t){document.querySelector('#s-cobranzas h1 span').textContent='· '+t;}
function aIng(n){const p=[...document.querySelectorAll('#cwrap .fxp')].find(x=>x.querySelector('h3')?.textContent==='Ingresos por mes');const v=n===6?[620,710,680,840,960,842]:[410,450,520,560,590,640,620,710,680,840,960,842];const l=n===6?['may','jun','jul','ago','sep','oct']:['nov','dic','ene','feb','mar','abr','may','jun','jul','ago','sep','oct'];
 p.querySelector('svg.fxc').outerHTML=fxCurve(v,l,{w:620,h:150,goal:900,gl:'&#8203;',pr:16,last:'$842k'});fxAnim(document.getElementById('cwrap'));}
function aFilt(b,s){const t=b.closest('.fxp');t&&t.querySelectorAll('tbody tr').forEach(r=>r.hidden=s&&!r.querySelector('.pill').textContent.startsWith(s));}
function aFiles(b,s){document.querySelectorAll('.fxfiles>div').forEach(r=>r.hidden=s&&!r.querySelector('small').textContent.startsWith(s));}
function aRev(b,k){b.closest('.fxp').querySelectorAll('tbody tr').forEach(r=>r.hidden=k&&!r.querySelector('.cbtn'));}
function aEdit(b,sel){const on=!b.classList.contains('editing');document.querySelectorAll('#fwrap '+sel).forEach(x=>{x.contentEditable=on;x.classList.toggle('aedit',on);});b.classList.toggle('editing',on);b.lastChild.textContent=on?'Guardar cambios':'Editar';if(on){const f=document.querySelector('#fwrap '+sel);f&&f.focus();}else toast('Cambios guardados.');}
let aRecT;function aRec(b){if(b.classList.contains('rec')){clearInterval(aRecT);b.classList.remove('rec');b.textContent='Grabar';toast('Grabación guardada. La IA arma el borrador de la nota.');return;}let s=0;b.classList.add('rec');b.textContent='Grabando 0:00';aRecT=setInterval(()=>{s++;if(!b.isConnected)return clearInterval(aRecT);b.textContent=`Grabando ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`},1000);}
let aStT;function aStart(b){if(b.classList.contains('live')){clearInterval(aStT);b.classList.remove('live');b.textContent='Iniciar consulta';toast('Consulta terminada. Revisá la nota y cerrala.');return;}let s=0;b.classList.add('live');b.textContent='En curso 0:00 · Terminar';aStT=setInterval(()=>{s++;if(!b.isConnected)return clearInterval(aStT);b.textContent=`En curso ${Math.floor(s/60)}:${String(s%60).padStart(2,'0')} · Terminar`},1000);}
const SOAP=[null,[['','Transcripción','Vos: ¿Cómo te fue con la merienda esta semana? · Sofía: Los días de oficina me cuesta, llego con mucha hambre a la noche. · Vos: ¿Y el sueño? · Sofía: Mejor desde que ceno más temprano. Me sigo hinchando un poco después del almuerzo…']],[['','Para Sofía','¡Muy buen avance! Bajaste 1,2 kg y 2 cm de cintura. Esta semana sumá yogur sin lactosa o un huevo en la merienda, dejá las legumbres para la noche y repetimos el análisis de hierro en 60 días. Nos vemos en 4 semanas.']]];
let SOAP0=null;function aSoap(k){const w=document.querySelector('.fxsoap');if(!w)return;if(!SOAP0)SOAP0=w.innerHTML;w.innerHTML=k?SOAP[k].map(([l,t,d])=>`<div><div><b>${t}</b><p>${d}</p></div></div>`).join(''):SOAP0;}
const MED=[null,[['Cintura','78','—','80','−2'],['Cadera','97','—','98','−1'],['Brazo relajado','27,5','27,0','28,0','−0,5'],['Muslo medio','52,0','51,5','53,0','−1,0'],['Pantorrilla','35,0','35,0','35,0','0']],[['Peso','68,4 kg','','69,6','−1,2'],['Grasa','27,8%','','28,6','−0,8'],['Masa muscular','26,4 kg','','26,1','+0,3'],['Agua','49,8%','','49,1','+0,7'],['Grasa visceral','6','','7','−1']],[['Brazo derecho','2,4 kg','','2,3','+0,1'],['Brazo izquierdo','2,3 kg','','2,3','0'],['Tronco','20,8 kg','','20,7','+0,1'],['Pierna derecha','7,6 kg','','7,5','+0,1'],['Pierna izquierda','7,5 kg','','7,5','0']]];
let MED0=null;function aMed(b,k){const tb=document.querySelector('#fwrap .fxtb tbody');if(!tb)return;if(!MED0)MED0=tb.innerHTML;tb.innerHTML=k?MED[k].map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num" style="color:var(--ink3)">${r[3]}</td><td class="num ok">${r[4]}</td><td></td></tr>`).join(''):MED0;}
function aEvo(b,v,g,gl){const p=b.closest('.fxp');p.querySelector('svg.fxc').outerHTML=fxCurve(v,['12/3','7/5','2/7','6/8','3/9','14/10'],{w:360,h:118,goal:g,gl});fxAnim(document.getElementById('fwrap'));}
let PLAN0=null;function aPlan(b,k){const w=b.closest('.fxp').querySelector('.fxs');if(!PLAN0)PLAN0=w.innerHTML;
 w.innerHTML=k===0?PLAN0:k===1?`<div class="awk">${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map((d,i)=>`<div class="${i===2?'td':''}"><b>${d}</b>${['Tostadas y huevo','Ensalada con pollo','Yogur y frutos secos',i===3?'Revuelto rápido':'Tortilla de espinaca'].map(x=>`<span>${x}</span>`).join('')}</div>`).join('')}</div>`
 :`<div class="aphone"><div><small>Hoy · miércoles</small><b>Tu plan</b>${[['8:00','Desayuno','Tostadas sin TACC con huevo y tomate'],['11:00','Colación','Una fruta de estación'],['13:00','Almuerzo','Ensalada completa con pollo'],['17:30','Merienda','Yogur sin lactosa con frutos secos'],['21:00','Cena','Tortilla de papa y espinaca']].map(([h,m,f])=>`<p><time>${h}</time><span><small>${m}</small>${f}</span></p>`).join('')}</div></div>`;}

/* Un solo escucha para todo el panel */
document.addEventListener('click',e=>{
 if(e.target.closest('#actw,#s-mensajes,#s-planes,.chatd,[data-go],[data-ft],[data-chat],[data-dv],[data-k],.nv,.si,#ftabs,.seg,.fold,.bar'))return;
 const b=e.target.closest('.main button,.main .lnk');if(!b||b.disabled)return;
 const tab=b.closest('.tabs');if(tab&&!b.classList.contains('on')){tab.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));}
 if(b.closest('.fxcases')){b.classList.toggle('on');return;}
 const raw=(b.getAttribute('aria-label')||b.textContent).trim().replace(/\s+/g,' '),lab=raw.replace(/\s*[·]?\s*\d+$/,'').trim();
 const f=ACT[aScr()+':'+lab]||ACT[lab]||((m=>m?()=>TURNO(PAC[0],`${m[1]} ${m[2]}/10`,m[3]):null)(raw.match(/^(\S+) (\d{1,2})(\d{1,2}:\d{2})$/)));
 if(!f)return;const r=f(e.target,b);if(r&&r.t)aOpen(r);});
document.addEventListener('click',e=>{const d=e.target.closest('.fxck>div');if(!d||e.target.closest('#actw'))return;const i=d.querySelector('i');i.classList.toggle('on');});
