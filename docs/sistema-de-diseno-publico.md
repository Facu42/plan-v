# Sistema de diseño de Plan V para páginas públicas

Para las páginas que ve cualquiera, sin sesión: `/pacientes` (y `/nutricionistas`, que viene después), y las que vengan (anuncios, piezas de redes que enlazan a la web).
**No toca la app.** Las pantallas de nutricionista y paciente siguen exactas al modelo de Nutrigo.

Fuente de verdad: [`src/landing/tokens.css`](../src/landing/tokens.css) (variables listas para usar). Vista del sistema: [`sistema-de-diseno-publico.html`](sistema-de-diseno-publico.html) (se abre con doble clic).
**Este sistema reemplaza la paleta de la guía de redes (`docs/redes`, PR 24)**, que usaba lima y lienzo de la app. Los colores de acá salen del logo (`marca/brand_kit.json`).

## Color (del logo)

| Variable | Valor | Para qué |
|---|---|---|
| `--pv-deep` | #083A30 | Texto, fondos oscuros |
| `--pv-green` | #23955D | Acentos y títulos grandes sobre crema |
| `--pv-leaf` | #62AA66 | Detalles; nunca texto chico |
| `--pv-gold` | #F9B343 | Botones, etiquetas, cinta |
| `--pv-gold-soft` | #FCD58E | Hover del dorado, fondos suaves |
| `--pv-coral` | #F87D6D | Sólo decorativo |
| `--pv-apricot` | #F5A067 | Apoyo decorativo |
| `--pv-cream` | #F9F6EE | Lienzo |
| `--pv-mist` | #E3EFE4 | Tarjetas y fondos suaves |
| `--pv-ink-soft` | #3F5F56 | Texto secundario sobre crema |

Pares de texto aprobados (contraste WCAG): verde profundo sobre crema 11,7 · crema sobre verde profundo 11,7 · verde profundo sobre dorado 7,0 · dorado sobre verde profundo 7,0 · verde profundo sobre verde claro 10,7 · verde del logo sobre crema 3,5 (sólo títulos desde 30 px).
Prohibido: blanco sobre dorado, texto chico en verde del logo sobre crema, texto chico en coral u hoja.

## Tipografía

Poppins. 600 títulos, 500 subtítulos y botones, 400 texto. Cursiva 500 sólo para resaltar 2 o 3 palabras de un título (en verde sobre crema, en dorado sobre oscuro).
Títulos de hasta 3 renglones. Tono en voseo, cálido, sin promesas de resultados ni "bajar de peso".

## Forma y espacio

Radio 32 px en bloques y fotos, 24 px en tarjetas, píldora en botones y etiquetas. Márgenes laterales `clamp(20px, 5vw, 72px)`, ancho máximo 1240 px. Secciones con 72 a 140 px de aire vertical.

## Componentes

- **Botón** (`.lp-btn`): dorado con texto verde profundo, píldora. Sobre fondo oscuro, el mismo.
- **Etiqueta** (`.lp-tag`): dorada con texto verde profundo; sobre crema puede ir invertida (verde profundo con texto dorado).
- **Tarjeta** (`.lp-card`): blanca, radio 24, número en píldora dorada; al pasar el mouse sube y se tiñe de verde claro.
- **Bloque oscuro** (`.lp-green`, `.lp-cta`): verde profundo con texto crema y resalte dorado.
- **Cinta** (`.lp-marquee`): franja dorada inclinada que se desplaza, sólo decorativa (`aria-hidden`).
- **Números** (`.lp-stats`): cifra grande con línea arriba; suben al entrar en pantalla. Sólo cifras de producto, nunca de ventas ni resultados.
- **Foto** (`.lp-photo`): radio 32, entra recortándose y con un parallax suave. En la portada se deja aire arriba (la barra flotante no debe tapar la cara) y el encuadre apunta a la parte alta de la foto.
- **Función en fila** (`.lp-feature`): foto a un lado y texto con etiqueta, título, bajada y dos puntos (`.lp-checks`); se alternan los lados y en celular se apilan. Cada fila debe describir algo que la app hace hoy; si no existe, va como "próximamente".

## Landing de pacientes (rediseño, `src/landing/pacientes.css`)

Usa **todos** los colores del logo como fondos de tarjetas, con pares ya probados (clases `.pv-c-gold`, `.pv-c-coral`, `.pv-c-leaf`, `.pv-c-apricot`, `.pv-c-orange`, `.pv-c-mist`, `.pv-c-green`, `.pv-c-deep`). Sobre naranja y hoja el texto va en verde profundo y con peso 500 o más; el texto blanco chico sólo sobre `--pv-green-strong` o verde profundo.

- **Portada con zoom** (`.pv-zoom`): la sección mide 260 % del alto de pantalla; la foto queda fija y se acerca mientras se baja, el marco pasa de tarjeta a pantalla completa y el título se reemplaza por una segunda frase.
- **Beneficios en horizontal** (`.pv-hs`): la sección queda fija y la fila de tarjetas se corre de costado con el scroll; una barra muestra el avance.
- **El logo** aparece en la barra, la portada, la cinta, el bloque de la diferencia, la foto de la nutricionista, el cierre (girando) y el pie.
- Sin el script, o con "reducir movimiento", la portada es una foto quieta y los beneficios se deslizan con el dedo: nada queda escondido.
- Las personas de las fotos son variadas (edades, cuerpos, géneros) y el texto no asume género.

## Fotos

Ilustrativas, generadas con IA, siempre aclarado en el pie. Comida colorida y natural, luz natural cálida, tonos crema y verde. Personas adultas, sin texto ni logos dentro de la imagen (se revisa que la IA no escriba letras raras). La única foto de una persona real es la de Verónica Trenti, con su autorización escrita.

## Movimiento

Entrada de títulos por línea, aparición al bajar con escalón de 110 ms, foto que se recorta al entrar, parallax de 5 a 12 %, cinta continua, números que suben. Curva `--pv-ease`. **Con "reducir movimiento" la página queda quieta**: sin animaciones ni transiciones. El movimiento nunca debe esconder contenido si el script no carga.

## Cómo usarlo

1. Página nueva: copiar `landing.html` o `pacientes.html` y cargar `src/landing/landing.ts` (trae las fuentes, `tokens.css` y los estilos).
2. Colores y medidas: sólo variables `--pv-*`; no valores sueltos.
3. Registrar la ruta en `vercel.json` y en `vite.config.ts` (rutas públicas) y sumarla a la prueba de rutas (`server/ops/pv30.test.ts`).
