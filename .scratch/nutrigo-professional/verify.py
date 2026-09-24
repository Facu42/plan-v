# Verify professional navigation and responsive layout
import json, time, base64, urllib.request
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional')
out.mkdir(parents=True,exist_ok=True)
def wait(expr):
    for _ in range(50):
        if js(expr): return
        time.sleep(.1)
    raise AssertionError(expr)
def click(name,role='button'):
    nodes=cdp('Accessibility.getFullAXTree')['nodes']
    for n in nodes:
        if n.get('role',{}).get('value')==role and n.get('name',{}).get('value')==name:
            cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId'])
            q=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content']
            click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4)
            time.sleep(.2)
            return
    raise AssertionError('Missing '+name)
def shot(name):
    cdp('Page.bringToFront');js('window.scrollTo(0,0)');time.sleep(.2)
    p=out/(name+'.png')
    p.write_bytes(base64.b64decode(cdp('Page.captureScreenshot',format='png')['data']))
    return str(p)
def api(path):
    return json.load(urllib.request.urlopen('http://127.0.0.1:3010/api/'+path))
assert api('health')['supabase'] is False
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"): click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
click('Nutricionista')
results=[]
for dark in [False,True]:
    current=js("document.querySelector('.nv-app').classList.contains('nv-dark')")
    if current!=dark: click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,1024,800,390,320]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=False)
        time.sleep(.2)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,modules:document.querySelectorAll('.nv-sidebar nav button').length,selected:document.querySelector('.nv-patient-select select').value})")
        assert state['scroll']<=width,state
        assert state['modules']==11,state
        results.append({'theme':'dark' if dark else 'light','state':state,'shot':shot(('dark' if dark else 'light')+'-'+str(width))})
(out/'responsive.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
click('Pacientes');fill_input('input[type=search]','Marina');wait("document.querySelectorAll('.nv-patient-table [role=row]').length===2")
click('Ver seguimiento');wait("document.querySelector('.nv-context-banner').textContent.includes('Marina')")
for label,selector in [('Abrir ficha','.patient-record h1'),('Editar plan','.menu-editor'),('Gestionar consultas','.appointments-tab'),('Revisar comidas','.meals-habits-tab'),('Editar pacientes','.crm-patients'),('Gestionar objetivos','.crm-objectives')]:
    click(label);wait("!!document.querySelector('.reference-frame')")
    assert js("document.querySelector('.work-person.selected .person-copy b').textContent").startswith('Marina')
    if label in ['Abrir ficha','Editar plan','Gestionar consultas','Revisar comidas']:
        wait('!!document.querySelector('+json.dumps(selector)+')')
    else:
        print(label,js("document.querySelector('.crm-workspace').innerText.slice(0,180)"))
    click('← Volver al diseño');wait("!!document.querySelector('.nv-app')")
    assert js("document.querySelector('.nv-context-banner').textContent.includes('Marina')")
    results.append({'action':label,'patient':'Marina','returned':True})
assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(results),'errors':js('window.__qaErrors'),'result':'PASS'}))
