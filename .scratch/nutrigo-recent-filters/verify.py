import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-recent-filters')
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
    return js("document.querySelectorAll('.nvw-activity>button').length")


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
js("window.__rErrors=[];window.addEventListener('error',e=>window.__rErrors.push(e.message))")
click('Reciente', '.nv-sidebar button')
wait_text('Movimientos de las fichas')
total = rows()
if total < 1:
    raise AssertionError('No hay actividad demo para probar')
checks.append('estado-inicial')

first_patient = js("document.querySelector('.nvw-filters [aria-label=\"Paciente\"] button:nth-child(2)')?.textContent")
if not first_patient:
    raise AssertionError('No hay filtro por paciente')
click(first_patient, '.nvw-filters [aria-label="Paciente"] button')
time.sleep(.3)
only_patient = rows()
if only_patient < 1 or only_patient > total:
    raise AssertionError(f'Filtro por paciente inconsistente: {only_patient}/{total}')
if js(f"[...document.querySelectorAll('.nvw-activity>button small')].some(e=>!e.textContent.includes({json.dumps(first_patient)}))"):
    raise AssertionError('El filtro por paciente mezcla pacientes')
click('Ayer', '.nvw-filters [aria-label="Recencia"] button')
time.sleep(.3)
if js("[...document.querySelectorAll('.nvw-activity>button small')].some(e=>!e.textContent.toUpperCase().startsWith('AYER'))"):
    raise AssertionError('El filtro Ayer muestra otra recencia')
checks.append('filtros-paciente-recencia')

click('Todas', '.nvw-filters [aria-label="Recencia"] button')
click('Todas las pacientes', '.nvw-filters [aria-label="Paciente"] button')
time.sleep(.3)
if rows() != total:
    raise AssertionError('No se restauró el listado completo')
click('Anteriores', '.nvw-filters [aria-label="Recencia"] button')
time.sleep(.3)
older = rows()
if older > 0 and js("[...document.querySelectorAll('.nvw-activity>button small')].some(e=>/^(HOY|AYER)/i.test(e.textContent))"):
    raise AssertionError('El filtro Anteriores muestra HOY o AYER')
if older == 0 and 'Sin actividad en este filtro' not in body():
    raise AssertionError('Falta el estado vacío del filtro')
checks.append('recencia-anteriores-y-vacio')

click('Todas', '.nvw-filters [aria-label="Recencia"] button')
time.sleep(.3)
target_name = js("document.querySelector('.nvw-activity>button small')?.textContent.split('·')[1]?.trim()")
if not js("(() => {const n=document.querySelector('.nvw-activity>button');if(!n)return false;n.click();return true})()"):
    raise AssertionError('No se pudo abrir el primer movimiento')
wait_text('Ficha')
if target_name and target_name.split()[0] not in body():
    raise AssertionError('Abrir un movimiento no llevó a la ficha de la paciente')
checks.append('navegacion-ficha')


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
click('Reciente', '.nv-sidebar button')
wait_text('Movimientos de las fichas')
click('Hoy', '.nvw-filters [aria-label="Recencia"] button')
time.sleep(.3)
if js('document.documentElement.scrollWidth') > 390:
    raise AssertionError('Overflow horizontal en móvil')
checks.append('mobile-dark')

errors = js('window.__rErrors || []') or []
if errors:
    raise AssertionError('Errores JS: ' + json.dumps(errors))
print(json.dumps({'checks': checks, 'errors': errors}, ensure_ascii=False))
