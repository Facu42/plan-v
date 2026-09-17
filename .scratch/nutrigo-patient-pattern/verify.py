# Verify the patient reference layout and navigation
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-patient-pattern');out.mkdir(exist_ok=True,parents=True)
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.np-dashboard')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,1280,800,390,320]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,cards:document.querySelectorAll('.np-metrics .nv-metric').length,menuTop:document.querySelector('.np-menu-card').getBoundingClientRect().top,charts:[...document.querySelectorAll('.np-chart-grid>.nv-card')].map(e=>({height:e.getBoundingClientRect().height,width:e.getBoundingClientRect().width})),logo:document.querySelector('.nv-brand img').naturalWidth,images:[...document.querySelectorAll('.np-food-photo')].map(i=>({url:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0}))})")
        assert state['scroll']<=width,state
        assert state['cards']==4 and state['logo']>0,state
        if width==1440:assert state['menuTop']<760,state
        results.append({'theme':'dark' if dark else 'light','state':state,'shot':shot(('dark' if dark else 'light')+'-'+str(width))})
        (out/'visual-checks.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
# Search remains functional and carries the query into the existing plan view.
fill_input('input[aria-label="Buscar en mi plan"]','Wrap');click('Buscar comidas en mi plan')
wait("!!document.querySelector('.nv-plan-grid')")
assert js("document.querySelector('input[aria-label=\"Buscar comidas\"]').value")=='Wrap'
assert js("[...document.querySelectorAll('.nv-plan-grid article')].every(e=>e.textContent.toLowerCase().includes('wrap'))")
click('Inicio');click('Ver conversación');wait("!!document.querySelector('.nv-thread')");click('Inicio')
click('Ver plan');wait("!!document.querySelector('.nv-plan-grid')");click('Inicio')
# Keep professional shell/operations available, without adopting patient-only styling.
click('Nutricionista');assert not js("document.querySelector('.nv-app').classList.contains('nv-patient')")
assert js("document.querySelectorAll('.nv-sidebar nav button').length")==11
click('Abrir ficha');wait("!!document.querySelector('.patient-record')");click('← Volver al diseño');wait("!!document.querySelector('.nv-app')")
click('Paciente')
# Mobile menu, real navigation and visible focus.
cdp('Emulation.setDeviceMetricsOverride',width=390,height=1000,deviceScaleFactor=1,mobile=False)
click('Abrir menú');assert js("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
click('Plan semanal');assert not js("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
cdp('Input.dispatchKeyEvent',type='keyDown',key='Tab',code='Tab',windowsVirtualKeyCode=9)
cdp('Input.dispatchKeyEvent',type='keyUp',key='Tab',code='Tab',windowsVirtualKeyCode=9)
assert js("getComputedStyle(document.activeElement).outlineStyle")!='none'
assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'interactions.json').write_text(json.dumps({'search':True,'plan':True,'messages':True,'professionalUnchanged':True,'mobileMenu':True,'focus':True,'errors':[]},indent=2),encoding='utf-8')
print(json.dumps({'captures':len(results),'interactions':'PASS','errors':[]}))
