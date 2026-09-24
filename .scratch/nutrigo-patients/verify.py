# Verify operational patients directory in the Nutrigo showroom
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-patients');out.mkdir(exist_ok=True)

def click_prefix(prefix,role='button'):
    nodes=cdp('Accessibility.getFullAXTree')['nodes']
    for n in nodes:
        name=n.get('name',{}).get('value','')
        if n.get('role',{}).get('value')==role and name.startswith(prefix):
            cdp('DOM.scrollIntoViewIfNeeded',backendNodeId=n['backendDOMNodeId'])
            q=cdp('DOM.getBoxModel',backendNodeId=n['backendDOMNodeId'])['model']['content']
            click_at_xy(sum(q[0::2])/4,sum(q[1::2])/4);time.sleep(.25)
            return
    raise AssertionError('Missing '+prefix)

def set_field(sel,value):
    r=js("(() => { const el = document.querySelector("+json.dumps(sel)+"); if(!el) return 'MISSING'; const proto = el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto,'value').set.call(el,"+json.dumps(value)+"); el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true})); return el.value; })()")
    assert r==value,(sel,value,r)

def find_patient(name):
    return next((p for p in api('patients')['patients'] if p['name']==name),None)

assert api('health')['supabase'] is False
stamp=str(int(time.time()))
qa_name='Paciente QA '+stamp
qa_email='qa+'+stamp+'@example.com'
before={p['id']:p for p in api('patients')['patients']}
sofia_before=next(p for p in before.values() if p['id'].startswith('pat-sofia') or p['name']=='Sofía')

new_tab('http://127.0.0.1:5180/');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
click('Nutricionista');wait("!!document.querySelector('.nv-work-toolbar')")

# Sidebar module opens the new directory (not the legacy bridge).
click('Pacientes');wait("!!document.querySelector('.nv-directory-table')")
assert not js("!!document.querySelector('.crm-patients')")
checks=[('sidebar-opens-new-directory',True)]

# External search from the page head.
fill_input('input[type=search]','Marina');time.sleep(.3)
assert js("document.querySelectorAll('.nv-directory-table [role=row]').length")==2
assert js("document.querySelector('.nv-directory-table').textContent.includes('Marina')") and not js("document.querySelector('.nv-directory-table').textContent.includes('Sofía')")
fill_input('input[type=search]','');time.sleep(.3)
checks.append(('search-filters-directory',True))

# Create flow: dialog -> API record -> notice without email claim.
click('Nuevo paciente');wait("!!document.querySelector('.nv-dialog')")
set_field('.nv-dialog-form > label:nth-of-type(1) input',qa_name)
set_field('.nv-dialog-form > label:nth-of-type(2) input',qa_email)
set_field('.nv-dialog-form > label:nth-of-type(3) textarea','Objetivo QA del corte directorio')
click('Crear alta');wait("!!document.querySelector('.nv-directory-notice')")
created=find_patient(qa_name);assert created,(qa_name,'no aparece en API')
assert created['billing_status']=='pending' and not created.get('archived_at'),created
assert 'todavía no enviada' in js("document.querySelector('.nv-directory-notice').textContent")
assert js("document.querySelector('.nv-directory-table').textContent.includes("+json.dumps(qa_name)+")")
checks.append(('create-persists-and-notice',created['id']))

# Edit flow: profile update -> exact API read-back; Sofía untouched.
click('Editar ficha de '+qa_name);wait("!!document.querySelector('.nv-dialog')")
set_field('.nv-dialog-grid > label:nth-of-type(2) input','En prueba QA')
set_field('.nv-dialog-grid > label:nth-of-type(3) select','plan')
set_field('.nv-dialog-form > label:nth-of-type(2) textarea','Foco QA editado')
click('Guardar cambios');wait("!document.querySelector('.nv-dialog')")
time.sleep(.4)
updated=find_patient(qa_name)
assert updated['status']=='En prueba QA' and updated['stage']=='plan' and updated['next_focus']=='Foco QA editado',updated
sofia=next(p for p in api('patients')['patients'] if p['id']==sofia_before['id'])
assert sofia['status']==sofia_before['status'] and sofia['next_focus']==sofia_before['next_focus'] and sofia['stage']==sofia_before['stage']
checks.append(('edit-persists-isolated',True))

# Archive two-step -> disappears from Activos, appears in Archivados; restore reverses.
click_prefix('Archivar '+qa_name);wait("!!document.querySelector('[aria-label=\"Confirmar archivo de "+qa_name+"\"]')")
click('Confirmar archivo de '+qa_name);time.sleep(.5)
archived=find_patient(qa_name);assert archived.get('archived_at'),archived
assert not js("document.querySelector('.nv-directory-table').textContent.includes("+json.dumps(qa_name)+")")
click_prefix('Archivados');time.sleep(.3)
assert js("document.querySelector('.nv-directory-table').textContent.includes("+json.dumps(qa_name)+")")
click('Restaurar '+qa_name);time.sleep(.5)
restored=find_patient(qa_name);assert not restored.get('archived_at'),restored
click_prefix('Activos');time.sleep(.3)
assert js("document.querySelector('.nv-directory-table').textContent.includes("+json.dumps(qa_name)+")")
checks.append(('archive-restore-reversible',True))

# Follow flow keeps multipatient context.
click('Ver seguimiento de '+qa_name);wait("!!document.querySelector('.nv-context-banner')")
assert js("document.querySelector('.nv-context-banner').textContent.includes("+json.dumps(qa_name)+")")
checks.append(('follow-selects-patient',True))

# Toolbar 'Editar pacientes' now lands on the new directory, not the legacy editor.
click('Editar pacientes');wait("!!document.querySelector('.nv-directory-table')")
assert not js("!!document.querySelector('.crm-patients')")
checks.append(('toolbar-uses-new-directory',True))

# Responsive evidence on the directory page.
results=[]
for dark in [False,True]:
    if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
    for width in [1440,800,390,320]:
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False);time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,summary:document.querySelectorAll('.nv-directory-summary > div').length,filters:document.querySelectorAll('.nv-directory-filters button').length,rows:document.querySelectorAll('.nv-directory-table [role=row]').length,table:document.querySelector('.nv-directory-table').getBoundingClientRect().width})")
        assert state['scroll']<=width and state['summary']==4 and state['filters']==3 and state['rows']>=2,state
        state.update(theme='dark' if dark else 'light',shot=shot('directory-'+('dark' if dark else 'light')+'-'+str(width)));results.append(state)
(out/'verification.json').write_text(json.dumps(results,indent=2),encoding='utf-8')

# Leave the demo directory tidy: archive the QA patient again.
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1100,deviceScaleFactor=1,mobile=False)
click_prefix('Archivar '+qa_name);wait("!!document.querySelector('[aria-label=\"Confirmar archivo de "+qa_name+"\"]')")
click('Confirmar archivo de '+qa_name);time.sleep(.5)
assert find_patient(qa_name).get('archived_at')
checks.append(('qa-patient-left-archived',True))

assert not js('window.__qaErrors'),js('window.__qaErrors')
(out/'checks.json').write_text(json.dumps(checks,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(checks),'views':len(results),'patientId':created['id'],'errors':[]}))
