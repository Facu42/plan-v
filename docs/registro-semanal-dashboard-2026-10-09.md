# Registro semanal del consultorio — 2026-10-09

## Decisiones de Facundo
Registro semanal con indicadores separados. Pendientes de revisión basados en registros sin revisar. Ausencia de datos no equivale a incumplimiento. Dashboard web; móvil y Academy fuera de este incremento.

## Contraste previo
Revisado visualmente el video de Nutriboost (Loom 35b428b996314f9c8f5505de4a6297cb), tramo de acompañamiento alrededor de 3:06: calendario, registros diarios y feed de comidas. Se conserva el diseño Nutrigo vigente.

## Implementación local
- Resumen común para directorio y ficha: días argentinos distintos de los últimos siete días, cantidad de comidas y agua por día declarado.
- Agua sin registro se devuelve como desconocida. Un cero informado explícitamente cuenta como registro. Los ceros históricos por defecto no se reinterpretan como información declarada.
- Pendientes incluyen comidas y registros de seguimiento sin revisar, incluso anteriores a la semana; excluyen pagos y medidas con permiso retirado. No son el total de tareas de la bandeja (también tiene ingresos, mensajes, pagos y propuestas IA).
- RPC profesional por lote de hasta cien pacientes, sin truncar comidas a veinte. Valida todos los pacientes antes de agregar; paciente y profesional ajena no acceden.
- Migración pendiente de publicación: 20261009090000_weekly_registration.sql. No aplicada a producción.
- Al revisar un registro, se refresca también el paciente. Guardado y lectura de hábitos comparten día argentino, incluso después de medianoche UTC.
- Cuando el resumen no está disponible, no se muestra cero; el filtro de pendientes se deshabilita con explicación.

## Verificación
ECC: pruebas nuevas fallaron antes de implementar; derivación, API, PostgreSQL descartable y filtros pasan. Suite general: 2153 aprobadas y 2 omitidas. Tipos, migraciones, secretos y compilación aprobados antes del último ajuste de respuestas de escritura; tras ese ajuste, catorce pruebas específicas aprobadas y tipos en revisión final. Revisión de código encontró y permitió corregir fecha de lectura y refresco del contador; segunda revisión en curso.

## Comodidad: pausa solicitada al usuario
La captura del directorio a 1440 muestra días y comidas pegados en la columna de registro semanal. Se frenó el ajuste visual, mostrando captura ficticia y preguntando: dos líneas (días/comidas) con etiqueta separada de pendientes, o sólo días y detalle desde ficha. No se modifica esa distribución hasta respuesta.

## Ensayos anteriores
PR80: ensayo con sesiones firmadas aprobado en run37928626810. PR81: lecturas de consulta en curso aprobadas, ensayo detenido al seleccionar día en calendario (run37928631780). Ajuste local conserva comprobaciones y usa fecha argentina devuelta por la base, esperando el control visible; requiere nuevo ensayo. No afirmar aprobación integral de PR81.

## Siguiente paso
Resolver disposición visual, comprobar ficha/directorio y actualización tras revisión en navegador; finalizar revisión, ejecutar checks finales y abrir PR borrador sobre PR81. Producción requiere autorización escrita específica.

### Corrección posterior de consultas
Segunda revisión detectó que guardar/cancelar devolvía paciente sin resumen. Se enriqueció la respuesta profesional y se añadió regresión PUT de cancelación: falla anterior por resumen ausente, luego pasa. Once pruebas específicas de persistencia/registro aprobadas; tipos en comprobación. Revisión final de esta corrección pendiente. Se mantiene la pausa visual solicitada.

## Cierre verificado · 2026-10-09
La solicitud de rediseño reemplaza la pausa visual anterior y autoriza esta disposición. Directorio y navegación rediseñados conservando Nutrigo, con registro semanal separado, acciones existentes y catálogo completo de alcance actual/futuro; Academy excluida. Funciones pendientes se identifican como tales.

ECC: pruebas previas a implementación; 311 archivos aprobados, 2159 pruebas aprobadas y 2 omitidas. Tipos, compilación, secretos y migraciones aprobados. Revisión de código y realidad sin bloqueantes. Navegador escritorio: filtros, edición, Escape y retorno de foco, detalles por teclado y contraste claro/oscuro. Capturas finales en docs/propuestas/capturas. Migración solamente verificada localmente; sin publicación productiva. CI del nuevo PR pendiente.
