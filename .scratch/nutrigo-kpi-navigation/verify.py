import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-kpi-navigation')
os.makedirs(OUT, exist_ok=True)
checks = []


def body():
    return js('document.body.innerText') or ''


def click(text, selector='button'):
    ok = js(f'''(() => {{const n=[...document.querySelectorAll({json.dumps(selector)})].find(e=>e.textContent.trim()==={json.dumps(text)});if(!n)return false;n.click();return true}})()''')
    if not ok:
        raise AssertionError('No se encontró '+text)


def wait_text(value):
    for _ in range(60):
        if value in body(): return
        time.sleep(.1)
    raise AssertionError('No apareció '+value)


def click_label(label):
    ok = js(f'''(() => {{const n=document.querySelector('button[aria-label={json.dumps(label)}]');if(!n)return false;n.click();return true}})()''')
    if not ok:
        raise AssertionError('No se encontró '+label)


def enter(role='patient'):
    wait_text('Continuar en modo demo')
    click('Continuar en modo demo')
    wait_text('Hola, Sofía.')
    if role == 'pro':
        click('Nutricionista', '.nv-role-switch button')
        wait_text('Mi trabajo')
    time.sleep(.35)


new_tab('http://127.0.0.1:5180/')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=1232, deviceScaleFactor=1, mobile=False)
js("localStorage.setItem('plan-v:theme','light'); location.reload()")
wait_for_load()
enter('patient')
js("window.__kErrors=[];window.addEventListener('error',e=>window.__kErrors.push(e.message))")

if js("document.querySelectorAll('.np-metrics button.nv-openable').length") != 4:
    raise AssertionError('Los cuatro KPI no son botones navegables')
click_label('Ver detalle de Comidas revisadas')
wait_text('Diario de comidas')
click('Inicio', '.nv-sidebar button')
wait_text('Tu seguimiento')
checks.append('kpi-comidas-diario')

for label in ('Ver detalle de Adherencia', 'Ver detalle de Descanso', 'Ver detalle de Hidratación'):
    click_label(label)
    wait_text('Progreso')
    click('Inicio', '.nv-sidebar button')
    wait_text('Tu seguimiento')
checks.append('kpi-progreso')

if js('document.documentElement.scrollWidth') > 1440:
    raise AssertionError('Overflow horizontal en escritorio')
print(capture_screenshot(path=os.path.join(OUT, 'kpi-light-1440.png'), full=False))

click('Nutricionista', '.nv-role-switch button')
wait_text('Mi trabajo')
click_label('Ver detalle de Comidas revisadas')
wait_text('Diario de comidas')
if 'Sofía' not in body():
    raise AssertionError('El KPI profesional perdió la paciente seleccionada')
checks.append('kpi-pro-contexto')

cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=1, mobile=True)
js("localStorage.setItem('plan-v:theme','dark'); location.reload()")
wait_for_load()
enter('patient')
click_label('Ver detalle de Hidratación')
wait_text('Progreso')
if js('document.documentElement.scrollWidth') > 390:
    raise AssertionError('Overflow horizontal en móvil')
checks.append('mobile-dark')

errors = js('window.__kErrors || []') or []
if errors:
    raise AssertionError('Errores JS: ' + json.dumps(errors))
print(json.dumps({'checks': checks, 'errors': errors}, ensure_ascii=False))
