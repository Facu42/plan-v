# Corte 59 — Enlaces profundos y compartir Recursos

## Implementado

- Cada una de las seis guías operativas tiene URL validada con `#recurso=<id>`.
- Un enlace directo abre Recursos y el detalle correspondiente después de entrar al modo demo.
- Abrir una guía desde la biblioteca crea una entrada de historial; Atrás vuelve a la biblioteca y Adelante reabre el detalle.
- Navegar desde la guía hacia otra función elimina el hash para no dejar una URL engañosa.
- **Compartir** usa Web Share cuando el navegador lo ofrece y copia el enlace como fallback.
- El resultado de compartir se anuncia con `role=status`.
- IDs desconocidos o hashes malformados no abren contenido.

## Límites

- Sólo se comparten las seis guías operativas originales y permitidas.
- No se habilitó contenido editorial clínico, autores externos, imágenes, asignaciones ni datos privados.
- Los favoritos continúan siendo locales y aislados por paciente.
- No se añadió persistencia Supabase ni se aplicó el contrato 016.

## Browser QA

```json
{"checks":["deep-link-directo","compartir-fallback","relacionado-y-volver","historial-navegador","enlace-reabrible","responsive"],"copied":"http://127.0.0.1:5180/#recurso=leer-plan-semanal","hash":"#recurso=leer-plan-semanal","errors":[]}
```

Verificado:

- Apertura directa desde URL.
- Copia exacta del enlace.
- Navegación relacionada con reemplazo del hash.
- Volver desde un enlace directo sin abandonar Plan V.
- Historial Atrás/Adelante desde apertura interna.
- Reapertura del enlace copiado desde otra superficie.
- Tres acciones del detalle y reorganización móvil a 390 px sin overflow.

Captura inspeccionada: `share-mobile-390.png`.

## Gate global

- 60 archivos de prueba.
- 134 suites.
- 310/310 pruebas.
- TypeScript frontend y servidor aprobado.
- Build de producción: 121 módulos.
- `npm audit`: 0 vulnerabilidades.
- 91 paquetes con firmas verificadas; 46 con attestations verificadas.
- `git diff --check`: aprobado, con los dos avisos LF→CRLF ya existentes.

## Pendiente

- Contenido editorial profesional revisado.
- Guardado unificado y persistido.
- Asignación individual/masiva e historial de lectura.
- Aprobación visual global.
- Sin commit ni push.
