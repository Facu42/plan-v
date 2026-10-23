# Arma panel.html (el boceto único del panel de la nutri) a partir de src/.
# Uso: python3 design/panel-nutri/v3/build.py   (ver docs/panel-nutri-rediseno/traspaso-boceto-v3.md)
import os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src'))
s=open('base.html').read()
js=open('fx.js').read()+open('cob.js').read(); css=open('fx.css').read()+open('cob.css').read()+open('imp.css').read()+open('act.css').read()+open('msg.css').read()+open('pl.css').read()
s=s.replace('const FTABS2=',js+'\nconst FTABS2=',1)
old="document.getElementById('fwrap').innerHTML=FT[ftab]();}"
assert s.count(old)==1
s=s.replace(old,"document.getElementById('fwrap').innerHTML=FT[ftab]();fxAnim(document.getElementById('fwrap'));}")
css+="""
/* Tarjeta de Inicio: botones parejos y más arriba */
.dvx{gap:9px;padding-bottom:24px}
.dvx .xacts button,.dvx .xacts button.go{flex:1 1 0;min-width:0;height:38px;padding:0 12px}
"""
i=s.rfind('</style>')
s=s[:i]+css+'\n'+s[i:]
k=s.rfind('</script>')
s=s[:k]+"\nconst _gf=go;go=function(id){_gf(id);if(id==='ficha')fxAnim(document.getElementById('fwrap'));};\n"+s[k:]
scr='''<div class="scr" id="s-cobranzas" hidden>
  <div class="top">
    <div><h1>Cobranzas <span>· octubre 2026</span></h1><div class="date">La plata va directo a tu cuenta · 21 programas activos · 3 cuotas vencidas</div></div>
    <div class="sp"></div>
    <div class="tabs"><button class="on" type="button">Mes</button><button type="button">Trimestre</button><button type="button">Año</button></div>
    <button class="chip" type="button" id="cexp">Exportar</button>
    <button class="cta" type="button" data-ic="plus">Registrar cobro</button>
  </div>
  <div id="cwrap" style="flex:1;min-height:0;display:flex;flex-direction:column"></div>
</div>
'''
a='<div class="scr" id="s-ficha" hidden>'; assert s.count(a)==1; s=s.replace(a,scr+a)
a='<button class="nv" type="button" aria-expanded="false" data-ic="coin">'; assert s.count(a)==1; s=s.replace(a,'<button class="nv" type="button" data-go="cobranzas" aria-expanded="false" data-ic="coin">')
a='<button type="button" data-go="agenda" aria-pressed="false">Agenda</button>'; assert s.count(a)==1; s=s.replace(a,a+'<button type="button" data-go="cobranzas" aria-pressed="false">Cobranzas</button>')
a="['pacientes','agenda','ficha'].includes(h0)"; assert s.count(a)==1; s=s.replace(a,"['pacientes','agenda','ficha','cobranzas'].includes(h0)")
k=s.rfind('</script>')
s=s[:k]+"document.getElementById('cwrap').innerHTML=COB();document.getElementById('cexp').insertAdjacentHTML('afterbegin',svg('dl'));\nconst _gc=go;go=function(id){_gc(id);if(id==='cobranzas')fxAnim(document.getElementById('cwrap'));};\n"+open('act.js').read()+'const MPH='+open('mph.json').read()+';\n'+open('msg.js').read()+'const RCI='+open('rcimg.json').read()+';\n'+open('pl.js').read()+s[k:]
scr2='''<div class="scr" id="s-mensajes" hidden>
  <div class="top">
    <div><h1>Mensajes <span id="mtitle">· 4 sin leer</span></h1><div class="date">Chat en la app de cada paciente · respondés en 1 h 20 min en promedio</div></div>
    <div class="sp"></div>
    <div class="tabs" id="mview"><button class="on" type="button" data-mv="0">Bandeja</button><button type="button" data-mv="1">Respuestas guardadas</button><button type="button" data-mv="2">Avisos automáticos</button></div>
    <button class="chip" type="button" id="mvarias" data-ic="users">Mensaje a varias</button>
    <button class="cta" type="button" id="mnew" data-ic="plus">Nuevo mensaje</button>
  </div>
  <div id="mwrap"></div>
</div>
'''
scr3='''<div class="scr" id="s-planes" hidden>
  <div class="top">
    <div><h1>Planes <span id="ptitle">· 13 pacientes</span></h1><div class="date">Nada le llega a la paciente hasta que lo publiques</div></div>
    <div class="sp"></div>
    <div class="tabs" id="pview"><button class="on" type="button" data-pv="0">Todos los planes</button><button type="button" data-pv="1">Plan de Sofía</button><button type="button" data-pv="2">Recetas</button><button type="button" data-pv="3">Plantillas</button><button type="button" data-pv="4">Equivalencias</button></div>
    <div id="pacts" style="display:flex;gap:8px"></div>
  </div>
  <div id="pwrap"></div>
</div>
'''
a='<div class="scr" id="s-ficha" hidden>'; assert s.count(a)==1; s=s.replace(a,scr2+scr3+a)
a='<button class="nv" type="button" aria-expanded="false" data-ic="clip">'; assert s.count(a)==1; s=s.replace(a,'<button class="nv" type="button" data-go="planes" aria-expanded="false" data-ic="clip">')
a='<button type="button" data-go="cobranzas" aria-pressed="false">Cobranzas</button>'; assert s.count(a)==1; s=s.replace(a,a+'<button type="button" data-go="planes" aria-pressed="false">Planes</button>')
a='<button class="nv" type="button" aria-expanded="false" data-ic="chat">'; assert s.count(a)==1; s=s.replace(a,'<button class="nv" type="button" data-go="mensajes" aria-expanded="false" data-ic="chat">')
a='<button type="button" data-go="cobranzas" aria-pressed="false">Cobranzas</button>'; assert s.count(a)==1; s=s.replace(a,a+'<button type="button" data-go="mensajes" aria-pressed="false">Mensajes</button>')
a="['pacientes','agenda','ficha','cobranzas'].includes(h0)"; assert s.count(a)==1; s=s.replace(a,"['pacientes','agenda','ficha','cobranzas','mensajes','planes'].includes(h0)")
s=s.replace('activo · WhatsApp 24 h antes','activo · en la app 24 h antes').replace('Le llega 3 días antes por WhatsApp','Le llega a su app 3 días antes')
open('../panel.html','w').write(s)
print('ok')
