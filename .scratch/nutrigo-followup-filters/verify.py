import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-followup-filters')
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


def rows():
    return js("document.querySelectorAll('.nvw-follow-list>article').length")


def badge():
    return js("document.querySelector('.nvw-filters .nv-badge')?.textContent")


new_tab('http://127.0.0.1:5180/')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=1232, deviceScaleFactor=1, mobile=False)
js("localStorage.setItem('plan-v:theme','light'); location.reload()")
wait_for_load()
wait_text('Continuar en modo demo')
click('Continuar en modo demo')
wait_text('Hola, Sofía.')
click('Nutricionista', '.nv-role-switch button')
wait_text('Mi trabajo')
js("window.__fErrors=[];window.addEventListener('error',e=>window.__fErrors.push(e.message))")
click('Centro de seguimiento', '.nv-sidebar button')
wait_text('Necesitan atención')
total = rows()
if total < 2:
    raise AssertionError('El demo no tiene suficientes pacientes para probar filtros')
if badge() != f'{total} de {total}':
    raise AssertionError(f'Contador inicial inesperado: {badge()}')
checks.append('estado-inicial')

click('Con pendientes')
time.sleep(.3)
with_pending = rows()
if with_pending >= total or badge() != f'{with_pending} de {total}':
    raise AssertionError(f'Filtro Con pendientes no acotó: {with_pending}/{total}')
if js("document.querySelectorAll('.nvw-follow-list .nv-button').length") < 1:
    raise AssertionError('Las filas con pendientes perdieron la acción Revisar comidas')
click('Revisar comidas', '.nvw-follow-list .nv-button')
wait_text('Diario de comidas')
click('Centro de seguimiento', '.nv-sidebar button')
wait_text('Necesitan atención')
checks.append('filtro-pendientes-y-accion')

click('Sin pendientes')
time.sleep(.3)
without_pending = rows()
if without_pending >= total:
    raise AssertionError('Filtro Sin pendientes no acotó')
if js("document.querySelectorAll('.nvw-follow-list .nv-button').length") != 0:
    raise AssertionError('Apareció Revisar comidas en filas sin pendientes')
checks.append('filtro-sin-pendientes')

click('Necesitan atención')
time.sleep(.3)
attention = rows()
if attention > total or badge() != f'{attention} de {total}':
    raise AssertionError(f'Filtro atención inconsistente: {badge()}')
if js("[...document.querySelectorAll('.nvw-follow-list .nv-badge')].some(b=>parseInt(b.textContent)>=70)"):
    raise AssertionError('La banda atención muestra adherencia >= 70')
checks.append('filtro-banda')

click('Todas', '.nvw-filters [aria-label="Revisiones pendientes"] button')
click('Todas', '.nvw-filters [aria-label="Banda de adherencia"] button')
time.sleep(.3)
if rows() != total or badge() != f'{total} de {total}':
    raise AssertionError('No se restauró el listado completo')
checks.append('restauracion')
print(capture_screenshot(path=os.path.join(OUT, 'followup-light-1440.png'), full=False))

cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=1, mobile=True)
js("localStorage.setItem('plan-v:theme','dark'); location.reload()")
wait_for_load()
wait_text('Continuar en modo demo')
click('Continuar en modo demo')
wait_text('Hola, Sofía.')
click('Nutricionista', '.nv-role-switch button')
time.sleep(.5)
if not js("(() => {const n=document.querySelector('button[aria-label=\"Abrir menú\"]');if(!n)return false;n.click();return true})()"):
    raise AssertionError('No se encontró Abrir menú')
time.sleep(.25)
click('Centro de seguimiento', '.nv-sidebar button')
wait_text('Necesitan atención')
click('Con pendientes')
time.sleep(.3)
if rows() != with_pending:
    raise AssertionError('El filtro móvil no coincide con escritorio')
if js('document.documentElement.scrollWidth') > 390:
    raise AssertionError('Overflow horizontal en móvil')
checks.append('mobile-dark')


errors = js('window.__fErrors || []') or []
if errors:
    raise AssertionError('Errores JS: ' + json.dumps(errors))
print(json.dumps({'checks': checks, 'errors': errors}, ensure_ascii=False))
