import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-visual-fidelity')
os.makedirs(OUT, exist_ok=True)


def body():
    return js('document.body.innerText') or ''


def click(text, selector='button'):
    ok = js(f'''(() => {{const n=[...document.querySelectorAll({json.dumps(selector)})].find(e=>e.textContent.trim()==={json.dumps(text)});if(!n)return false;n.click();return true}})()''')
    if not ok:
        raise AssertionError('No se encontró '+text)


def rect(selector):
    return js(f'''(() => {{const e=document.querySelector({json.dumps(selector)});if(!e)return null;const r=e.getBoundingClientRect();return {{x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom}}}})()''')

new_tab('http://127.0.0.1:5180/')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=1232, deviceScaleFactor=1, mobile=False)
js("localStorage.setItem('plan-v:theme','light'); location.reload()")
wait_for_load()
for _ in range(50):
    if 'Continuar en modo demo' in body(): break
    time.sleep(.1)
click('Continuar en modo demo')
for _ in range(50):
    if 'Hola, Sofía.' in body(): break
    time.sleep(.1)
time.sleep(.5)
metrics = {
    'viewport': {'w': js('innerWidth'), 'h': js('innerHeight'), 'scrollW': js('document.documentElement.scrollWidth')},
    'sidebar': rect('.nv-sidebar'),
    'brand': rect('.nv-brand'),
    'content': rect('.nv-content-layout'),
    'main': rect('.nv-main'),
    'head': rect('.nv-page-head'),
    'metrics': rect('.np-metrics'),
    'metric_first': rect('.np-metrics .nv-metric'),
    'charts': rect('.np-chart-grid'),
    'goal': rect('.np-goal'),
    'nutrition': rect('.np-nutrition-card'),
    'followup': rect('.np-followup'),
    'bottom': rect('.np-bottom-grid'),
    'daily': rect('.nv-daily'),
    'font': js("getComputedStyle(document.querySelector('.nv-app')).fontFamily"),
    'h1': js("(() => {const s=getComputedStyle(document.querySelector('.nv-page-head h1'));return {size:s.fontSize,weight:s.fontWeight,line:s.lineHeight}})()"),
}
print(json.dumps(metrics, ensure_ascii=False))
print(capture_screenshot(path=os.path.join(OUT, 'after-light-1440-final.png'), full=False))
