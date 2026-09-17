# Verify operational Nutrigo messaging on isolated services.
import base64,json,time,urllib.request
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-messages');out.mkdir(parents=True,exist_ok=True)
def api(path):return json.load(urllib.request.urlopen('http://127.0.0.1:3012/api/'+path))
def wait(expr):
    for _ in range(120):
        if js(expr):return
        time.sleep(.1)
    raise AssertionError(expr)
def click(name,role='button'):
    for _ in range(6):
        for n in cdp('Accessibility.getFullAXTree')['nodes']:
            if n.get('role',{}).get('value')==role and n.get('name',{}).get('value')==name:
                cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId']);q=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content'];click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4);time.sleep(.35);return
        time.sleep(.25)
    raise AssertionError('Missing '+name)
def click_selector(selector,index=0):
    nodes=cdp('DOM.querySelectorAll',nodeId=cdp('DOM.getDocument')['root']['nodeId'],selector=selector)['nodeIds'];assert len(nodes)>index,(selector,len(nodes))
    q=cdp('DOM.getBoxModel',nodeId=nodes[index])['model']['content'];click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4);time.sleep(.35)
def nav(label):
    if js("document.querySelector('.nv-sidebar').getBoundingClientRect().right<=0"):
        click('Abrir menú');wait("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
    click(label)
def shot(name,width,height):
    cdp('Page.bringToFront');time.sleep(.1)
    data=cdp('Page.captureScreenshot',format='png',captureBeyondViewport=False,clip={'x':0,'y':0,'width':width,'height':height,'scale':1})['data']
    (out/name).write_bytes(base64.b64decode(data))

def patient_record(pid):return next(p for p in api('patients')['patients'] if p['id']==pid)
patients=[p for p in api('patients')['patients'] if not p.get('archived_at')]
patient,other=patients[0],patients[1]
before_patient=len(patient['messages']);before_other=len(other['messages'])
new_tab('http://127.0.0.1:5182/?design=nutrigo');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')");js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):click('Usar tema claro')
click('Paciente');time.sleep(.4);nav('Mensajes');wait("!!document.querySelector('.nm-layout')")
checks=[]
state=js("({active:document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim(),contacts:document.querySelectorAll('.nm-contact-list>button').length,profile:!!document.querySelector('.nm-profile'),composer:!!document.querySelector('#nm-message'),rail:!!document.querySelector('.nv-daily')})")
assert state=={'active':'Mensajes','contacts':1,'profile':True,'composer':True,'rail':False},state
patient_text='QA paciente · mensaje aislado'
fill_input('#nm-message',patient_text);click('Enviar mensaje');wait("document.querySelector('#nm-status').innerText.includes('Mensaje enviado')")
updated=patient_record(patient['id']);assert len(updated['messages'])==before_patient+1 and updated['messages'][-1]['text']==patient_text and updated['messages'][-1]['from']=='patient' and updated['messages'][-1]['sent_at'],updated['messages'][-1]
assert len(patient_record(other['id'])['messages'])==before_other
checks.append(('patient-send-readback-isolated',True))
click('Ver mi agenda');wait("!!document.querySelector('.nvpa-agenda')")
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")=='Agenda'
checks.append(('patient-context-opens-agenda',True))

# Professional inbox search, selection, send, and profile actions.
click('Nutricionista');time.sleep(.5);click('Abrir mensajes');wait("!!document.querySelector('.nm-layout')")
fill_input('input[aria-label="Buscar conversaciones"]',other['name']);wait("document.querySelectorAll('.nm-contact-list>button').length===1")
click_selector('.nm-contact-list>button');wait("document.querySelector('.nm-conversation').getAttribute('aria-label')==="+json.dumps('Conversación con '+other['name']))
fill_input('input[aria-label="Buscar conversaciones"]','');time.sleep(.2)
pro_text='QA profesional · mensaje aislado'
fill_input('#nm-message',pro_text);click('Enviar mensaje');wait("document.querySelector('#nm-status').innerText.includes('Mensaje enviado')")
updated_other=patient_record(other['id']);assert len(updated_other['messages'])==before_other+1 and updated_other['messages'][-1]['text']==pro_text and updated_other['messages'][-1]['from']=='vero' and updated_other['messages'][-1]['sent_at'],updated_other['messages'][-1]
assert len(patient_record(patient['id'])['messages'])==before_patient+1
checks.append(('professional-search-select-send-isolated',True))
click('Abrir ficha');wait("!!document.querySelector('.nr-record')")
assert other['name'] in js("document.querySelector('.nr-record').innerText")
click('Abrir mensajes');wait("!!document.querySelector('.nm-layout')")
click('Ver consultas');wait("!!document.querySelector('.nvc-consultations')")
assert other['name'] in js("document.querySelector('.nvc-consultations').innerText")
checks.append(('professional-context-opens-record-and-consultations',True))

# Return to patient mode for privacy and responsive checks.
click('Paciente');time.sleep(.5);nav('Mensajes');wait("!!document.querySelector('.nm-layout')")
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
        layout=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,root:document.querySelector('.nm-layout').getBoundingClientRect().width,thread:document.querySelector('.nm-thread').getBoundingClientRect().width,contacts:document.querySelectorAll('.nm-contact-list>button').length,rail:!!document.querySelector('.nv-daily')})")
        assert layout['scroll']<=width and layout['root']>0 and layout['thread']>0 and layout['contacts']==1 and not layout['rail'],layout
        layout['theme']='dark' if dark else 'light';results.append(layout)
        if not dark and width==1440:shot('messages-light-1440.png',1440,1000)
        if dark and width==390:shot('messages-dark-390.png',390,1000)
checks.append(('responsive-themes',len(results)))
assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8');(out/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(checks),'views':len(results),'patient':patient['id'],'other':other['id'],'private':len(private),'errors':[]}))
