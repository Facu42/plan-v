# Verify patient activity logging and professional visibility.
import base64,json,time,urllib.request
from pathlib import Path
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-exercise');out.mkdir(parents=True,exist_ok=True)

def fetch(path): return json.load(urllib.request.urlopen('http://127.0.0.1:3013'+path))
def wait(expr,timeout=12):
    end=time.time()+timeout
    while time.time()<end:
        if js(expr): return
        time.sleep(.15)
    raise AssertionError(expr)
def button(label):
    result=js("(() => { const target="+json.dumps(label)+"; const el=Array.from(document.querySelectorAll('button')).find(b=>b.innerText.trim()===target || b.getAttribute('aria-label')===target); if(!el) return false; el.click(); return true; })()")
    assert result,label
    time.sleep(.3)
def save(name):
    cdp('Page.bringToFront');raw=cdp('Page.captureScreenshot',format='png',captureBeyondViewport=True)['data'];(out/name).write_bytes(base64.b64decode(raw))

goto_url('http://127.0.0.1:5183/');wait_for_load();js('localStorage.clear()');goto_url('http://127.0.0.1:5183/');wait_for_load();wait("document.body.innerText.includes('Continuar en modo demo')");button('Continuar en modo demo');wait("document.body.innerText.includes('Paciente') && document.body.innerText.includes('Nutricionista')")
button('Paciente');time.sleep(.5);button('Ejercicio');wait("!!document.querySelector('.nvexercise')")
assert js("document.body.innerText.includes('Todavía no registraste actividad')")
assert not js("Array.from(document.querySelectorAll('.nv-sidebar button')).find(b=>b.innerText.includes('Ejercicio')).innerText.includes('Pronto')")
patient_id=js("document.querySelector('.nvexercise').closest('.nv-app') && localStorage.getItem('plan-v:selected-patient')") or 'pat-sofia'
# Gather private strings from isolated full demo response before testing the patient DOM.
full=fetch('/api/patients/'+patient_id)['patient']
private=[full.get('adherence_why',''),full.get('sensitive_hours',''),full.get('plan_b',''),full.get('next_focus','')]
private += [x.get('note_for_nutri','') for x in full.get('meal_logs',[])]
private += [x.get('note','') for x in full.get('goal_history',[])]
private=[x for x in private if x]
body=js('document.body.innerText')
assert not any(x in body for x in private)
other=next(p for p in fetch('/api/patients')['patients'] if p['id']!=patient_id)
other_before=len(other.get('activity_logs',[]))
button('Registrar actividad');wait("!!document.querySelector('.nvexercise-modal')")
fill_input('input[placeholder="Ej. Caminata al aire libre"]','Caminata QA')
fill_input('input[type="number"]','35')
js("(() => { const s=document.querySelector('.nvexercise-modal select');s.value='moderada';s.dispatchEvent(new Event('change',{bubbles:true})); })()")
fill_input('.nvexercise-modal textarea','Me sentí bien en QA')
button('Guardar actividad');wait("!document.querySelector('.nvexercise-modal') && document.body.innerText.includes('Caminata QA')")
updated=fetch('/api/patients/'+patient_id)['patient']
entry=updated['activity_logs'][0]
assert entry['activity']=='Caminata QA' and entry['duration_minutes']==35 and entry['intensity']=='moderada'
assert entry['note']=='Me sentí bien en QA'
assert len(next(p for p in fetch('/api/patients')['patients'] if p['id']==other['id']).get('activity_logs',[]))==other_before
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"): button('Usar tema claro')
time.sleep(.3)
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=900,deviceScaleFactor=1,mobile=False);save('exercise-light-1440.png')
# Professional Activities reuses the selected patient's diary and must expose the self-report read-only.
button('Nutricionista');time.sleep(.5);button('Actividades');wait("!!document.querySelector('.nvm-diary')")
wait("document.body.innerText.includes('Caminata QA') && document.body.innerText.includes('Actividad autodeclarada')")
assert js("document.body.innerText.includes('35 min')")
# Return to patient exercise for mobile dark validation.
button('Paciente');time.sleep(.5);button('Ejercicio');wait("!!document.querySelector('.nvexercise')")
if not js("document.querySelector('.nv-app').classList.contains('nv-dark')"): button('Usar tema oscuro')
time.sleep(.3)
cdp('Emulation.setDeviceMetricsOverride',width=390,height=844,deviceScaleFactor=1,mobile=True);time.sleep(.4)
assert js("document.documentElement.scrollWidth<=document.documentElement.clientWidth")
assert js("document.body.innerText.includes('Caminata QA')")
save('exercise-dark-390.png')
errors=js("window.__planVErrors||[]")
print(json.dumps({'checks':7,'views':6,'patient':patient_id,'created':entry['id'],'otherUntouched':True,'private':len(private),'errors':errors}))
assert not errors
