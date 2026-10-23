
/* Ficha con el estilo del detalle de Pacientes: paneles claros, curvas suaves, medio círculo, columnas redondeadas y filas con borde de color. */
let fxId=0;
const fxP=(t,m,r,b,c='')=>`<section class="fxp ${c}"><header><h3>${t}</h3>${m?`<span class="m">${m}</span>`:''}<span class="sp"></span>${r||''}</header>${b}</section>`;
function fxCurve(v,lab,o={}){const W=o.w||300,H=o.h||110,pl=6,pr=o.mini?4:(o.pr??30),pt=o.mini?4:18,pb=lab?20:(o.mini?3:8),id='fxg'+(++fxId);
 const g=o.goal,lo=Math.min(...v,g??Infinity),hi=Math.max(...v,g??-Infinity),pad=(hi-lo)*.15||1,mn=o.min??lo-pad,mx=o.max??hi+pad;
 const X=k=>pl+k*(W-pl-pr)/(v.length-1),Y=x=>pt+(mx-x)/(mx-mn)*(H-pt-pb);
 const P=v.map((x,k)=>[X(k),Y(x)]);let d=`M${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
 for(let k=1;k<P.length;k++){const [x0,y0]=P[k-1],[x1,y1]=P[k],m=(x1-x0)/2;d+=` C${(x0+m).toFixed(1)} ${y0.toFixed(1)} ${(x1-m).toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`}
 const L=P[P.length-1],fmt=x=>String(x).replace('.',',');
 return `<svg class="pw-g fxc${o.warn?' wa':''}${o.mini?' mini':''}" viewBox="0 0 ${W} ${H}"${o.mini?' preserveAspectRatio="none"':''} aria-hidden="true"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="s1"/><stop offset="1" class="s2"/></linearGradient></defs>
 ${g!=null?`<line class="goal" x1="${pl}" x2="${W-pr+4}" y1="${Y(g).toFixed(1)}" y2="${Y(g).toFixed(1)}"/>${o.mini?'':`<text class="gt" x="${W-pr+7}" y="${(Y(g)+3).toFixed(1)}">${o.gl||fmt(g)}</text>`}`:''}
 <path class="ar" d="${d} L${L[0].toFixed(1)} ${H-pb} L${pl} ${H-pb}Z" style="fill:url(#${id})"/><path class="ln" pathLength="1" d="${d}"/>
 ${o.mini?'':P.slice(0,-1).map(([x,y])=>`<circle class="dt" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2"/>`).join('')+`<circle class="now" cx="${L[0].toFixed(1)}" cy="${L[1].toFixed(1)}" r="4"/><text class="nt" x="${L[0].toFixed(1)}" y="${(L[1]-9).toFixed(1)}" text-anchor="middle">${o.last||fmt(v[v.length-1])}</text>`}
 ${lab?lab.map((t,k)=>`<text class="xl" x="${X(k).toFixed(1)}" y="${H-5}" text-anchor="middle">${t}</text>`).join(''):''}</svg>`;}
function fxGauge(p,big,sub,o={}){const R=62,cx=80,cy=78,arc=`M${cx-R} ${cy}A${R} ${R} 0 0 1 ${cx+R} ${cy}`,a=Math.PI*(1-p/100);
 return `<div class="pg fxg${o.warn?' wa':''}${o.sm?' sm':''}" style="width:${o.w||170}px"><svg class="pg-g" viewBox="0 0 160 88" aria-hidden="true"><path class="tr" pathLength="100" d="${arc}"/>
 ${o.sm?'':[0,25,50,75,100].map(t=>{const b=Math.PI*(1-t/100);return `<line class="tk" x1="${(cx+(R+8)*Math.cos(b)).toFixed(1)}" y1="${(cy-(R+8)*Math.sin(b)).toFixed(1)}" x2="${(cx+(R+12)*Math.cos(b)).toFixed(1)}" y2="${(cy-(R+12)*Math.sin(b)).toFixed(1)}"/>`}).join('')}
 <path class="pv" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100-p}" data-o="${100-p}" d="${arc}"/>${p?`<circle class="end" cx="${(cx+R*Math.cos(a)).toFixed(1)}" cy="${(cy-R*Math.sin(a)).toFixed(1)}" r="5"/>`:''}</svg>
 <div class="pg-v"><b class="num">${big}</b>${sub?`<span>${sub}</span>`:''}</div></div>`;}
function fxCols(v,lab,o={}){const mx=o.max||Math.max(...v),avg=o.avg?v.reduce((a,b)=>a+b,0)/v.length:null;
 return `<div class="pa7 fxcols" style="height:${o.h||110}px">${avg!=null?`<span class="avg" style="bottom:calc(${(avg/mx*100).toFixed(1)}% * .78 + 18px)"></span>`:''}${v.map((x,k)=>{const last=k===v.length-1&&o.hl!==false;return `<div class="${last?'td':''}">${last&&o.top?`<u class="num">${o.top}</u>`:''}<i style="height:${(x/mx*78).toFixed(1)}%" class="${o.lo!=null&&x<o.lo?'lo':o.md!=null&&x<o.md?'md':''}"></i><small>${lab[k]}</small></div>`}).join('')}</div>`;}
const fxRing=(p,t,s=44)=>`<span class="fxring" style="--s:${s}px"><svg viewBox="0 0 40 40" aria-hidden="true"><circle class="bg" cx="20" cy="20" r="16"/><circle class="fg" cx="20" cy="20" r="16" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${100-p}" data-o="${100-p}"/></svg><b class="num">${t??p+'%'}</b></span>`;
const fxBar=(p,c='')=>`<span class="fxb ${c}"><i style="width:${Math.min(100,p)}%"></i></span>`;
const fxRows=l=>`<div class="fxr">${l.map(([c,t,s,r,g])=>{const tag=g?'button':'div';return `<${tag}${g?` type="button" data-ft="${g}"`:''} class="${c}"><span class="t"><b>${t}</b>${s?`<small>${s}</small>`:''}</span>${r||''}${g?svg('chev',12):''}</${tag}>`}).join('')}</div>`;
const fxTl=l=>`<ol class="fxtl">${l.map(([t,d,dt,c])=>`<li class="${c||''}"><i></i><span><b>${t}</b>${d?`<small>${d}</small>`:''}</span><time>${dt}</time></li>`).join('')}</ol>`;
const fxKv=l=>`<div class="fxkv">${l.map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('')}</div>`;
const fxCk=l=>`<div class="fxck">${l.map(([t,o])=>`<div><i class="${o?'on':''}"></i><span>${t}</span></div>`).join('')}</div>`;
const fxDk=(k,t,s,acts='')=>`<div class="fxdk"><small>${k}</small><b class="num">${t}</b><span>${s}</span>${acts}</div>`;
const fxAi=(t,b,r='')=>`<div class="fxai">${svg('spark',14)}<span><b>${t}</b> ${b}</span>${r}</div>`;
const fxStk=l=>`<div class="fxstk">${l.map(([t,p,c])=>`<i class="${c}" style="width:${p}%" title="${t}"></i>`).join('')}</div><div class="fxleg">${l.map(([t,p,c])=>`<span class="${c}"><i></i>${t}</span>`).join('')}</div>`;
const fxTile=(lab,val,unit,dl,good,v,ft)=>`<button type="button" class="fxp fxtile" data-ft="${ft}"><small>${lab}</small><div class="fxv"><b class="num">${val}</b><span>${unit}</span><em class="${good?'':'bad'}">${dl}</em></div>${fxCurve(v,null,{w:120,h:30,mini:1})}</button>`;

Object.assign(FT,{
resumen:()=>`<div class="fx" style="grid-template-columns:1.3fr 1fr .95fr">
 <div class="c">
  <div class="fxtiles">${fxTile('Peso','68,4','kg','−1,2',1,[71.2,70.6,70.1,69.8,69.6,68.9,68.4],'mediciones')}${fxTile('Grasa','29,1','%','−0,8',1,[31.4,31,30.6,30.2,29.9,29.5,29.1],'mediciones')}${fxTile('Cintura','80','cm','−2',1,[85,84,84,83,82,82,80],'mediciones')}</div>
  ${fxP('Evolución del peso','desde marzo',go2('mediciones','Mediciones'),fxCurve([74,72.2,70.9,70.1,69.6,68.4],['12/3','7/5','2/7','6/8','3/9','14/10'],{w:460,h:150,goal:66.5,gl:'66,5'}))}
  ${fxP('Qué cambió desde la última consulta','14/10 · hace 7 días','',`<div class="fxs">${fxRows([['l','Objetivo al 74%','faltan 1,9 kg · adherencia 86% (+6 puntos)','','objetivos'],['l','Registró 19 de 21 comidas','la merienda le falta 3 veces','','alimentario'],['a','Ánimo bien 5 de 7 días','hinchazón después del almuerzo 3 días','','objetivos'],['l','Agua 1,9 L por día','meta 2 L · sueño 6,2 h','','objetivos'],['b','Laboratorio nuevo del 12/10','2 valores alterados: ferritina y vitamina D','','laboratorio'],['b','2 mensajes y un pedido de cambio','cena del jueves','','plan']])}</div>`,'g')}
 </div>
 <div class="c">
  ${fxP('Avance al objetivo','bajar a 66,5 kg','',`<div class="fxsplit">${fxGauge(74,'74','%',{w:150})}${fxKv([['Inicio','74,0 kg'],['Hoy','68,4 kg'],['Faltan','1,9 kg'],['Adherencia','86%']])}</div>`)}
  ${fxP('Alertas','3','',fxRows([['r','Ferritina baja','14 ng/ml, mínimo 30','','laboratorio'],['a','El plan vence el 4/11','renovar en esta consulta','','plan'],['a','Pedido de cambio sin responder','desde ayer','','plan']]))}
  ${fxP('Para hacer hoy','4','',`<div class="fxs">${fxRows([['n','Aprobar la nota del 14/10','',`<button type="button" class="sbtn" data-ft="consultas">Revisar</button>`],['n','Responder el pedido de cambio','',`<button type="button" class="sbtn" data-ft="plan">Responder</button>`],['n','Pedir análisis de hierro','',`<button type="button" class="sbtn" data-ft="laboratorio">Pedir</button>`],['n','Renovar el plan','',`<button type="button" class="sbtn" data-ft="plan">Renovar</button>`]])}</div>`,'g')}
 </div>
 <div class="c">
  ${fxDk('Próximo turno','Hoy 10:30','Seguimiento n.º 7 · consultorio',`<div class="fxdk2"><span>Después</span><b>Mar 18/11 · videollamada</b></div>`)}
  ${fxP('Plan vigente','4/10 al 4/11',go2('plan','Abrir'),`<div class="fxbig"><b class="num">1.650</b><span>kcal · sin gluten ni lactosa</span></div>${fxStk([['Proteínas 25%',25,'k'],['Carbohidratos 45%',45,''],['Grasas 30%',30,'o']])}`)}
  ${fxP('Anamnesis','12 de 14',go2('historia','Abrir'),`${fxBar(86)}${fxKv([['Medicación','Levotiroxina 50 µg · hierro'],['Falta','Preferencias y rechazos']])}`)}
  ${fxP('Acuerdos de la última consulta','2 de 3','',fxCk([['Yogur sin lactosa o huevo en la merienda',0],['Caminar 4 veces por semana',1],['Cenar antes de las 21',1]]),'g')}
 </div></div>`,

historia:()=>`<div class="fx" style="grid-template-columns:1.6fr 1fr">
 <div class="c">${fxP('Anamnesis',pill('12 de 14 secciones','p-conf'),`${sb('Enviar cuestionario','','send')}${sb('Editar','k','pen')}`,`
  <div class="fxcases">${['General','Celiaquía','Embarazo','Niños','Deportista','Bariátrico','Diabetes','Renal'].map((t,i)=>`<button type="button" class="${i<2?'on':''}">${t}</button>`).join('')}</div>
  <div class="fxs"><div class="fxanam">${[
   ['Motivo y objetivo','Bajar grasa y tener más energía. Probó dietas estrictas y las dejó al mes.','ok'],
   ['Diagnósticos','Celiaquía (2019, biopsia). Hipotiroidismo compensado. Anemia leve (2024).','ok'],
   ['Medicación y suplementos','Levotiroxina 50 µg en ayunas. Hierro 1 por día desde agosto.','ok'],
   ['Alergias e intolerancias','Gluten (celiaquía). Lactosa.','ok'],
   ['Antecedentes familiares','Madre con diabetes tipo 2. Padre hipertenso.','ok'],
   ['Historia alimentaria','Dietas de 1.200 kcal en 2023 y 2025, abandonadas al mes. Come rápido y saltea comidas con estrés.','ok'],
   ['Recordatorio de 24 h','Mate solo · tostadas sin TACC con queso · ensalada con pollo · galletitas · fideos de arroz con salsa.','ok'],
   ['Hábitos','Almuerza en la oficina, cena tarde. Pica a la tarde. No fuma. Alcohol: 1 copa los sábados.','ok'],
   ['Actividad física','Camina 3 veces por semana, 40 min. Quiere sumar fuerza.','ok'],
   ['Sueño y estrés','Duerme 6 h. Estrés laboral alto.','ok'],
   ['Digestión','Hinchazón después de legumbres. Tránsito normal.','ok'],
   ['Ciclo menstrual','Regular. Sin anticonceptivos.','ok'],
   ['Embarazo y lactancia','No aplica por ahora · se pregunta en cada consulta.','na'],
   ['Preferencias y rechazos','Falta completar.','miss']].map(([t,d,e])=>`<div class="${e}"><b>${t}${e==='miss'?'<button class="lnk" type="button">Completar</button>':''}</b><span>${d}</span></div>`).join('')}</div></div>`,'g')}</div>
 <div class="c">
  ${fxP('Estado de la historia','','',`<div class="fxsplit">${fxGauge(86,'86','%',{w:140})}<div class="fxmini">${[['Anamnesis','12 de 14',86],['Consentimiento','10 de 11',91],['Cuestionario','respondido',100]].map(([a,b,p])=>`<div><span>${a}</span><b>${b}</b>${fxBar(p)}</div>`).join('')}</div></div>`)}
  ${fxP('Datos que cambian el plan','6','',`<div class="fxchips">${['Sin gluten','Sin lactosa','Hierro con vitamina C','Levotiroxina lejos del desayuno','Legumbres solo a la noche','Cena antes de las 21'].map(t=>`<span>${t}</span>`).join('')}</div>`)}
  ${fxP('Cuestionario y consentimiento','',pill('Firmado 12/03','p-conf'),fxKv([['Primera vez','Peso 74,0 · altura 1,68 · cintura 84'],['Uso de IA','Resumir consultas y leer estudios: sí'],['Falta','Compartir con su médica']]))}
  ${fxP('Historial de versiones','','',`<div class="fxs">${fxTl([['Vos','Medicación: hierro desde agosto','14/10'],['Sofía','Recordatorio de 24 h desde la app','12/10'],['Vos','Primera anamnesis','12/03'],['Importado','Otro consultorio · plan de 1.500 kcal','2025','n']])}</div>`,'g')}
 </div></div>`,

mediciones:()=>`<div class="fx" style="grid-template-columns:1.55fr 1fr">
 <div class="c">
  ${fxP('Mediciones','última 14/10 · consultorio',`${sb('Importar balanza','','up')}${sb('Nueva medición','k','plus')}`,`<div class="fxgauges">${[['IMC','24,1','Normal',48],['Grasa','27,8%','−3,1 desde marzo',56],['Músculo','26,4 kg','+0,8',62],['Cintura','78 cm','riesgo bajo',40],['Cintura/cadera','0,80','riesgo bajo',38]].map(([a,b,c,p])=>`<div>${fxGauge(p,b,'',{w:108,sm:1})}<small>${a}</small><em>${c}</em></div>`).join('')}</div>`)}
  ${fxP('<div class="tabs"><button class="on" type="button">Pliegues</button><button type="button">Perímetros</button><button type="button">Composición</button><button type="button">Segmental</button></div>','mm',`<span class="m">Fórmula</span><button class="chip" type="button" style="padding:5px 10px">Durnin-Womersley + Siri</button>`,`<div class="fxs fxtb"><table><thead><tr><th>Sitio</th><th>Derecho</th><th>Izquierdo</th><th>3/9</th><th>Cambio</th><th></th></tr></thead><tbody>${[['Tríceps','18,0','18,4','19,5','−1,5',8],['Bíceps','8,5','8,2','9,0','−0,5',3],['Subescapular','14,0','14,5','15,0','−1,0',5],['Cresta ilíaca','19,0','19,0','21,0','−2,0',10],['Supraespinal','12,5','12,0','13,5','−1,0',5],['Abdominal','22,0','—','24,0','−2,0',10],['Muslo','26,0','25,5','27,0','−1,0',5],['Pantorrilla','14,0','14,0','14,5','−0,5',3]].map(r=>`<tr><td>${r[0]}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num" style="color:var(--ink3)">${r[3]}</td><td class="num ok">${r[4]}</td><td style="width:90px">${fxBar(r[5]*10)}</td></tr>`).join('')}<tr class="sum"><td>Suma de 4 pliegues</td><td class="num" colspan="2">59,5 mm → <b>27,8% de grasa</b></td><td class="num" style="color:var(--ink3)">65,5</td><td class="num ok">−6,0</td><td></td></tr></tbody></table></div>`,'g')}
 </div>
 <div class="c">
  ${fxP('Evolución','',`<div class="tabs"><button class="on" type="button">Peso</button><button type="button">Grasa</button><button type="button">Pliegues</button></div>`,fxCurve([74,72.2,70.9,70.1,69.6,68.4],['12/3','7/5','2/7','6/8','3/9','14/10'],{w:360,h:118,goal:66.5,gl:'66,5'}))}
  ${fxP('Kerr · 5 componentes','suma 68,4 kg',pill('Fórmula validada','p-conf'),`${fxStk([['Adiposa',32,'o'],['Muscular',44,''],['Ósea',11,'k'],['Residual',8,'n'],['Piel',5,'p']]).replace('<div class="fxleg">','<div class="fxleg" hidden>')}${fxKv([['Adiposa','22,1 kg · 32%'],['Muscular','29,8 kg · 44%'],['Ósea','7,6 kg · 11%'],['Residual','5,4 kg · 8%'],['Piel','3,5 kg · 5%']]).replace(/<div><span>([^<]+)/g,(m,t)=>`<div><span class="dot ${({Adiposa:'o',Muscular:'',Ósea:'k',Residual:'n',Piel:'p'})[t]}">${t}`)}`)}
  ${fxP('Para Sofía','','',fxRows([['l','Informe de mediciones','PDF con tu logo, gráficos y lo que cambió',sb('Generar','k')],['b','Fotos de progreso','4 fotos privadas · frente y perfil',sb('Comparar')]]),'g')}
 </div></div>`,

objetivos:()=>`<div class="fx" style="grid-template-columns:1fr 1fr">
 <div class="c">
  ${fxP('Objetivos','se actualizan solos',sb('Agregar','','plus'),`<div class="fxgoals">${[['Llegar a 66,5 kg',74,'68,4 kg · con cada medición',''],['Grasa por debajo de 26%',58,'27,8% · con los pliegues',''],['Merienda con proteína 5 días',60,'3 de 5 · con el registro',''],['Caminar 4 veces por semana',75,'3 de 4 · con la actividad',''],['Dormir 7 horas',40,'6,2 h · con el sueño','wa']].map(([t,p,d,c])=>`<div class="${c}">${fxRing(p,null,46)}<span><b>${t}</b><small>${d}</small></span></div>`).join('')}</div>`)}
  ${fxP('Hábitos de la semana','cargados por Sofía','',`<div class="fxhab">${[['Agua','1,9','L','meta 2 L',95,[1.6,2,1.8,2.1,1.9,1.7,2.2]],['Sueño','6,2','h','meta 7 h',89,[6,5.5,6.5,7,6,6.2,6.4]],['Actividad','3','días','8.400 pasos',75,[1,0,1,0,0,1,0]],['Energía','4','de 5','buena',80,[3,4,4,5,3,4,4]]].map(([a,b,u,m,p,w])=>`<div><small>${a}</small><div class="fxv"><b class="num">${b}</b><span>${u}</span></div><div class="fxwk">${w.map(x=>`<i style="height:${Math.max(12,x/Math.max(...w)*100).toFixed(0)}%"></i>`).join('')}</div>${fxBar(p,p<80?'a':'')}<em>${m}</em></div>`).join('')}</div>`,'g')}
 </div>
 <div class="c">
  ${fxP('Ánimo','últimos 14 días · promedio 3,9 de 5','',fxCols([4,4,3,5,4,2,4,4,5,4,3,4,5,4],'LMMJVSDLMMJVSD'.split(''),{h:150,max:5,avg:1,lo:3,top:'4'}),'g')}
  ${fxP('Síntomas','últimos 14 días','',`<div class="fxsym">${[['Hinchazón','después del almuerzo',[0,0,1,0,0,1,0,0,0,1,0,0,0,0]],['Cansancio','a la tarde',[0,0,0,1,0,0,0,0,1,0,0,0,0,0]],['Dolor de cabeza','sábado',[0,0,0,0,0,1,0,0,0,0,0,0,0,0]]].map(([t,d,v])=>`<div><span><b>${t}</b><small>${d}</small></span><div class="fxdots">${v.map(x=>`<i class="${x?'on':''}"></i>`).join('')}</div><em class="num">${v.filter(Boolean).length} ${v.filter(Boolean).length===1?'día':'días'}</em></div>`).join('')}</div>`)}
  ${fxAi('Relación que ve la IA:','la hinchazón aparece los días que almuerza legumbres. Ya está en los cuidados para el plan.')}
 </div></div>`,

consultas:()=>`<div class="fx" style="grid-template-columns:330px 1fr">
 <div class="c">
  ${fxDk('Consulta de hoy · 10:30 · consultorio','Seguimiento n.º 7','Plantilla: Seguimiento SOAP',`<div class="fxdkb"><button type="button">Grabar</button><button type="button" class="go">Iniciar consulta</button></div>`)}
  ${fxP('Asistencia','desde marzo','',`<div class="fxsplit">${fxGauge(86,'86','%',{w:120,sm:1})}${fxKv([['Realizadas','6'],['Faltas','1'],['Próxima','18/11']])}</div>`)}
  ${fxP('Consultas','7','',`<div class="fxs">${fxTl([['14/10','Seguimiento · videollamada',pill('Nota por aprobar','p-wait'),'a'],['16/09','Seguimiento · consultorio',pill('Publicada','p-conf')],['19/08','Seguimiento · consultorio',pill('Faltó','p-bad'),'r'],['18/08','Seguimiento · videollamada',pill('Publicada','p-conf')],['15/04','Seguimiento · consultorio',pill('Publicada','p-conf')],['12/03','Primera consulta',pill('Publicada','p-conf')]])}</div>`,'g')}
 </div>
 <div class="c">${fxP('Nota del 14/10',pill('Borrador de la IA','p-wait'),`<div class="tabs"><button class="on" type="button">Nota</button><button type="button">Transcripción</button><button type="button">Para Sofía</button></div><button class="chip" type="button" style="padding:5px 10px">Plantilla: Seguimiento SOAP</button>`,`<div class="fxs"><div class="fxsoap">${[['S','Subjetivo','Le cuesta sostener la merienda los días de oficina. Duerme mejor desde que cena más temprano. Hinchazón leve después del almuerzo.'],['O','Objetivo','Peso 68,4 kg (−1,2). Grasa 27,8%. Cintura 78 cm. Registró 19 de 21 comidas. Ferritina 14 ng/ml.'],['A','Análisis','Buena evolución. Proteína baja en la merienda. Ferritina sin mejora suficiente con el suplemento.'],['P','Plan','Sumar yogur sin lactosa o huevo en la merienda. Repetir hierro en 60 días. Legumbres solo a la noche. Próxima consulta en 4 semanas.']].map(([l,t,d])=>`<div><span class="sl">${l}</span><div><b>${t}</b><p>${d}</p></div></div>`).join('')}</div>
  <div class="fxclose"><small>Cerrar la consulta de hoy</small>${fxCk([['Marcar como realizada',1],['Enviar el resumen a Sofía',1],['Actualizar el plan',0],['Pedir análisis de hierro',0]])}</div></div>
  <div class="fxfoot">${sb('Editar','','pen')}${sb('Copiar versión para Sofía','','copy')}<span style="flex:1"></span>${sb('Aprobar y publicar','k','send')}</div>`,'g')}</div>
 </div>`,

plan:()=>`<div class="fx" style="grid-template-columns:1.55fr 1fr">
 <div class="c">${fxP('Plan vigente','Sin gluten 1.800 kcal · semana 3 de 4 · vence 4/11',`<div class="tabs"><button class="on" type="button">Hoy</button><button type="button">Semana</button><button type="button">Vista de Sofía</button></div>${sb('Abrir en el editor','k','pen')}`,`<div class="fxask">${svg('swap',14)}<span><b>Pedido de cambio:</b> cena del jueves, «tengo poco tiempo esa noche».</span><span class="sp"></span>${sb('Aprobar','k')}${sb('Proponer otra')}</div>
  <div class="fxs"><ol class="fxmeals">${[['a','Desayuno','8:00','Tostadas sin TACC con huevo y tomate',410,'Avena con banana · yogur sin lactosa con granola'],['a','Colación','11:00','Una fruta de estación',60,'Bastones de zanahoria'],['d','Almuerzo','13:00','Ensalada completa con pollo',610,'Merluza con puré · tarta de verduras sin TACC'],['b','Merienda','17:30','Yogur sin lactosa con frutos secos',260,'Huevo duro y fruta'],['c','Cena','21:00','Tortilla de papa y espinaca',460,'Lentejas con verduras']].map(([g,m,h,f,k,alt])=>`<li><time class="num">${h}</time><i></i>${photo(g)}<div class="tx"><small>${m}</small><b>${f}</b><span>Puede cambiar por: ${alt}</span></div><div class="kc"><b class="num">${k}</b><small>kcal</small>${fxBar(k/6.1)}</div></li>`).join('')}</ol></div>`,'g')}</div>
 <div class="c">
  ${fxP('Requerimiento','Mifflin-St Jeor · actividad leve',sb('Editar','','pen'),`<div class="fxsplit">${fxGauge(84,'1.800','kcal',{w:164})}${fxKv([['Gasto','2.150 kcal'],['Plan','1.800 kcal'],['Déficit','−16%']])}</div>
   <div class="fxmacros">${[['Proteínas','25% · 112 g · 1,6 g/kg',50,'k'],['Carbohidratos','50% · 225 g',100,''],['Grasas','25% · 50 g',50,'o']].map(([a,v,p,c])=>`<div><span><b>${a}</b><small>${v}</small></span>${fxBar(p,c)}</div>`).join('')}</div>`)}
  ${fxP('Calorías por comida','1.800 en el día','',fxCols([410,60,610,260,460],['Desayuno','Colación','Almuerzo','Merienda','Cena'],{h:120,max:640,hl:false}),'g')}
  ${fxP('Lista de compras','semana 3','<button class="lnk" type="button">Enviar a Sofía</button>',fxKv([['Verdulería','Espinaca, tomate, calabaza, limones'],['Carnicería','Pollo 1 kg, carne magra 500 g'],['Almacén','Pan sin TACC, avena sin TACC']]))}
 </div></div>`,

alimentario:()=>`<div class="fx" style="grid-template-columns:1.6fr 1fr">
 <div class="c">${fxP('Registro de comidas','últimos 7 días',`<div class="tabs"><button class="on" type="button">Todo</button><button type="button">Por revisar · 3</button></div>${sb('Descargar','','dl')}`,`<div class="fxs fxtb tall"><table><thead><tr><th>Cuándo</th><th>Qué comió</th><th>Estimado</th><th>Contra el plan</th><th></th></tr></thead><tbody>${[['Hoy 8:10','Desayuno','a','Tostadas con palta y huevo','~390 kcal','Coincide','p-conf',1],['Ayer 21:10','Cena','d','Verduras con arroz','~420 kcal','Coincide','p-conf',0],['Ayer 17:40','Merienda','b','Tostadas con huevo','~310 kcal','Faltó proteína','p-wait',0],['Ayer 13:20','Almuerzo','a','Pollo con chauchas','~520 kcal','Coincide','p-conf',0],['Ayer 8:30','Desayuno','c','Yogur con granola','~350 kcal','Con lactosa','p-bad',1],['Dom 21:00','Cena','c','Pizza sin TACC','~780 kcal','Se pasó','p-wait',1],['Dom 13:00','Almuerzo','d','Ensalada con pollo','~540 kcal','Coincide','p-conf',1],['Dom 8:40','Desayuno','a','Mate y tostadas sin TACC','~300 kcal','Faltó proteína','p-wait',1],['Sáb 21:30','Cena','b','Merluza con puré','~520 kcal','Coincide','p-conf',1]].map(([d,m,g,f,k,p,pc,rv])=>`<tr><td><div class="fxwhen"><b>${m}</b><small class="num">${d}</small></div></td><td><div class="who">${photo(g).replace('photo"','photo" style="width:32px;height:32px;--g:'+FOOD[g]+'"')}<b>${f}</b></div></td><td class="num" style="color:var(--ink2)">${k}</td><td>${pill(p,pc)}</td><td>${rv?'<span style="color:var(--ink3);font-size:11.5px">Revisada</span>':sb('Confirmar','k','check')}</td></tr>`).join('')}</tbody></table></div>`,'g')}</div>
 <div class="c">
  ${fxP('Calorías por día','meta 1.800','',fxCols([1720,1650,1810,1590,1440,2010,1690],['L','M','M','J','V','S','D'],{h:120,max:2100,avg:1,lo:1500,md:1600,top:'1.690'}))}
  ${fxP('Promedio de la semana','','',`<div class="fxmacros">${[['Proteínas','92 de 112 g',82,'k'],['Carbohidratos','216 de 225 g',96,''],['Grasas','52 de 50 g',100,'o']].map(([a,v,p,c])=>`<div><span><b>${a}</b><small class="num">${v}</small></span>${fxBar(p,c)}</div>`).join('')}</div>`)}
  ${fxP('Comidas cargadas','24 de 28','',`<div class="fxsplit">${fxRing(86,'24',58)}<div class="fxgrid28"><span></span>${['D','A','M','C'].map(t=>`<span>${t}</span>`).join('')}${['L','M','M','J','V','S','D'].map((d,i)=>`<span>${d}</span>`+[0,1,2,3].map(j=>`<i class="${(i===4&&j>1)||(i===2&&j===2)?'no':(i===5&&j===3)?'wa':''}"></i>`).join('')).join('')}</div></div>`,'g')}
  ${fxAi('Lo que ve la IA:','la proteína queda corta en la merienda y los viernes carga menos comidas.')}
 </div></div>`,

laboratorio:()=>`<div class="fx" style="grid-template-columns:1.6fr 1fr">
 <div class="c">${fxP('Laboratorio','3 análisis · el último el 12/10',`${sb('Agregar valor','','plus')}${sb('Cargar análisis','k','up')}`,`<div class="fxs fxtb tall"><table><thead><tr><th>Valor</th><th>Referencia</th><th>Jul 24</th><th>Mar 26</th><th>Oct 26</th><th>Tendencia</th><th>Estado</th></tr></thead><tbody>${[['Ferritina','ng/ml','30–200',[9,11,14],'Bajo','p-bad',1],['Hemoglobina','g/dl','12–16',[11.4,11.9,12.3],'Normal','p-conf'],['Vitamina D','ng/ml','30–100',[22,25,28],'Límite','p-wait',1],['Glucemia','mg/dl','70–100',[90,88,86],'Normal','p-conf'],['Colesterol total','mg/dl','< 200',[195,188,182],'Normal','p-conf'],['TSH','µUI/ml','0,4–4',[2.1,2.2,2.3],'Normal','p-conf'],['Anticuerpos celíacos','U/ml','< 10',[18,12,8],'Normal','p-conf'],['Vitamina B12','pg/ml','200–900',[300,310,352],'Normal','p-conf']].map(([n,u,r,v,s,pc,w])=>`<tr><td><b style="font-weight:500">${n}</b> <span style="color:var(--ink3);font-size:11px">${u}</span></td><td class="num" style="color:var(--ink3)">${r}</td>${v.map((x,k)=>`<td class="num"${k<2?' style="color:var(--ink3)"':''}>${k===2?`<b style="font-weight:500">${String(x).replace('.',',')}</b>`:String(x).replace('.',',')}</td>`).join('')}<td style="width:80px">${fxCurve(v,null,{w:70,h:22,mini:1,warn:w})}</td><td>${pill(s,pc)}</td></tr>`).join('')}</tbody></table></div>`,'g')}
  ${fxP('Archivos del análisis','','',`<div class="fxr fx2">${fxRows([['b','Laboratorio 12-10.pdf','Leído por la IA · 7 valores',sb('Ver','','eye')],['b','Laboratorio 03-26.pdf','Leído por la IA · 6 valores',sb('Ver','','eye')]]).slice(17,-6)}</div>`)}</div>
 <div class="c">
  ${fxP('Ferritina',pill('Bajo','p-bad'),'',`${fxCurve([9,11,14],['Jul 24','Mar 26','Oct 26'],{w:320,h:120,min:0,max:40,goal:30,gl:'mín. 30',warn:1})}<small class="fxhint">Sube despacio con el suplemento. Conviene reforzar hierro en el plan.</small>`)}
  ${fxAi('Sugerencia de la IA:','sumar lentejas, carne magra y espinaca con cítricos 4 veces por semana.',sb('Aplicar al plan','k'))}
  ${fxP('Pedidos de estudios','',sb('Nuevo pedido','k','plus'),fxRows([['a','Hierro, ferritina y vitamina D','pedido hoy · para mediados de diciembre',pill('Por enviar','p-wait')],['l','Perfil tiroideo','pedido el 12/03',pill('Recibido','p-conf')]]),'g')}
   </div></div>`,

archivos:()=>`<div class="fx" style="grid-template-columns:1.6fr 1fr">
 <div class="c">${fxP('Archivos','8',`<div class="tabs"><button class="on" type="button">Todos · 8</button><button type="button">Análisis · 3</button><button type="button">Estudios · 1</button><button type="button">Planes · 1</button><button type="button">Documentos · 2</button><button type="button">Fotos · 1</button></div>${sb('Exportar PDF','','dl')}`,`<div class="fxs"><div class="fxfiles">${[['file','a','Laboratorio 12-10.pdf','Análisis · subido por Sofía','12/10','1,2 MB'],['img','b','Ecografía abdominal.jpg','Estudio · subido por Sofía','02/09','3,4 MB'],['file','l','Plan sin gluten semana 3.pdf','Plan · enviado a Sofía','15/10','420 KB'],['file','l','Consentimiento informado.pdf','Documento · firmado en la app','12/03','180 KB'],['file','a','Laboratorio 03-26.pdf','Análisis · subido por vos','20/03','980 KB'],['file','b','Derivación de clínica médica.pdf','Documento · subido por vos','10/03','240 KB'],['img','l','Foto de progreso frente.jpg','Foto · privada, solo la ves vos','14/10','2,1 MB'],['file','a','Laboratorio 07-24.pdf','Análisis · importado de otro consultorio','15/07','1,0 MB']].map(([i,c,n,d,f,t])=>`<div class="${c}"><span class="ico ${c}">${svg(i)}</span><span class="t"><b>${n}</b><small>${d}</small></span><time class="num">${f}</time><span class="sz num">${t}</span>${sb('Ver','','eye')}</div>`).join('')}</div></div>`,'g')}</div>
 <div class="c">
  ${fxP('Por tipo','8 archivos · 9,5 MB','',`${fxStk([['Análisis',34,''],['Estudios',36,'b'],['Planes',4,'k'],['Documentos',4,'n'],['Fotos',22,'o']])}`)}
  ${fxP('Subir archivos','','',`<div class="fxdrop">${svg('up',20)}<b>Arrastrá archivos acá</b><span>PDF, fotos o planillas. La IA los ordena por tipo y fecha.</span>${sb('Elegir archivos','k')}</div>`,'g')}
  ${fxAi('Ordenado por la IA:','encontró 2 análisis y 1 estudio entre lo que subió Sofía. Los valores del laboratorio ya están en su pestaña.')}
 </div></div>`,

cobros:()=>`<div class="fx" style="grid-template-columns:1.6fr 1fr">
 <div class="c">
  <div class="fxtiles fx3">${[['Programa','Mensual','$54.000 · 4 seguimientos'],['Estado','Al día','pagó hasta el 10/11','ok'],['Pagó en total','$310.000','desde marzo']].map(([a,b,c,k])=>`<div class="fxp fxtile"><small>${a}</small><div class="fxv"><b class="num ${k||''}">${b}</b></div><span>${c}</span></div>`).join('')}</div>
  ${fxP('Pagos por mes','marzo a octubre','',fxCols([40,0,0,54,54,54,54,54],['mar','abr','may','jun','jul','ago','sep','oct'],{h:120,max:60,top:'$54 mil'}))}
  ${fxP('Movimientos','',sb('Registrar cobro','k','plus'),`<div class="fxs">${fxTl([['Programa mensual · noviembre','Transferencia','10/10'],['Programa mensual · octubre','Transferencia','10/09'],['Programa mensual · septiembre','Mercado Pago','10/08'],['Programa mensual · agosto','Efectivo','12/07'],['Programa mensual · julio','Transferencia','10/06'],['Primera consulta','Transferencia · $40.000','12/03']].map(([t,d,f])=>[t,d,`<b class="num">${t.startsWith('Primera')?'$40.000':'$54.000'}</b> · ${f}`]))}</div>`,'g')}
 </div>
 <div class="c">
  ${fxDk('Próximo vencimiento','10/11 · $54.000','Le llega un recordatorio a su app 3 días antes')}
  ${fxP('Cuotas al día','','',`<div class="fxsplit">${fxGauge(100,'5','de 5',{w:140})}${fxKv([['Pagadas','5'],['Vencidas','0'],['Medio más usado','Transferencia']])}</div>`)}
  ${fxP('Medios de pago','','',fxStk([['Transferencia',60,''],['Mercado Pago',20,'b'],['Efectivo',20,'o']]))}
  ${fxP('Acceso a la app',pill('Activo','p-conf'),'',`${fxKv([['Incluido en','Programa mensual'],['Si se vence','Ve un aviso amable y sigue usando todo']])}<div>${sb('Cambiar programa')}</div>`,'g')}
 </div></div>`
});

/* Movimiento de la ficha: paneles que suben, curvas que se dibujan, medidores que barren, columnas y barras que crecen. */
function fxAnim(r){if(!r||!window.gsap||matchMedia('(prefers-reduced-motion: reduce)').matches)return;if(r._fxTl)r._fxTl.progress(1).kill();const q=s=>r.querySelectorAll(s);
 const tl=r._fxTl=gsap.timeline();
 tl.from(q('.fx>.c>*'),{opacity:0,duration:.3,stagger:.02,ease:'power1.out',clearProps:'opacity'})
  .fromTo(q('.fxc .ln'),{strokeDasharray:1,strokeDashoffset:1},{strokeDashoffset:0,duration:1,ease:'power2.inOut',stagger:.04},.15)
  .from(q('.fxc .ar'),{opacity:0,duration:.6},.45)
  .from(q('.fxc .dt,.fxc .now,.fxc .nt'),{scale:0,opacity:0,transformOrigin:'50% 50%',transformBox:'fill-box',duration:.3,stagger:.02,ease:'expo.out'},.55)
  .fromTo(q('.fxg .pv'),{strokeDashoffset:100},{strokeDashoffset:(k,e)=>+e.dataset.o,duration:1.1,ease:'power3.out',stagger:.06},.2)
  .from(q('.fxg .end'),{scale:0,transformOrigin:'50% 50%',transformBox:'fill-box',duration:.4,ease:'expo.out',stagger:.06},.9)
  .from(q('.fxcols i'),{scaleY:0,transformOrigin:'50% 100%',duration:.6,stagger:.03,ease:'expo.out'},.25)
  .from(q('.fxcols .avg,.fxcols u'),{opacity:0,duration:.4},.8)
  .from(q('.fxb i,.fxstk i'),{scaleX:0,transformOrigin:'0 50%',duration:.7,stagger:.03,ease:'power3.out'},.25)
  .fromTo(q('.fxring .fg'),{strokeDashoffset:100},{strokeDashoffset:(k,e)=>+e.dataset.o,duration:1,ease:'power3.out',stagger:.05},.25)
    .from(q('.fxwk i'),{scaleY:0,transformOrigin:'50% 100%',duration:.5,stagger:.015,ease:'expo.out'},.35)
  .from(q('.fxdots i.on,.fxgrid28 i'),{scale:0,duration:.3,stagger:.01,ease:'expo.out'},.4);}
