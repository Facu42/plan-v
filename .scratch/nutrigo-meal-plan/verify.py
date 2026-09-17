# Verify Nutrigo professional weekly meal plan
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-meal-plan');out.mkdir(exist_ok=True)

SLOTS=['Desayuno','Media mañana','Almuerzo','Merienda','Cena','Snack opcional']
DAYS=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']

def set_field(sel,value):
    result=js("(() => { const el=document.querySelector("+json.dumps(sel)+"); if(!el)return 'MISSING'; const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,"+json.dumps(value)+"); el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true})); return el.value; })()")
    assert result==value,(sel,value,result)

def patient_by_id(pid):
    return next(p for p in api('patients')['patients'] if p['id']==pid)

patients=[p for p in api('patients')['patients'] if not p.get('archived_at')]
patient=next(p for p in patients if any(d['meals'] for d in p['weekPlan']))
first_day=next(d for d in patient['weekPlan'] if d['meals'])
first_meal=first_day['meals'][0]
add_day=next(day for day in DAYS if len(next((d['meals'] for d in patient['weekPlan'] if d['day']==day),[]))<len(SLOTS))
used={m['slot'] for d in patient['weekPlan'] if d['day']==add_day for m in d['meals']}
add_slot=next(slot for slot in SLOTS if slot not in used)
original=first_meal['title']
changed=(original+' · QA')[:200]
added_title='Comida QA temporal'
checks=[]

new_tab('http://127.0.0.1:5180/');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):click('Usar tema claro');wait("!document.querySelector('.nv-app').classList.contains('nv-dark')")
if js("!![...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Nutricionista')"):click('Nutricionista')
wait("!!document.querySelector('.nv-work-toolbar')")
set_field('[aria-label="Paciente en seguimiento"]',patient['id']);time.sleep(.2)
click('Editar plan');wait("!!document.querySelector('.npm-plan')")
assert js("document.querySelector('[aria-label=\"Paciente del plan\"]').value")==patient['id']
assert js("document.querySelectorAll('[data-plan-day]').length")==7
assert not js("!!document.querySelector('.reference-frame')") and not js("!!document.querySelector('.nv-daily')")
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")== 'Fichas'
checks.append(('plan-action-stays-in-nutrigo',patient['id']))

# Edit and restore an existing meal through the real API.
meal_sel=f'[aria-label="{first_day["day"]} · {first_meal["slot"]}"]'
set_field(meal_sel,changed)
assert js("document.querySelector("+json.dumps(meal_sel)+").closest('.npm-meal-card').querySelector('.npm-save').disabled") is False
js("document.querySelector("+json.dumps(meal_sel)+").closest('.npm-meal-card').querySelector('.npm-save').click()")
wait("document.querySelector("+json.dumps(meal_sel)+").closest('.npm-meal-card').querySelector('.npm-save').textContent==='Listo'")
assert next(m for d in patient_by_id(patient['id'])['weekPlan'] if d['day']==first_day['day'] for m in d['meals'] if m['slot']==first_meal['slot'])['title']==changed
set_field(meal_sel,original)
js("document.querySelector("+json.dumps(meal_sel)+").closest('.npm-meal-card').querySelector('.npm-save').click()")
wait("document.querySelector("+json.dumps(meal_sel)+").value==="+json.dumps(original))
time.sleep(.3)
assert next(m for d in patient_by_id(patient['id'])['weekPlan'] if d['day']==first_day['day'] for m in d['meals'] if m['slot']==first_meal['slot'])['title']==original
checks.append(('edit-and-restore',first_day['day']+'|'+first_meal['slot']))

# Add and remove a temporary meal, leaving demo data unchanged.
add_button=f'[aria-label="Agregar comida al {add_day}"]'
add_slot_sel=f'[aria-label="Momento a agregar el {add_day}"]'
add_title_sel=f'[aria-label="Título nuevo para {add_day}"]'
js("document.querySelector("+json.dumps(add_button)+").click()")
wait("!!document.querySelector("+json.dumps(add_slot_sel)+")")
set_field(add_slot_sel,add_slot)
set_field(add_title_sel,added_title)
js("document.querySelector("+json.dumps(add_title_sel)+").closest('form').querySelector('button[type=submit]').click()")
added_sel=f'[aria-label="{add_day} · {add_slot}"]'
wait("!!document.querySelector("+json.dumps(added_sel)+")")
assert any(m['slot']==add_slot and m['title']==added_title for d in patient_by_id(patient['id'])['weekPlan'] if d['day']==add_day for m in d['meals'])
js("document.querySelector("+json.dumps(added_sel)+").closest('.npm-meal-card').querySelector('.npm-remove').click()")
wait("document.querySelector("+json.dumps(added_sel)+").closest('.npm-meal-card').innerText.includes('Sí, quitar')")
js("[...document.querySelector("+json.dumps(added_sel)+").closest('.npm-meal-card').querySelectorAll('button')].find(b=>b.textContent.includes('Sí, quitar')).click()")
wait("!document.querySelector("+json.dumps(added_sel)+")")
assert not any(m['slot']==add_slot for d in patient_by_id(patient['id'])['weekPlan'] if d['day']==add_day for m in d['meals'])
checks.append(('add-and-remove',add_day+'|'+add_slot))

# Search uses explicit per-day empty states without removing rows.
set_field('[aria-label="Buscar comidas"]','qa-sin-coincidencias-491');time.sleep(.2)
assert js("document.querySelectorAll('[data-plan-day]').length")==7
assert 'Sin coincidencias' in js("document.querySelector('.npm-plan').innerText")
set_field('[aria-label="Buscar comidas"]','');time.sleep(.2)
checks.append(('search-keeps-seven-days',True))

# The patient keeps a separate, read-only published plan.
click('Paciente');wait("!!document.querySelector('.np-dashboard')")
click('Plan semanal');wait("!!document.querySelector('.nv-plan-grid')")
assert not js("!!document.querySelector('.npm-plan')")
assert not js("!!document.querySelector('.nv-plan-grid input,.nv-plan-grid button')")
checks.append(('patient-plan-remains-read-only',True))
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')")
set_field('[aria-label="Paciente en seguimiento"]',patient['id']);time.sleep(.2)
click('Editar plan');wait("!!document.querySelector('.npm-plan')")

# Responsive and theme geometry.
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,days:document.querySelectorAll('[data-plan-day]').length,rail:!!document.querySelector('.nv-daily'),legacy:!!document.querySelector('.reference-frame'),main:document.querySelector('.nv-main').getBoundingClientRect().width,tableScroll:document.querySelector('.npm-table').scrollWidth,tableClient:document.querySelector('.npm-table').clientWidth,rowHeights:[...document.querySelectorAll('[data-plan-day]')].map(e=>e.getBoundingClientRect().height)})")
        assert state['scroll']<=width and state['days']==7 and not state['rail'] and not state['legacy'],state
        if width==1440:assert state['main']>=1100 and min(state['rowHeights'])>=96,state
        if width==390:assert state['tableScroll']>state['tableClient'],state
        state.update(theme='dark' if dark else 'light',shot=shot('plan-'+('dark' if dark else 'light')+'-'+str(width)));results.append(state)
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
(out/'checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
assert not js('window.__qaErrors'),js('window.__qaErrors')
print(json.dumps({'checks':len(checks),'views':len(results),'patient':patient['id'],'days':7,'restored':True,'errors':[]}))
