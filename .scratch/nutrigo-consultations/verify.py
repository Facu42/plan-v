# Verify Nutrigo professional consultations on isolated demo API
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-consultations');out.mkdir(parents=True,exist_ok=True)
API='http://127.0.0.1:3011/api/'
def api(path): return json.load(urllib.request.urlopen(API+path))
def put(path,body):
    request=urllib.request.Request(API+path,data=json.dumps(body).encode(),headers={'Content-Type':'application/json'},method='PUT')
    return json.load(urllib.request.urlopen(request))
def set_field(sel,value):
    result=js("(() => { const el=document.querySelector("+json.dumps(sel)+"); if(!el)return 'MISSING'; const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,"+json.dumps(str(value))+" ); el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true})); return el.value; })()")
    assert result==str(value),(sel,value,result)
def patient(pid): return next(p for p in api('patients')['patients'] if p['id']==pid)

patients=[p for p in api('patients')['patients'] if not p.get('archived_at')]
subject=next(p for p in patients if p.get('appointment'))
other=next(p for p in patients if p['id']!=subject['id'])
original=dict(subject['appointment'])
other_original=other.get('appointment')
old_day,old_time=original['when'].split(' · ')
new_day='Martes' if old_day!='Martes' else 'Miércoles'
new_time='16:15' if old_time!='16:15' else '15:45'
new_duration=30 if original['duration']!=30 else 45
checks=[]

new_tab('http://127.0.0.1:5181/');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):click('Usar tema claro');wait("!document.querySelector('.nv-app').classList.contains('nv-dark')")
if js("!![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Nutricionista')"):click('Nutricionista')
wait("!!document.querySelector('.nv-work-toolbar')")
set_field('[aria-label="Paciente en seguimiento"]',subject['id']);time.sleep(.2)
click('Gestionar consultas');wait("!!document.querySelector('.nvc-consultations')")
assert js("document.querySelector('[aria-label=\"Paciente de la consulta\"]').value")==subject['id']
assert js("document.querySelectorAll('.nvc-stat').length")==3
assert js("[35,42].includes(document.querySelectorAll('[data-calendar-day]').length)")
assert not js("!!document.querySelector('.reference-frame')") and not js("!!document.querySelector('.nv-daily')")
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")== 'Fichas'
checks.append(('consultations-action-stays-in-nutrigo',subject['id']))

# Reschedule through UI and verify exact API state + unrelated patient isolation.
click('Reagendar');wait("!!document.querySelector('.nvc-form')")
set_field('[aria-label="Día de la consulta"]',new_day)
set_field('[aria-label="Hora de la consulta"]',new_time)
set_field('[aria-label="Duración de la consulta"]',new_duration)
click('Guardar turno');wait("!document.querySelector('.nvc-form')")
changed=patient(subject['id'])['appointment']
assert changed['when']==new_day+' · '+new_time and changed['duration']==new_duration,changed
assert patient(other['id']).get('appointment')==other_original
checks.append(('reschedule-isolated',subject['id']))

# Change patient while viewing, then return and restore original appointment.
set_field('[aria-label="Paciente de la consulta"]',other['id']);time.sleep(.25)
assert js("document.querySelector('.nvc-consultations').getAttribute('aria-label')")== 'Consultas de '+other['name']
set_field('[aria-label="Paciente de la consulta"]',subject['id']);time.sleep(.25)
click('Reagendar');wait("!!document.querySelector('.nvc-form')")
set_field('[aria-label="Día de la consulta"]',old_day)
set_field('[aria-label="Hora de la consulta"]',old_time)
set_field('[aria-label="Duración de la consulta"]',original['duration'])
set_field('[aria-label="Modalidad de la consulta"]',original['channel'])
set_field('[aria-label="Enlace de videollamada"]',original.get('meet_url',''))
click('Guardar turno');wait("!document.querySelector('.nvc-form')")
restored=patient(subject['id'])['appointment']
assert restored==original,(restored,original)
checks.append(('patient-reset-and-restore',True))

# Cancel confirmation and restoration on the isolated API only.
click('Cancelar turno');wait("document.querySelector('.nvc-detail').innerText.includes('Sí, cancelar')")
click('No, volver');assert not js("document.querySelector('.nvc-detail').innerText.includes('Sí, cancelar')")
click('Cancelar turno');click('Sí, cancelar');wait("document.querySelector('.nvc-detail').innerText.includes('Sin consulta programada')")
assert patient(subject['id'])['appointment'] is None
wait("!!document.querySelector('.nvc-form')")
set_field('[aria-label="Día de la consulta"]',old_day)
set_field('[aria-label="Hora de la consulta"]',old_time)
set_field('[aria-label="Duración de la consulta"]',original['duration'])
set_field('[aria-label="Modalidad de la consulta"]',original['channel'])
set_field('[aria-label="Enlace de videollamada"]',original.get('meet_url',''))
click('Guardar turno');wait("!document.querySelector('.nvc-form')")
assert patient(subject['id'])['appointment']==original
assert original['when'] in js("document.querySelector('.nvc-detail').innerText")
checks.append(('cancel-confirmation-isolated',True))

# Patient calendar remains read-only and does not expose professional controls.
click('Paciente');wait("!!document.querySelector('.np-dashboard')")
click('Calendario');wait("!!document.querySelector('.nv-appointment,.nv-state')")
assert not js("!!document.querySelector('.nvc-consultations')")
assert not js("!![...document.querySelectorAll('button')].find(b=>['Reagendar','Cancelar turno','Guardar turno'].includes(b.textContent.trim()))")
checks.append(('patient-calendar-read-only',True))

# Return to professional consultations for responsive evidence.
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')")
set_field('[aria-label="Paciente en seguimiento"]',subject['id']);time.sleep(.2)
click('Gestionar consultas');wait("!!document.querySelector('.nvc-consultations')")
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,stats:[...document.querySelectorAll('.nvc-stat')].map(e=>e.getBoundingClientRect().height),cells:document.querySelectorAll('[data-calendar-day]').length,cellHeights:[...document.querySelectorAll('[data-calendar-day]')].slice(0,7).map(e=>e.getBoundingClientRect().height),rail:!!document.querySelector('.nv-daily'),legacy:!!document.querySelector('.reference-frame'),layout:getComputedStyle(document.querySelector('.nvc-layout')).gridTemplateColumns,primary:document.querySelector('.nvc-primary').getBoundingClientRect().width,detail:document.querySelector('.nvc-detail').getBoundingClientRect().width})")
        assert state['scroll']<=width and len(state['stats'])==3 and not state['rail'] and not state['legacy'],state
        assert all(h==120 for h in state['cellHeights']),state
        assert all(h==(178 if width==390 else 108) for h in state['stats']),state
        if width==1440:assert 830<=state['primary']<=840 and 280<=state['detail']<=290,state
        state.update(theme='dark' if dark else 'light',shot=shot('consultations-'+('dark' if dark else 'light')+'-'+str(width)));results.append(state)
cdp('Emulation.setDeviceMetricsOverride',width=390,height=2100,deviceScaleFactor=1,mobile=False);time.sleep(.25)
full_mobile_shot=shot('consultations-dark-390-full')
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
(out/'checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
assert not js('window.__qaErrors'),js('window.__qaErrors')
print(json.dumps({'checks':len(checks),'views':len(results),'patient':subject['id'],'restored':patient(subject['id'])['appointment']==original,'otherUntouched':patient(other['id']).get('appointment')==other_original,'errors':[]}))
