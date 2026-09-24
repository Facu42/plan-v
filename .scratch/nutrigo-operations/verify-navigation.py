# Verify professional navigation and responsive context
import json, time, base64, urllib.request
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-operations')
def wait(expr):
    for _ in range(60):
        if js(expr): return
        time.sleep(.1)
    raise AssertionError(expr)
def click(name,role='button'):
    for n in cdp('Accessibility.getFullAXTree')['nodes']:
        if n.get('role',{}).get('value')==role and n.get('name',{}).get('value')==name:
            cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId'])
            b=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content']
            click_at_xy(sum(b[0::2])/4,sum(b[1::2])/4);time.sleep(.2);return
    raise RuntimeError('Missing '+name)
def key(name,code):
    for kind in ['keyDown','keyUp']:cdp('Input.dispatchKeyEvent',type=kind,key=name,code=name,windowsVirtualKeyCode=code)
def shot(name):
    cdp('Page.bringToFront');js('window.scrollTo(0,0)');time.sleep(.2)
    p=out/(name+'.png');p.write_bytes(base64.b64decode(cdp('Page.captureScreenshot',format='png')['data']));return str(p)
def save(data): (out/'navigation.json').write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
def back():
    click('← Volver al diseño');wait("!!document.querySelector('.nv-app')")
    assert js("document.querySelector('select[aria-label=\"Paciente en seguimiento\"]').value")=='pat-marina'

new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
click('Nutricionista')
click('Pacientes');fill_input('input[type=search]','Marina');time.sleep(.2);click('Ver seguimiento')
assert 'Marina' in js("document.querySelector('.nv-context-banner').textContent")
# Independent read confirms the displayed KPIs, not decorative values.
data=json.load(urllib.request.urlopen('http://127.0.0.1:3010/api/patients'))['patients']
active=[p for p in data if not p.get('archived_at')]
expected=[str(len(active)),str(sum(l['status']=='pending_review' and l['patient_id']==p['id'] for p in active for l in p['meal_logs'])),str(int(sum(p['adherence_score'] for p in active)/len(active)+.5))+'%',str(sum(bool(p.get('appointment')) for p in active))]
assert js("[...document.querySelectorAll('.nv-pro-metrics .nv-metric>strong')].map(x=>x.textContent)")==expected
report={'kpis':expected,'screens':[],'actions':[],'modules':[]}
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,1024,800,390,320]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.2)
        assert js('document.documentElement.scrollWidth<=innerWidth'),width
        assert js("document.querySelector('select[aria-label=\"Paciente en seguimiento\"]').value")=='pat-marina'
        report['screens'].append({'width':width,'dark':dark,'path':shot(f'crm-{width}-'+('dark' if dark else 'light'))});save(report)
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
for label,tab in [('Abrir ficha','Resumen'),('Revisar comidas','Comidas y hábitos'),('Editar plan','Plan'),('Gestionar consultas','Consultas')]:
    click(label);wait("!!document.querySelector('.patient-record h1')")
    assert 'Marina' in js("document.querySelector('.patient-record h1').textContent")
    assert js("document.querySelector('.record-tabs button.active').textContent")==tab
    report['actions'].append(label);save(report);back()
for name in ['Reciente','Guardado','Centro de seguimiento','Paneles','Actividades','Fichas','Videollamadas','Agenda','Objetivos']:
    click(name);wait("document.querySelectorAll('.menu-group button').length===11")
    assert js("document.querySelector('.menu-current .menu-label').textContent")==name
    report['modules'].append(name);save(report);back()
# Keyboard patient selection must change the record target too.
click('Paciente en seguimiento','combobox');key('Home',36);key('Enter',13);time.sleep(.2)
other=js("document.querySelector('select[aria-label=\"Paciente en seguimiento\"]').selectedOptions[0].textContent")
assert 'Marina' not in other
click('Abrir ficha');wait("!!document.querySelector('.patient-record h1')")
assert js("document.querySelector('.patient-record h1').textContent")==other
click('← Volver al diseño');wait("!!document.querySelector('.nv-app')")
report['otherPatient']=other
report['errors']=js('window.__qaErrors');assert not report['errors'];save(report)
assert len(report['screens'])==10 and len(report['actions'])==4 and len(report['modules'])==9
print(json.dumps(report,ensure_ascii=False))
