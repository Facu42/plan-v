# Verify default entry and bidirectional demo messaging
from pathlib import Path
import uuid
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-messaging');out.mkdir(exist_ok=True)
assert api('health')['supabase'] is False
new_tab('http://127.0.0.1:5180/');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.np-dashboard')")
assert js('location.search')==''
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
click('Versión anterior','link');wait_for_load();wait("!!document.querySelector('.auth-card,.prototype-switch')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.prototype-switch')");assert js('location.search')=='?design=legacy'
click('Nuevo diseño','link');wait_for_load();wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.np-dashboard')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
people=[p for p in api('patients')['patients'] if not p.get('archived_at')]
selected=people[0];other=people[1]
before={p['id']:api('patients/'+p['id'])['patient']['messages'] for p in people}
click('Mensajes');wait("!!document.querySelector('.nm-compose')")
assert js("document.querySelector('.nm-contacts').textContent.includes('Verónica Trenti')")
text='QA diseño · paciente '+uuid.uuid4().hex[:8]
fill_input('#nm-message',text);click('Enviar mensaje');wait("document.querySelector('#nm-status').textContent==='Mensaje enviado.'")
messages=api('patients/'+selected['id'])['patient']['messages'];new=[m for m in messages if m['text']==text]
assert len(new)==1 and new[0]['from']=='patient' and new[0]['sent_at']
assert api('patients/'+other['id'])['patient']['messages']==before[other['id']]
click('Nutricionista');click('Abrir mensajes');wait("!!document.querySelector('.nm-compose')")
assert js('document.querySelector(".nm-thread").textContent.includes('+json.dumps(text)+')')
reply='QA diseño · respuesta profesional '+uuid.uuid4().hex[:8]
fill_input('#nm-message',reply);click('Enviar mensaje');wait("document.querySelector('#nm-status').textContent==='Mensaje enviado.'")
messages=api('patients/'+selected['id'])['patient']['messages'];new=[m for m in messages if m['text']==reply]
assert len(new)==1 and new[0]['from']=='vero' and new[0]['suggested_by_ai'] is False
fill_input('#nm-message','BORRADOR NO ENVIADO')
# Pick the other conversation using its exact accessible button name.
def pick(name):
    nodes=cdp('Accessibility.getFullAXTree')['nodes']
    label=next(n['name']['value'] for n in nodes if n.get('role',{}).get('value')=='button' and name in n.get('name',{}).get('value',''))
    click(label)
pick(other['name']);assert js("document.querySelector('#nm-message').value")==''
assert not js('document.querySelector(".nm-thread").textContent.includes('+json.dumps(text)+')')
assert api('patients/'+other['id'])['patient']['messages']==before[other['id']]
pick(selected['name'])
fill_input('input[aria-label="Buscar conversaciones"]','zz-no-results');assert js("document.querySelectorAll('.nm-contact-list button').length")==0
fill_input('input[aria-label="Buscar conversaciones"]','')
# Expected send failure preserves the draft; this interceptor touches only this QA tab.
js("window.__normalFetch=window.fetch;window.fetch=(...args)=>String(args[0]).endsWith('/messages')?Promise.reject(new Error('QA offline')):window.__normalFetch(...args)")
fill_input('#nm-message','QA fallo sin guardar');click('Enviar mensaje');wait("!!document.querySelector('#nm-error')")
assert js("document.querySelector('#nm-message').value")=='QA fallo sin guardar'
js('window.fetch=window.__normalFetch;delete window.__normalFetch')
fill_input('#nm-message','')
results=[]
for role in ['Nutricionista','Paciente']:
    if role=='Paciente':click('Paciente');click('Mensajes')
    for dark in [False,True]:
        if js("document.querySelector('.nv-app').classList.contains('nv-dark')")!=dark:click('Usar tema oscuro' if dark else 'Usar tema claro')
        for width in [1440,800,390,320]:
            cdp('Emulation.setDeviceMetricsOverride',width=width,height=1000,deviceScaleFactor=1,mobile=False);time.sleep(.2)
            assert js('document.documentElement.scrollWidth<=innerWidth')
            assert js("!document.querySelector('.nv-daily')")
            results.append({'role':role,'theme':'dark' if dark else 'light','width':width,'shot':shot(role+'-'+('dark' if dark else 'light')+'-'+str(width))})
            (out/'captures.json').write_text(json.dumps(results,indent=2),encoding='utf-8')
assert js('document.querySelector(".nm-thread").textContent.includes('+json.dumps(reply)+')')
assert not js('window.__qaErrors'),js('window.__qaErrors')
assert len(results)==len({(r['role'],r['theme'],r['width']) for r in results})==16
report={'rootDefaultsToNutrigo':True,'legacyAccessible':True,'patientSend':text,'professionalReply':reply,'selectedId':selected['id'],'isolatedId':other['id'],'draftIsolation':True,'failurePreservesDraft':True,'captures':len(results),'errors':[],'demoNote':'Two clearly labelled QA messages remain in the in-memory demo; no real messages sent.'}
(out/'verification.json').write_text(json.dumps(report,indent=2),encoding='utf-8');print(json.dumps(report))
