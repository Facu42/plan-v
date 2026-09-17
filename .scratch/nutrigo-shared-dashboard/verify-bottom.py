# Inspect the lower CRM cards at mobile and desktop widths
from pathlib import Path
exec(Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-professional/verify.py').read_text(encoding='utf-8').split("assert api('health')")[0])
out=Path(r'C:/Users/facun/OneDrive/Desktop/Personal/Vero Insta/Plan V/plan-v/.scratch/nutrigo-shared-dashboard')
for width in [390,1440]:
    cdp('Emulation.setDeviceMetricsOverride',width=width,height=1100,deviceScaleFactor=1,mobile=False)
    root=cdp('DOM.getDocument')['root']['nodeId']
    node=cdp('DOM.querySelector',nodeId=root,selector='.np-bottom-grid')['nodeId']
    cdp('DOM.scrollIntoViewIfNeeded',nodeId=node);time.sleep(.2)
    p=out/('lower-dark-'+str(width)+'.png')
    p.write_bytes(base64.b64decode(cdp('Page.captureScreenshot',format='png')['data']))
    print(str(p))
