import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-comparison')
os.makedirs(OUT, exist_ok=True)


def body():
    return js('document.body.innerText') or ''


def click(text, selector='button'):
    ok = js(f'''(() => {{const n=[...document.querySelectorAll({json.dumps(selector)})].find(e=>e.textContent.trim()==={json.dumps(text)});if(!n)return false;n.click();return true}})()''')
    if not ok:
        raise AssertionError('No se encontró '+text)


def enter(role):
    for _ in range(60):
        if 'Continuar en modo demo' in body(): break
        time.sleep(.1)
    click('Continuar en modo demo')
    for _ in range(60):
        if 'Hola, Sofía.' in body(): break
        time.sleep(.1)
    if role == 'pro':
        click('Nutricionista', '.nv-role-switch button')
        for _ in range(60):
            if 'Mi trabajo' in body(): break
            time.sleep(.1)
    time.sleep(.4)


new_tab('http://127.0.0.1:5180/')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=1232, deviceScaleFactor=1, mobile=False)
js("localStorage.setItem('plan-v:theme','light'); location.reload()")
wait_for_load()
enter('patient')
if js('document.documentElement.scrollWidth') > 1440:
    raise AssertionError('Overflow paciente')
print(capture_screenshot(path=os.path.join(OUT, 'patient-light-1440.png'), full=False))

js("localStorage.setItem('plan-v:theme','light'); location.reload()")
wait_for_load()
enter('pro')
if js('document.documentElement.scrollWidth') > 1440:
    raise AssertionError('Overflow profesional')
print(capture_screenshot(path=os.path.join(OUT, 'pro-light-1440.png'), full=False))
print('OK')
