# Verify the patient Progress surface inside Nutrigo.
import base64,json,time,urllib.request
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-progress');out.mkdir(parents=True,exist_ok=True)
def wait(expr):
    for _ in range(80):
        if js(expr): return
        time.sleep(.1)
    raise AssertionError(expr)
def click(name,role='button'):
    for _ in range(5):
        for n in cdp('Accessibility.getFullAXTree')['nodes']:
            if n.get('role',{}).get('value')==role and n.get('name',{}).get('value')==name:
                cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId'])
                q=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content'];click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4);time.sleep(.3);return
        time.sleep(.3)
    raise AssertionError('Missing '+name)
def nav(label):
    if js("document.querySelector('.nv-sidebar').getBoundingClientRect().right<=0"):
        click('Abrir menú');wait("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
    click(label)
def shot(name,width,height):
    data=cdp('Page.captureScreenshot',format='png',captureBeyondViewport=False,clip={'x':0,'y':0,'width':width,'height':height,'scale':1})['data']
    (out/name).write_bytes(base64.b64decode(data))

patients=json.load(urllib.request.urlopen('http://127.0.0.1:3010/api/patients'))['patients']
patient=next(p for p in patients if not p.get('archived_at'))
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=900,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):click('Usar tema claro');wait("!document.querySelector('.nv-app').classList.contains('nv-dark')")
click('Paciente');time.sleep(.4);nav('Progreso');wait("!!document.querySelector('.nvp-progress')")
checks=[]
text=js("document.querySelector('.nvp-progress').innerText")
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")=='Progreso'
assert not js("!!document.querySelector('.nv-daily,.reference-frame')")
assert patient['goal'] in text and str(patient['adherence_score'])+'%' in text
assert js("document.querySelectorAll('.nvp-days article').length")==7
assert js("document.querySelectorAll('.nvp-chart article').length")==7
assert 'No se completan períodos sin registros' in text
assert 'IMC' not in text and 'Peso' not in text
checks.append(('patient-progress-opens-in-nutrigo',patient['id']))

# Exact professional-only fields never enter the patient surface.
private=[]
if patient.get('adherence_why'):private.append(patient['adherence_why'])
for entry in patient.get('goal_history',[]):
    if entry.get('note'):private.append(entry['note'])
for log in patient.get('meal_logs',[]):
    if log.get('note_for_nutri'):private.append(log['note_for_nutri'])
for value in private:
    assert value not in js("document.querySelector('.nv-app').innerText"),value
checks.append(('private-fields-excluded',len(private)))

# Responsive/theme matrix and evidence.
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=900,deviceScaleFactor=1,mobile=False);time.sleep(.3)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,root:document.querySelector('.nvp-progress').getBoundingClientRect().width,metrics:document.querySelectorAll('.nvp-metrics>article').length,days:document.querySelectorAll('.nvp-days article').length,rail:!!document.querySelector('.nv-daily'),legacy:!!document.querySelector('.reference-frame'),main:document.querySelector('.nv-main').getBoundingClientRect().width,dayOverflow:document.querySelector('.nvp-days').scrollWidth>document.querySelector('.nvp-days').clientWidth})")
        assert state['scroll']<=width and state['root']>0 and state['metrics']==4 and state['days']==7 and not state['rail'] and not state['legacy'],state
        if width==1440:assert state['main']>=1150,state
        if width==390:assert state['dayOverflow'],state
        state['theme']='dark' if dark else 'light';results.append(state)
checks.append(('responsive-themes',len(results)))
assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
(out/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(checks),'views':len(results),'patient':patient['id'],'private':len(private),'errors':[]}))
