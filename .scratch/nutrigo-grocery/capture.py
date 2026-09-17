# Capture the verified grocery surface at desktop and mobile.
import base64,time
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-grocery')
def wait(expr):
    for _ in range(60):
        if js(expr): return
        time.sleep(.1)
    raise AssertionError(expr)
def click(name):
    for n in cdp('Accessibility.getFullAXTree')['nodes']:
        if n.get('role',{}).get('value')=='button' and n.get('name',{}).get('value')==name:
            q=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content'];click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4);time.sleep(.3);return
    raise AssertionError(name)
def shot(name,width,height):
    data=cdp('Page.captureScreenshot',format='png',captureBeyondViewport=False,clip={'x':0,'y':0,'width':width,'height':height,'scale':1})['data']
    (out/name).write_bytes(base64.b64decode(data))
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=900,deviceScaleFactor=1,mobile=False);goto_url('http://127.0.0.1:5180/?design=nutrigo');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo');wait("!!document.querySelector('.nv-app')")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):click('Usar tema claro')
if not js("!!document.querySelector('.nvgrocery')"):click('Lista de compras');wait("!!document.querySelector('.nvgrocery')")
js('window.scrollTo(0,0)');time.sleep(.2);shot('grocery-light-1440.png',1440,900)
click('Usar tema oscuro');cdp('Emulation.setDeviceMetricsOverride',width=390,height=900,deviceScaleFactor=1,mobile=False);time.sleep(.3);js('window.scrollTo(0,0)');shot('grocery-dark-390.png',390,900)
print('captured')
