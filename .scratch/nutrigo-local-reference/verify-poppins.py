# Verify locally loaded Poppins in both showroom roles
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out = Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-local-reference/poppins')
out.mkdir(exist_ok=True)
new_tab('http://127.0.0.1:5180/?design=nutrigo'); wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"): click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
js("window.__qaErrors=[];window.addEventListener('error',e=>window.__qaErrors.push(e.message));window.addEventListener('unhandledrejection',e=>window.__qaErrors.push(String(e.reason)))")
js("Promise.all([400,500,600,700,800].map(w=>document.fonts.load(w+' 14px Poppins','Nutrición'))).then(()=>true)")
wait("document.fonts.status==='loaded'")
fonts = js("[...document.fonts].filter(f=>f.family.includes('Poppins')).map(f=>({family:f.family,weight:f.weight,status:f.status}))")
assert len(fonts) == 5 and all(f['status']=='loaded' for f in fonts), fonts
results=[]
for role in ['Paciente','Nutricionista']:
    click(role)
    for dark, width in [(False,1440),(True,390)]:
        if js("document.querySelector('.nv-app').classList.contains('nv-dark')") != dark:
            click('Usar tema oscuro' if dark else 'Usar tema claro')
        cdp('Emulation.setDeviceMetricsOverride',width=width,height=1200,deviceScaleFactor=1,mobile=False)
        time.sleep(.25)
        state=js("({width:innerWidth,scroll:document.documentElement.scrollWidth,font:getComputedStyle(document.querySelector('.nv-app')).fontFamily,titleFont:getComputedStyle(document.querySelector('.nv-page-head h1')).fontFamily})")
        assert state['scroll']<=width,state
        assert state['font'].startswith('Poppins') and state['titleFont'].startswith('Poppins'),state
        state.update(role=role,theme='dark' if dark else 'light',shot=shot(role+'-'+str(width)))
        results.append(state)
        (out/'verification.json').write_text(json.dumps({'fonts':fonts,'views':results},indent=2),encoding='utf-8')
urls=js("performance.getEntriesByType('resource').filter(r=>r.name.includes('poppins')&&r.name.includes('.woff')).map(r=>r.name)")
assert len(urls)>=5 and all(u.startswith('http://127.0.0.1:5180/') for u in urls),urls
assert not js('window.__qaErrors'),js('window.__qaErrors')
assert len(results)==len({(r['role'],r['width']) for r in results})==4
print(json.dumps({'font':'Poppins','loadedWeights':[f['weight'] for f in fonts],'fontAssets':'local','verifiedViews':len(results),'errors':[]}))
