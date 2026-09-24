# Verify Nutrigo aggregate professional agenda.
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-agenda');out.mkdir(parents=True,exist_ok=True)
patients=[p for p in api('patients')['patients'] if not p.get('archived_at')]
scheduled=[p for p in patients if p.get('appointment')]
unassigned=[p for p in patients if not p.get('appointment')]
video=[p for p in scheduled if p['appointment'].get('channel')=='video']
presencial=[p for p in scheduled if p['appointment'].get('channel')=='presencial']
checks=[]

def click(name,role='button'):
    last=None
    for _ in range(4):
        try:
            nodes=cdp('Accessibility.getFullAXTree')['nodes']
            for n in nodes:
                if n.get('role',{}).get('value')==role and n.get('name',{}).get('value')==name:
                    cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId'])
                    q=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content']
                    click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4)
                    time.sleep(.3)
                    return
        except Exception as e: last=e
        time.sleep(.4)
    raise AssertionError('Missing '+name+((' / '+str(last)) if last else ''))
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
if js("!!document.querySelector('.auth-card')"): click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"): click('Usar tema claro');wait("!document.querySelector('.nv-app').classList.contains('nv-dark')")
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')");time.sleep(.5)
click('Agenda');wait("!!document.querySelector('.nva-agenda')")

assert js("document.querySelectorAll('.nv-sidebar nav button').length")==11
assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")=='Agenda'
assert js("document.querySelectorAll('.nva-stat').length")==4
stats=js("[...document.querySelectorAll('.nva-stat strong')].map(e=>Number(e.textContent))")
assert stats==[len(scheduled),len(video),len(presencial),len(unassigned)],(stats,len(scheduled),len(video),len(presencial),len(unassigned))
assert js("document.querySelectorAll('.nva-row').length")==len(scheduled)
assert js("document.querySelectorAll('.nva-unassigned article').length")==len(unassigned)
assert not js("!!document.querySelector('.nv-daily,.nv-work-toolbar,.reference-frame')")
assert js("[...document.querySelectorAll('.nva-row-actions a')].every(a=>a.href.startsWith('https://')&&a.target==='_blank'&&a.rel==='noopener noreferrer')")
checks.append(('aggregate-counts-and-safe-links',True))

click('Video');time.sleep(.2)
assert js("document.querySelectorAll('.nva-row').length")==len(video)
assert js("[...document.querySelectorAll('.nva-row .nv-badge')].every(e=>e.textContent.trim()==='Videollamada')")
click('Sin turno');time.sleep(.2)
assert js("document.querySelectorAll('.nva-row').length")==0
assert js("document.querySelectorAll('.nva-unassigned article').length")==len(unassigned)
click('Todas');time.sleep(.2)
checks.append(('agenda-filters',True))

if scheduled:
    expected=js("document.querySelector('.nva-row strong').textContent")
    js("document.querySelector('.nva-row .nv-button').click()");wait("!!document.querySelector('.nvc-consultations')")
    assert expected in js("document.querySelector('.nvc-context').innerText")
    assert js("document.querySelector('.nv-sidebar [aria-current=page]').textContent.trim()")=='Fichas'
    checks.append(('manage-opens-nutrigo-consultation',expected))
    click('Agenda');wait("!!document.querySelector('.nva-agenda')")

results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark: click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,stats:[...document.querySelectorAll('.nva-stat')].map(e=>e.getBoundingClientRect().height),rail:!!document.querySelector('.nv-daily'),legacy:!!document.querySelector('.reference-frame'),main:document.querySelector('.nv-main').getBoundingClientRect().width,layout:getComputedStyle(document.querySelector('.nva-layout')).gridTemplateColumns,calendar:document.querySelector('.nva-calendar').getBoundingClientRect().width,queue:document.querySelector('.nva-queue').getBoundingClientRect().width})")
        assert state['scroll']<=width and len(state['stats'])==4 and not state['rail'] and not state['legacy'],state
        if width==1440: assert ' ' in state['layout'] and state['calendar']>=700 and state['queue']>=330 and state['main']>=1150,state
        else: assert state['calendar']==state['queue'],state
        state.update(theme='dark' if dark else 'light')
        cdp('Page.bringToFront');js('window.scrollTo(0,0)');time.sleep(.15)
        p=out/('agenda-'+state['theme']+'-'+str(width)+'.png');p.write_bytes(base64.b64decode(cdp('Page.captureScreenshot',format='png')['data']));state['shot']=str(p)
        results.append(state)
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
checks.append(('responsive-themes',len(results)))

cdp('Emulation.setDeviceMetricsOverride',width=390,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
click('Paciente');wait("!!document.querySelector('.nv-patient')")
click('Abrir menú');wait("document.querySelector('.nv-sidebar').classList.contains('nv-open')")
click('Agenda');wait("document.querySelector('#nv-main').innerText.includes('próxima consulta')||document.querySelector('#nv-main').innerText.includes('Sin consulta programada')")
assert not js("!!document.querySelector('.nva-agenda,.nvc-consultations')")
assert 'gestión del turno corresponde' in js("document.querySelector('#nv-main').innerText") or 'Sin consulta programada' in js("document.querySelector('#nv-main').innerText")
checks.append(('patient-agenda-read-only-and-separate',True))

assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'checks.json').write_text(json.dumps(checks,indent=2,ensure_ascii=False),encoding='utf-8')
print(json.dumps({'checks':len(checks),'views':len(results),'scheduled':len(scheduled),'unassigned':len(unassigned),'errors':[]}))
