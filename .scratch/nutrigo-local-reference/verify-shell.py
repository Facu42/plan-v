# Check shell measurements against the local Figma source
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out = Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-local-reference')
new_tab('http://127.0.0.1:5180/?design=nutrigo'); wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"): click('Continuar en modo demo')
wait("!!document.querySelector('.np-dashboard')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
results = []
for dark in [False, True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')") != dark:
        click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440, 800, 390, 320]:
        # A tall desktop artboard avoids Windows' 15 px scrollbar reducing the 1440 px canvas.
        cdp('Emulation.setDeviceMetricsOverride', width=width, height=1400 if width == 1440 else 1000, deviceScaleFactor=1, mobile=False)
        time.sleep(.2)
        state = js("(() => {const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};return {width:innerWidth,scroll:document.documentElement.scrollWidth,sidebar:rect('.nv-sidebar'),main:rect('.nv-main'),rail:rect('.nv-daily'),body:rect('.np-dashboard'),padding:getComputedStyle(document.querySelector('.nv-main')).paddingLeft}})()")
        assert state['scroll'] <= width, state
        if width == 1440:
            assert [state[k]['width'] for k in ['sidebar', 'main', 'rail']] == [223, 892, 325], state
            assert state['padding'] == '28px', state
            assert state['body']['y'] == 106, state
        state['theme'] = 'dark' if dark else 'light'
        state['screenshot'] = shot(state['theme'] + '-' + str(width))
        results.append(state)
        (out / 'shell-verification.json').write_text(json.dumps(results, indent=2), encoding='utf-8')
cdp('Emulation.setDeviceMetricsOverride', width=390, height=1000, deviceScaleFactor=1, mobile=False)
click('Abrir menú'); click('Plan semanal'); wait("!!document.querySelector('.nv-plan-grid')")
assert not js("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
cdp('Emulation.setDeviceMetricsOverride', width=1440, height=1000, deviceScaleFactor=1, mobile=False)
click('Nutricionista')
assert not js("document.querySelector('.nv-app').classList.contains('nv-patient')")
assert js("document.querySelectorAll('.nv-sidebar nav button').length") == 11
click('Paciente')
assert not js('window.__qaErrors'), js('window.__qaErrors')
assert len(results) == len({(r['theme'], r['width']) for r in results}) == 8
print(json.dumps({'captures': len(results), 'desktopColumns': [223, 892, 325], 'bodyY': 106, 'mobileNavigation': 'PASS', 'crmModules': 11, 'errors': []}))
