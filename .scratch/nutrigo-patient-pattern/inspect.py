# Inspect current patient pattern against Nutrigo
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-patient-pattern');out.mkdir(exist_ok=True,parents=True)
new_tab('http://127.0.0.1:5180/?design=nutrigo');wait_for_load()
wait("!!document.querySelector('.auth-card,.nv-app')")
if js("!!document.querySelector('.auth-card')"):click('Continuar en modo demo')
wait("!!document.querySelector('.nv-app')")
cdp('Emulation.setDeviceMetricsOverride',width=1440,height=1000,deviceScaleFactor=1,mobile=False)
if js("document.querySelector('.nv-app').classList.contains('nv-dark')"):click('Usar tema claro')
wait("!!document.querySelector('.np-dashboard')")
print(shot('before-1440'))
print(js("({images:[...document.querySelectorAll('.np-food-photo')].map(i=>({src:i.src,ok:i.complete&&i.naturalWidth>0})),bounds:[...document.querySelectorAll('.nv-sidebar,.nv-main,.nv-daily,.np-metrics,.np-chart-grid,.np-followup')].map(e=>({class:e.className,x:e.getBoundingClientRect().x,y:e.getBoundingClientRect().y,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height})),font:getComputedStyle(document.querySelector('h1')).fontFamily})"))
