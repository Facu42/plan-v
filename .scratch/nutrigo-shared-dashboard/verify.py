# Verify shared patient/professional dashboard and selection
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-shared-dashboard');out.mkdir(exist_ok=True)
new_tab('http://127.0.0.1:5180/');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.np-dashboard')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
results=[]
for role in ['Paciente','Nutricionista']:
    click(role)
    js("document.fonts.ready.then(()=>true)")
    for dark in [False,True]:
        if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
        for width in [1440,800,390,320]:
            cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.2)
            state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,metrics:document.querySelectorAll('.np-dashboard .nv-metric').length,oldCharts:document.querySelectorAll('.nv-chart-grid').length,gauge:!!document.querySelector('.np-gauge'),macros:document.querySelectorAll('.np-macro-row').length,contact:document.querySelector('.np-contact-card h2').textContent,menuTop:document.querySelector('.np-menu-card').getBoundingClientRect().top})")
            assert state['scroll']<=width and state['metrics']==4 and state['oldCharts']==0 and state['gauge'] and state['macros']==3,state
            if role=='Nutricionista':
                assert state['contact'].startswith('Conversación con '),state
                assert js("document.querySelectorAll('.nv-sidebar nav button').length")==11
            else:assert state['contact']=='Tu nutricionista'
            state.update(role=role,theme='dark' if dark else 'light',shot=shot(role+'-'+('dark' if dark else 'light')+'-'+str(width)))
            results.append(state)
            (out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False)
options=js("[...document.querySelector('.nv-patient-select select').options].map(o=>({id:o.value,name:o.textContent}))")
for index in [0,1]:
    n=next(n for n in cdp('Accessibility.getFullAXTree')['nodes'] if n.get('role',{}).get('value')=='combobox' and n.get('name',{}).get('value')=='Paciente en seguimiento')
    cdp('DOM.focus',backendNodeId=n['backendDOMNodeId'])
    for key,code in [('Home',36)]+([('ArrowDown',40)] if index else [])+[('Enter',13)]:
        cdp('Input.dispatchKeyEvent',type='keyDown',key=key,windowsVirtualKeyCode=code);cdp('Input.dispatchKeyEvent',type='keyUp',key=key,windowsVirtualKeyCode=code)
    time.sleep(.3)
    assert js("document.querySelector('.np-contact-card h2').textContent")=='Conversación con '+options[index]['name']
    click('Ver conversación');wait("!!document.querySelector('.nm-layout')")
    assert js("document.querySelector('.nm-conversation').getAttribute('aria-label')")=='Conversación con '+options[index]['name']
    click('Volver al consultorio');wait("!!document.querySelector('.np-dashboard')")
    assert js("document.querySelector('.nv-patient-select select').value")==options[index]['id']
click('Ver plan');wait("!!document.querySelector('.nv-plan-grid')");click('Inicio')
click('Últimos 7 días');wait("!!document.querySelector('.nv-ring')");click('Inicio')
# Hydration history retained in a keyboard-operable native disclosure.
node=next(n for n in cdp('Accessibility.getFullAXTree')['nodes'] if n.get('name',{}).get('value')=='Historial de hidratación · últimos 7 días' and n.get('role',{}).get('value')=='DisclosureTriangle')
cdp('DOM.focus',backendNodeId=node['backendDOMNodeId'])
cdp('Input.dispatchKeyEvent',type='keyDown',key='Enter',windowsVirtualKeyCode=13,text='\r',unmodifiedText='\r');cdp('Input.dispatchKeyEvent',type='keyUp',key='Enter',windowsVirtualKeyCode=13)
wait("document.querySelector('.nv-habit-details').open")
assert js("document.querySelector('.nv-habit-details .nv-bars').getBoundingClientRect().height")>0
assert not js('window.__qaErrors'),js('window.__qaErrors')
assert len(results)==len({(r['role'],r['theme'],r['width']) for r in results})==16
print(json.dumps({'captures':len(results),'patientConversationIsolation':'PASS','planAndProgress':'PASS','hydrationDisclosure':'PASS','errors':[]}))
