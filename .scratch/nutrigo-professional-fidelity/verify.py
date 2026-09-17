import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-professional-fidelity')
os.makedirs(OUT, exist_ok=True)
checks = []
errors = []


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


def number(selector, prop):
    return js(f'''(() => {{const e=document.querySelector({json.dumps(selector)});return e ? e.getBoundingClientRect()[{json.dumps(prop)}] : null}})()''')


def assert_close(actual, expected, label, tolerance=2):
    if actual is None or abs(actual - expected) > tolerance:
        raise AssertionError(f'{label}: {actual}, esperado {expected}±{tolerance}')


def set_view(width, height, theme):
    cdp('Emulation.setDeviceMetricsOverride', width=width, height=height, deviceScaleFactor=1, mobile=width <= 390)
    js(f"localStorage.setItem('plan-v:theme',{json.dumps(theme)}); location.reload()")
    wait_for_load()
    wait_text('Continuar en modo demo')
    click('Continuar en modo demo')
    wait_text('Hola, Sofía.')
    click('Nutricionista', '.nv-role-switch button')
    wait_text('Mi trabajo')
    js("window.__visualErrors=[];window.addEventListener('error',e=>window.__visualErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__visualErrors.push(String(e.reason)))")
    time.sleep(.5)


new_tab('http://127.0.0.1:5180/')
wait_for_load()

set_view(1440, 1232, 'light')
assert_close(number('.nv-sidebar', 'width'), 223, 'sidebar')
assert_close(number('.nv-daily', 'width'), 325, 'rail derecho')
assert_close(number('.nv-page-head', 'y'), 28, 'encabezado y')
assert_close(number('.nv-pro-summary', 'height'), 56, 'resumen agregado', 3)
assert_close(number('.nv-work-toolbar', 'height'), 140, 'barra mi trabajo', 4)
assert_close(number('.nv-context-banner', 'height'), 43, 'banner de contexto', 3)
assert_close(number('.np-metrics', 'height'), 142, 'métricas paciente')
assert_close(number('.np-chart-grid', 'height'), 306, 'objetivo y nutrición')
assert_close(number('.np-followup', 'height'), 138, 'seguimiento')
assert_close(number('.nv-brand .brand-mark', 'width'), 36, 'marca')
if js('document.documentElement.scrollWidth') > 1440:
    raise AssertionError('Overflow horizontal en escritorio')
if js("getComputedStyle(document.querySelector('.nv-topbar')).position") != 'fixed':
    raise AssertionError('La topbar profesional sigue ocupando el flujo en escritorio')
if js("[...document.querySelectorAll('.nv-work-toolbar,.np-metrics .nv-metric,.np-chart-grid .nv-card')].some(e=>e.scrollHeight>e.clientHeight+1)"):
    raise AssertionError('Contenido recortado en tarjetas de escritorio')
click('Revisar comidas', '.nv-work-toolbar button')
wait_text('Diario de comidas')
if 'Sofía' not in body():
    raise AssertionError('La acción perdió la paciente seleccionada')
click('Inicio', '.nv-sidebar button')
wait_text('Mi trabajo')
checks.append('desktop-geometria-acciones')
print(capture_screenshot(path=os.path.join(OUT, 'light-1440.png'), full=False))

set_view(800, 1100, 'light')
if js('document.documentElement.scrollWidth') > 800:
    raise AssertionError('Overflow horizontal en tablet')
if number('.nv-main', 'width') <= 0 or number('.nv-work-toolbar', 'width') <= 0:
    raise AssertionError('El CRM tablet perdió su composición')
if js("[...document.querySelectorAll('.nv-work-toolbar .nv-button')].some(e=>e.scrollWidth>e.clientWidth+2)"):
    raise AssertionError('Botones recortados en tablet')
checks.append('tablet-responsive')

set_view(390, 844, 'dark')
if js('document.documentElement.scrollWidth') > 390:
    raise AssertionError('Overflow horizontal en móvil')
if js("getComputedStyle(document.querySelector('.nv-sidebar')).display") != 'none':
    raise AssertionError('Sidebar desktop visible en móvil')
if js("getComputedStyle(document.querySelector('.nv-topbar')).position") == 'fixed':
    raise AssertionError('La topbar fija rompe el móvil')
if not js("(() => {const n=document.querySelector('button[aria-label=\"Abrir menú\"]');if(!n)return false;n.click();return true})()"):
    raise AssertionError('No se encontró Abrir menú')
time.sleep(.25)
if js("getComputedStyle(document.querySelector('.nv-sidebar')).display") == 'none':
    raise AssertionError('El menú móvil no abre')
click('Inicio', '.nv-sidebar button')
wait_text('Mi trabajo')
if js('document.documentElement.scrollWidth') > 390:
    raise AssertionError('Overflow después de navegar en móvil')
checks.append('mobile-dark-menu')
print(capture_screenshot(path=os.path.join(OUT, 'dark-390.png'), full=False))

errors.extend(js('window.__visualErrors || []') or [])
if errors:
    raise AssertionError('Errores JS: '+json.dumps(errors))
print(json.dumps({'checks': checks, 'errors': errors}, ensure_ascii=False))
