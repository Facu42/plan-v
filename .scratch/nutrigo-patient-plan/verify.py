# Verify the read-only Nutrigo patient weekly plan.
import base64,json,time,urllib.request
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-patient-plan');out.mkdir(parents=True,exist_ok=True)
def api(path):return json.load(urllib.request.urlopen('http://127.0.0.1:3010/api/'+path))
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
        time.sleep(.25)
    raise AssertionError('Missing '+name)
def click_selector(selector,index=0):
    box=js("(() => {const e=document.querySelectorAll("+json.dumps(selector)+")["+str(index)+"];if(!e)return null;const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}})()")
    assert box,(selector,index);click_at_xy(box['x'],box['y']);time.sleep(.25)
def nav(label):
    if js("document.querySelector('.nv-sidebar').getBoundingClientRect().right<=0"):
        click('Abrir menú');wait("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
    click(label)
def set_field(selector,value):
    result=js("(() => {const e=document.querySelector("+json.dumps(selector)+");if(!e)return null;const p=HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(e,"+json.dumps(value)+");e.dispatchEvent(new Event('input',{bubbles:true}));return e.value})()")
    assert result==value,(selector,result)
def shot(name,width,height):
    cdp('Page.bringToFront');time.sleep(.1)
    data=cdp('Page.captureScreenshot',format='png',captureBeyondViewport=False,clip={'x':0,'y':0,'width':width,'height':height,'scale':1})['data']
    (out/name).write_bytes(base64.b64decode(data))

patients=api('patients')['patients'];patient=next(p for p in patients if not p.get('archived_at'))
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')");js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):click('Usar tema claro')
click('Paciente');time.sleep(.4);nav('Plan semanal');wait("!!document.querySelector('.nvpp-plan')")
checks=[]
state=js("({active:document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim(),days:document.querySelectorAll('.nvpp-day').length,rail:!!document.querySelector('.nv-daily'),legacy:!!document.querySelector('.reference-frame'),summary:document.querySelectorAll('.nvpp-summary>div').length})")
assert state=={'active':'Plan semanal','days':7,'rail':False,'legacy':False,'summary':3},state
assert 'Plan publicado por tu nutricionista' in js("document.querySelector('.nvpp-plan').innerText")
checks.append(('patient-plan-opens-in-nutrigo',True))

# Every day can be selected and the detail updates without edit controls.
for index in range(7):
    click_selector('.nvpp-day',index)
    assert js("document.querySelectorAll('.nvpp-day[aria-pressed=true]').length")==1
    assert js("[...document.querySelectorAll('.nvpp-day')].findIndex(e=>e.getAttribute('aria-pressed')==='true')")==index
body=js("document.querySelector('.nvpp-plan').innerText")
for forbidden in ['Guardar','Quitar','Agregar comida','Cómo prepararla','Tip de sabor']:
    assert forbidden not in body,forbidden
checks.append(('seven-read-only-days',7))

# Search spans the whole week and returns exact published titles.
meal=next(m for d in patient['weekPlan'] for m in d['meals'])
set_field('[aria-label="Buscar comidas"]',meal['title']);wait("!!document.querySelector('.nvpp-results')")
assert meal['title'] in js("document.querySelector('.nvpp-results').innerText")
set_field('[aria-label="Buscar comidas"]','qa-no-match-9236');time.sleep(.2)
assert 'Sin coincidencias' in js("document.querySelector('.nvpp-results').innerText")
set_field('[aria-label="Buscar comidas"]','');wait("!!document.querySelector('.nvpp-detail')")
checks.append(('weekly-search',meal['title']))

# No private professional fields enter the patient DOM.
private=[]
if patient.get('adherence_why'):private.append(patient['adherence_why'])
for entry in patient.get('goal_history',[]):
    if entry.get('note'):private.append(entry['note'])
for log in patient.get('meal_logs',[]):
    if log.get('note_for_nutri'):private.append(log['note_for_nutri'])
body=js("document.querySelector('.nv-app').innerText")
for value in private:assert value not in body,value
checks.append(('private-fields-excluded',len(private)))

results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        layout=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,root:document.querySelector('.nvpp-plan').getBoundingClientRect().width,days:document.querySelectorAll('.nvpp-day').length,rail:!!document.querySelector('.nv-daily'),main:document.querySelector('.nv-main').getBoundingClientRect().width})")
        assert layout['scroll']<=width and layout['root']>0 and layout['days']==7 and not layout['rail'],layout
        if width==1440:assert layout['main']>=1150,layout
        layout['theme']='dark' if dark else 'light';results.append(layout)
        if not dark and width==1440:shot('patient-plan-light-1440.png',1440,1000)
        if dark and width==390:shot('patient-plan-dark-390.png',390,1000)
checks.append(('responsive-themes',len(results)))
assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8');(out/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(checks),'views':len(results),'patient':patient['id'],'days':7,'private':len(private),'errors':[]}))
