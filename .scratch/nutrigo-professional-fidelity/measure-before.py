import json
import os
import time

OUT=os.path.abspath('.scratch/nutrigo-professional-fidelity')
os.makedirs(OUT,exist_ok=True)

def body(): return js('document.body.innerText') or ''
def click(text,selector='button'):
    ok=js(f'''(() => {{const n=[...document.querySelectorAll({json.dumps(selector)})].find(e=>e.textContent.trim()==={json.dumps(text)});if(!n)return false;n.click();return true}})()''')
    if not ok: raise AssertionError('No se encontró '+text)
def rect(selector):
    return js(f'''(() => {{const e=document.querySelector({json.dumps(selector)});if(!e)return null;const r=e.getBoundingClientRect();return {{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}}}})()''')

new_tab('http://127.0.0.1:5180/')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1232,deviceScaleFactor=1,mobile=False)
js("localStorage.setItem('plan-v:theme','light');location.reload()")
wait_for_load()
for _ in range(50):
    if 'Continuar en modo demo' in body(): break
    time.sleep(.1)
click('Continuar en modo demo')
for _ in range(50):
    if 'Hola, Sofía.' in body(): break
    time.sleep(.1)
click('Nutricionista','.nv-role-switch button')
time.sleep(.6)
metrics={name:rect(sel) for name,sel in {
    'sidebar':'.nv-sidebar','topbar':'.nv-topbar','content':'.nv-content-layout','main':'.nv-main','daily':'.nv-daily',
    'head':'.nv-page-head','summary':'.nv-pro-summary','toolbar':'.nv-work-toolbar','context':'.nv-context-banner',
    'patient_metrics':'.np-metrics','charts':'.np-chart-grid','followup':'.np-followup','bottom':'.np-bottom-grid'
}.items()}
metrics['viewport']={'w':js('innerWidth'),'scrollW':js('document.documentElement.scrollWidth')}
print(json.dumps(metrics,ensure_ascii=False))
print(capture_screenshot(path=os.path.join(OUT,'after-light-1440-final.png'),full=False))
