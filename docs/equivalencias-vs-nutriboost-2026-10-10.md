# Equivalencias frente a Nutriboost · 2026-10-10

Equivalencia funcional con Nutriboost, diseño Nutrigo, escritorio. Academy excluida; sin ampliar móvil. Pacientes y consultorios ficticios. Sin producción: la migración no se aplicó en Supabase.

Evidencia: `nutriboost-capturas/` (carpeta local de Facundo, ver LEEME.md). Capturas por minuto del reproductor.

## Visto en pantalla (loom-7m06-equivalencias.jpg, 7:06)
- Pantalla «Equivalencias», subtítulo «Listas de alimentos intercambiables y grupos para armar tus planes».
- Pestañas «Listas de equivalentes (2)» y «Grupos de alimentos (7)», buscador y botón «+ Crear».
- Tarjetas «Equivalentes de cereales» y «Equivalentes de proteínas» con etiqueta «Sistema», alimento base (1 taza · 180 g; 1 porción · 150 g), 3 equivalentes y flecha.
- Construido: todo lo anterior (título, subtítulo, pestañas con contador, buscador, Crear, tarjetas con origen, base y cantidad).

## Narrado / anunciado, no visto
- «Alternativas equivalentes aprobadas por el profesional en cada comida» para la paciente (tiendas de apps; plan v3 §4.4, §14.3). No construido.
- Pedido del backlog (pendientes 2026-10-08, punto 7): catálogo/selector de alternativas aprobadas, con cantidades y justificación visibles al armar el plan. Construido sólo el catálogo; el selector en el plan queda pendiente (ver decisión).

## Propuesta propia (no visto en el video)
- Detalle de lista: alimento base y tabla de equivalentes con medida casera, gramos y aporte (energía, proteínas, carbohidratos, grasas) calculado con Alimentos cuando el alimento está vinculado; «Sin dato» si no (nunca cero).
- Justificación («Por qué son equivalentes») por lista.
- Editor de listas y grupos; duplicar una lista de Sistema para adaptarla; archivar las propias.
- Grupo: alimentos y porción de referencia opcional con aporte promedio de los alimentos vinculados (indica cuántos entran en el promedio).
- Vínculo automático por nombre con un único alimento visible del catálogo.
- Modelo de datos `exchange_catalog` (una tabla, tipo lista o grupo, contenido validado en base).

## No verificado
- Detalle de una lista, editor, contenido de los 7 grupos y cómo se usan al armar un plan: el video sólo muestra la pantalla.
- Qué equivalentes y cantidades traen las listas de Sistema (en la captura sólo se ve «3 equivalentes»).
- Si Nutriboost permite editar o duplicar las listas de Sistema.

## Aislamiento y permisos (probado)
- `server/exchanges/database.postgres.test.ts`: cadena completa de migraciones en PGlite, dos consultorios, una paciente y una cuenta administradora sin consultorio. El consultorio B no lee, edita ni archiva lo de A; nadie edita ni archiva Sistema desde un consultorio; no se insertan filas de Sistema ni de otro consultorio por la API de datos; paciente, administradora y anon no leen ni escriben; sólo se vinculan alimentos visibles para el consultorio; revisión optimista, tipo inmutable y contenido validado.
- `server/exchanges/authorization.test.ts`: rutas rechazan paciente, administradora y actor ausente antes de consultar; el consultorio sale de la cuenta, no del cuerpo; sin base no cae a demostración.
- `server/exchanges/flow.integration.test.ts`: crear, recargar, editar con revisión, duplicar y archivar; aislamiento en modo demostración.

## Pendientes y decisiones para Facundo
1. Contenido de Sistema: la migración no carga listas. Quién las redacta y con qué fuente (por ejemplo guías alimentarias locales) es decisión de contenido clínico; se cargan con el rol de servicio.
2. Uso en el plan: elegir alternativas aprobadas por comida y mostrarlas a la paciente toca el editor de planes, la versión publicada y lo que ve la paciente. Opciones: (a) alternativas sólo visibles para la profesional como guía; (b) alternativas aprobadas dentro de la versión publicada, visibles para la paciente; (c) dejarlo para después de definir el vínculo plan-alimento.
3. Varias listas de Sistema en demostración: la demostración parte vacía; para ver la etiqueta «Sistema» hay que cargar filas con el servicio.
4. Volumen: la pantalla carga todo y limita a 2.000 equivalencias por consultorio; más requiere paginación.
