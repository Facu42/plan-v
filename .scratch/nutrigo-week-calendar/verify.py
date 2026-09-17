# Verify weekly dates, menu isolation and responsive calendar
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-week-calendar');out.mkdir(exist_ok=True)
assert api('health')['supabase'] is False
new_tab('http://127.0.0.1:5180/');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nw-calendar')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
results=[]
for role in ['Paciente','Nutricionista']:
    click(role)
    for dark in [False,True]:
        if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
        for width in [1440,800,390,320]:
            cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
            state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,days:document.querySelectorAll('.nw-day').length,selected:document.querySelectorAll('.nw-day[aria-pressed=true]').length,today:document.querySelector('.nw-day[aria-current=date]').getAttribute('aria-pressed'),height:document.querySelector('.nw-calendar').getBoundingClientRect().height,cellWidths:[...document.querySelectorAll('.nw-day')].map(e=>e.getBoundingClientRect().width),font:getComputedStyle(document.querySelector('.nw-calendar')).fontFamily,logo:[...document.querySelectorAll('.brand-mark img,img.brand-mark')].every(i=>i.complete&&i.naturalWidth>0)})")
            assert state['scroll']<=width and state['days']==7 and state['selected']==1 and state['today']=='true',state
            assert min(state['cellWidths'])>=24 and state['height']==128,state
            if role=='Nutricionista':assert js("document.querySelectorAll('.nv-sidebar nav button').length")==11
            n=next(n for n in cdp('Accessibility.getFullAXTree')['nodes'] if n.get('name',{}).get('value')=='Volver a hoy' and n.get('role',{}).get('value')=='button')
            cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId']);time.sleep(.15)
            cdp('Page.bringToFront')
            path=out/(role+'-'+('dark' if dark else 'light')+'-'+str(width)+'.png')
            path.write_bytes(base64.b64decode(cdp('Page.captureScreenshot',format='png')['data']))
            state.update(role=role,theme='dark' if dark else 'light',shot=str(path));results.append(state)
            (out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False)
people=api('patients')['patients']
options=js("[...document.querySelector('.nv-patient-select select').options].map(o=>({id:o.value,name:o.textContent}))")
flows=[]
for index in [0,1]:
    node=next(n for n in cdp('Accessibility.getFullAXTree')['nodes'] if n.get('role',{}).get('value')=='combobox' and n.get('name',{}).get('value')=='Paciente en seguimiento')
    cdp('DOM.focus',backendNodeId=node['backendDOMNodeId'])
    for key,code in [('Home',36)]+([('ArrowDown',40)] if index else [])+[('Enter',13)]:
        cdp('Input.dispatchKeyEvent',type='keyDown',key=key,windowsVirtualKeyCode=code);cdp('Input.dispatchKeyEvent',type='keyUp',key=key,windowsVirtualKeyCode=code)
    time.sleep(.3)
    p=next(p for p in people if p['id']==options[index]['id'])
    assert js("document.querySelector('.nw-day[aria-current=date]').getAttribute('aria-pressed')")=='true'
    days=js("[...document.querySelectorAll('.nw-day')].map(e=>({label:e.getAttribute('aria-label'),day:e.querySelector('span').textContent,today:e.getAttribute('aria-current')==='date'}))")
    full=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo']
    for i,d in enumerate(days):
        click(d['label'])
        actual=js("[...document.querySelectorAll('.nv-agenda-meals strong')].map(e=>e.textContent)")
        expected=p['todayPlan'] if d['today'] else next((row['meals'] for row in p['weekPlan'] if row['day']==full[i]),[])
        assert actual==[meal['title'] for meal in expected],(p['name'],d,actual,expected)
        assert js("document.querySelectorAll('.nw-day[aria-pressed=true]').length")==1
        flows.append({'patient':p['id'],'day':full[i],'meals':len(actual),'verified':True})
    # Actual keyboard activation of Today and visible focus.
    node=next(n for n in cdp('Accessibility.getFullAXTree')['nodes'] if n.get('name',{}).get('value')=='Volver a hoy' and n.get('role',{}).get('value')=='button')
    cdp('DOM.focus',backendNodeId=node['backendDOMNodeId'])
    cdp('Input.dispatchKeyEvent',type='keyDown',key='Enter',windowsVirtualKeyCode=13,text='\r');cdp('Input.dispatchKeyEvent',type='keyUp',key='Enter',windowsVirtualKeyCode=13)
    wait("document.querySelector('.nw-day[aria-current=date]').getAttribute('aria-pressed')==='true'")
    assert js("[...document.querySelectorAll('.nv-agenda-meals strong')].map(e=>e.textContent)")==[m['title'] for m in p['todayPlan']]
    # Keep a non-today selection before changing patient; next iteration must reset it.
    click(next(d['label'] for d in days if not d['today']))
assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'flows.json').write_text(json.dumps(flows,indent=2),encoding='utf-8')
rows=json.loads((out/'verification.json').read_text());assert len(rows)==len({(r['role'],r['theme'],r['width']) for r in rows})==16
assert len(flows)==14
print(json.dumps({'views':len(rows),'menuChecks':len(flows),'calendarHeight':128,'keyboardToday':'PASS','patientReset':'PASS','errors':[]}))
