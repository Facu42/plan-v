import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-typography')
os.makedirs(OUT, exist_ok=True)
checks = []


def body():
    return js('document.body.innerText') or ''


def click(text, selector='button'):
    ok = js(f'''(() => {{const n=[...document.querySelectorAll({json.dumps(selector)})].find(e=>e.textContent.trim()==={json.dumps(text)});if(!n)return false;n.click();return true}})()''')
    if not ok:
        raise AssertionError('No se encontró '+text)


def css(sel, prop):
    return js(f"getComputedStyle(document.querySelector({json.dumps(sel)}))[{json.dumps(prop)}]")


def set_view(width, height, theme):
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=height, deviceScaleFactor=1, mobile=width <= 390)
    js(f"localStorage.setItem('plan-v:theme',{json.dumps(theme)}); location.reload()")
    wait_for_load()
    for _ in range(60):
        if 'Continuar en modo demo' in body(): break
        time.sleep(.1)
    click('Continuar en modo demo')
    for _ in range(60):
        if 'Hola, Sofía.' in body(): break
        time.sleep(.1)
    js("window.__typoErrors=[];window.addEventListener('error',e=>window.__typoErrors.push(e.message))")
    time.sleep(.35)


def to_pro():
    click('Nutricionista', '.nv-role-switch button')
    for _ in range(60):
        if 'Mi trabajo' in body(): break
        time.sleep(.1)
    time.sleep(.4)


new_tab('http://127.0.0.1:5180/')
wait_for_load()

for theme in ('light', 'dark'):
    set_view(1440, 1232, theme)
    patient = {
        'ink': css('.nv-app', 'color'),
        'bg': css('.nv-app', 'backgroundColor'),
        'nav_h': css('.nv-sidebar nav button', 'minHeight'),
        'metric_h': css('.np-metrics .nv-metric', 'minHeight'),
        'green': css('.np-followup-grid>button', 'backgroundColor'),
    }
    to_pro()
    pro = {
        'ink': css('.nv-app', 'color'),
        'bg': css('.nv-app', 'backgroundColor'),
        'nav_h': css('.nv-sidebar nav button', 'minHeight'),
        'metric_h': css('.np-metrics .nv-metric', 'minHeight'),
        'green': css('.np-followup-grid>button', 'backgroundColor'),
    }
    if patient != pro:
        raise AssertionError(f'Deriva paciente/profesional en {theme}: {json.dumps({"patient": patient, "pro": pro}, ensure_ascii=False)}')
    if js('document.documentElement.scrollWidth') > 1440:
        raise AssertionError('Overflow horizontal en escritorio ' + theme)
    checks.append(f'paridad-tokens-{theme}')

set_view(1440, 1232, 'light')
scale = {
    'h1': (css('.nv-page-head h1', 'fontSize'), '25px'),
    'h1_w': (css('.nv-page-head h1', 'fontWeight'), '700'),
    'card_h2': (css('.np-chart-grid .nv-card-head h2', 'fontSize'), '14px'),
    'metric_value': (css('.np-metrics .nv-metric>strong', 'fontSize'), '23px'),
    'gauge': (css('.np-gauge strong', 'fontSize'), '30px'),
    'badge': (css('.np-plan-meal .nv-badge', 'fontSize'), '9px'),
}
bad = {k: v for k, v in scale.items() if v[0] != v[1]}
if bad:
    raise AssertionError('Escala tipográfica rota: ' + json.dumps(bad))
if css('.nv-app', 'fontFamily').split(',')[0] != 'Poppins':
    raise AssertionError('La familia tipográfica no es Poppins')
checks.append('escala-tipografica')
print(capture_screenshot(path=os.path.join(OUT, 'patient-light-final.png'), full=False))

set_view(800, 1100, 'light')
if js('document.documentElement.scrollWidth') > 800:
    raise AssertionError('Overflow horizontal en tablet')
checks.append('tablet')
set_view(390, 844, 'dark')
if js('document.documentElement.scrollWidth') > 390:
    raise AssertionError('Overflow horizontal en móvil')
if js("[...document.querySelectorAll('.np-metrics .nv-metric')].some(e=>e.scrollHeight>e.clientHeight+1)"):
    raise AssertionError('Métricas recortadas en móvil')
checks.append('mobile-dark')
print(capture_screenshot(path=os.path.join(OUT, 'patient-dark-390-final.png'), full=False))

errors = js('window.__typoErrors || []') or []
if errors:
    raise AssertionError('Errores JS: ' + json.dumps(errors))
print(json.dumps({'checks': checks, 'errors': errors}, ensure_ascii=False))
