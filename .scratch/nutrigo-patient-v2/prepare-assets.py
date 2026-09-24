from pathlib import Path
from PIL import Image, ImageOps
import json
root=Path(__file__).resolve().parents[2]
source=root.parent/'archive/legacy-prototype-2026-09-04/contenido/fotos-publicaciones'
out=root/'src/assets/showroom'
out.mkdir(parents=True,exist_ok=True)
items=[('breakfast','Carrusel Comida Real - Slide 1 Desayuno Saludable_1.jpg',(380,830,1660,1780)),('lunch','Carrusel Comida Real - Slide 2 Almuerzo Balanceado_1.jpg',(350,830,1660,1770)),('snack','Carrusel Comida Real - Slide 3 Merienda Saludable_1.jpg',(340,840,1660,1770))]
manifest=[]
for name,filename,box in items:
    im=Image.open(source/filename).convert('RGB')
    image=ImageOps.fit(im.crop(box),(480,360),method=Image.Resampling.LANCZOS)
    dest=out/(name+'.webp');image.save(dest,'WEBP',quality=86)
    manifest.append({'source':str(source/filename),'derived':str(dest.relative_to(root)),'crop':box,'bytes':dest.stat().st_size,'usage':'Imagen ilustrativa del archivo de Plan V; no es foto del registro del paciente.'})
(root/'.scratch/nutrigo-patient-v2/assets.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(manifest,ensure_ascii=False))
