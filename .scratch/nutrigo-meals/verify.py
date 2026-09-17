# Verify Nutrigo professional food diary and review entry
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-meals');out.mkdir(exist_ok=True)

def set_field(sel,value):
    result=js("(() => { const el=document.querySelector("+json.dumps(sel)+"); if(!el)return 'MISSING'; const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,"+json.dumps(value)+"); el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true})); return el.value; })()")
    assert result==value,(sel,value,result)

patients=[p for p in api('patients')['patients'] if not p.get('archived_at')]
assert len(patients)>=2
new_tab('http://127.0.0.1:5180/');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):
    click('Usar tema claro');wait("!document.querySelector('.nv-app').classList.contains('nv-dark')")
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')")
click('Actividades');wait("!!document.querySelector('.nvm-diary')")
checks=[]
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent")=='Actividades'
assert not js("!!document.querySelector('.reference-frame')") and not js("!!document.querySelector('.nv-daily')")
assert js("document.querySelectorAll('.nvm-metrics>.nv-metric').length")==4
checks.append(('activities-opens-new-diary',True))

# Pick a patient with a pending meal and verify isolation against API.
with_pending=next((p for p in patients if any(m['patient_id']==p['id'] and m['status']=='pending_review' for m in p['meal_logs'])),None)
assert with_pending, 'No demo patient with a pending meal'
set_field('[aria-label="Paciente del diario"]',with_pending['id']);time.sleep(.3)
body=js("document.querySelector('.nvm-diary').innerText")
own_logs=[m for m in with_pending['meal_logs'] if m['patient_id']==with_pending['id']]
for log in own_logs:
    detail=', '.join(f['name'] for f in log['foods']) if log['foods'] else (log.get('description') or 'Sin detalle registrado')
    assert detail in body,(detail,body[:700])
for person in patients:
    if person['id']==with_pending['id']:continue
    for log in person['meal_logs']:
        if log.get('note_for_nutri'):assert log['note_for_nutri'] not in body
assert 'Nota IA (solo vos)' not in body
checks.append(('selected-patient-data-isolated',with_pending['id']))

# Search gives a real match and an explicit empty state.
first_term=own_logs[0]['slot']
set_field('[aria-label="Buscar comidas"]',first_term);time.sleep(.2)
assert first_term in js("document.querySelector('.nvm-table-card').innerText")
set_field('[aria-label="Buscar comidas"]','qa-no-existe-9931');time.sleep(.2)
assert 'Sin registros para mostrar' in js("document.querySelector('.nvm-table-card').innerText")
set_field('[aria-label="Buscar comidas"]','');time.sleep(.2)
checks.append(('search-and-empty-state',True))

# Review dialog exposes only the selected meal's professional note and closes without mutation.
pending=next(m for m in own_logs if m['status']=='pending_review')
buttons=js("[...document.querySelectorAll('.nvm-table article')].map(r=>({text:r.innerText,button:r.querySelector('button')?.innerText||''}))")
assert any(row['button']=='Revisar' for row in buttons),buttons
click('Revisar');wait("!!document.querySelector('.review-panel')")
modal=js("document.querySelector('.review-panel').innerText")
assert pending.get('note_for_nutri','') in modal
assert 'Nota IA (solo vos)' in modal
for width,name in [(1440,'review-light-1440'),(390,'review-light-390')]:
    cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.2);shot(name)
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
click('Cerrar');wait("!document.querySelector('.review-panel')")
checks.append(('review-dialog-private-note',pending['id']))

# Dashboard action now stays in Nutrigo and preserves patient selection.
click('Inicio');wait("!!document.querySelector('.nv-work-toolbar')")
set_field('[aria-label="Paciente en seguimiento"]',with_pending['id']);time.sleep(.2)
click('Revisar comidas');wait("!!document.querySelector('.nvm-diary')")
assert js("document.querySelector('[aria-label=\"Paciente del diario\"]').value")==with_pending['id']
assert not js("!!document.querySelector('.reference-frame')")
checks.append(('review-action-stays-in-nutrigo',True))

# Patient experience remains read-only and excludes professional notes.
click('Paciente');wait("!!document.querySelector('.np-dashboard')")
click('Diario de comidas');wait("!!document.querySelector('.nv-record-list,.nv-state')")
patient_text=js("document.querySelector('.nv-app').innerText")
assert not js("!!document.querySelector('.nvm-diary')")
assert 'Nota IA (solo vos)' not in patient_text
for person in patients:
    for log in person['meal_logs']:
        if log.get('note_for_nutri'):assert log['note_for_nutri'] not in patient_text
checks.append(('patient-diary-excludes-private-notes',True))

# Responsive and theme evidence for professional view.
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')");click('Actividades');wait("!!document.querySelector('.nvm-diary')")
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390,320]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,metrics:document.querySelectorAll('.nvm-metrics>.nv-metric').length,metricHeights:[...document.querySelectorAll('.nvm-metrics>.nv-metric')].map(e=>e.getBoundingClientRect().height),metricsHeight:document.querySelector('.nvm-metrics').getBoundingClientRect().height,rows:document.querySelectorAll('.nvm-table article').length,rail:!!document.querySelector('.nv-daily'),main:document.querySelector('.nv-main').getBoundingClientRect().width,tableScroll:document.querySelector('.nvm-table')?.scrollWidth||0,tableClient:document.querySelector('.nvm-table')?.clientWidth||0})")
        assert state['scroll']<=width and state['metrics']==4 and not state['rail'],state
        assert all(height==72 for height in state['metricHeights']),state
        assert state['metricsHeight']==(104 if width==1440 else 192 if width==800 else 368),state
        if width==1440:assert state['main']>=1100,state
        state.update(theme='dark' if dark else 'light',shot=shot('meals-'+('dark' if dark else 'light')+'-'+str(width)));results.append(state)
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
(out/'checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
assert not js('window.__qaErrors'),js('window.__qaErrors')
assert len(results)==8
print(json.dumps({'checks':len(checks),'views':len(results),'patient':with_pending['id'],'rows':len(own_logs),'errors':[]}))
