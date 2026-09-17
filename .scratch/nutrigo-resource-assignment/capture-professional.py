import json
import os
import time


def body():
    return js('document.body.innerText') or ''


def click(text, selector='button'):
    ok = js(f'''(() => {{const n=[...document.querySelectorAll({json.dumps(selector)})].find(x=>x.textContent.trim().includes({json.dumps(text)}));if(!n)return false;n.click();return true;}})()''')
    if not ok: raise AssertionError(text)
    time.sleep(.35)


new_tab('http://127.0.0.1:5185/')
wait_for_load()
cdp('Emulation.setDeviceMetricsOverride', width=1200, height=800, deviceScaleFactor=1, mobile=False)
time.sleep(.5)
if 'Continuar en modo demo' in body(): click('Continuar en modo demo')
click('Nutricionista', '.nv-role-switch button')
click('Guardado', '.nv-sidebar nav button')
time.sleep(1)
assert js("document.documentElement.scrollWidth <= window.innerWidth")
assert js("getComputedStyle(document.querySelector('.nvw-resource-picker')).gridTemplateColumns.split(' ').length") == 2
path=os.path.abspath('.scratch/nutrigo-resource-assignment/professional-assignment-1200-fixed.png')
print(capture_screenshot(path=path, full=False))
