# Verify the read-only Nutrigo patient agenda.
import base64,json,time,urllib.request
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-patient-agenda');out.mkdir(parents=True,exist_ok=True)
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
def nav(label):
    if js("document.querySelector('.nv-sidebar').getBoundingClientRect().right<=0"):
        click('Abrir menú');wait("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
    click(label)
def shot(name,width,height):
    cdp('Page.bringToFront');time.sleep(.1)
    data=cdp('Page.captureScreenshot',format='png',captureBeyondViewport=False,clip={'x':0,'y':0,'width':width,'height':height,'scale':1})['data']
    (out/name).write_bytes(base64.b64decode(data))

patients=api('patients')['patients'];patient=next(p for p in patients if not p.get('archived_at'))
assert patient['appointment'],patient['id']
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')");js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):click('Usar tema claro')
click('Paciente');time.sleep(.4);nav('Agenda');wait("!!document.querySelector('.nvpa-agenda')")
checks=[]
state=js("({active:document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim(),cells:document.querySelectorAll('[data-patient-agenda-day]').length,marked:document.querySelectorAll('.nvpa-appointment').length,stats:document.querySelectorAll('.nvpa-summary>div').length,rail:!!document.querySelector('.nv-daily'),legacy:!!document.querySelector('.reference-frame')})")
assert state['active']=='Agenda' and state['cells'] in [35,42] and state['marked']==1 and state['stats']==3 and not state['rail'] and not state['legacy'],state
body=js("document.querySelector('.nvpa-agenda').innerText")
assert patient['appointment']['when'] in body and f"{patient['appointment']['duration']} min" in body
for forbidden in ['Reagendar','Cancelar turno','Guardar turno']:
    assert forbidden not in body,forbidden
checks.append(('patient-agenda-opens-in-nutrigo',state['cells']))

# Contact action lands in the real message surface and returns safely.
click('Escribirle a Verónica');wait("!!document.querySelector('.nm-layout')")
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")=='Mensajes'
nav('Agenda');wait("!!document.querySelector('.nvpa-agenda')")
checks.append(('contact-action-opens-messages',True))

# Private professional fields stay out of patient DOM.
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
        layout=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,root:document.querySelector('.nvpa-agenda').getBoundingClientRect().width,cells:document.querySelectorAll('[data-patient-agenda-day]').length,marked:document.querySelectorAll('.nvpa-appointment').length,rail:!!document.querySelector('.nv-daily'),main:document.querySelector('.nv-main').getBoundingClientRect().width})")
        assert layout['scroll']<=width and layout['root']>0 and layout['cells'] in [35,42] and layout['marked']==1 and not layout['rail'],layout
        if width==1440:assert layout['main']>=1150,layout
        layout['theme']='dark' if dark else 'light';results.append(layout)
        if not dark and width==1440:shot('patient-agenda-light-1440.png',1440,1000)
        if dark and width==390:shot('patient-agenda-dark-390.png',390,1000)
checks.append(('responsive-themes',len(results)))
assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8');(out/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(checks),'views':len(results),'patient':patient['id'],'calendarCells':state['cells'],'private':len(private),'errors':[]}))
