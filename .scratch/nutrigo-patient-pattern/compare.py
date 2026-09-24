from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import json
p = Path(__file__).resolve().parent
reference = Image.open(p / 'nutrigo-reference.jpg').convert('RGB')
# Desktop artboard visible in the public marketplace preview; never bundled in the app.
crop = reference.crop((582, 412, 1600, 1066))
crop.save(p / 'nutrigo-dashboard-crop.png')
width = 1200
height = round(crop.height * width / crop.width)
left = crop.resize((width, height), Image.Resampling.LANCZOS)
current = Image.open(p / 'light-1440.png').convert('RGB')
right = current.resize((width, round(current.height * width / current.width)), Image.Resampling.LANCZOS).crop((0, 0, width, height))
canvas = Image.new('RGB', (width * 2 + 24, height + 110), '#e8ece6')
canvas.paste(left, (0, 80)); canvas.paste(right, (width + 24, 80))
draw = ImageDraw.Draw(canvas)
try:
    font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 26)
    small = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 16)
except OSError:
    font = small = ImageFont.load_default()
draw.text((20, 16), 'NUTRIGO · referencia pública recortada', font=font, fill='#083a30')
draw.text((width + 44, 16), 'PLAN V · Dashboard paciente en navegador', font=font, fill='#083a30')
draw.text((20, 49), 'Escala igualada por ancho. Preview de referencia parcial; no es un Figma de producción.', font=small, fill='#40564a')
draw.text((width + 44, 49), 'Marca y datos de Plan V. Iteración visual, todavía sin aprobación.', font=small, fill='#40564a')
canvas.save(p / 'comparison.png')
print(json.dumps({'file':str(p / 'comparison.png'),'referenceCrop':[582,412,1600,1066],'comparisonSize':canvas.size}))
