# Verify the five remaining professional modules in Nutrigo.
import json,time,base64,urllib.request
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-work-center');out.mkdir(parents=True,exist_ok=True)
def wait(expr):
    for _ in range(70):
        if js(expr): return
        time.sleep(.1)
    raise AssertionError(expr)
def click(name,role='button'):
    last=None
    for _ in range(4):
        try:
            for n in cdp('Accessibility.getFullAXTree')['nodes']:
                if n.get('role',{}).get('value')==role and n.get('name',{}).get('value')==name:
                    cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId'])
                    q=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content']
                    click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4);time.sleep(.3);return
        except Exception as e: last=e
        time.sleep(.4)
    raise AssertionError('Missing '+name+((' / '+str(last)) if last else ''))
def click_selector(selector):
    box=js("(() => {const e=document.querySelector("+json.dumps(selector)+");if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}})()")
    assert box,(selector,js("document.body.innerText.slice(0,500)"))
    click_at_xy(box['x'],box['y']);time.sleep(.35)
def nav(label):
    if js("document.querySelector('.nv-sidebar').getBoundingClientRect().right<=0"):
        click('Abrir menú');wait("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
    click(label)

patients=json.load(urllib.request.urlopen('http://127.0.0.1:3010/api/patients'))['patients']
patients=[p for p in patients if not p.get('archived_at')]
modules=[('reciente','Reciente','Actividad reciente'),('guardado','Guardado','Planes B guardados'),('seguimiento','Centro de seguimiento','Centro de seguimiento'),('paneles','Paneles','Paneles del consultorio'),('videollamadas','Videollamadas','Videollamadas programadas')]
checks=[];results=[]
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"): click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"): click('Usar tema claro');wait("!document.querySelector('.nv-app').classList.contains('nv-dark')")
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')");time.sleep(.5)

for module,label,heading in modules:
    nav(label);wait("!!document.querySelector('.nvw-'+"+json.dumps(module)+")")
    assert heading in js("document.querySelector('.nvw-work-center').innerText")
    assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")==label
    assert js("document.querySelectorAll('.nv-sidebar nav button').length")==11
    assert not js("!!document.querySelector('.nv-daily,.nv-work-toolbar,.reference-frame')")
checks.append(('five-modules-stay-in-nutrigo',len(modules)))

# Every row action reaches the correct Nutrigo patient flow.
nav('Reciente');wait("!!document.querySelector('.nvw-reciente')")
expected=js("document.querySelector('.nvw-activity button small').textContent.split('·').pop().trim()")
click_selector('.nvw-activity>button');wait("!!document.querySelector('.nr-record')")
assert expected in js("document.querySelector('.nr-hero').innerText")
nav('Guardado');wait("!!document.querySelector('.nvw-guardado')")
expected=js("document.querySelector('.nvw-saved-card strong').textContent")
click_selector('.nvw-saved-card .nv-button');wait("!!document.querySelector('.nr-record')")
assert expected in js("document.querySelector('.nr-hero').innerText")
nav('Centro de seguimiento');wait("!!document.querySelector('.nvw-seguimiento')")
expected=js("document.querySelector('.nvw-follow-list article strong').textContent")
click_selector('.nvw-follow-list article .nv-button');wait("!!document.querySelector('.nvm-diary')")
assert expected in js("document.querySelector('.nvm-context').innerText")
nav('Paneles');wait("!!document.querySelector('.nvw-paneles')")
assert js("document.querySelectorAll('.nvw-stats article').length")==4
click_selector('.nvw-priority button');wait("!!document.querySelector('.nr-record')")
nav('Videollamadas');wait("!!document.querySelector('.nvw-videollamadas')")
assert js("[...document.querySelectorAll('.nvw-video-actions a')].every(a=>a.href.startsWith('https://')&&a.target==='_blank'&&a.rel==='noopener noreferrer')")
expected=js("document.querySelector('.nvw-video-grid article strong').textContent")
click_selector('.nvw-video-grid article .nv-button');wait("!!document.querySelector('.nvc-consultations')")
assert expected in js("document.querySelector('.nvc-context').innerText")
checks.append(('actions-open-nutrigo-patient-flows',5))

# Responsive and theme matrix across all five surfaces.
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark: click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
        for module,label,heading in modules:
            nav(label);wait("!!document.querySelector('.nvw-'+"+json.dumps(module)+")")
            state=js("({module:"+json.dumps(module)+",width:innerWidth,scroll:document.documentElement.scrollWidth,main:document.querySelector('.nv-main').getBoundingClientRect().width,root:document.querySelector('.nvw-work-center').getBoundingClientRect().width,rail:!!document.querySelector('.nv-daily'),toolbar:!!document.querySelector('.nv-work-toolbar'),legacy:!!document.querySelector('.reference-frame')})")
            assert state['scroll']<=width and state['root']>0 and not state['rail'] and not state['toolbar'] and not state['legacy'],state
            if width==1440: assert state['main']>=1150,state
            state['theme']='dark' if dark else 'light';results.append(state)
            if (not dark and width==1440 and module=='paneles') or (dark and width==390 and module in ['reciente','guardado','seguimiento','paneles','videollamadas']):
                cdp('Page.bringToFront');js('window.scrollTo(0,0)');time.sleep(.1)
                path=out/(module+'-'+state['theme']+'-'+str(width)+'.png');path.write_bytes(base64.b64decode(cdp('Page.captureScreenshot',format='png')['data']))
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
checks.append(('responsive-themes',len(results)))

assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'checks.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(checks),'views':len(results),'modules':len(modules),'patients':len(patients),'errors':[]}))
