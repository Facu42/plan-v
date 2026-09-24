# Verify the patient grocery list inside Nutrigo.
import base64,json,time
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-grocery');out.mkdir(parents=True,exist_ok=True)
def wait(expr):
    for _ in range(80):
        if js(expr): return
        time.sleep(.1)
    raise AssertionError(expr)
def click(name,role='button'):
    for _ in range(5):
        for n in cdp('Accessibility.getFullAXTree')['nodes']:
            if n.get('role',{}).get('value')==role and n.get('name',{}).get('value')==name:
                cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId'])
                q=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content']
                click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4);time.sleep(.3);return
        time.sleep(.3)
    raise AssertionError('Missing '+name)
def click_selector(selector):
    box=js("(() => {const e=document.querySelector("+json.dumps(selector)+");if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
    assert box,selector
    click_at_xy(box['x'],box['y']);time.sleep(.3)
def set_field(selector,value):
    result=js("(() => {const el=document.querySelector("+json.dumps(selector)+");if(!el)return null;const p=HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(p,'value').set.call(el,"+json.dumps(value)+");el.dispatchEvent(new Event('input',{bubbles:true}));return el.value})()")
    assert result==value,(selector,result)
def nav(label):
    if js("document.querySelector('.nv-sidebar').getBoundingClientRect().right<=0"):
        click('Abrir menú');wait("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
    click(label)

new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"): click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"): click('Usar tema claro');wait("!document.querySelector('.nv-app').classList.contains('nv-dark')")
click('Paciente');time.sleep(.4)
nav('Lista de compras');wait("!!document.querySelector('.nvgrocery')")
checks=[]
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()").startswith('Lista de compras')
assert js("document.querySelectorAll('.nv-sidebar nav button').length")==10
assert 'Pronto' not in js("document.querySelector('.nv-sidebar [aria-current=page]').innerText")
assert not js("!!document.querySelector('.nv-daily,.reference-frame')")
assert js("document.querySelectorAll('.nvgrocery-groups li').length")>0
assert 'No incluye cantidades ni porciones' in js("document.querySelector('.nvgrocery').innerText")
assert 'supermercado' not in js("document.querySelector('.nvgrocery').innerText.toLowerCase()")
checks.append(('patient-grocery-opens-in-nutrigo',True))

# Checklist is patient-scoped and persists in browser storage.
keys_before=js("Object.keys(localStorage).filter(k=>k.includes(':shopping:'))")
if js("document.querySelector('.nvgrocery-groups li button').getAttribute('aria-pressed')==='true'"): click('Desmarcar todo')
first_label=js("document.querySelector('.nvgrocery-groups li strong').textContent")
click_selector('.nvgrocery-groups li button')
assert js("document.querySelector('.nvgrocery-groups li button').getAttribute('aria-pressed')")=='true'
keys_after=js("Object.keys(localStorage).filter(k=>k.includes(':shopping:'))")
assert len(keys_after)>=1
nav('Inicio');wait("!!document.querySelector('.np-dashboard')")
nav('Lista de compras');wait("!!document.querySelector('.nvgrocery')")
assert js("document.querySelector('.nvgrocery-groups li button').getAttribute('aria-pressed')")=='true'
click('Desmarcar todo');assert js("document.querySelector('.nvgrocery-groups li button').getAttribute('aria-pressed')")=='false'
checks.append(('checklist-persists-and-resets',first_label))

# Search/filter and export are operational.
set_field('[aria-label="Buscar en la lista"]',first_label.split()[0])
assert js("document.querySelectorAll('.nvgrocery-groups li').length")>=1
set_field('[aria-label="Buscar en la lista"]','qa-no-existe-442')
assert 'Sin coincidencias' in js("document.querySelector('.nvgrocery-list-card').innerText")
set_field('[aria-label="Buscar en la lista"]','')
click('Listos')
assert 'Sin coincidencias' in js("document.querySelector('.nvgrocery-list-card').innerText")
click('Todos');click('Exportar .txt');wait("document.querySelector('[role=status]')?.textContent==='Lista descargada.'")
checks.append(('search-filter-export',True))

# Responsive and theme matrix.
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark: click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,root:document.querySelector('.nvgrocery').getBoundingClientRect().width,items:document.querySelectorAll('.nvgrocery-groups li').length,rail:!!document.querySelector('.nv-daily'),legacy:!!document.querySelector('.reference-frame')})")
        assert state['scroll']<=width and state['root']>0 and state['items']>0 and not state['rail'] and not state['legacy'],state
        state['theme']='dark' if dark else 'light';results.append(state)
checks.append(('responsive-themes',len(results)))
# Remove any isolated QA checklist state.
js("Object.keys(localStorage).filter(k=>k.includes(':shopping:')).forEach(k=>localStorage.removeItem(k))")
assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
(out/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(checks),'views':len(results),'items':results[0]['items'],'errors':[]}))
