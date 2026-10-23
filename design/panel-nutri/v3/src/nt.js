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

/* Paso 0.2: Ficha. Lista «Para Sofía» al terminar, firma con matrícula, historial y accesos, pedir registro,
   formularios, certificados, laboratorio y balanza con IA, aviso de valor mal cargado. */
const NTREP=(h,a,b)=>{if(!h.includes(a))console.warn('nt: no encontré',a.slice(0,40));return h.replace(a,b);};
const NTFIRMA='Lic. Verónica Trenti · MN 4521';
let ntFirmada=false;
const NTPS=[['b','chat','Devolución','Resumen para Sofía, sin tus notas internas',sb('Revisar')],
 ['l','clip','Plan','El vigente vence el 4/11',sb('Renovar')],
 ['l','file','Material','«Colaciones para llevar a la oficina»',sb('Asignar')],
 ['a','flame','Registro alimentario','7 días desde mañana, sin calorías',sb('Pedir')],
 ['b','file','Formulario','Preferencias y rechazos',pill('Programado 06/11','p-wait')],
 ['b','shield','Certificado','Asistencia a la consulta',sb('Generar')],
 ['a','coin','Cobro','Seguimiento · $30.000',sb('Cobrar')],
 ['l','cal','Próximo turno','Sugerido: martes 18/11, 10:30',sb('Agendar')]];
const ntPsH=()=>`<div class="fxs"><div class="ntps">${NTPS.map(([c,i,t,s,r])=>`<div><span class="ico ${c}">${svg(i,13)}</span><span class="t"><b>${t}</b><small>${s}</small></span>${r}</div>`).join('')}</div>${fxAi('Al firmar,','Sofía recibe un solo aviso con todo lo que le publicaste hoy, en vez de uno por cada cosa.')}</div>
 <div class="fxfoot">${ntFirmada?`<span class="ntsig">${svg('check',13)}Firmada hoy · ${NTFIRMA}</span>`:`<span class="ntsig n">Sin firmar</span>`}<span style="flex:1"></span>${ntFirmada?sb('Agregar nota','','plus'):sb('Terminar y firmar','k','check')}</div>`;
const _ntCons=FT.consultas;FT.consultas=()=>{let h=_ntCons();
 h=NTREP(h,'grid-template-columns:330px 1fr','grid-template-columns:290px 1fr 300px');
 h=h.replace(/<div class="fxclose">[\s\S]*?<\/div><\/div><\/div>/,`<div class="fxclose"><small>Acuerdos de hoy · Sofía los ve en su app</small>${fxCk([['Yogur sin lactosa o huevo en la merienda',0],['Legumbres solo a la noche',0],['Repetir el hierro en 60 días',0],['Caminar 4 veces por semana',0]])}</div>`);
 h=h.replace('>Plantilla: Seguimiento SOAP</button>','>SOAP</button>');
 if(ntFirmada)h=h.replace(pill('Borrador de la IA','p-wait'),pill('Firmada · bloqueada','p-conf'));
 const done=NTPS.filter(p=>!p[4].includes('<button')).length;
 return h.replace(/<\/div>\s*$/,`<div class="c">${fxP('Para Sofía al terminar',`${done} de ${NTPS.length}`,'',ntPsH(),'g ntpsw')}</div></div>`);};
const ntPsDone=(t,txt)=>{const r=NTPS.find(p=>p[2]===t);if(r)r[4]=pill(txt,'p-conf');if(ftab==='consultas')drawFicha();};
const NTREG=(done)=>({t:'Pedir registro alimentario',s:'Sofía lo ve en su app como «Registro 1 de 7 días»',ok:'Pedir registro',
 body:aF('Cuántos días',aSeg(['3 días','7 días','14 días','Sin fin'],1))+aF('Empieza',aS(['Mañana, viernes 24/10','Hoy','Lunes 27/10']))
  +aF('Qué comidas',aCh(['Desayuno','Colación','Almuerzo','Merienda','Cena','Colación nocturna'],['Desayuno','Almuerzo','Merienda','Cena']))
  +aF('Qué ve Sofía',aCk([['Calorías',0],['Proteínas, grasas y carbohidratos',0],['Plato por grupos de alimentos',1],['Micronutrientes',0]]))
  +aF('Qué le pedís que cargue',aCk([['Cómo se sentía y con quién comió',1],['Actividad del día',1],['Agua',1]]))
  +aCk([['Modo sin números: nunca ve calorías ni gramos (trastornos de la conducta alimentaria)',1]])
  +aF('Mensaje para Sofía',aT('Esta semana anotá todo lo que comas, sin juzgarte. Con eso ajustamos la merienda.')),
 after:()=>{ntPsDone('Registro alimentario','Pedido');if(done)done();},
 done:b=>`Registro de ${b.querySelector('.aseg [aria-checked=true]').textContent} pedido. Cuando termine te llega un resumen.`});
const NTCERT=()=>({t:'Certificado',s:'Sale en PDF con tu firma, matrícula y logo',ok:'Firmar y generar',
 body:aF('Modelo',aSeg(['Asistencia','Aptitud nutricional','Dieta escolar','Dieta laboral']))
  +`<div class="apdf ntcert"><b>Certificado de asistencia</b><p>Certifico que <u>Sofía Gómez</u>, DNI <u>34.567.890</u>, asistió a consulta nutricional el día <u>23/10/2026</u> de 10:30 a 11:15.</p><small>${NTFIRMA}<br>Consultorio de Verónica · La Plata</small></div>`
  +aCk([['Guardarlo en Documentos de su app',1],['Avisarle por la app y por mail',1]]),
 pick:b=>{const m={Asistencia:['Certificado de asistencia','asistió a consulta nutricional el día <u>23/10/2026</u> de 10:30 a 11:15.'],'Aptitud nutricional':['Certificado de aptitud nutricional','se encuentra en buen estado nutricional y apta para realizar actividad física.'],'Dieta escolar':['Certificado de dieta escolar','requiere alimentación <u>sin gluten (celiaquía)</u> y sin lactosa en el comedor escolar.'],'Dieta laboral':['Certificado de dieta laboral','requiere alimentación <u>sin gluten (celiaquía)</u> y sin lactosa en el comedor de su trabajo.']}[b.textContent];
  if(!m)return;const c=document.querySelector('#act .ntcert');c.querySelector('b').textContent=m[0];c.querySelector('p').innerHTML=`Certifico que <u>Sofía Gómez</u>, DNI <u>34.567.890</u>, ${m[1]}`;},
 after:b=>{const n=b.querySelector('.ntcert b').textContent;const l=document.querySelector('.fxfiles');if(l)l.insertAdjacentHTML('afterbegin',`<div class="l anew"><span class="ico l">${svg('shield')}</span><span class="t"><b>${n}.pdf</b><small>Documento · firmado con tu matrícula</small></span><time class="num">23/10</time><span class="sz num">90 KB</span>${sb('Ver','','eye')}</div>`);ntPsDone('Certificado','Generado');},
 done:b=>`${b.querySelector('.ntcert b').textContent} firmado. Sofía lo tiene en Documentos de su app.`});
Object.assign(ACT,{
 'ficha-consultas:Revisar':()=>{aSoap(2);document.querySelectorAll('#fwrap .fxp header .tabs button').forEach((x,i)=>x.classList.toggle('on',i===2));toast('Esta es la versión que va a ver Sofía.');},
 'ficha-consultas:Renovar':()=>({t:'Renovar el plan',s:'Sin gluten 1.800 kcal · vence el 4/11',ok:'Renovar',body:aF('Cómo',aSeg(['Igual por 4 semanas más','Con los cambios de hoy','Abrir en el editor']))+aCk([['Sumar yogur sin lactosa o huevo en la merienda',1],['Legumbres solo a la noche',1]]),after:()=>ntPsDone('Plan','Renovado'),done:'Plan renovado hasta el 2/12. Sofía lo ve al cerrar la consulta.'}),
 'ficha-consultas:Asignar':()=>({t:'Asignar material',s:'Aparece en «Para hacer» de su app',ok:'Asignar',body:aF('Material',aCh(['Colaciones para llevar a la oficina','Recetario sin TACC','Cómo leer etiquetas','Hierro: qué comer'],['Colaciones para llevar a la oficina'])),after:()=>ntPsDone('Material','Asignado'),done:'Material asignado.'}),
 'ficha-consultas:Pedir':()=>NTREG(),'ficha-alimentario:Pedir registro':()=>NTREG(),'ficha-alimentario:Cambiar':()=>NTREG(),
 'ficha-consultas:Generar':()=>NTCERT(),'ficha-consultas:SOAP':(e,b)=>ACT['Plantilla: Seguimiento SOAP'](e,b),'Hacer certificado':()=>NTCERT(),
 'ficha-consultas:Cobrar':e=>{const r=COBRO('Sofía Gómez');r.body=r.body.replace('<option>Seguimiento</option>','<option selected>Seguimiento</option>').replace('value="$54.000"','value="$30.000"');const a=r.after;r.after=b=>{a&&a(b);ntPsDone('Cobro','Cobrado');};return r;},
 'ficha-consultas:Agendar':()=>{const r=TURNO('Sofía Gómez','Lun 27/10','10:30');r.after=()=>{const x=NTPS.find(p=>p[2]==='Próximo turno');x[3]='Martes 18/11, 10:30 · consultorio';ntPsDone('Próximo turno','Agendado');};return r;},
 'Terminar y firmar':()=>{const pend=NTPS.filter(p=>p[4].includes('<button'));return {t:'Terminar y firmar',s:'Después de firmar, la nota queda bloqueada',ok:'Firmar y cerrar',
  body:(pend.length?aF(`Quedan ${pend.length} cosas sin hacer (podés cerrar igual)`,fxCk(pend.map(p=>[p[2]+' · '+p[3],0]))):fxAi('Listo:','hiciste todo lo de la lista.'))
   +aF('Firma',fxKv([['Profesional',NTFIRMA],['Fecha','23/10/2026 · 11:15'],['Nota','Seguimiento n.º 7 · versión 3']]))
   +aCk([['Mandarle a Sofía un solo aviso con todo lo publicado hoy',1],['Marcar el turno como realizado',1]])
   +`<small class="nthint">Si después necesitás corregir algo, se suma como nota agregada con fecha. La original no se pierde.</small>`,
  after:()=>{ntFirmada=true;drawFicha();},done:()=>`Consulta firmada. Sofía recibió un solo aviso con ${NTPS.filter(p=>!p[4].includes('<button')).length} cosas nuevas.`};},
 'Agregar nota':()=>({t:'Nota agregada',s:'Se suma a la consulta firmada con fecha y tu nombre',ok:'Agregar',body:aF('Nota',aT('','Por ejemplo: Sofía avisó que el yogur sin lactosa le cae mal; se cambia por huevo.'))+aCk([['Avisarle a Sofía si cambia algo de su plan',0]]),done:'Nota agregada a la consulta del 23/10.'})
});

/* Historia clínica: formularios propios y quién cambió o abrió la ficha */
const _ntHist=FT.historia;FT.historia=()=>{let h=_ntHist();
 h=NTREP(h,'Enviar cuestionario','Formularios');
 h=h.replace(/<section class="fxp "><header><h3>Cuestionario y consentimiento<\/h3>[\s\S]*?<\/section>/,fxP('Formularios','3 de 4','<button class="lnk" type="button">Ver respuestas</button>',fxKv([['Preferencias y rechazos','se manda solo el 06/11'],['Seguimiento semanal','respondido el 12/10'],['Consentimiento y uso de IA','firmado el 12/03']])));
 h=NTREP(h,'<h3>Historial de versiones</h3>','<h3>Historial de cambios</h3><span class="sp"></span><button class="lnk" type="button">Cambios y accesos</button>'.replace('<span class="sp"></span>',''));
 return h;};
const NTFORMS=['Anamnesis completa','Seguimiento semanal','Evaluación nutricional inicial','Preferencias y rechazos','Calidad de sueño','Recordatorio de 24 h'];
Object.assign(ACT,{
 'ficha-historia:Formularios':()=>({t:'Formularios',s:'Los armás una vez en Ajustes y los usás con todas',ok:'Enviar',
  body:aF('Formulario',aS(NTFORMS,'Preferencias y rechazos'))+aF('Cómo',aSeg(['Mandárselo ahora','Programarlo','Completarlo yo en la consulta']))
   +aRow(aF('Día',aS(['Jueves 06/11','Lunes 27/10','Antes del próximo turno'])),aF('Hora',aS(['9:00','12:00','18:00'])))
   +aCk([['Usarlo también como formulario previo a cada primera consulta',0],['Recordarle si no lo completa en 2 días',1]]),
  pick:b=>{const ok=document.querySelector('#act [data-ok]');if(ok)ok.textContent={'Mandárselo ahora':'Enviar','Programarlo':'Programar','Completarlo yo en la consulta':'Abrir formulario'}[b.textContent]||ok.textContent;},
  done:b=>{const w=b.querySelector('.aseg [aria-checked=true]').textContent;return w==='Programarlo'?`«${aVal(b,0)}» programado para el ${aVal(b,1)}.`:w==='Mandárselo ahora'?`«${aVal(b,0)}» enviado a la app de Sofía.`:`«${aVal(b,0)}» abierto. Se guarda solo mientras lo completás.`;}}),
 'Ver respuestas':()=>({t:'Seguimiento semanal',s:'Respondido por Sofía el 12/10 desde la app',ok:false,body:fxKv([['¿Cómo te sentiste esta semana?','Bien, con más energía'],['¿Qué comida te costó más?','La merienda en la oficina'],['Horas de sueño','6 a 7'],['¿Tuviste hinchazón?','Sí, 2 veces después del almuerzo'],['Peso en casa','68,6 kg']])+`<small class="nthint">Las respuestas no se pueden editar. Si algo cambia la historia clínica, lo sumás vos con «Editar».</small>`}),
 'Cambios y accesos':()=>({t:'Cambios y accesos',s:'Quién cambió o abrió la ficha de Sofía',ok:false,
  body:aF('Mostrar',aSeg(['Cambios','Quién la abrió']))+`<div id="ntaud">${NTAUD[0]}</div>`,pick:b=>{document.getElementById('ntaud').innerHTML=NTAUD[b.textContent==='Cambios'?0:1];}})
});
const NTAUD=[fxTl([['Vos','Medicación: hierro desde agosto (antes: sin suplementos)','14/10 10:52'],['Sofía, desde la app','Recordatorio de 24 h','12/10 21:14'],['Vos','Diagnósticos: anemia leve (2024)','16/09 11:20'],['Marina, recepción','Teléfono y obra social','02/09 17:05'],['Vos','Primera anamnesis','12/03 10:40'],['Importado','Otro consultorio · plan de 1.500 kcal','2025','n']]),
 fxTl([['Vos','Resumen, Historia clínica y Laboratorio','hoy 9:58'],['Sofía, en su app','Plan y registro de comidas','hoy 8:10'],['Marina, recepción','Turnos y Cobros · no tiene permiso para la historia clínica','ayer 18:10'],['Vos','Exportaste la ficha en PDF','12/10 19:30'],['Dra. Paula Ruiz, equipo','Mediciones','03/09 16:00']])];

/* Registro alimentario: el pedido activo y su configuración */
const _ntAl=FT.alimentario;FT.alimentario=()=>{let h=_ntAl();
 h=NTREP(h,`${sb('Descargar','','dl')}`,`${sb('Descargar','','dl')}${sb('Pedir registro','k','plus')}`);
 h=h.replace(/<section class="fxp g"><header><h3>Comidas cargadas<\/h3>[\s\S]*?<\/section>/,fxP('Registro pedido','día 5 de 7','<button class="lnk" type="button">Cambiar</button>',`<div class="fxsplit">${fxRing(71,'5/7',58)}${fxKv([['Del','19 al 25/10'],['Sofía ve','el plato, sin calorías'],['Carga','cómo se sentía y agua']])}</div>`,'g'));
 return h;};

/* Laboratorio: lectura de la IA con lo que sabe de la ficha, y comparación al cargar */
const _ntLab=FT.laboratorio;FT.laboratorio=()=>NTREP(_ntLab(),`${sb('Cargar análisis','k','up')}`,`${sb('Analizar con IA','','spark')}${sb('Cargar análisis','k','up')}`);
const _ntCarga=ACT['Cargar análisis'];
Object.assign(ACT,{
 'Analizar con IA':()=>({t:'Lectura de la IA',s:'Borrador privado: Sofía no lo ve hasta que lo publiques',ok:'Guardar borrador',
  body:aF('Usó de la ficha',`<div class="fxchips">${['Celiaquía','Hipotiroidismo · levotiroxina 50 µg','Hierro desde agosto','Sin lactosa'].map(t=>`<span>${t}</span>`).join('')}</div>`)
   +aF('Comparado con marzo',fxKv([['Ferritina','14 ng/ml · +3 · sigue baja'],['Vitamina D','28 ng/ml · +3 · en el límite'],['Anticuerpos celíacos','8 U/ml · −4 · en rango'],['Glucemia','86 mg/dl · −2 · normal']]))
   +aF('Lectura',aT('La ferritina sube despacio con el suplemento. Con celiaquía conviene descartar mala absorción con su médica. La vitamina D sigue en el límite: sumar sol y repetir en 60 días. Los anticuerpos en rango muestran buena adherencia a la dieta sin TACC.'))
   +`<small class="nthint">La IA ayuda; el criterio es tuyo. Podés editar el texto antes de guardarlo.</small>`,
  done:'Lectura guardada como borrador en Laboratorio.'}),
 'Cargar análisis':e=>{const r=_ntCarga(e);r.body=r.body.replace('<div class="afound" hidden>','<div class="afound" hidden>'+fxAi('Comparado con el análisis de marzo:','ferritina +3, vitamina D +3, glucemia −2. Confirmá cada valor antes de guardar.'));return r;},
 'ficha-mediciones:Importar balanza':()=>DROP('Importar de la balanza','InBody 270 · 14/10 10:42','Cargar 8 valores','Medición de la balanza cargada: 8 valores.',
  aF('La IA reconoció un InBody 270. Destildá lo que no quieras cargar',aCk([['Peso 68,4 kg',1],['Grasa 27,8 %',1],['Músculo 26,4 kg',1],['Agua 49,8 %',1],['Grasa visceral 6',1],['Metabolismo basal 1.420 kcal',1],['Brazos y piernas por segmento',1],['Edad metabólica 31',0]]))+`<small class="nthint">También lee Tanita y Omron, en PDF o foto.</small>`)
});
const _ntMed=ACT['Nueva medición'];ACT['Nueva medición']=e=>{const r=_ntMed(e),d=r.done;
 r.done=b=>{const c=parseFloat((aVal(b,2)||'').replace(',','.'));return c&&(c<45||c>180)?`Ojo: una cintura de ${aVal(b,2)} cm está fuera de lo esperado. Revisá el valor.`:(typeof d==='function'?d(b):d)||'Medición guardada.';};return r;};

/* Archivos: certificado desde la ficha */
const _ntArc=FT.archivos;FT.archivos=()=>NTREP(_ntArc(),`${sb('Elegir archivos','k')}`,`<span style="display:flex;gap:8px">${sb('Elegir archivos','k')}${sb('Hacer certificado','','shield')}</span>`);
if(ftab)drawFicha();

/* Paso 0.3: tipo de alimentación y estrategia del plan (la IA los respeta igual que las alergias) */
let ntDiet=['General','Alta en proteínas'];
const NTDIET=()=>aRow(aF('Tipo de alimentación',aS(['General','Vegetariana','Vegana','Pescetariana','Flexitariana','Mediterránea','Basada en plantas','DASH'],ntDiet[0])),aF('Estrategia',aS(['Sin estrategia especial','Alta en proteínas','Baja en carbohidratos','Cetogénica','Alta en fibra','Baja en fibra'],ntDiet[1])))+`<small class="nthint">El asistente de IA arma el plan respetando las dos cosas, igual que las alergias. Nada viene elegido de antemano en un plan nuevo.</small>`;
const ntDietSave=b=>{const s=[...b.querySelectorAll('.abody select.ai')];const t=s.find(x=>[...x.options].some(o=>o.text==='Vegana')),e=s.find(x=>[...x.options].some(o=>o.text==='Cetogénica'));if(t&&e)ntDiet=[t.value,e.value];};
const ntWithDiet=r=>{if(!r||!r.t)return r;r.body+=NTDIET();const a=r.after;r.after=b=>{ntDietSave(b);a&&a(b);if(ftab==='plan'&&!document.getElementById('s-ficha').hidden)drawFicha();};return r;};
['Nuevo plan','ficha-plan:Editar'].forEach(k=>{const f=ACT[k];ACT[k]=(e,b)=>ntWithDiet(f(e,b));});
['metas','nuevo'].forEach(k=>{const f=PA[k];PA[k]=(...a)=>ntWithDiet(f(...a));});
const _ntGoal=pGoal;pGoal=function(){let h=_ntGoal().replace('<small>Meta diaria</small>',`<small>Meta diaria · ${ntDiet[0].toLowerCase()}</small>`);if(ntDiet[1]!=='Sin estrategia especial')h=h.replace('<small>Proteínas · carbohidratos · grasas</small>',`<small>${ntDiet[1]} · P · C · G</small>`);return h;};
const _ntPlanF=FT.plan;FT.plan=()=>NTREP(_ntPlanF(),'Mifflin-St Jeor · actividad leve',`Mifflin-St Jeor · ${ntDiet[0].toLowerCase()}${ntDiet[1]==='Sin estrategia especial'?'':', '+ntDiet[1].toLowerCase()}`);
if(ftab==='plan')drawFicha();
