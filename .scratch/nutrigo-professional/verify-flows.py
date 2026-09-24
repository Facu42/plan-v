# Exercise real demo saves and selected-patient isolation
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
assert api('health')['supabase'] is False
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
click('Nutricionista');click('Pacientes');fill_input('input[type=search]','Marina');wait("document.querySelectorAll('.nv-patient-table [role=row]').length===2");click('Ver seguimiento')
original=api('patients/pat-marina')['patient']
other=api('patients/pat-sofia')['patient']
(out/'before-flows.json').write_text(json.dumps({'marina':original,'sofia':other},ensure_ascii=False,indent=2),encoding='utf-8')
results=[]
def back():
    click('← Volver al diseño');wait("!!document.querySelector('.nv-app')")
    assert js("document.querySelector('.nv-patient-select select').value")==original['id']
def poll_api(predicate):
    for _ in range(40):
        p=api('patients/pat-marina')['patient']
        if predicate(p):return p
        time.sleep(.15)
    raise AssertionError('API state did not update')
# Reversible menu edit, persisted by existing API and projected back into preview.
day=original['weekPlan'][0]['day'];meal=original['weekPlan'][0]['meals'][0];title=meal['title'];marker='QA Plan V - cambio temporal'
selector='input[aria-label='+json.dumps(day+' · '+meal['slot'],ensure_ascii=False)+']'
click('Editar plan');wait("!!document.querySelector('.menu-editor')")
fill_input(selector,marker);click('Guardar')
poll_api(lambda p: p['weekPlan'][0]['meals'][0]['title']==marker)
back();click('Paciente');click('Plan semanal');wait('document.querySelector(".nv-main").textContent.includes('+json.dumps(marker)+')')
click('Nutricionista');click('Editar plan');wait("!!document.querySelector('.menu-editor')")
fill_input(selector,title);click('Guardar')
poll_api(lambda p: p['weekPlan'][0]['meals'][0]['title']==title)
back();results.append({'flow':'menu-save-and-restore','patientPreviewUpdated':True,'apiReadback':True})
# Reversible appointment edit, without following meeting URLs.
oldtime=original['appointment']['when'].split(' · ')[1];newtime='12:15' if oldtime!='12:15' else '12:30'
click('Gestionar consultas');wait("!!document.querySelector('.appointments-tab')");click('Reagendar')
fill_input('input[type=time]',newtime);click('Guardar turno')
poll_api(lambda p:p['appointment']['when'].endswith(newtime));back()
assert newtime in js("document.querySelector('.nv-next-visit').textContent")
click('Gestionar consultas');wait("!!document.querySelector('.appointments-tab')");click('Reagendar')
fill_input('input[type=time]',oldtime);click('Guardar turno');poll_api(lambda p:p['appointment']==original['appointment']);back()
results.append({'flow':'appointment-save-and-restore','apiReadback':True})
# Review dialog must belong to Marina and never show Sofia's pending meal.
click('Revisar comidas');wait("!!document.querySelector('.meals-habits-tab')");click('Revisar')
wait("!!document.querySelector('.review-panel')")
assert 'Merienda' in js("document.querySelector('#meal-review-title').textContent")
click('Cerrar');back();results.append({'flow':'review-dialog','patient':'Marina','unchanged':True})
# Every original module opens from the professional preview.
modules=js("[...document.querySelectorAll('.nv-sidebar nav button')].map(b=>b.textContent)")
for name in modules:
    click(name)
    if name in ['Inicio','Pacientes']:
        assert js("!!document.querySelector('.nv-app')")
    else:
        wait("!!document.querySelector('.reference-frame')")
        assert js("document.querySelector('.menu-current .menu-label').textContent")==name
        assert js("document.querySelector('.work-person.selected .person-copy b').textContent")==original['name']
        back()
    results.append({'module':name,'opened':True})
# Switching away and back updates patient-specific data, without stale Marina fields.
click('Inicio');click('Pacientes');fill_input('input[type=search]','Sofía');wait("document.querySelectorAll('.nv-patient-table [role=row]').length===2");click('Ver seguimiento');click('Editar plan');wait("!!document.querySelector('.menu-editor')")
assert 'Sofía' in js("document.querySelector('.menu-editor h3').textContent")
assert 'Marina' not in js("document.querySelector('.crm-workspace').innerText")
click('← Volver al diseño');wait("!!document.querySelector('.nv-app')")
assert 'Sofía' in js("document.querySelector('.nv-context-banner').textContent")
# Unrelated patient's full record unchanged. Target's edited fields restored.
assert api('patients/pat-sofia')['patient']==other
restored=api('patients/pat-marina')['patient']
assert restored['weekPlan']==original['weekPlan']
assert restored['appointment']==original['appointment']
assert restored['meal_logs']==original['meal_logs']
assert not js('window.__qaErrors'),js('window.__qaErrors')
results.append({'flow':'patient-isolation','otherPatientUnchanged':True,'editedFieldsRestored':True,'errors':[]})
(out/'flows.json').write_text(json.dumps(results,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({'checks':len(results),'modules':len(modules),'result':'PASS'}))
