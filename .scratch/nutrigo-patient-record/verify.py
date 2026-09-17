# Verify professional record, privacy, selection and reversible edit
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-patient-record');out.mkdir(exist_ok=True)

def set_field(sel,value):
    result=js("(() => { const el=document.querySelector("+json.dumps(sel)+"); if(!el)return 'MISSING'; const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,"+json.dumps(value)+"); el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true})); return el.value; })()")
    assert result==value,(sel,value,result)

def patient(id):
    return next(p for p in api('patients')['patients'] if p['id']==id)

assert api('health')['supabase'] is False
new_tab('http://127.0.0.1:5180/');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')")
click('Fichas');wait("!!document.querySelector('.nr-record')")
checks=[]
assert not js("!!document.querySelector('.reference-frame')")
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent")=='Fichas'
assert js("document.querySelectorAll('.nv-sidebar nav button').length")==11
checks.append(('fichas-opens-new-record',True))

selected_id=js("document.querySelector('[aria-label=\"Paciente de la ficha\"]').value")
first=patient(selected_id)
body=js("document.querySelector('.nr-record').innerText")
for value in [first['sensitive_hours'],first['plan_b'],first['next_focus'],first['adherence_why']]:
    if value:assert value in body,(value,body[:500])
for entry in first.get('goal_history',[]):
    if entry.get('note'):assert entry['note'] in body
for log in first['meal_logs']:
    if log['patient_id']==first['id'] and log.get('note_for_nutri'):assert log['note_for_nutri'] in body
assert 'Solo visible para profesionales' in body
checks.append(('professional-private-data-matches-api',first['id']))

# Change patient inside the new record and verify no previous private fields remain.
options=js("[...document.querySelector('[aria-label=\"Paciente de la ficha\"]').options].map(o=>o.value)")
second_id=next(id for id in options if id!=first['id'])
set_field('[aria-label="Paciente de la ficha"]',second_id);time.sleep(.35)
second=patient(second_id);body2=js("document.querySelector('.nr-record').innerText")
assert second['name'] in body2 and js("document.querySelector('[aria-label=\"Paciente de la ficha\"]').value")==second_id
for value in [second['sensitive_hours'],second['plan_b'],second['next_focus'],second['adherence_why']]:
    if value:assert value in body2
for value in [first['sensitive_hours'],first['next_focus'],first['adherence_why']]:
    if value and value not in [second['sensitive_hours'],second['next_focus'],second['adherence_why']]:assert value not in body2
checks.append(('patient-switch-isolated',second_id))

# Reversible edit with exact API read-back, then restore original value.
original_focus=second['next_focus'];qa_focus='Foco temporal QA ficha'
click('Editar datos de ficha');wait("!!document.querySelector('.nv-dialog')")
set_field('.nv-dialog-form > label:nth-of-type(2) textarea',qa_focus)
click('Guardar cambios');wait("!document.querySelector('.nv-dialog')");time.sleep(.4)
assert patient(second_id)['next_focus']==qa_focus
assert qa_focus in js("document.querySelector('.nr-private').innerText")
click('Editar datos de ficha');wait("!!document.querySelector('.nv-dialog')")
set_field('.nv-dialog-form > label:nth-of-type(2) textarea',original_focus)
click('Guardar cambios');wait("!document.querySelector('.nv-dialog')");time.sleep(.4)
assert patient(second_id)['next_focus']==original_focus
checks.append(('profile-edit-readback-and-restore',True))

# Operational meal page keeps the selected patient in the new Nutrigo surface.
click('Revisar comidas');wait("!!document.querySelector('.nvm-diary')")
assert not js("!!document.querySelector('.reference-frame')")
assert js("document.querySelector('[aria-label=\"Paciente del diario\"]').value")==second_id
click('Fichas');wait("!!document.querySelector('.nr-record')")
assert js("document.querySelector('[aria-label=\"Paciente de la ficha\"]').value")==second_id
checks.append(('meal-page-keeps-selection',True))

# Patient role must not expose the professional record or its private values.
click('Paciente');wait("!!document.querySelector('.np-dashboard')")
patient_text=js("document.querySelector('.nv-app').innerText")
assert not js("!!document.querySelector('.nr-record')")
assert 'Información profesional privada' not in patient_text
for value in [second['sensitive_hours'],second['next_focus'],second['adherence_why']]:
    if value:assert value not in patient_text,(value,patient_text[:500])
for log in second['meal_logs']:
    if log.get('note_for_nutri'):assert log['note_for_nutri'] not in patient_text
checks.append(('patient-role-excludes-private-record',True))

# Back to record; responsive evidence and semantic checks.
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')");click('Fichas');wait("!!document.querySelector('.nr-record')")
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390,320]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,privateCards:document.querySelectorAll('.nr-private dl>div').length,summaryCards:document.querySelectorAll('.nr-summary-grid>.nr-card').length,historyCards:document.querySelectorAll('.nr-history-grid>.nr-card').length,rail:!!document.querySelector('.nv-daily'),main:document.querySelector('.nv-main').getBoundingClientRect().width,privateLabel:document.querySelector('.nr-private').getAttribute('aria-label')})")
        assert state['scroll']<=width and state['privateCards']==4 and state['summaryCards']==3 and state['historyCards']==3 and not state['rail'],state
        if width==1440:assert state['main']>=1050,state
        assert state['privateLabel']=='Información profesional privada'
        state.update(theme='dark' if dark else 'light',shot=shot('record-'+('dark' if dark else 'light')+'-'+str(width)));results.append(state)
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
(out/'checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
assert not js('window.__qaErrors'),js('window.__qaErrors')
assert len(results)==8
print(json.dumps({'checks':len(checks),'views':len(results),'privateFields':4,'selection':second_id,'errors':[]}))
