import json
import time

checks = []


def wait_for(predicate, label, timeout=10):
    deadline = time.time() + timeout
    while time.time() < deadline:
        value = predicate()
        if value:
            return value
        time.sleep(0.15)
    raise AssertionError(f'No se cumplió: {label}')


def body():
    return js('document.body.innerText') or ''


def click_text(text, selector='button'):
    found = js(f'''(() => {{
      const node = [...document.querySelectorAll({json.dumps(selector)})].find((item) => item.textContent.trim().includes({json.dumps(text)}));
      if (!node) return false;
      node.click();
      return true;
    }})()''')
    if not found:
        raise AssertionError(f'No se encontró: {text}')
    time.sleep(0.2)


def assert_true(value, message):
    if not value:
        raise AssertionError(message)


new_tab('http://127.0.0.1:5180/#recurso=leer-plan-semanal')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=900, deviceScaleFactor=1, mobile=False)
js("localStorage.clear(); window.__qaErrors=[]; window.addEventListener('error',e=>window.__qaErrors.push(String(e.message))); window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason))); location.reload()")
time.sleep(0.8)
if 'Continuar en modo demo' in body():
    click_text('Continuar en modo demo')
wait_for(lambda: 'Una semana, siete días' in body(), 'abrir detalle desde enlace profundo')
assert_true(js('location.hash') == '#recurso=leer-plan-semanal', 'El hash inicial cambió')
assert_true('Recursos.' in body(), 'El enlace no abrió la superficie Recursos')
checks.append('deep-link-directo')

js("""(() => {
  Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (value) => { window.__copiedResource = value; } } });
})()""")
click_text('Compartir', '.nvr-detail-toolbar button')
wait_for(lambda: 'Enlace copiado.' in body(), 'confirmación de copiado')
copied = js('window.__copiedResource')
assert_true(copied == 'http://127.0.0.1:5180/#recurso=leer-plan-semanal', 'Se copió un enlace inestable')
checks.append('compartir-fallback')

click_text('Preparar la compra desde el plan', '.nvr-related section:nth-child(2) button')
wait_for(lambda: 'Una ayuda basada en tu plan' in body(), 'guía relacionada')
assert_true(js('location.hash') == '#recurso=compras-desde-plan', 'Relacionados no reemplazó el hash')
click_text('Volver a Recursos', '.nvr-detail-toolbar > button')
wait_for(lambda: 'Guías para usar Plan V' in body() and js("document.querySelector('.nvr-detail') === null"), 'volver desde enlace directo')
assert_true(js('location.hash') == '', 'Volver dejó un hash huérfano')
checks.append('relacionado-y-volver')

click_text('Abrir guía', '.nvr-featured button')
wait_for(lambda: 'Una semana, siete días' in body(), 'abrir desde biblioteca')
assert_true(js('history.state?.planVResourceOpen === true'), 'La apertura interna no creó estado de navegación')
js('history.back()')
wait_for(lambda: js("document.querySelector('.nvr-detail') === null"), 'atrás del navegador vuelve a biblioteca')
assert_true(js('location.hash') == '', 'Atrás no limpió el hash')
js('history.forward()')
wait_for(lambda: 'Una semana, siete días' in body(), 'adelante del navegador reabre detalle')
checks.append('historial-navegador')

click_text('Abrir mi plan', '.nvr-article > button')
wait_for(lambda: 'Tu plan semanal' in body(), 'acción contextual')
assert_true(js('location.hash') == '', 'Navegar a Plan dejó el recurso en la URL')
goto_url(copied)
wait_for_load()
wait_for(lambda: 'Una semana, siete días' in body(), 'reabrir enlace copiado')
checks.append('enlace-reabrible')

cdp('Emulation.setDeviceMetricsOverride', width=390, height=844, deviceScaleFactor=1, mobile=True)
time.sleep(0.25)
assert_true(js('document.documentElement.scrollWidth <= window.innerWidth'), 'Hay overflow horizontal en móvil')
assert_true(js("getComputedStyle(document.querySelector('.nvr-detail-toolbar')).flexDirection") == 'column', 'La barra de compartir no se reorganizó en móvil')
assert_true(js("document.querySelectorAll('.nvr-detail-toolbar button').length") == 3, 'Falta una acción del detalle')
checks.append('responsive')

errors = js('window.__qaErrors || []') or []
assert_true(errors == [], f'Errores de navegador: {errors}')
print(json.dumps({'checks': checks, 'copied': copied, 'hash': js('location.hash'), 'errors': errors}, ensure_ascii=False))
