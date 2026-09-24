# Inspect disclosure keyboard focus after the QA failure
print([(n.get('role',{}).get('value'),n.get('name',{}).get('value'),n.get('backendDOMNodeId')) for n in cdp('Accessibility.getFullAXTree')['nodes'] if 'Historial de hidratación' in n.get('name',{}).get('value','')])
print(js('({active:document.activeElement.outerHTML,open:document.querySelector(".nv-habit-details").open})'))
