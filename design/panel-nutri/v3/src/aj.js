/* Ajustes: cuenta, plantillas de formularios y certificados, avisos automáticos, seguridad e integraciones (Nutreando 0.7). */
const AJ={view:0,tp:0,av:0,two:1,all:0};
const AJT=['Mi cuenta','Plantillas','Avisos automáticos','Seguridad','Integraciones'];
const AJP=[ // nombre, tipo, cuándo se manda, preguntas o texto, usos
 ['Primera consulta','Formulario','Al reservar el primer turno',['Motivo de consulta y objetivo','Diagnósticos y medicación','Alergias e intolerancias','Un día de comidas típico','Actividad física y sueño','Consentimiento de datos de salud'],34],
 ['Seguimiento semanal','Formulario','Cada domingo a las 19',['¿Cómo te sentiste con el plan?','¿Qué comida te costó más?','Ánimo y energía de 1 a 5','¿Algo para cambiar?'],128],
 ['Frecuencia de consumo','Formulario','Se manda desde la ficha',['Lácteos por semana','Frutas y verduras por día','Ultraprocesados por semana','Alcohol por semana'],12],
 ['Consentimiento informado','Formulario','Antes de la primera consulta',['Uso de datos de salud (Ley 25.326)','Fotos de progreso','Contacto por la app y por mail'],34],
 ['Certificado de asistencia','Certificado','Se genera desde la ficha','Certifico que {nombre}, DNI {dni}, asistió a consulta nutricional el día {fecha} de {hora_inicio} a {hora_fin}.',41],
 ['Apto nutricional','Certificado','Se genera desde la ficha','Certifico que {nombre}, DNI {dni}, se encuentra en seguimiento nutricional y no presenta contraindicaciones para la actividad física.',9],
 ['Indicación de dieta','Certificado','Se genera desde la ficha','Certifico que {nombre} requiere una alimentación {tipo_de_dieta} por indicación profesional. Se solicita contemplarlo en su lugar de trabajo o estudio.',7],
 ['Derivación','Certificado','Se genera desde la ficha','Derivo a {nombre} a {especialidad} para evaluación de {motivo}. Adjunto resumen de la historia nutricional.',3]];
const AJR=[['Si no vuelve en 45 días','le mandamos un aviso para que reserve',1],['A los 3 meses del alta','control para ver cómo sigue',1],['Plan por vencer','te avisamos a vos 5 días antes',1]];
const AJI=[['Google Calendar y Meet','Tus turnos en tu calendario y el link de Meet automático','cal',0],['Mercado Pago','Seña al reservar y turno liberado si no paga','coin',0],['Mail (Brevo)','Confirmaciones, recordatorios y avisos por mail','send',0],['Balanzas InBody, Tanita y Omron','Se cargan desde el informe en PDF o foto, sin conectar nada','ruler',1]];
const AJIX=[[['Cada turno nuevo aparece en tu Google Calendar','Las videollamadas llevan su link de Meet','Si movés un turno, se actualiza solo'],'Mientras tanto: el link de la videollamada lo pegás vos en el turno.'],
 [['La paciente paga la seña al reservar','Si no paga en 2 horas, el lugar se libera','Los pagos aparecen solos en Cobranzas'],'Mientras tanto: los pagos se cargan a mano en Cobranzas.'],
 [['Confirmación y recordatorio de turno por mail','Avisos de cuota por mail','Certificados y planes adjuntos por mail'],'Mientras tanto: todos los avisos llegan a la app.'],
 [['InBody 270, 570 y 770','Tanita con informe en PDF','Omron con foto del ticket'],'Cada valor se revisa y se confirma antes de guardarlo.']];
const ajB=(t,a,k='',i='')=>`<button type="button" class="sbtn${k?' '+k:''} cbtn" data-aja="${a}">${i?svg(i,13):''}${t}</button>`;
const ajSw=(l,on,k)=>`<button type="button" class="sw" role="switch" aria-checked="${!!on}" aria-label="${l}" data-ajsw="${k}"></button>`;

function ajV0(){const dk=document.documentElement.dataset.theme==='dark';
 return `<div class="fx" style="grid-template-columns:1.2fr 1fr 1fr">
 <div class="c">
  ${fxP('Datos del consultorio','salen en certificados y en tu página',ajB('Editar','datos','','pen'),fxKv([['Nombre','Consultorio Lic. Verónica Trenti'],['Matrícula','MN 4521'],['CUIT','27-28.456.912-4'],['Dirección','Av. Cabildo 2040, 3.º B · Belgrano'],['Teléfono','11 5823-4410'],['Mail','vero@consultoriotrenti.com.ar']]))}
  ${fxP('Firma y marca','para certificados e informes',ajB('Cambiar','firma'),`<div class="ajsig"><div class="ajfirma"><svg viewBox="0 0 160 50" aria-hidden="true"><path d="M8 34c14-22 22-24 24-12s-6 18 2 8 14-24 18-14-8 22 4 14 16-20 22-10 4 12 14 4 18-10 28-6 12 4 26-2"/></svg><small>Lic. Verónica Trenti · MN 4521</small></div><div class="ajlogo"><span class="mk">V</span><small>Logo y color lima</small></div></div>`)}
  ${fxP('Título y matrícula','se imprimen en certificados',ajB('Editar','titulo'),fxKv([['Título','Lic. en Nutrición · UBA'],['Matrícula nacional','MN 4521'],['Matrícula provincial','MP 3310 · Buenos Aires'],['Especialidad','Celiaquía y deporte']]),'g')}
 </div>
 <div class="c">
  ${fxP('Tu servicio de Plan V','',``,`<div class="ajplan"><b>Fundadora</b><small>Precio fijo de por vida</small></div>${fxKv([['Pacientes activas','48'],['Equipo','4 personas'],['Próximo pago','1 de noviembre'],['Medio','Transferencia']])}<div class="fxfoot">${ajB('Ver pagos','pagos')}${ajB('Descargar factura','fact','','dl')}</div>`)}
  ${fxP('Obras sociales y reservas','se configuran en tu página pública',``,`${fxKv([['Obras sociales','OSDE, Swiss Medical, Galeno, OMINT'],['Reservas','12 h antes, hasta 30 días'],['Cancelar','hasta 24 h antes']])}<div class="fxfoot">${ajB('Ir a Página pública','gopub','','globe')}${ajB('Planilla por obra social','planos','','dl')}</div>`,'g')}
 </div>
 <div class="c">
  ${fxP('Apariencia','',``,`<div class="pubhr"><div><b>Tema oscuro</b><span>Para trabajar de noche</span>${ajSw('Tema oscuro',dk,'tema')}</div><div><b>Letra más grande</b><span>En todo el panel</span>${ajSw('Letra más grande',0,'letra')}</div><div><b>Menos movimiento</b><span>Sin animaciones</span>${ajSw('Menos movimiento',0,'mov')}</div></div>`)}
  ${fxP('Idioma y horario','',``,fxKv([['Idioma','Español (Argentina)'],['Zona horaria','Buenos Aires (GMT−3)'],['Moneda','Pesos argentinos'],['Semana empieza','Lunes']]))}
  ${fxP('Avisos para vos','qué te llega y por dónde',``,`<div class="ajav sm">${[['Reserva nueva','en la app',1],['Pedido de cambio de plan','en la app',1],['Pago recibido','en la app y por mail',1],['Resumen del día','por mail a las 8',0]].map((x,i)=>`<div><span class="t"><b>${x[0]}</b><small>${x[1]}</small></span>${ajSw(x[0],x[2],'me'+i)}</div>`).join('')}</div>`,'g')}
  ${fxP('Tus datos','',ajB('Descargar','export','','dl'),`<p class="pubbio">Pacientes, fichas, planes y cobros, cuando quieras.</p>`)}
 </div></div>`;}

function ajV1(){const t=AJP[AJ.tp],cert=t[1]==='Certificado';
 const grp=k=>AJP.map((x,i)=>x[1]===k?`<button type="button" class="ajtp${i===AJ.tp?' on':''}" data-ajtp="${i}"><span class="t"><b>${x[0]}</b><small>${x[2]}</small></span><em class="num">${x[4]}</em></button>`:'').join('');
 return `<div class="fx" style="grid-template-columns:330px 1fr 300px">
 <div class="c">${fxP('Plantillas','formularios y certificados',ajB('Nueva','nueva','','plus'),`<div class="fxs"><div class="ajtps"><small>Formularios</small>${grp('Formulario')}<small>Certificados</small>${grp('Certificado')}</div></div>`,'g')}</div>
 <div class="c">${fxP(t[0],pill(t[1],cert?'p-vid':'p-conf'),`${ajB('Vista de la paciente','prev','','eye')}${ajB('Editar','tp-ed','k','pen')}`,cert?`<div class="ajcert"><div class="ajch"><span class="mk">V</span><span><b>Lic. Verónica Trenti</b><small>Nutricionista · MN 4521 · Av. Cabildo 2040, Belgrano</small></span></div><h4>${t[0]}</h4><p>${t[3].replace(/\{(\w+)\}/g,'<u>$1</u>')}</p><p>Se extiende a pedido de la interesada para ser presentado ante quien corresponda.</p><div class="ajcf"><svg viewBox="0 0 160 50" aria-hidden="true"><path d="M8 34c14-22 22-24 24-12s-6 18 2 8 14-24 18-14-8 22 4 14 16-20 22-10 4 12 14 4 18-10 28-6 12 4 26-2"/></svg><small>Firma y sello · Buenos Aires, <u>fecha</u></small></div></div>`
  :`<div class="fxs"><ol class="ajq">${t[3].map((q,i)=>`<li><span class="num">${i+1}</span><span class="t"><b>${q}</b><small>${i===t[3].length-1&&t[0].startsWith('Primera')?'Casilla para aceptar':i%2?'Respuesta corta':'Respuesta libre'}</small><i class="ajfld${i===t[3].length-1&&t[0].startsWith('Primera')?' ck':i%2?'':' lg'}"></i></span></li>`).join('')}</ol></div>`,'g')}</div>
 <div class="c">
  ${fxP('Uso','',``,`<div class="pubkp"><div><small>${cert?'Generados':'Enviados'}</small><b class="num">${t[4]}</b><em>este año</em></div><div><small>${cert?'Firmados':'Respondieron'}</small><b class="num">${cert?'100%':'88%'}</b><em>${cert?'con matrícula':'a tiempo'}</em></div></div>`)}
  ${fxP('Cuándo se usa','',ajB('Cambiar','cuando'),`<p class="pubbio">${t[2]}.</p>${cert?'<small class="nthint">Lleva tu firma, matrícula y logo. La paciente lo recibe en su app y por mail.</small>':'<small class="nthint">Las respuestas quedan en la historia clínica de cada paciente.</small>'}`)}
  ${fxP('Variables','se completan solas',``,`<div class="ajvar">${(cert?['nombre','dni','fecha','hora_inicio','hora_fin','tipo_de_dieta']:['nombre','fecha del turno','nutricionista']).map(v=>`<span>${v}</span>`).join('')}</div>`)}
  ${fxP(cert?'Últimos generados':'Últimas respuestas','',``,`<div class="fxs">${fxTl((cert?[['Sofía Gómez','asistencia · enviado a su app','hoy'],['Rocío Paz','apto nutricional','ayer'],['Julia Sosa','indicación de dieta','14/10']]:[['Valeria Núñez','completó las 6 preguntas','hoy'],['Agustina Díaz','le faltan 2 preguntas','ayer'],['Rocío Paz','completó las 6 preguntas','20/10'],['Martina Díaz','completó las 6 preguntas','18/10']]))}</div>`,'g')}
 </div></div>`;}

function ajV2(){const a=MA[AJ.av];
 return `<div class="fx" style="grid-template-columns:1.35fr 1fr">
 <div class="c">${fxP('Avisos a tus pacientes',`${MA.filter(x=>x[3]).length} de ${MA.length} prendidos · por la app y por mail`,'',`<div class="fxs"><div class="ajav">${MA.map((x,i)=>`<div class="${i===AJ.av?'on':''}" data-ajav="${i}" tabindex="0"><span class="t"><b>${x[0]}</b><small>${x[1]}</small></span><span class="ajch2"><i>App</i><i>Mail</i></span>${ajSw(x[0],x[3],'av'+i)}</div>`).join('')}</div></div>`,'g')}
  ${fxP('Reglas de regreso','para que nadie se pierda',``,`<div class="pubhr">${AJR.map((r,i)=>`<div><b>${r[0]}</b><span>${r[1]}</span>${ajSw(r[0],r[2],'rg'+i)}</div>`).join('')}</div>`)}
 </div>
 <div class="c">${fxP(a[0],pill(a[3]?'Prendido':'Apagado',a[3]?'p-conf':'p-ok'),ajB('Editar','av-ed','','pen'),`${fxKv([['Cuándo',a[1]],['Por dónde','App y mail'],['Enviados','este mes: '+a[4]]])}<div class="ajmsg"><small>Así le llega</small><div class="ajbub">${a[2].replace(/\{(\w+)\}/g,(m,k)=>({nombre:'Sofía',hora:'10:30',fecha:'4/11'}[k]||k))}</div></div>`)}
  ${fxP('Últimos enviados','',``,`<div class="fxs">${a[4]?fxTl([['Sofía Gómez','lo vio · '+(AJ.av===0?'confirmó':'respondió'),'ayer'],['Julia Sosa','lo vio','ayer'],['Martina Díaz','lo vio','lun'],['Paula Acosta','sin ver todavía','lun']]):'<span class="ntempty">Todavía no se mandó.</span>'}</div>`,'g')}
  ${fxAi('El mail','se activa cuando conectes Brevo en Integraciones. Mientras tanto, todos los avisos llegan a la app.')}
 </div></div>`;}

function ajV3(){return `<div class="fx" style="grid-template-columns:1fr 1fr 1fr">
 <div class="c">
  ${fxP('Verificación en dos pasos',pill(AJ.two?'Activa':'Apagada',AJ.two?'p-conf':'p-wait'),``,`<p class="pubbio">Además de la clave, te pedimos un código de tu celular al entrar desde un dispositivo nuevo.</p><div class="pubhr"><div><b>Para vos</b><span>App de códigos</span>${ajSw('Dos pasos para vos',AJ.two,'two')}</div><div><b>Para el equipo</b><span>Obligatoria para todos</span>${ajSw('Dos pasos obligatoria para el equipo',AJ.all,'all')}</div></div>`)}
  ${fxP('Clave','cambiada hace 2 meses',ajB('Cambiar clave','clave'),`<p class="pubbio">Usá una clave que no uses en otro lado. Si te olvidás, te mandamos un link a tu mail.</p>`)}
  ${fxP('Ingresos a tu cuenta','últimos',``,`<div class="fxs">${fxTl([['Entraste desde el iPhone','app · Belgrano','hoy 8:02'],['Entraste desde Chrome','consultorio','hoy 7:55'],['Código de dos pasos pedido','dispositivo nuevo · casa','ayer 22:10'],['Entraste desde Chrome','casa','ayer 22:10'],['Cambiaste la clave','desde Ajustes','21/08']])}</div>`,'g')}
 </div>
 <div class="c">
  ${fxP('Sesiones abiertas','3',ajB('Cerrar las demás','sesall'),`<div class="publk">${[['iPhone · app','ahora · este dispositivo',0],['Chrome · consultorio','hace 20 min',1],['Chrome · casa','ayer 22:10',1]].map(x=>`<div><span class="t"><b>${x[0]}</b><small>${x[1]}</small></span>${x[2]?'<button type="button" class="sbtn" data-aja="ses">Cerrar</button>':'<span class="ntsig">'+svg('check',13)+'Vos</span>'}</div>`).join('')}</div>`)}
  ${fxP('Registro de accesos','quién abrió cada ficha',`<button class="lnk" type="button" data-aja="goeq">Ver ${svg('chev',11)}</button>`,`<div class="fxs">${fxTl(EQA.slice(0,8).map(a=>[a[1].split(' ')[0]+': '+a[2].charAt(0).toLowerCase()+a[2].slice(1),a[4],a[0].replace('Hoy ','')]))}</div>`,'g')}
 </div>
 <div class="c">
  ${fxP('Copias de seguridad','automáticas',``,fxKv([['Frecuencia','todos los días'],['Se guardan','7 días'],['Última','hoy 4:00 · completa']]))}
  ${fxP('Datos de salud','',``,`<div class="pubpide">${['Cumplimos la Ley 25.326 de datos personales','Las fichas solo las ven nutricionistas','Las pacientes firman el consentimiento en la app','Nada se usa para publicidad'].map(t=>`<div>${svg('shield',13)}<span>${t}</span></div>`).join('')}</div>`)}
  ${fxP('Consentimientos','46 de 48 firmados',ajB('Pedir firma','firma2','k'),`<div class="publk">${[['Agustina Díaz','primera consulta el viernes'],['Rocío Paz','se lo mandamos el 20/10']].map(x=>`<div><span class="t"><b>${x[0]}</b><small>${x[1]}</small></span>${pill('Falta firmar','p-wait')}</div>`).join('')}</div><small class="nthint">Sin el consentimiento, la app le pide firmarlo antes de cargar datos.</small>`,'g')}
 </div></div>`;}

function ajV4(){return `<div class="fx aji4" style="grid-template-columns:1fr 1fr;grid-template-rows:minmax(0,1fr) minmax(0,1fr)">
 ${AJI.map((x,i)=>fxP(x[0],pill(x[3]?'Lista':'Sin conectar',x[3]?'p-conf':'p-ok'),x[3]?ajB('Cómo se usa','inb'):ajB('Conectar','con','k'),`<div class="ajint"><span class="ajic">${svg(x[2],22)}</span><p>${x[1]}.</p></div><div class="pubpide">${AJIX[i][0].map(t=>`<div>${svg('check',13)}<span>${t}</span></div>`).join('')}</div><div class="pubins"><p>${AJIX[i][1]}</p></div>${x[3]?'':`<small class="nthint">${i===0?'Pide entrar con tu cuenta de Google.':i===1?'Pide entrar con tu cuenta de Mercado Pago. La plata va directo a tu cuenta.':'Pide una clave de Brevo. La cargamos nosotros, nunca por el chat.'}</small>`}`,'g').replace('data-aja="con"',`data-aja="con" data-i="${i}"`)).join('')}
 </div>`;}

function ajDraw(an){document.getElementById('ajwrap').innerHTML=[ajV0,ajV1,ajV2,ajV3,ajV4][AJ.view]();
 document.querySelectorAll('#ajview button').forEach((b,i)=>b.classList.toggle('on',i===AJ.view));
 const m={0:0,4:1,3:2};document.querySelectorAll('.nv[data-go="ajustes"]+.subw .si').forEach((s,i)=>s.classList.toggle('on',m[AJ.view]===i));
 if(an)fxAnim(document.getElementById('ajwrap'));}
const AJA={
 titulo:()=>({t:'Título y matrícula',ok:'Guardar',body:aF('Título',aI('Lic. en Nutrición · UBA'))+aRow(aF('Matrícula nacional',aI('MN 4521')),aF('Provincial',aI('MP 3310')))+aF('Especialidad',aI('Celiaquía y deporte')),done:'Guardado.'}),
 datos:()=>({t:'Datos del consultorio',ok:'Guardar',body:aF('Nombre',aI('Consultorio Lic. Verónica Trenti'))+aRow(aF('Matrícula',aI('MN 4521')),aF('CUIT',aI('27-28.456.912-4')))+aF('Dirección',aI('Av. Cabildo 2040, 3.º B · Belgrano'))+aRow(aF('Teléfono',aI('11 5823-4410')),aF('Mail',aI('vero@consultoriotrenti.com.ar'))),done:'Datos guardados.'}),
 firma:()=>({t:'Firma y marca',s:'Se usan en certificados e informes',ok:'Guardar',body:aF('Firma',aSeg(['Dibujarla','Subir una foto']))+aF('Logo',aSeg(['Usar la V de Plan V','Subir el mío']))+aF('Color de los informes',aSeg(['Lima','Azafrán','Negro'])),done:'Firma y marca guardadas.'}),
 pagos:()=>({t:'Tus pagos de Plan V',ok:false,body:fxKv([['Octubre','Pagado · 1/10'],['Septiembre','Pagado · 1/9'],['Agosto','Pagado · 1/8']])}),
 fact:()=>{toast('Factura de octubre descargada.');},
 gopub:()=>{go('publica');PUB.view=2;pubDraw(1);},
 planos:()=>({t:'Planilla por obra social',s:'Para facturar a cada obra social',ok:'Descargar',body:aF('Obra social',aS(['Todas','OSDE','Swiss Medical','Galeno','OMINT'],'Todas'))+aF('Período',aS(['Octubre 2026','Septiembre 2026','Últimos 3 meses']))+aCk([['Número de afiliada',1],['Código de práctica',1],['Copago cobrado',1]]),after:b=>ajOsCsv(b.querySelector('select').value)}),
 export:()=>({t:'Descargar mis datos',s:'Te mandamos un link por mail cuando esté listo',ok:'Preparar',body:aCk([['Pacientes y fichas',1],['Planes',1],['Cobros',1],['Mensajes',0]]),done:'Estamos preparando tus datos. Te llega un mail en unos minutos.'}),
 nueva:()=>({t:'Nueva plantilla',ok:'Crear',body:aF('Nombre',aI('','Ej.: Control de embarazo'))+aF('Tipo',aSeg(['Formulario','Certificado']))+aF('Cuándo se manda',aS(['Se manda desde la ficha','Al reservar el primer turno','Antes de cada turno','Cada domingo a las 19'])),
  after:b=>{const n=aVal(b,0)||'Plantilla nueva',c=b.querySelector('.aseg [aria-checked=true]').textContent;AJP.push([n,c,b.querySelector('select').value,c==='Formulario'?['Pregunta 1']:'Certifico que {nombre} …',0]);AJ.tp=AJP.length-1;ajDraw();},done:b=>`«${aVal(b,0)||'Plantilla nueva'}» creada.`}),
 prev:()=>{const t=AJP[AJ.tp];return {t:t[0],s:'Así lo ve la paciente en su app',ok:false,body:t[1]==='Certificado'?`<p class="pubbio">${t[3].replace(/\{nombre\}/g,'Sofía Gómez').replace(/\{dni\}/g,'38.412.556').replace(/\{fecha\}/g,'23/10/2026').replace(/\{(\w+)\}/g,'…')}</p>`:t[3].map(q=>aF(q,aI('','Tu respuesta'))).join('')};},
 'tp-ed':()=>{const t=AJP[AJ.tp];return {t:'Editar «'+t[0]+'»',ok:'Guardar',body:aF('Nombre',aI(t[0]))+(t[1]==='Certificado'?aF('Texto',aT(t[3])):t[3].map((q,i)=>aF('Pregunta '+(i+1),aI(q))).join('')),after:b=>{t[0]=aVal(b,0)||t[0];if(t[1]==='Certificado')t[3]=b.querySelector('textarea').value||t[3];else t[3]=t[3].map((q,i)=>aVal(b,i+1)||q);ajDraw();},done:'Plantilla guardada.'};},
 cuando:()=>({t:'Cuándo se usa',ok:'Guardar',body:aF('Momento',aS(['Se manda desde la ficha','Al reservar el primer turno','Antes de cada turno','Cada domingo a las 19'],AJP[AJ.tp][2])),after:b=>{AJP[AJ.tp][2]=b.querySelector('select').value;ajDraw();},done:'Guardado.'}),
 'av-ed':()=>{const a=MA[AJ.av];return {t:a[0],s:'Por la app y por mail',ok:'Guardar',body:aF('Cuándo',aI(a[1]))+aF('Mensaje',aT(a[2]),'Podés usar {nombre}, {hora} y {fecha}.'),after:b=>{a[1]=aVal(b,0)||a[1];a[2]=b.querySelector('textarea').value||a[2];ajDraw();},done:'Aviso guardado.'};},
 firma2:()=>{toast('Le pedimos la firma a Agustina y a Rocío en su app.');},
 clave:()=>({t:'Cambiar clave',ok:'Cambiar',body:aF('Clave actual',aI('','','password'))+aF('Clave nueva',aI('','Mínimo 10 caracteres','password'))+aF('Repetila',aI('','','password')),done:'Clave cambiada. Cerramos las otras sesiones.'}),
 ses:b=>{b.replaceWith(Object.assign(document.createElement('span'),{className:'ntsig n',textContent:'Cerrada'}));toast('Sesión cerrada.');},
 sesall:()=>{document.querySelectorAll('#ajwrap [data-aja="ses"]').forEach(b=>b.replaceWith(Object.assign(document.createElement('span'),{className:'ntsig n',textContent:'Cerrada'})));toast('Cerramos las otras sesiones.');},
 goeq:()=>{go('equipo');EQ.view=2;eqDraw(1);},
 inb:()=>({t:'Balanzas',s:'Sin conectar nada',ok:false,body:`<p class="pubbio">En la ficha, Mediciones → «Importar balanza». Subís el PDF o una foto del ticket, revisás cada valor y lo confirmás.</p>`}),
 con:b=>{const x=AJI[+b.dataset.i];return {t:'Conectar '+x[0],s:'Esto se hace al final, con tu cuenta',ok:'Entendido',body:`<p class="pubbio">${x[1]}. Cuando lo actives te va a pedir entrar con tu cuenta. Mientras tanto, todo sigue andando sin esta conexión.</p>`,done:'Queda anotado para conectarlo al final.'};}
};
async function ajOsCsv(os){const rows=[['Fecha','Paciente','Obra social','Afiliada','Práctica','Copago']].concat([['03/10','Valeria Núñez','Swiss Medical','8812-4410-02','Consulta nutricional','$8.000'],['07/10','Florencia Romero','OSDE','61 220 448 9','Consulta nutricional','Reintegro'],['15/10','Rocío Paz','Galeno','40-338812','Antropometría','$10.000'],['21/10','Valeria Núñez','Swiss Medical','8812-4410-02','Consulta nutricional','$8.000']].filter(r=>os==='Todas'||r[2]===os));
 const dl=window.claude?await claude.use('downloads').catch(()=>null):null;if(!dl)return toast('Planilla lista. La descarga no está disponible en esta vista.');
 try{await dl.save({filename:'obras-sociales-'+os.toLowerCase().replace(/\s+/g,'-')+'.csv',data:'﻿'+rows.map(r=>r.map(c=>'"'+c+'"').join(',')).join('\n')});toast('Planilla descargada.');}catch(e){toast(e&&e.code==='declined'?'Descarga cancelada.':'No se pudo descargar.');}}
(function(){
 document.getElementById('s-ficha').insertAdjacentHTML('beforebegin',`<div class="scr" id="s-ajustes" hidden>
  <div class="top"><div><h1>Ajustes</h1><div class="date">Tu cuenta, plantillas, avisos y seguridad del consultorio</div></div><div class="sp"></div>
   <div class="tabs" id="ajview">${AJT.map((t,i)=>`<button type="button" data-ajv="${i}" class="${i?'':'on'}">${t}</button>`).join('')}</div>
   <button class="ibtn" type="button" aria-label="Avisos">${svg('bell')}<i></i></button></div>
  <div id="ajwrap"></div></div>`);
 const nv=[...document.querySelectorAll('.side .nv')].find(n=>n.textContent.trim().startsWith('Ajustes'));nv.dataset.go='ajustes';nv.addEventListener('click',()=>go('ajustes'));
 const subi=nv.nextElementSibling&&nv.nextElementSibling.querySelector('.subi');
 if(subi)subi.innerHTML=['Mi cuenta','Integraciones','Seguridad','Plantillas','Avisos automáticos'].map((t,i)=>`<button class="si" type="button" style="--i:${i}"><span>${t}</span></button>`).join('');
 const sg=document.querySelector('.bar .seg [data-go="equipo"]');if(sg){sg.insertAdjacentHTML('afterend','<button type="button" data-go="ajustes" aria-pressed="false">Ajustes</button>');sg.nextElementSibling.addEventListener('click',()=>go('ajustes'));}
 const S=document.getElementById('s-ajustes');
 S.addEventListener('click',e=>{if(e.target.closest('[aria-label="Avisos"]'))return;const b=e.target.closest('button,[data-ajav]');if(!b||b.disabled)return;e.stopPropagation();const d=b.dataset;
  if(d.go)return go(d.go);
  if(d.ajv!==undefined){AJ.view=+d.ajv;return ajDraw(1);}
  if(d.ajtp!==undefined){AJ.tp=+d.ajtp;return ajDraw();}
  if(b.classList.contains('sw')){const on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',on);const k=d.ajsw;
   if(k==='tema'){setT(on?'dark':'light');}
   else if(k==='letra')document.querySelector('.app').classList.toggle('ajbig',on);
   else if(k==='two'){AJ.two=on;}else if(k==='all'){AJ.all=on;}
   else if(k.startsWith('av')){MA[+k.slice(2)][3]=on?1:0;}else if(k.startsWith('rg')){AJR[+k.slice(2)][2]=on?1:0;}
   if(k==='two'||k==='all'||k.startsWith('av'))setTimeout(ajDraw,0);
   return toast(`${b.getAttribute('aria-label')}: ${on?'prendido':'apagado'}.`);}
  if(d.ajav!==undefined){AJ.av=+d.ajav;return ajDraw();}
  const f=AJA[d.aja];if(!f)return;const r=f(b);if(r&&r.t)aOpen(r);});
 S.addEventListener('keydown',e=>{const t=e.target.closest('[data-ajav]');if(t&&(e.key==='Enter'||e.key===' ')){e.preventDefault();t.click();}});
 document.querySelectorAll('.nv[data-go="ajustes"]+.subw .si').forEach((s,i)=>s.addEventListener('click',()=>{go('ajustes');AJ.view=[0,4,3,1,2][i];ajDraw(1);}));
 ajDraw();})();
const _gaj=go;go=function(id){_gaj(id);if(id==='ajustes')fxAnim(document.getElementById('ajwrap'));};
if(location.hash==='#ajustes')go('ajustes');
// Cobranzas: la exportación suma la planilla por obra social
(()=>{const ex=ACT['Exportar'];if(!ex)return;ACT['Exportar']=(...a)=>{const r=ex(...a);if(aScr()!=='cobranzas')return r;
 return {...r,body:aF('Planilla',aSeg(['Movimientos','Por obra social']))+r.body,after:b=>{const os=b.querySelector('.aseg [aria-checked=true]').textContent==='Por obra social';if(os)return ajOsCsv('Todas');r.after(b);}};};})();
