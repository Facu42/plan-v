import json
import os
import time

OUT = os.path.abspath('.scratch/nutrigo-resources')
os.makedirs(OUT, exist_ok=True)
errors = []
checks = []


def wait_text(text, timeout=10):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if text in (js('document.body.innerText') or ''):
            return
        time.sleep(0.15)
    raise AssertionError(f'No apareció: {text}')


def click_button(text, selector='button'):
    result = js(f'''(() => {{
      const nodes = [...document.querySelectorAll({json.dumps(selector)})];
      const node = nodes.find((item) => item.textContent.trim().includes({json.dumps(text)}));
      if (!node) return false;
      node.click();
      return true;
    }})()''')
    if not result:
        raise AssertionError(f'No se encontró control: {text}')
    time.sleep(0.2)


def click_label(label):
    result = js(f'''(() => {{
      const node = [...document.querySelectorAll('[aria-label]')].find((item) => item.getAttribute('aria-label') === {json.dumps(label)});
      if (!node) return false;
      node.click();
      return true;
    }})()''')
    if not result:
        raise AssertionError(f'No se encontró control con etiqueta: {label}')
    time.sleep(0.2)


def screenshot(name):
    path = os.path.join(OUT, name)
    return capture_screenshot(path=path)


def assert_true(value, message):
    if not value:
        raise AssertionError(message)


new_tab('http://127.0.0.1:5184/')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=900, deviceScaleFactor=1, mobile=False)
js("localStorage.clear(); window.__qaErrors=[]; window.addEventListener('error',e=>window.__qaErrors.push(String(e.message))); window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
js('location.reload()')
time.sleep(0.8)
if 'Continuar en modo demo' in (js('document.body.innerText') or ''):
    click_button('Continuar en modo demo')
wait_text('Hola, Sofía')

click_button('Recursos')
wait_text('Guías para usar Plan V')
body = js('document.body.innerText') or ''
assert_true(js("document.querySelectorAll('.nvr-grid article').length") == 6, 'La biblioteca no contiene seis guías')
assert_true('Pronto' not in body, 'Recursos aún aparece como pendiente')
assert_true(js("document.querySelector('.nv-daily') === null"), 'El rail diario desplaza Recursos')
assert_true(js("document.documentElement.scrollWidth <= window.innerWidth"), 'Hay overflow horizontal en escritorio')
checks.append('biblioteca')


click_button('Seguimiento', '.nvr-filters button')
assert_true(js("document.querySelectorAll('.nvr-grid article').length") == 1, 'El filtro de categoría no aisló una guía')
assert_true('Entender tu progreso semanal' in (js('document.body.innerText') or ''), 'Falta la guía de seguimiento')
click_button('Todas', '.nvr-filters button')
fill_input('input[aria-label="Buscar guías"]', 'actividad')
time.sleep(0.25)
assert_true(js("document.querySelectorAll('.nvr-grid article').length") == 1, 'La búsqueda no filtró una guía')
assert_true('Registrar actividad autodeclarada' in (js('document.body.innerText') or ''), 'La búsqueda devolvió otra guía')
fill_input('input[aria-label="Buscar guías"]', '')
time.sleep(0.2)
checks.append('filtros')

result = js("""(() => {
 const card=[...document.querySelectorAll('.nvr-grid article')].find(x=>x.textContent.includes('Cómo leer tu plan semanal'));
 const button=card?.querySelector('button'); if(!button)return false; button.click(); return true;
})()""")
assert_true(result, 'No se pudo abrir el detalle')
wait_text('Una semana, siete días')
assert_true(js("document.querySelectorAll('.nvr-sections > section').length") == 3, 'El detalle no muestra sus tres secciones')
assert_true(js("document.querySelectorAll('.nvr-related section:nth-child(2) button').length") == 2, 'Faltan recursos relacionados')
assert_true('No reemplazan las indicaciones de tu profesional' in (js('document.body.innerText') or ''), 'Falta el límite editorial')
checks.append('detalle')

click_button('Guardar', '.nvr-detail-toolbar button')
key = 'plan-v:resource-favorites:pat-sofia'
saved = js(f"JSON.parse(localStorage.getItem({json.dumps(key)}) || '[]')")
assert_true(saved == ['leer-plan-semanal'], 'El favorito no quedó aislado por paciente')
click_button('Volver a Recursos', '.nvr-detail-toolbar button')
wait_text('Para volver después')
assert_true(js("document.querySelector('.nvr-aside section:nth-child(2) > strong')?.textContent") == '1', 'El resumen no refleja el guardado local')
click_button('Cómo leer tu plan semanal', '.nvr-saved button')
wait_text('Una semana, siete días')
checks.append('guardado-local')

click_button('Abrir mi plan', '.nvr-article > button')
wait_text('Tu plan semanal')
assert_true('Plan semanal' in (js('document.body.innerText') or ''), 'La acción contextual no abrió el plan')
click_button('Recursos')
wait_text('Guías para usar Plan V')
checks.append('navegacion')

private_tokens = ['note_for_nutri', 'goal_history', 'Plan B favorito']
body = js('document.body.innerText') or ''
assert_true(not any(token in body for token in private_tokens), 'Recursos expone campos profesionales')
checks.append('privacidad')

cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=1, mobile=True)
click_label('Abrir menú')
click_button('Recursos')
wait_text('Guías para usar Plan V')
assert_true(js("document.documentElement.scrollWidth <= window.innerWidth"), 'Hay overflow horizontal en móvil')
click_button('Abrir guía', '.nvr-featured button')
wait_text('Una semana, siete días')
if not js("document.querySelector('.nv-app').classList.contains('nv-dark')"):
    click_label('Usar tema oscuro')
time.sleep(0.25)
assert_true(js("document.querySelector('.nv-app').classList.contains('nv-dark')"), 'No se activó el tema oscuro')
assert_true(js("document.documentElement.scrollWidth <= window.innerWidth"), 'El detalle oscuro tiene overflow móvil')
checks.append('responsive-temas')

errors = js('window.__qaErrors || []') or []
assert_true(errors == [], f'Errores de navegador: {errors}')
print(json.dumps({'checks': checks, 'views': 4, 'saved': saved, 'errors': errors}, ensure_ascii=False))
