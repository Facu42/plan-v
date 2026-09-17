import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-quad')
os.makedirs(OUT, exist_ok=True)
checks = []


def body():
    return js('document.body.innerText') or ''


def click(text, selector='button'):
    ok = js(f'''(() => {{const n=[...document.querySelectorAll({json.dumps(selector)})].find(e=>e.textContent.trim()==={json.dumps(text)});if(!n)return false;n.click();return true}})()''')
    if not ok:
        raise AssertionError('No se encontró '+text)


def click_label(label):
    ok = js(f'''(() => {{const n=document.querySelector('button[aria-label={json.dumps(label)}]');if(!n)return false;n.click();return true}})()''')
    if not ok:
        raise AssertionError('No se encontró '+label)


def wait_text(value):
    for _ in range(60):
        if value in body(): return
        time.sleep(.1)
    raise AssertionError('No apareció '+value)


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
js("window.__qErrors=[];window.addEventListener('error',e=>window.__qErrors.push(e.message))")

click('Diario de comidas', '.nv-sidebar button')
wait_text('Tu diario de comidas')
tags = js("[...document.querySelectorAll('.nvpdiary-plan-tag')].map(e=>e.textContent)")
if 'Del plan' not in tags:
    raise AssertionError('Falta el vínculo Del plan: ' + json.dumps(tags))
if 'no es una evaluación clínica' not in body():
    raise AssertionError('Falta el límite editorial del vínculo')
checks.append('diary-plan-relation')

click('Nutricionista', '.nv-role-switch button')
wait_text('Mi trabajo')
click_label('Abrir el directorio de pacientes')
wait_text('Directorio de pacientes')
click('Inicio', '.nv-sidebar button')
wait_text('Mi trabajo')
click_label('Revisar las comidas pendientes')
wait_text('Diario de comidas')
if 'Sofía' not in body():
    raise AssertionError('Revisar pendientes perdió la paciente')
click('Inicio', '.nv-sidebar button')
wait_text('Mi trabajo')
click_label('Abrir el centro de seguimiento')
wait_text('Necesitan atención')
click('Inicio', '.nv-sidebar button')
wait_text('Mi trabajo')
click_label('Abrir la agenda')
wait_text('Agenda')
checks.append('pro-summary-navigation')

cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=1, mobile=True)
js("localStorage.setItem('plan-v:theme','dark'); location.reload()")
wait_for_load()
enter('patient')
if not js("(() => {const n=document.querySelector('button[aria-label=\"Abrir menú\"]');if(!n)return false;n.click();return true})()"):
    raise AssertionError('No se encontró Abrir menú')
time.sleep(.25)
click('Diario de comidas', '.nv-sidebar button')
wait_text('Tu diario de comidas')
if js('document.documentElement.scrollWidth') > 390:
    raise AssertionError('Overflow horizontal en móvil')
if js("[...document.querySelectorAll('.nvpdiary-plan-tag')].length") < 1:
    raise AssertionError('El vínculo de plan no llegó al móvil')
checks.append('mobile-dark-diary')

errors = js('window.__qErrors || []') or []
if errors:
    raise AssertionError('Errores JS: ' + json.dumps(errors))
print(json.dumps({'checks': checks, 'errors': errors}, ensure_ascii=False))
