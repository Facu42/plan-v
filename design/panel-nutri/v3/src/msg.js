
/* Mensajes: bandeja en tres columnas, respuestas guardadas y avisos automáticos. */
Object.assign(IC,{pclip:'<path d="M20 11.5l-7.8 7.8a5 5 0 0 1-7.1-7.1l8.1-8.1a3.3 3.3 0 0 1 4.7 4.7l-8.1 8.1a1.7 1.7 0 0 1-2.4-2.4l7.4-7.4"/>',pause:'<path d="M8 5.5v13M16 5.5v13"/>'});
const mAv=(a,c,s=32)=>`<span class="av" style="background:var(--${c}-t);color:var(--${c}-ink);width:${s}px;height:${s}px;font-size:${s>40?14:s>30?11.5:10.5}px">${a}</span>`;
const MC=[
 {k:'julia',n:'Julia Sosa',a:'JS',c:'azul',un:2,t:'10:12',on:'En línea',s:'29 años · bajar 4 kg',
  num:[['Adherencia','81%','+4 pts'],['Peso','63,1 kg','−0,6 kg']],
  kv:[['Plan','Mantenimiento 1.900 kcal'],['Semana','2 de 4'],['Próxima consulta','Mar 28/10 · 9:30'],['Modalidad','Videollamada'],['Cuota','Al día · vence 10/11']],
  m:[['d','Ayer'],['in','¡Hola Vero! Ayer cumplí todo el plan.','18:20'],['out','¡Qué bien, Julia! Se nota en el registro. Seguí así con las meriendas.','18:45'],['d','Hoy'],['in','Una consulta: ¿puedo cambiar el arroz del almuerzo por quinoa?','10:10'],['in',{ph:'a',cap:'Así la pensaba hacer'},'10:12']],
  sug:['Sí, cambiala por la misma cantidad cocida: una taza. Sumale las verduras de siempre y listo.','Sí, sin problema. La quinoa rinde igual que el arroz; mantené la porción del plan.']},
 {k:'paula',n:'Paula Acosta',a:'PA',c:'azaf',un:1,t:'9:48',on:'Hace 20 min',s:'38 años · bajar 6 kg',
  num:[['Adherencia','54%','−24 pts',1],['Peso','81,2 kg','+0,4 kg',1]],
  kv:[['Plan','Descenso 1.600 kcal'],['Semana','3 de 4'],['Próxima consulta','Jue 30/10 · 17:00'],['Modalidad','Consultorio'],['Cuota','Al día · vence 5/11']],
  m:[['d','Lunes'],['out','¿Cómo venís con las cenas, Paula?','20:10'],['in','Bien, más o menos.','21:32'],['d','Hoy'],['in','Esta semana me costó mucho. Tuve mucho trabajo y comí lo que había.','9:48']],
  sug:['Gracias por contarme. Pasa, no te preocupes. ¿Te parece si el jueves armamos cenas rápidas para los días de trabajo?','Tranqui, una semana no cambia el camino. Retomamos con la próxima comida, sin compensar.']},
 {k:'martina',n:'Martina Díaz',a:'MD',c:'lima',un:1,t:'9:05',on:'Hace 1 h',s:'31 años · ganar masa muscular',
  num:[['Adherencia','88%','+2 pts'],['Peso','58,4 kg','+0,3 kg']],
  kv:[['Plan','Nuevo · para aprobar'],['Armado','Hoy 8:40 con el asistente'],['Próxima consulta','Lun 3/11 · 11:00'],['Modalidad','Consultorio'],['Cuota','Al día · vence 12/11']],
  m:[['d','Viernes'],['out','La semana que viene te paso el plan con más proteína para los días de entrenamiento.','16:05'],['in','¡Genial! Gracias.','16:30'],['d','Hoy'],['in','Hola Vero, ¿cuándo me llega el plan nuevo?','9:05']],
  sug:['Hoy a la tarde te queda en la app. Lo estoy terminando de revisar.','Ya está casi listo. Te aviso apenas lo publique.']},
 {k:'laura',n:'Laura Ruiz',a:'LR',c:'rojo',un:1,t:'ayer',on:'Ayer 21:14',s:'45 años · colesterol alto',
  num:[['Adherencia','72%','−3 pts',1],['Peso','74,0 kg','−0,2 kg']],
  kv:[['Plan','Cardioprotector 1.750 kcal'],['Semana','1 de 4'],['Próxima consulta','Jue 23/10 · 16:00'],['Modalidad','Consultorio'],['Cuota','Al día · vence 2/11']],
  m:[['d','Ayer'],['in','Hola, ¿se puede pasar el turno del jueves a las 17? Salgo más tarde del trabajo.','21:14']],
  sug:['Sí, te paso el turno a las 17. Te queda confirmado en la app.','Las 17 está ocupado, ¿te sirve a las 18?']},
 {k:'sofia',n:'Sofía Gómez',a:'SG',c:'lima',un:0,t:'8:40',on:'Hace 2 h',s:'34 años · seguimiento n.º 6',
  num:[['Adherencia','86%','+6 pts'],['Peso','68,4 kg','−1,2 kg']],
  kv:[['Plan','Sin gluten 1.800 kcal'],['Semana','3 de 4'],['Próxima consulta','Hoy · 10:30'],['Modalidad','Consultorio'],['Cuota','Al día · vence 10/11']],
  m:[['d','Ayer'],['in','Mañana te llevo los análisis nuevos.','19:02'],['out','Perfecto, Sofía. Si podés, subilos antes a la app así los veo.','19:20'],['in','Ya los subí. ¿Puedo cambiar la cena del jueves? Tengo poco tiempo esa noche.','19:31'],['d','Hoy'],['in','¿Llevo algo más a la consulta?','8:40']],
  sug:['No hace falta, ya tengo todo. ¡Nos vemos a las 10:30!','Solo traé la lista de lo que comiste el finde. ¡Nos vemos!']},
 {k:'camila',n:'Camila Méndez',a:'CM',c:'azaf',un:0,t:'ayer',on:'Ayer 19:30',s:'27 años · comer más ordenado',
  num:[['Adherencia','64%','+9 pts'],['Peso','66,8 kg','−0,4 kg']],
  kv:[['Plan','Orden de comidas 2.000 kcal'],['Semana','2 de 4'],['Próxima consulta','Vie 31/10 · 18:00'],['Modalidad','Videollamada'],['Cuota','Vencida desde el 14/10']],
  m:[['d','Ayer'],['in','Te mando las fotos de la semana.','18:50'],['in',{ph:'b',cap:'Almuerzo del lunes'},'18:51'],['in',{ph:'c',cap:'Desayuno del martes'},'18:51'],['out','¡Muy bien armados los platos! Sumá un poco más de verdura en la cena.','19:02']],
  sug:['¿Cómo te fue con las cenas esta semana?','Recordá cargar también las colaciones.']},
 {k:'natalia',n:'Natalia Ríos',a:'NR',c:'lima',un:0,star:1,t:'lun',on:'Lunes',s:'41 años · llegó a su objetivo',
  num:[['Adherencia','93%','+1 pt'],['Peso','60,0 kg','−6 kg desde marzo']],
  kv:[['Plan','Mantenimiento 1.850 kcal'],['Semana','4 de 4'],['Próxima consulta','Mar 28/10 · 12:00'],['Modalidad','Consultorio'],['Cuota','Al día · vence 8/11']],
  m:[['d','Lunes'],['in','¡Vero! ¡Llegué a los 60 kg! No lo puedo creer.','8:12'],['out','¡Felicitaciones, Natalia! Es todo mérito tuyo. El martes armamos el plan para sostenerlo.','8:40'],['in','Gracias por todo.','8:41']],
  sug:['¿Cómo te sentís con el plan de mantenimiento?','Te dejé el plan nuevo en la app.']},
 {k:'romina',n:'Romina Benítez',a:'RB',c:'azul',un:0,t:'dom',on:'Domingo',s:'35 años · posparto',
  num:[['Adherencia','77%','−2 pts',1],['Peso','70,6 kg','−0,8 kg']],
  kv:[['Plan','Lactancia 2.300 kcal'],['Semana','1 de 4'],['Próxima consulta','Mié 5/11 · 10:00'],['Modalidad','Videollamada'],['Cuota','Al día · vence 15/11']],
  m:[['d','Domingo'],['in',{au:'0:42'},'11:20'],['out','Gracias por el audio, Romi. Sí, podés sumar la colación de la tarde mientras des la teta.','12:05']],
  sug:['¿Cómo vienen las noches con el bebé?','Acordate de tomar agua durante el día.']},
 {k:'lucia',n:'Lucía Ferrero',a:'LF',c:'lima',un:0,t:'sáb',on:'Sábado',s:'52 años · prediabetes',
  num:[['Adherencia','84%','+5 pts'],['Peso','77,3 kg','−1,1 kg']],
  kv:[['Plan','Bajo índice glucémico'],['Semana','3 de 4'],['Próxima consulta','Vie 7/11 · 9:00'],['Modalidad','Consultorio'],['Cuota','Al día · vence 6/11']],
  m:[['d','Sábado'],['out','Lucía, ya cargué los resultados: la glucemia bajó a 104. ¡Muy bien!','10:15'],['in','Gracias, Vero. Me pone muy contenta.','10:40']],
  sug:['Seguimos igual hasta la próxima consulta.','¿Pudiste caminar esta semana?']},
 {k:'ana',n:'Ana López',a:'AL',c:'azul',un:0,t:'vie',on:'Viernes',s:'48 años · hierro bajo',
  num:[['Adherencia','79%','+1 pt'],['Peso','62,2 kg','sin cambios']],
  kv:[['Plan','Hierro y vitamina C'],['Semana','2 de 4'],['Próxima consulta','Lun 10/11 · 15:00'],['Modalidad','Consultorio'],['Cuota','Al día · vence 1/11']],
  m:[['d','Viernes'],['out',{file:'Pedido de análisis.pdf',sz:'1 página'},'12:30'],['out','Te dejé el pedido de análisis. Hacelo antes del 5/11.','12:31']],
  sug:['¿Pudiste sacar turno para los análisis?','Recordá ir en ayunas.']},
 {k:'florencia',n:'Florencia Romero',a:'FR',c:'azul',un:0,t:'jue',on:'Jueves',s:'33 años · celiaquía',
  num:[['Adherencia','90%','+3 pts'],['Peso','55,9 kg','sin cambios']],
  kv:[['Plan','Sin gluten 1.700 kcal'],['Semana','4 de 4'],['Próxima consulta','Sáb 25/10 · 10:00'],['Modalidad','Consultorio'],['Cuota','Vence el 25/10']],
  m:[['d','Jueves'],['in','¿Movemos el turno al sábado? El jueves no llego.','17:40'],['out','Sí, te paso al sábado a las 10. Ya te queda en la app.','18:02']],
  sug:['¿Te llegó el recordatorio de la cuota?','Te espero el sábado a las 10.']},
 {k:'valentina',n:'Valentina Sosa',a:'VS',c:'lima',un:0,t:'mié',on:'Miércoles',s:'24 años · deportista',
  num:[['Adherencia','82%','+1 pt'],['Peso','61,7 kg','+0,5 kg']],
  kv:[['Plan','Deportista 2.400 kcal'],['Semana','2 de 4'],['Próxima consulta','Mié 29/10 · 19:00'],['Modalidad','Videollamada'],['Cuota','Vence el 26/10']],
  m:[['d','Miércoles'],['in','¿Antes de entrenar puedo comer una banana con mantequilla de maní?','7:15'],['out','Sí, perfecto. Hacelo una hora antes.','7:40']],
  sug:['¿Cómo te sentiste en el entrenamiento?','Acordate de la colación después de entrenar.']},
 {k:'agustina',n:'Agustina Díaz',a:'AD',c:'azul',un:0,t:'lun',on:'Lunes',s:'30 años · primera consulta',
  num:[['Adherencia','—','sin datos todavía'],['Peso','—','se carga en la consulta']],
  kv:[['Plan','Todavía sin plan'],['Cuestionario','Completo'],['Próxima consulta','Vie 24/10 · 11:30'],['Modalidad','Consultorio'],['Cuota','Seña pagada']],
  m:[['d','Lunes'],['out','¡Bienvenida, Agustina! Antes de la consulta completá el cuestionario de la app.','11:20'],['in','¡Gracias por la bienvenida! Ya lo completé.','13:05']],
  sug:['¡Gracias! Te espero el viernes a las 11:30.','Si tenés análisis recientes, subilos a la app.']}
];
const MR=[
 ['Cambio de comida','Comidas','Sí, podés cambiarla por otra opción del mismo grupo. Mantené la porción y seguí con el resto del plan.',23],
 ['Recordatorio de registro','Registro','¡Hola {nombre}! Acordate de cargar tus comidas de hoy, así ajustamos lo que haga falta.',41],
 ['Semana difícil','Ánimo','Gracias por contarme, {nombre}. Pasa y no hay que retarse. Retomamos con la próxima comida, sin compensar.',9],
 ['Felicitación por la meta','Ánimo','¡Felicitaciones, {nombre}! Es todo mérito tuyo. Seguimos así.',12],
 ['Pedido de análisis','Consultas','Te dejé el pedido de análisis en la app. Hacelo antes de la próxima consulta ({próxima consulta}).',17],
 ['Cambio de turno','Turnos','Sí, lo movemos. Te dejo los horarios libres en la app para que elijas.',15],
 ['Antes de la primera consulta','Turnos','Antes de la consulta completá el cuestionario de la app y traé tus últimos análisis.',28],
 ['Plan nuevo publicado','Consultas','{nombre}, ya tenés el plan nuevo en la app. Miralo y contame si algo no te cierra.',34],
 ['Salida o cumpleaños','Comidas','Disfrutá. Elegí una porción de lo que haya y al día siguiente volvés al plan, sin compensar.',11],
 ['Viaje o vacaciones','Comidas','Para el viaje: priorizá verduras y proteína en cada comida, y llevá frutas y frutos secos para el camino.',6],
 ['Pedido de fotos','Registro','Si podés, mandame una foto de tus platos esta semana, así vemos porciones juntas.',19],
 ['Recordatorio de agua','Registro','Acordate de tomar agua durante el día: una botella a mano ayuda mucho.',22]
];
const MA=[
 ['Recordatorio de turno','24 h antes · le pide confirmar','Hola {nombre}, te espero mañana a las {hora}. ¿Me confirmás desde la app?',1,38],
 ['Recordatorio de cuota','3 días antes del vencimiento','Hola {nombre}, el {fecha} vence tu programa. Te dejo los datos para pagar en la app.',1,21],
 ['Cuota vencida','Al día siguiente y a los 5 días','Hola {nombre}, quedó pendiente el pago del programa. Si ya lo hiciste, avisame y lo anoto.',1,6],
 ['Bienvenida','Al darla de alta, con el cuestionario','¡Bienvenida, {nombre}! Antes de la primera consulta completá el cuestionario de la app.',1,4],
 ['Registrar comidas','Si no carga nada en 3 días','Hola {nombre}, hace unos días que no veo tus comidas. ¿Todo bien? Cargá lo que puedas.',1,12],
 ['Pesarse antes de la consulta','El día anterior a las 8','Mañana tenemos consulta: si podés, pesate en ayunas y cargalo en la app.',0,0],
 ['Felicitación por objetivo','Cuando llega a su meta','¡Llegaste a tu objetivo, {nombre}! Es todo mérito tuyo.',1,1],
 ['Cumpleaños','Ese día a las 9','¡Feliz cumple, {nombre}! Que tengas un lindo día.',0,0]
];
const MX=[];MC[0].un=0;let mCur='julia',mFil='all',mQ='',mV=0,mRs=0,mAs=0,mSi=0;
const mGet=k=>MC.find(c=>c.k===k);
const mFirst=n=>n.split(' ')[0];
const mLast=c=>{const x=[...c.m].reverse().find(m=>m[0]!=='d');const v=x[1];const t=typeof v==='string'?v:v.ph?'Foto':v.au?'Audio · '+v.au:v.file;return (x[0]==='out'?'Vos: ':'')+t;};
const mUnread=()=>MC.filter(c=>c.un).length;
function mBub([w,v,t]){if(w==='d')return `<span class="day">${v}</span>`;const st=w==='out'?` · ${t==='ahora'?'enviado':'leído'}`:'';
 if(typeof v==='string')return `<div class="bub ${w}">${v.replace(/</g,'&lt;')}<small>${t}${st}</small></div>`;
 if(v.ph)return `<button type="button" class="bub ${w} mph" data-mph="${v.ph}"><img src="${MPH[v.ph]}" alt="Foto de comida que mandó la paciente"><small>${v.cap} · ${t}</small></button>`;
 if(v.au)return `<div class="bub ${w} mau"><button type="button" class="mplay" aria-label="Escuchar audio">${svg('play',12)}</button><span class="mwave">${Array.from({length:22},(_,i)=>`<i style="height:${4+Math.round(Math.abs(Math.sin(i*1.7))*12)}px"></i>`).join('')}</span><span class="num">${v.au}</span><small>${t}${st}</small></div>`;
 return `<div class="bub ${w} file">${svg('file',16)}<span><b>${v.file}</b><small>${v.sz} · ${t}${st}</small></span></div>`;}
function mListH(){const q=mQ.toLowerCase();if(mFil==='arch')return MX.length?MX.map((c,i)=>`<div class="mcv arch">${mAv(c.a,c.c,34)}<span class="mt"><span class="mr"><b>${c.n}</b></span><span class="mr"><small>${mLast(c)}</small></span></span><button type="button" class="sbtn" data-mx="${i}">Restaurar</button></div>`).join(''):`<p class="mempty">No hay conversaciones archivadas.</p>`;const l=MC.filter(c=>(mFil==='all'||(mFil==='un'&&c.un)||(mFil==='star'&&c.star))&&(!q||c.n.toLowerCase().includes(q)||mLast(c).toLowerCase().includes(q)));
 return l.length?l.map(c=>`<button type="button" class="mcv${c.k===mCur?' on':''}${c.un?' un':''}" data-mc="${c.k}">${mAv(c.a,c.c,34)}<span class="mt"><span class="mr"><b>${c.n}</b>${c.star?`<i class="mstar" aria-label="Destacada"></i>`:''}<time>${c.t}</time></span><span class="mr"><small>${mLast(c)}</small>${c.un?`<em class="num">${c.un}</em>`:''}</span></span></button>`).join('')
 :`<p class="mempty">${mFil==='un'?'No tenés mensajes sin leer.':mFil==='star'?'Todavía no destacaste ninguna conversación.':'No hay conversaciones con ese nombre.'}</p>`;}
function mChatH(c){return `<header class="mh">${mAv(c.a,c.c,36)}<span class="mt"><b>${c.n}</b><small>${c.on==='En línea'?'<i class="mlive"></i>':''}${c.on}</small></span><span class="sp"></span>
  <button type="button" class="sbtn" data-m="star">${c.star?'Destacada':'Destacar'}</button><button type="button" class="sbtn" data-m="arch">Archivar</button><button type="button" class="sbtn k" data-go="ficha">Ver ficha</button></header>
 <div class="chat" id="mchat">${c.m.map(mBub).join('')}</div>
 <div class="msug" id="msug"><span><b>Respuesta sugerida</b> «${c.sug[c.si||0]}»</span><button type="button" class="sbtn" data-m="other">Otra</button><button type="button" class="sbtn k" data-m="use">Usar</button></div>
 <div class="mquick" id="mquick" hidden>${MR.map((r,i)=>`<button type="button" data-mr="${i}">${r[0]}</button>`).join('')}</div>
 <div class="mcomp"><button type="button" class="ibtn" data-m="clip" aria-label="Adjuntar archivo">${svg('pclip',15)}</button>
  <span class="mbox"><textarea id="mtxt" rows="1" placeholder="Escribile a ${mFirst(c.n)}…" aria-label="Mensaje para ${c.n}"></textarea><span class="mrec" hidden>Grabando <b class="num">0:00</b></span></span>
  <button type="button" class="chip" data-m="quick" aria-expanded="false">Respuestas</button><button type="button" class="ibtn" data-m="mic" aria-label="Grabar audio">${svg('mic',15)}</button><button type="button" class="ibtn go" data-m="send" aria-label="Enviar" disabled>${svg('send',15)}</button></div>
 <p class="mnote">Le llega a su app. Si no la abre en 2 h, le avisa por mail.</p>`;}
function mCtxH(c){return `<section class="fxp mctx"><div class="mwho">${mAv(c.a,c.c,48)}<b>${c.n}</b><small>${c.s}</small></div>
  <div class="mnum">${c.num.map(([l,v,d,bad])=>`<div><small>${l}</small><b class="num">${v}</b><em class="${bad?'bad':''}">${d}</em></div>`).join('')}</div>
  ${fxKv(c.kv.map(([a,b])=>[a,a==='Cuota'&&b.startsWith('Vencida')?`<span style="color:var(--rojo-ink)">${b}</span>`:b]))}
  <div class="macts"><button type="button" class="sbtn" data-m="turno">Nuevo turno</button><button type="button" class="sbtn" data-m="plan">Ver plan</button></div></section>
 ${fxP('Respuestas guardadas','',`<button type="button" class="lnk" data-m="adm">Administrar</button>`,`<div class="fxs mrs">${MR.slice(0,5).map((r,i)=>`<button type="button" data-mr="${i}"><b>${r[0]}</b><small>${r[2].replace('{nombre}',mFirst(c.n)).replace('{próxima consulta}',c.kv[2][1])}</small></button>`).join('')}</div>`,'g')}`;}
function mBandeja(){const c=mGet(mCur)||MC[0];mCur=c.k;return `<section class="fxp mlist"><div class="msearch">${svg('search',14)}<input id="mq" type="search" placeholder="Buscar conversación" value="${mQ}" aria-label="Buscar conversación"></div>
  <div class="tabs" id="mfil"><button type="button" data-f="all" class="${mFil==='all'?'on':''}">Todas</button><button type="button" data-f="un" class="${mFil==='un'?'on':''}">Sin leer <span class="num">${mUnread()}</span></button><button type="button" data-f="star" class="${mFil==='star'?'on':''}">Destacadas</button><button type="button" data-f="arch" class="${mFil==='arch'?'on':''}">Archivadas</button></div>
  <div class="fxs mcvs" id="mlist">${mListH()}</div></section>
 <section class="fxp mchatp">${mChatH(c)}</section><div class="c mside">${mCtxH(c)}</div>`;}
function mResp(){const r=MR[mRs]||MR[0],ej=r[2].replace('{nombre}','Julia').replace('{próxima consulta}','Mar 28/10');
 return `<div class="c mspan">${fxP('Respuestas guardadas',MR.length+'',`<button type="button" class="sbtn k" data-m="newr">Nueva respuesta</button>`,`<div class="fxs fxtb tall"><table><thead><tr><th>Nombre</th><th>Texto</th><th>Tema</th><th style="text-align:right">Usada</th></tr></thead><tbody>${MR.map((x,i)=>`<tr class="${i===mRs?'on':''}" data-rs="${i}"><td><b style="font-weight:500">${x[0]}</b></td><td class="mtx">${x[2]}</td><td style="color:var(--ink2)">${x[1]}</td><td class="num" style="text-align:right">${x[3]} veces</td></tr>`).join('')}</tbody></table></div>`,'g')}</div>
 <div class="c mside">${fxP('Así le llega','ejemplo con Julia','',`<div class="mprev"><div class="bub out">${ej}<small>ahora</small></div></div>${fxKv([['Tema',r[1]],['La usaste',r[3]+' veces'],['Se completa solo','nombre y próxima consulta']])}<p class="mhelp">En cualquier chat tocá «Respuestas» y elegí una: se pega en el cuadro para que la ajustes. Nunca se envía sola.</p><div class="macts"><button type="button" class="sbtn" data-m="editr">Editar</button><button type="button" class="sbtn" data-m="delr">Borrar</button><button type="button" class="sbtn k" data-m="user">Usar en un chat</button></div>`,'g')}
 ${fxP('Las más usadas','este mes','',`<div class="fxs mtop">${[...MR].sort((x,y)=>y[3]-x[3]).slice(0,6).map(x=>`<div><span>${x[0]}</span><b class="num">${x[3]}</b>${fxBar(x[3]/41*100)}</div>`).join('')}</div>`,'g')}</div>`;}
const MAL=[['JS','azul','Julia Sosa','Recordatorio de turno','hoy 9:30','Confirmó','p-conf'],['FR','azul','Florencia Romero','Recordatorio de cuota','hoy 9:00','Leído','p-conf'],['CM','azaf','Camila Méndez','Cuota vencida','ayer 10:00','Sin abrir','p-wait'],['PA','azaf','Paula Acosta','Registrar comidas','ayer 20:00','Respondió','p-conf'],['LR','rojo','Laura Ruiz','Recordatorio de turno','ayer 16:00','Pidió cambio','p-wait'],['AD','azul','Agustina Díaz','Bienvenida','lun 11:20','Completó el cuestionario','p-conf'],['NR','lima','Natalia Ríos','Felicitación por objetivo','lun 8:10','Leído','p-conf'],['BA','rojo','Brenda Acosta','Cuota vencida','dom 10:00','Por mail · sin abrir','p-bad']];
function mAvisos(){const a=MA[mAs]||MA[0],on=MA.filter(x=>x[3]).length,tot=MA.reduce((s,x)=>s+x[4],0);
 return `<div class="c mspan">${fxP('Avisos automáticos',`${on} de ${MA.length} prendidos`,'',`<div class="mav">${MA.map((x,i)=>`<div class="tog${i===mAs?' on':''}" data-as="${i}"><span class="tx"><b>${x[0]}</b><small>${x[1]}${x[3]?` · ${x[4]} enviados este mes`:''}</small></span><button type="button" class="sbtn" data-m="edita">Editar</button><button type="button" class="sw" role="switch" aria-checked="${!!x[3]}" aria-label="${x[0]}"></button></div>`).join('')}</div>`)}
 ${fxP('Últimos enviados','qué hizo cada paciente','',`<div class="fxs fxtb"><table><thead><tr><th>Paciente</th><th>Aviso</th><th>Cuándo</th><th>Qué pasó</th></tr></thead><tbody>${MAL.map(([av,c,n,t,w,e,ec])=>`<tr><td><div class="who">${cAv(av,c)}<b>${n}</b></div></td><td style="color:var(--ink2)">${t}</td><td class="num" style="color:var(--ink2)">${w}</td><td>${pill(e,ec)}</td></tr>`).join('')}</tbody></table></div>`,'g')}</div>
 <div class="c mside">${fxP('Así le llega','notificación en su celular','',`<div class="mnot"><i class="mnl">V</i><span><b>Verónica · Plan V</b><small>${a[2].replace('{nombre}','Julia').replace('{hora}','9:30').replace('{fecha}','10/11')}</small></span><time>ahora</time></div>${fxKv([['Aviso',a[0]],['Cuándo',a[1]],['Estado',a[3]?'Prendido':'Apagado'],['Si no lo abre','le llega por mail a las 2 h']])}<button type="button" class="sbtn" data-m="edita" data-ai="${mAs}" style="align-self:flex-start">Editar este aviso</button>`)}
 ${fxP('Este mes','octubre','',`<div class="mnum"><div><small>Avisos enviados</small><b class="num">${tot}</b></div><div><small>Los leyeron</small><b class="num">91%</b></div></div>${fxKv([['Confirmaron su turno','34 de 38'],['Pagaron después del aviso','17 de 21'],['Volvieron a registrar comidas','9 de 12'],['Llegaron por mail','7']])}`,'g')}</div>`;}
function mDraw(anim){const w=document.getElementById('mwrap');w.className='mv'+mV;w.innerHTML=`<div class="fx mfx">${[mBandeja,mResp,mAvisos][mV]()}</div>`;
 document.querySelectorAll('#mview button').forEach((b,i)=>b.classList.toggle('on',i===mV));
 const t=document.getElementById('mtitle');if(t)t.textContent=mUnread()?`· ${mUnread()} sin leer`:'· todo leído';
 document.querySelectorAll('.nv[data-go="mensajes"] .ct').forEach(x=>{x.textContent=mUnread();x.hidden=!mUnread();});
 const sb=document.querySelector('.nv[data-go="mensajes"]+.subw .si b');if(sb){sb.textContent=mUnread();sb.hidden=!mUnread();}
 const ch=document.getElementById('mchat');if(ch)ch.scrollTop=ch.scrollHeight;if(anim)fxAnim(w);}
function mList(){const l=document.getElementById('mlist');if(l)l.innerHTML=mListH();}
function mPush(x){const c=mGet(mCur);c.m.push(x);c.t='ahora';const ch=document.getElementById('mchat');if(ch){ch.insertAdjacentHTML('beforeend',mBub(x));ch.lastElementChild.classList.add('anew');ch.scrollTop=ch.scrollHeight;
  if(x[0]==='out'&&c.on==='En línea')setTimeout(()=>{const s=ch.lastElementChild&&ch.lastElementChild.querySelector('small');if(s)s.textContent=s.textContent.replace('enviado','leído');},1600);}
 mList();}
function mSel(k){const c=mGet(k);if(!c)return;mCur=k;c.un=0;mDraw();}
function mView(i){mV=i;mDraw(1);const subs=document.querySelectorAll('.nv[data-go="mensajes"]+.subw .si');subs.forEach((s,j)=>s.classList.toggle('on',j===i));}
function mPaste(t){const a=document.getElementById('mtxt');if(!a)return;const c=mGet(mCur);a.value=t.replace(/\{nombre\}/g,mFirst(c.n)).replace('{próxima consulta}',c.kv[2][1]);a.dispatchEvent(new Event('input'));a.focus();a.setSelectionRange(a.value.length,a.value.length);}
function mSend(){const a=document.getElementById('mtxt');const t=a.value.trim();if(!t)return;mPush(['out',t,'ahora']);a.value='';a.dispatchEvent(new Event('input'));}
let mRecT=null,mRecS=0;
function mMic(b){const box=b.closest('.mcomp'),r=box.querySelector('.mrec'),a=box.querySelector('textarea');
 if(!mRecT){mRecS=0;r.hidden=false;a.hidden=true;b.classList.add('rec');b.setAttribute('aria-label','Terminar y enviar audio');mRecT=setInterval(()=>{mRecS++;r.querySelector('b').textContent='0:'+String(mRecS).padStart(2,'0');},1000);return;}
 clearInterval(mRecT);mRecT=null;r.hidden=true;a.hidden=false;b.classList.remove('rec');b.setAttribute('aria-label','Grabar audio');mPush(['out',{au:'0:'+String(Math.max(1,mRecS)).padStart(2,'0')},'ahora']);toast('Audio enviado.');}
function mFromDrawer(n,t){const c=MC.find(x=>x.n===n);if(!c||!t.trim())return;c.m.push(['out',t.trim(),'ahora']);c.t='ahora';c.un=0;MC.splice(MC.indexOf(c),1);MC.unshift(c);if(aScr()==='mensajes'){mCur=c.k;mV=0;mDraw();}}
const MACT={
 star:()=>{const c=mGet(mCur);c.star=!c.star;mDraw();toast(c.star?`Destacaste la conversación con ${mFirst(c.n)}.`:'Ya no está destacada.');},
 arch:()=>{const c=mGet(mCur),i=MC.indexOf(c);MC.splice(i,1);MX.unshift(c);mCur=(MC[i]||MC[i-1]||MC[0]).k;mDraw();toast(`Archivaste la conversación con ${mFirst(c.n)}. La encontrás en Archivadas.`);},
 use:()=>{const c=mGet(mCur);mPaste(c.sug[c.si||0]);},
 other:()=>{const c=mGet(mCur);c.si=((c.si||0)+1)%c.sug.length;document.querySelector('#msug span').innerHTML=`<b>Respuesta sugerida</b> «${c.sug[c.si]}»`;},
 quick:b=>{const q=document.getElementById('mquick');q.hidden=!q.hidden;b.setAttribute('aria-expanded',!q.hidden);b.classList.toggle('on',!q.hidden);},
 send:mSend,mic:mMic,
 clip:()=>{const c=mGet(mCur);aOpen({...DROP('Adjuntar archivo',`Plan de ${mFirst(c.n)} · semana 3.pdf`,'Enviar',`Archivo enviado a ${mFirst(c.n)}.`,`<p class="ahint">Le llega en el chat y queda guardado en su ficha, en Archivos.</p>`),after:()=>mPush(['out',{file:`Plan de ${mFirst(c.n)} · semana 3.pdf`,sz:'2 páginas'},'ahora'])});},
 turno:()=>aOpen(TURNO(mGet(mCur).n)),
 plan:()=>{go('ficha');ftab='plan';drawFicha();},
 adm:()=>mView(1),
 newr:()=>aOpen({t:'Nueva respuesta',s:'Queda a mano en todos los chats',ok:'Guardar respuesta',body:aF('Nombre',aI('','Por ejemplo: Viaje o vacaciones'))+aF('Tema',aS(['Comidas','Registro','Ánimo','Consultas','Turnos']))+aF('Texto',aT('','Escribí la respuesta…'),'Escribí {nombre} y se completa con el nombre de cada paciente.'),
  after:b=>{const n=aVal(b,0).trim()||'Respuesta nueva';MR.unshift([n,aVal(b,1),aVal(b,2).trim()||'…',0]);mRs=0;mDraw();},done:'Respuesta guardada.'}),
 editr:()=>{const r=MR[mRs];aOpen({t:'Editar respuesta',s:r[0],ok:'Guardar cambios',body:aF('Nombre',aI(r[0]))+aF('Tema',aS(['Comidas','Registro','Ánimo','Consultas','Turnos'],r[1]))+aF('Texto',aT(r[2]),'Escribí {nombre} y se completa con el nombre de cada paciente.'),
  after:b=>{r[0]=aVal(b,0)||r[0];r[1]=aVal(b,1);r[2]=aVal(b,2)||r[2];mDraw();},done:'Respuesta actualizada.'});},
 delr:()=>{const r=MR.splice(mRs,1)[0];mRs=0;mDraw();toast(`Borraste «${r[0]}».`);},
 user:()=>{const r=MR[mRs];r[3]++;mV=0;mDraw(1);mView(0);mPaste(r[2]);},
 edita:b=>{const i=b.dataset.ai!==undefined?+b.dataset.ai:+b.closest('[data-as]').dataset.as,a=MA[i];aOpen({t:a[0],s:'Aviso automático',ok:'Guardar',body:aF('Cuándo',aI(a[1]))+aF('Texto',aT(a[2]),'{nombre}, {hora} y {fecha} se completan solos.')+aCk([['Si no lo abre en 2 h, mandarlo por mail',1]]),
  after:p=>{a[1]=aVal(p,0)||a[1];a[2]=aVal(p,1)||a[2];mAs=i;mDraw();},done:'Aviso guardado.'});},
 varias:()=>({t:'Mensaje a varias',s:'Le llega a cada una por separado, como un chat',ok:'Enviar',
  body:aF('Para',aCh(['Todas las activas · 21','Cuota vencida · 3','Sin registrar hace 3 días · 5','Consulta esta semana · 9'],['Sin registrar hace 3 días · 5']))+aF('Mensaje',aT('¡Hola {nombre}! Hace unos días que no veo tus comidas. Cargá lo que puedas, así ajustamos juntas.'),'Escribí {nombre} y se completa con el nombre de cada paciente.')+aF('Cuándo',aSeg(['Ahora','Mañana a las 9'])),
  done:b=>{const n=[...b.querySelectorAll('.ach [aria-pressed=true]')].reduce((s,x)=>s+ +x.textContent.split('· ')[1],0);const w=b.querySelector('.aseg [aria-checked=true]').textContent;return n?`${w==='Ahora'?'Mensaje enviado':'Mensaje programado'} a ${n} pacientes.`:'No elegiste a quién mandarlo.';}}),
 nuevo:()=>MSG(PAC[0])
};
(function(){const S=document.getElementById('s-mensajes');
 S.addEventListener('click',e=>{const b=e.target.closest('button,tr[data-rs],.tog[data-as]');if(!b||b.disabled||b.hasAttribute('data-go'))return;
  if(b.dataset.mv!==undefined)return mView(+b.dataset.mv);
  if(b.dataset.mc)return mSel(b.dataset.mc);
  if(b.dataset.mx!==undefined){const c=MX.splice(+b.dataset.mx,1)[0];MC.unshift(c);mCur=c.k;mFil='all';mDraw();return toast(`Volvió a la bandeja la conversación con ${mFirst(c.n)}.`);}
  if(b.dataset.f){mFil=b.dataset.f;document.querySelectorAll('#mfil button').forEach(x=>x.classList.toggle('on',x===b));return mList();}
  if(b.dataset.mr!==undefined){if(mV!==0)return;mPaste(MR[+b.dataset.mr][2]);MR[+b.dataset.mr][3]++;const q=document.getElementById('mquick');if(q&&!q.hidden)MACT.quick(document.querySelector('[data-m=quick]'));return;}
  if(b.dataset.mph){const c=mGet(mCur);return aOpen({t:`Foto de ${mFirst(c.n)}`,s:b.querySelector('small').textContent,ok:false,body:`<div class="mbig"><img src="${MPH[b.dataset.mph]}" alt="Foto de comida que mandó la paciente"></div>${aF('Comentario para ella',aT('','Por ejemplo: ¡Muy buen plato!'))}<button type="button" class="cta" data-mcom style="align-self:flex-end">Enviar comentario</button>`,
   click:(x,p)=>{if(x.hasAttribute('data-mcom')){const t=p.querySelector('textarea').value.trim()||'¡Muy buen plato!';aClose();mPush(['out',t,'ahora']);toast('Comentario enviado.');}}});}
  if(b.classList.contains('mplay')){const on=b.classList.toggle('on');b.innerHTML=svg(on?'pause':'play',12);b.setAttribute('aria-label',on?'Pausar audio':'Escuchar audio');b.closest('.mau').classList.toggle('on',on);return;}
  if(b.classList.contains('sw')){const i=+b.closest('[data-as]').dataset.as,a=MA[i];a[3]=a[3]?0:1;mAs=i;mDraw();return toast(`${a[0]}: ${a[3]?'prendido':'apagado'}.`);}
  if(b.dataset.rs!==undefined){mRs=+b.dataset.rs;return mDraw();}
  if(b.dataset.as!==undefined&&!e.target.closest('button')){mAs=+b.dataset.as;return mDraw();}
  const k=b.dataset.m||(b.id==='mvarias'?'varias':b.id==='mnew'?'nuevo':'');const f=MACT[k];if(!f)return;const r=f(b);if(r&&r.t)aOpen(r);});
 S.addEventListener('input',e=>{if(e.target.id==='mq'){mQ=e.target.value;return mList();}
  if(e.target.id==='mtxt'){const a=e.target;a.style.height='auto';a.style.height=Math.min(a.scrollHeight,96)+'px';const s=document.querySelector('[data-m=send]');if(s)s.disabled=!a.value.trim();}});
 S.addEventListener('keydown',e=>{if(e.target.id==='mtxt'&&e.key==='Enter'&&!e.shiftKey){e.preventDefault();mSend();}});
 document.querySelectorAll('.nv[data-go="mensajes"]+.subw .si').forEach((s,i)=>s.addEventListener('click',()=>{go('mensajes');mView(i);}));
 mDraw();})();
Object.assign(ACT,{'Abrir mensajes':()=>{go('mensajes');mView(0);},'Responder a Julia':()=>{go('mensajes');mV=0;mSel('julia');setTimeout(()=>document.getElementById('mtxt')?.focus(),50);}});
const _gm=go;go=function(id){_gm(id);if(id==='mensajes'){fxAnim(document.getElementById('mwrap'));const ch=document.getElementById('mchat');if(ch)ch.scrollTop=ch.scrollHeight;}};
if(location.hash==='#mensajes')go('mensajes');
