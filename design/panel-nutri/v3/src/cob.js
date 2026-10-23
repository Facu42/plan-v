
/* Cobranzas con el estilo del detalle de Pacientes. */
const cAv=(a,c)=>`<span class="av" style="background:var(--${c}-t);color:var(--${c}-ink);width:28px;height:28px;font-size:10.5px">${a}</span>`;
function COB(){return `<div class="fx" style="grid-template-columns:1.6fr 1fr">
 <div class="c">
  <div class="fxtiles cob4">
   <div class="fxp fxtile"><small>Por cobrar este mes</small><div class="fxv"><b class="num">$288.000</b></div><span>6 cuotas hasta el 31/10</span>${fxBar(38,'a')}</div>
   <div class="fxp fxtile cwa"><small>Vencido</small><div class="fxv"><b class="num">$162.000</b><em class="bad">3</em></div><span>Camila, Brenda y Paula</span>${fxBar(36,'r')}</div>
   <div class="fxp fxtile"><small>Programas activos</small><div class="fxv"><b class="num">21</b><span>de 48 pacientes</span></div>${fxStk([['Mensual',67,''],['Trimestral',33,'k']]).replace('<div class="fxleg">','<div class="fxleg sm">')}</div>
  </div>
  ${fxP('Ingresos por mes','línea punteada: tu meta de $900.000',`<div class="tabs"><button class="on" type="button">6 meses</button><button type="button">12 meses</button></div>`,fxCurve([620,710,680,840,960,842],['may','jun','jul','ago','sep','oct'],{w:620,h:150,goal:900,gl:'&#8203;',pr:16,last:'$842k'}))}
  ${fxP('Movimientos','octubre',`<div class="tabs"><button class="on" type="button">Todos</button><button type="button">Cobrados</button><button type="button">Pendientes</button><button type="button">Vencidos · 3</button></div>`,`<div class="fxs fxtb tall"><table><thead><tr><th>Fecha</th><th>Paciente</th><th>Concepto</th><th style="text-align:right">Monto</th><th>Estado</th></tr></thead><tbody>${[
   ['21/10','SG','lima','Sofía Gómez','Programa mensual · noviembre','Transferencia','$54.000','Cobrado','p-conf'],
   ['20/10','AD','azul','Agustina Díaz','Seña de la primera consulta','Mercado Pago','$20.000','Cobrado','p-conf'],
   ['19/10','LF','lima','Lucía Fernández','Programa trimestral','Transferencia','$153.000','Cobrado','p-conf'],
   ['18/10','MR','azaf','Martina Ruiz','Primera consulta','Efectivo','$40.000','Cobrado','p-conf'],
   ['25/10','FR','azul','Florencia Romero','Programa mensual','—','$54.000','Vence en 3 días','p-wait'],
   ['22/10','PV','rojo','Paula Vidal','Seguimiento','—','$30.000','Vencido','p-bad'],
   ['17/10','BA','rojo','Brenda Acosta','Programa mensual','—','$54.000','Vencido','p-bad'],
   ['14/10','CT','rojo','Camila Torres','Programa mensual','—','$54.000','Vencido','p-bad'],
   ['12/10','JM','azaf','Julieta Molina','Seguimiento','Mercado Pago','$30.000','Cobrado','p-conf']
  ].map(([f,a,c,n,co,me,mo,e,ec])=>`<tr><td class="num" style="color:var(--ink2)">${f}</td><td><div class="who">${cAv(a,c)}<b>${n}</b></div></td><td><div class="fxwhen"><b style="font-weight:400">${co}</b><small>${me==='—'?'sin pagar':me}</small></div></td><td class="num" style="text-align:right;font-weight:500">${mo}</td><td>${pill(e,ec)}</td></tr>`).join('')}</tbody></table></div>`,'g')}
 </div>
 <div class="c">
  ${fxDk('Cobrado en octubre','$842.000','74% de lo esperado · faltan $296.000',`<div class="fxdkp"><i style="width:74%"></i></div><div class="fxdk2"><span>Septiembre</span><b>$960.000</b></div>`)}
  ${fxP('Cuotas vencidas','3',sb('Recordar a todas','k','chat'),`<div class="fxr">${[['CT','Camila Torres','Mensual · venció el 14/10 · 8 días','$54.000'],['BA','Brenda Acosta','Mensual · venció el 17/10 · 5 días','$54.000'],['PV','Paula Vidal','Seguimiento · venció el 22/10','$30.000']].map(([a,n,s,m])=>`<div class="r">${cAv(a,'rojo')}<span class="t"><b>${n}</b><small>${s}</small></span><b class="num cm">${m}</b>${sb('Recordar','','chat')}</div>`).join('')}</div>`)}
  ${fxP('Vencen esta semana','4','',`<div class="fxs">${fxTl([['Florencia Romero','Programa mensual · recordatorio enviado',`<b class="num">$54.000</b> · 25/10`,'a'],['Valentina Sosa','Programa mensual','<b class="num">$54.000</b> · 26/10'],['Carla Méndez','Seguimiento','<b class="num">$30.000</b> · 27/10'],['Rocío Paz','Programa trimestral','<b class="num">$153.000</b> · 28/10']])}</div>`,'g')}
  ${fxP('Cómo te pagan','octubre','',fxStk([['Transferencia 58%',58,''],['Mercado Pago 30%',30,'b'],['Efectivo 12%',12,'o']]))}
 </div></div>`;}
