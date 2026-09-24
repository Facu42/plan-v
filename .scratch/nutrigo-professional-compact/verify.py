# Verify default local entry and compact professional dashboard
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional-compact')
out.mkdir(exist_ok=True)
new_tab('http://127.0.0.1:5180/');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-patient')")
assert js('location.pathname+location.search')=='/'
assert js("document.querySelector('.nv-back').getAttribute('href')")=='?design=legacy'
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
click('Nutricionista');wait("!!document.querySelector('.nv-pro .nv-work-toolbar')")
js("document.fonts.ready.then(()=>true)")
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390,320]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False)
        time.sleep(.3)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,modules:document.querySelectorAll('.nv-sidebar nav button').length,actions:document.querySelectorAll('.nv-work-toolbar .nv-button').length,summary:document.querySelectorAll('.nv-pro-summary dd').length,chartTop:document.querySelector('.nv-chart-grid').getBoundingClientRect().top})")
        assert state['scroll']<=width,state
        assert state['modules']==11 and state['actions']==6 and state['summary']==4,state
        if width==1440:assert state['chartTop']<700,state
        state.update(theme='dark' if dark else 'light',shot=shot(('dark' if dark else 'light')+'-'+str(width)))
        results.append(state)
        (out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False)
options=js("[...document.querySelector('.nv-patient-select select').options].map(o=>({id:o.value,name:o.textContent}))")
assert len(options)>=2
# Select by keyboard, then verify both displayed patient context and operation return.
n=next(n for n in cdp('Accessibility.getFullAXTree')['nodes'] if n.get('role',{}).get('value')=='combobox' and n.get('name',{}).get('value')=='Paciente en seguimiento')
cdp('DOM.focus',backendNodeId=n['backendDOMNodeId'])
for key,code in [('Home',36),('ArrowDown',40),('Enter',13)]:
    cdp('Input.dispatchKeyEvent',type='keyDown',key=key,windowsVirtualKeyCode=code)
    cdp('Input.dispatchKeyEvent',type='keyUp',key=key,windowsVirtualKeyCode=code)
time.sleep(.3)
selected=js("document.querySelector('.nv-patient-select select').value")
assert selected==options[1]['id'],selected
assert options[1]['name'] in js("document.querySelector('.nv-context-banner').textContent")
click('Abrir ficha');wait("!!document.querySelector('.patient-record')")
assert options[1]['name'] in js("document.querySelector('.patient-record').textContent")
click('← Volver al diseño');wait("!!document.querySelector('.nv-pro')")
assert js("document.querySelector('.nv-patient-select select').value")==selected
assert not js('window.__qaErrors'),js('window.__qaErrors')
click('Versión anterior',role='link');wait_for_load()
wait("!!document.querySelector('.auth-card,.prototype-switch')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.prototype-switch')")
assert js('location.search')=='?design=legacy'
click('Nuevo diseño',role='link');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
assert len(results)==len({(r['theme'],r['width']) for r in results})==8
print(json.dumps({'rootDefault':'Nutrigo','legacyAccess':'PASS','captures':len(results),'selectedPatientRoundtrip':'PASS','modules':11,'errors':[]}))
