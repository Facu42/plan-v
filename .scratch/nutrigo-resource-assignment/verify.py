import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-resource-assignment')
os.makedirs(OUT, exist_ok=True)
checks = []


def text():
    return js('document.body.innerText') or ''


def wait_text(value, timeout=10):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if value in text():
            return
        time.sleep(0.15)
    raise AssertionError(f'No apareció: {value}')


def click_text(value, selector='button'):
    ok = js(f'''(() => {{
      const node = [...document.querySelectorAll({json.dumps(selector)})]
        .find((item) => item.textContent.trim().includes({json.dumps(value)}));
      if (!node) return false;
      node.click();
      return true;
    }})()''')
    if not ok:
        raise AssertionError(f'No se encontró: {value} en {selector}')
    time.sleep(0.25)


def click_label(value):
    ok = js(f'''(() => {{
      const node = [...document.querySelectorAll('[aria-label]')]
        .find((item) => item.getAttribute('aria-label') === {json.dumps(value)});
      if (!node) return false;
      node.click();
      return true;
    }})()''')
    if not ok:
        raise AssertionError(f'No se encontró aria-label: {value}')
    time.sleep(0.2)


def assert_true(value, message):
    if not value:
        raise AssertionError(message)


new_tab('http://127.0.0.1:5185/')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=950, deviceScaleFactor=1, mobile=False)
js("localStorage.clear(); window.__qaErrors=[]; window.addEventListener('error',e=>window.__qaErrors.push(String(e.message))); window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
js('location.reload()')
time.sleep(0.8)
if 'Continuar en modo demo' in text():
    click_text('Continuar en modo demo')
wait_text('Hola, Sofía')

click_text('Nutricionista', '.nv-role-switch button')
wait_text('Mi consultorio')
click_text('Guardado', '.nv-sidebar nav button')
wait_text('Asignar recursos')
assert_true(js("document.querySelectorAll('.nvw-resource-picker > button').length") == 6, 'No aparecen las seis guías')
assert_true(js("document.querySelectorAll('.nvw-patient-checklist label').length") >= 2, 'No aparece la selección multipaciente')
assert_true(js("document.documentElement.scrollWidth <= window.innerWidth"), 'Overflow horizontal profesional')
checks.append('superficie-profesional')

click_label('Seleccionar Sofía R.')
click_label('Seleccionar Marina C.')
assert_true('2 seleccionados' in text(), 'La selección masiva no refleja dos pacientes')
click_text('Asignar a 2', '.nvw-assignment-footer button')
wait_text('2 asignaciones creadas.')
assert_true(js("[...document.querySelectorAll('.nvw-patient-checklist label small')].filter(x=>x.textContent.includes('· pendiente')).length") == 2, 'No se reflejaron las asignaciones')
checks.append('asignacion-masiva')

click_text('Paciente', '.nv-role-switch button')
wait_text('Hola, Sofía')
click_text('Recursos', '.nv-sidebar nav button')
wait_text('Asignado por tu nutricionista')
assert_true('Pendiente de lectura' in text(), 'La paciente no ve el recurso pendiente')
assert_true(js("document.querySelectorAll('.nvr-assigned button').length") == 1, 'La paciente ve asignaciones ajenas o duplicadas')
click_text('Cómo leer tu plan semanal', '.nvr-assigned button')
wait_text('Una semana, siete días')
time.sleep(0.7)
click_text('Volver a Recursos', '.nvr-detail-toolbar button')
wait_text('Asignado por tu nutricionista')
assert_true('Leída' in text(), 'La lectura no se reflejó en la paciente')
checks.append('lectura-paciente')

click_text('Nutricionista', '.nv-role-switch button')
click_text('Guardado', '.nv-sidebar nav button')
wait_text('Asignar recursos')
patient_states = js("[...document.querySelectorAll('.nvw-patient-checklist label')].map(x=>x.innerText)")
sofia = next((state for state in patient_states if 'Sofía R.' in state), '')
marina = next((state for state in patient_states if 'Marina C.' in state), '')
assert_true('Leído' in sofia, 'La profesional no ve la lectura de Sofía')
assert_true('· pendiente' in marina, 'La lectura contaminó a otra paciente')
checks.append('seguimiento-aislado')

cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=1, mobile=True)
click_text('Paciente', '.nv-role-switch button')
wait_text('Hola, Sofía')
click_label('Abrir menú')
click_text('Recursos', '.nv-sidebar nav button')
wait_text('Asignado por tu nutricionista')
assert_true(js("document.documentElement.scrollWidth <= window.innerWidth"), 'Overflow horizontal móvil')
if not js("document.querySelector('.nv-app').classList.contains('nv-dark')"):
    click_label('Usar tema oscuro')
time.sleep(0.3)
assert_true(js("document.querySelector('.nv-app').classList.contains('nv-dark')"), 'No se activó tema oscuro')
checks.append('responsive-tema')

errors = js('window.__qaErrors || []') or []
assert_true(errors == [], f'Errores de navegador: {errors}')
print(json.dumps({'checks': checks, 'errors': errors}, ensure_ascii=False))
