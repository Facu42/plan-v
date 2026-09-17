# Inspect patient layout and exercise dashboard navigation
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-patient-v2')
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.np-dashboard')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
results=[]
for dark in [False,True]:
    current=js("document.querySelector('.nv-app').classList.contains('nv-dark')")
    if current!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,1024,800,390,320]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=False)
        time.sleep(.3)
        wait("[...document.querySelectorAll('.np-food-photo')].every(i=>i.complete&&i.naturalWidth>0)")
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,photos:document.querySelectorAll('.np-food-photo').length,sidebar:document.querySelector('.nv-sidebar').getBoundingClientRect().width,charts:document.querySelector('.np-chart-grid').getBoundingClientRect().toJSON(),font:getComputedStyle(document.querySelector('.nv-main h1')).fontFamily})")
        assert state['scroll']<=width,state
        results.append({'dark':dark,'width':width,'state':state,'shot':shot(('dark' if dark else 'light')+'-'+str(width))})
(out/'screens.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
fill_input('input[aria-label="Buscar en mi plan"]','Wrap');click('Buscar comidas en mi plan')
wait("!!document.querySelector('.nv-plan-grid')")
assert js("[...document.querySelectorAll('.nv-plan-grid article p')].every(e=>e.textContent.toLowerCase().includes('wrap'))")
assert js("document.querySelectorAll('.nv-plan-grid article').length")>0
click('Inicio');wait("!!document.querySelector('.np-dashboard')")
for name,selector in [('Últimos 7 días','.nv-ring'),('Ver plan completo','.nv-plan-grid'),('Ver conversación','.nv-thread')]:
    click(name);wait('!!document.querySelector('+json.dumps(selector)+')');click('Inicio');wait("!!document.querySelector('.np-dashboard')")
click('Nutricionista');wait("!!document.querySelector('.nv-pro-metrics')")
assert not js("document.querySelector('.nv-app').classList.contains('nv-patient')")
assert js("document.querySelectorAll('.nv-sidebar nav button').length")==11
click('Abrir ficha');wait("!!document.querySelector('.reference-frame')")
click('← Volver al diseño');click('Paciente');wait("!!document.querySelector('.np-dashboard')")
assert not js('window.__qaErrors'),js('window.__qaErrors')
result={'responsive':len(results),'search':True,'navigation':True,'crmPreserved':True,'errors':[]}
(out/'verification.json').write_text(json.dumps(result,indent=2),encoding='utf-8')
print(json.dumps(result))
