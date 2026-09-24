# Verify Nutrigo professional goals on isolated demo API.
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-goals');out.mkdir(parents=True,exist_ok=True)
API='http://127.0.0.1:3012/api/'
def api(path): return json.load(urllib.request.urlopen(API+path))
def patient(pid): return next(p for p in api('patients')['patients'] if p['id']==pid)
def set_field(sel,value):
    result=js("(() => { const el=document.querySelector("+json.dumps(sel)+"); if(!el)return 'MISSING'; const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,"+json.dumps(str(value))+" ); el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true})); return el.value; })()")
    assert result==str(value),(sel,value,result)

patients=[p for p in api('patients')['patients'] if not p.get('archived_at')]
subject=next(p for p in patients if p.get('goal_history'))
other=next(p for p in patients if p['id']!=subject['id'])
original={k:subject.get(k) for k in ['goal','goal_status','goal_progress']}
other_original={k:other.get(k) for k in ['goal','goal_status','goal_progress','goal_updated_at','goal_history']}
qa_goal='Objetivo temporal para QA Nutrigo'
checks=[]

new_tab('http://127.0.0.1:5182/');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"): click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"): click('Usar tema claro');wait("!document.querySelector('.nv-app').classList.contains('nv-dark')")
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')")
set_field('[aria-label="Paciente en seguimiento"]',subject['id']);time.sleep(.2)
click('Gestionar objetivos');wait("!!document.querySelector('.nvg-goals')")
assert js("document.querySelector('[aria-label=\"Paciente en seguimiento\"]').value")==subject['id']
assert js("document.querySelectorAll('.nvg-stat').length")==4
assert js("document.querySelectorAll('.nvg-list>article').length")==len(patients)
assert not js("!!document.querySelector('.reference-frame')") and not js("!!document.querySelector('.nv-daily')")
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")=='Objetivos'
checks.append(('goals-action-stays-in-nutrigo',subject['id']))

# Filters stay on the multipatient surface.
click('En pausa');time.sleep(.2)
assert js("[...document.querySelectorAll('.nvg-list>article .nv-badge')].every(e=>e.textContent.trim()==='En pausa')")
click('Todos');time.sleep(.2)
assert js("document.querySelectorAll('.nvg-list>article').length")==len(patients)
checks.append(('multipatient-filters',True))

# Switch patient and verify private history changes with context.
set_field('.nvg-context [aria-label="Paciente en seguimiento"]',other['id']);time.sleep(.25)
assert other['name'] in js("document.querySelector('.nvg-focus').innerText")
for entry in subject.get('goal_history',[]):
    if entry.get('note') and entry['note'] not in [h.get('note') for h in other.get('goal_history',[])]: assert entry['note'] not in js("document.querySelector('.nvg-focus').innerText")
set_field('.nvg-context [aria-label="Paciente en seguimiento"]',subject['id']);time.sleep(.25)
checks.append(('patient-history-isolated',other['id']))

# Update and restore visible goal fields through the real UI; isolated API is discarded afterward.
js("document.querySelector('.nvg-focus .nv-button').click()");wait("!!document.querySelector('.nvg-dialog')")
set_field('.nvg-dialog textarea',qa_goal)
set_field('.nvg-dialog [aria-label="Avance del objetivo"]','65')
set_field('.nvg-dialog select','paused')
set_field('.nvg-dialog .nv-dialog-form > label:last-of-type textarea','Nota temporal QA privada')
click('Guardar actualización');wait("!document.querySelector('.nvg-dialog')");time.sleep(.35)
changed=patient(subject['id'])
assert changed['goal']==qa_goal and changed['goal_progress']==65 and changed['goal_status']=='paused',changed
assert other_original=={k:patient(other['id']).get(k) for k in other_original}
js("document.querySelector('.nvg-focus .nv-button').click()");wait("!!document.querySelector('.nvg-dialog')")
set_field('.nvg-dialog textarea',original['goal'])
set_field('.nvg-dialog [aria-label="Avance del objetivo"]',original['goal_progress'])
set_field('.nvg-dialog select',original['goal_status'])
click('Guardar actualización');wait("!document.querySelector('.nvg-dialog')");time.sleep(.35)
restored=patient(subject['id'])
assert all(restored.get(k)==v for k,v in original.items()),(restored,original)
checks.append(('update-readback-and-restore',True))

# Patient progress remains a separate read-only surface without professional notes.
click('Paciente');wait("!!document.querySelector('.np-dashboard')")
click('Progreso');wait("document.querySelector('#nv-main').innerText.includes('Seguimiento de los últimos 7 días')")
patient_text=js("document.querySelector('#nv-main').innerText")
assert not js("!!document.querySelector('.nvg-goals')")
for entry in restored.get('goal_history',[]):
    if entry.get('note'): assert entry['note'] not in patient_text
checks.append(('patient-progress-read-only',True))

# Return through the CRM navigation and measure the Progress-inspired geometry.
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')")
click('Objetivos');wait("!!document.querySelector('.nvg-goals')")
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark: click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,stats:[...document.querySelectorAll('.nvg-stat')].map(e=>e.getBoundingClientRect().height),rail:!!document.querySelector('.nv-daily'),legacy:!!document.querySelector('.reference-frame'),main:document.querySelector('.nv-main').getBoundingClientRect().width,layout:getComputedStyle(document.querySelector('.nvg-layout')).gridTemplateColumns,directory:document.querySelector('.nvg-directory').getBoundingClientRect().width,focus:document.querySelector('.nvg-focus').getBoundingClientRect().width})")
        assert state['scroll']<=width and len(state['stats'])==4 and not state['rail'] and not state['legacy'],state
        assert all(h==(128 if width==390 else 108) for h in state['stats']),state
        if width==1440: assert 745<=state['directory']<=775 and 368<=state['focus']<=380 and state['main']>=1150,state
        state.update(theme='dark' if dark else 'light',shot=shot('goals-'+('dark' if dark else 'light')+'-'+str(width)));results.append(state)
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
(out/'checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
assert not js('window.__qaErrors'),js('window.__qaErrors')
print(json.dumps({'checks':len(checks),'views':len(results),'patient':subject['id'],'fieldsRestored':all(patient(subject['id']).get(k)==v for k,v in original.items()),'otherUntouched':other_original=={k:patient(other['id']).get(k) for k in other_original},'errors':[]}))
