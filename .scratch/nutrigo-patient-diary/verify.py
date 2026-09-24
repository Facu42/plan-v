# Verify the patient diary and registration flow on isolated demo services.
import json,time,urllib.request
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-patient-diary');out.mkdir(parents=True,exist_ok=True)
def api(path):return json.load(urllib.request.urlopen('http://127.0.0.1:3011/api/'+path))
def wait(expr):
    for _ in range(100):
        if js(expr):return
        time.sleep(.1)
    raise AssertionError(expr)
def click(name,role='button'):
    for _ in range(5):
        for n in cdp('Accessibility.getFullAXTree')['nodes']:
            if n.get('role',{}).get('value')==role and n.get('name',{}).get('value')==name:
                cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId']);q=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content'];click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4);time.sleep(.3);return
        time.sleep(.3)
    raise AssertionError('Missing '+name)
def nav(label):
    if js("document.querySelector('.nv-sidebar').getBoundingClientRect().right<=0"):
        click('Abrir menú');wait("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
    click(label)
def set_field(selector,value):
    result=js("(() => {const e=document.querySelector("+json.dumps(selector)+");if(!e)return null;const p=e.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,"+json.dumps(value)+");e.dispatchEvent(new Event('input',{bubbles:true}));return e.value})()")
    assert result==value,(selector,result)

patients=api('patients')['patients'];patient=next(p for p in patients if not p.get('archived_at'));other=next(p for p in patients if p['id']!=patient['id'] and not p.get('archived_at'))
original_count=len(patient['meal_logs']);other_count=len(other['meal_logs']);description='QA diario Nutrigo aislado 9235'
new_tab('http://127.0.0.1:5181/?design=nutrigo');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')");js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):click('Usar tema claro')
click('Paciente');time.sleep(.4);nav('Diario de comidas');wait("!!document.querySelector('.nvpdiary')")
checks=[]
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")=='Diario de comidas'
assert not js("!!document.querySelector('.nv-daily,.reference-frame')")
assert js("document.querySelectorAll('.nvpdiary-metrics>article').length")==4
assert js("document.querySelectorAll('.nvpdiary-list>article').length")==original_count
checks.append(('patient-diary-opens-in-nutrigo',original_count))

# Search and state filters are real.
first=patient['meal_logs'][0];term=first['slot']
set_field('[aria-label="Buscar comidas"]',term);time.sleep(.2)
assert js("document.querySelectorAll('.nvpdiary-list>article').length")>=1
set_field('[aria-label="Buscar comidas"]','qa-no-match-918');time.sleep(.2)
assert 'Sin registros para mostrar' in js("document.querySelector('.nvpdiary-card').innerText")
set_field('[aria-label="Buscar comidas"]','');click('En revisión');
assert js("[...document.querySelectorAll('.nvpdiary-list .nv-badge')].every(e=>e.textContent.includes('Pendiente'))")
click('Todos');checks.append(('search-and-status-filters',True))

# Reuse the operational capture flow, now visually scoped to Nutrigo.
click('Registrar comida');wait("!!document.querySelector('.meal-capture-modal')")
modal_style=js("({font:getComputedStyle(document.querySelector('.photo-modal')).fontFamily,bg:getComputedStyle(document.querySelector('.photo-modal')).backgroundColor})")
assert 'Poppins' in modal_style['font'] and modal_style['bg']!='rgba(0, 0, 0, 0)',modal_style
click('Describir');click('Extra');set_field('.meal-desc',description);click('Analizar con IA')
wait("document.querySelector('.photo-modal')?.innerText.includes('Esto es lo que vemos')")
assert description in js("document.querySelector('.photo-modal').innerText")
assert 'pendiente de Verónica' in js("document.querySelector('.photo-modal').innerText")
click('Guardar comida');wait("document.querySelector('.photo-modal')?.innerText.toLowerCase().includes('comida registrada')")
click('Volver a mi día');wait("!document.querySelector('.photo-modal')")
wait("document.querySelector('.nvpdiary')?.innerText.includes("+json.dumps(description)+")")
updated=api('patients/'+patient['id'])['patient'];untouched=api('patients/'+other['id'])['patient']
created=next((m for m in updated['meal_logs'] if m.get('description')==description),None)
assert created and created['patient_id']==patient['id'] and created['slot']=='Extra' and created['status']=='pending_review',created
assert len(updated['meal_logs'])==original_count+1 and len(untouched['meal_logs'])==other_count
checks.append(('register-readback-isolated',created['id']))

# Private professional fields stay out of patient DOM.
private=[]
if updated.get('adherence_why'):private.append(updated['adherence_why'])
for entry in updated.get('goal_history',[]):
    if entry.get('note'):private.append(entry['note'])
for log in updated.get('meal_logs',[]):
    if log.get('note_for_nutri'):private.append(log['note_for_nutri'])
body=js("document.querySelector('.nv-app').innerText")
for value in private:assert value not in body,value
checks.append(('private-fields-excluded',len(private)))

# Responsive/theme matrix after real state refresh.
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,root:document.querySelector('.nvpdiary').getBoundingClientRect().width,metrics:document.querySelectorAll('.nvpdiary-metrics>article').length,rail:!!document.querySelector('.nv-daily'),legacy:!!document.querySelector('.reference-frame'),main:document.querySelector('.nv-main').getBoundingClientRect().width})")
        assert state['scroll']<=width and state['root']>0 and state['metrics']==4 and not state['rail'] and not state['legacy'],state
        if width==1440:assert state['main']>=1150,state
        state['theme']='dark' if dark else 'light';results.append(state)
checks.append(('responsive-themes',len(results)))
assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8');(out/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(checks),'views':len(results),'patient':patient['id'],'created':created['id'],'otherUntouched':True,'errors':[]}))
