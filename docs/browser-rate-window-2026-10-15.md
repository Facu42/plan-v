# Ritmo del recorrido con sesiones firmadas · 15/10/2026

## Corrección vigente: todas las ventanas

El job 116600688578 de PR108 (`f0b65c3`) volvió a aprobar los 30 casos nativos, pero encontró HTTP429 al comprobar la respuesta profesional, mucho después de comidas/hábitos. La espera inicial descrita abajo no controla las ventanas posteriores y podía no esperar nada si la primera ya había transcurrido.

El runner ahora observa únicamente el evento `http` de la salida de su API descartable. Conserva sólo las marcas de tiempo de solicitudes completadas: no guarda ni imprime líneas, destinos, cuerpos, cuentas ni credenciales. Antes de cada comando de navegador y lectura de comprobación, limita el ritmo a cien respuestas en una ventana móvil de 61 segundos. Las doscientas solicitudes restantes dejan margen para una navegación en curso y las actualizaciones de fondo; no cambian los límites del producto. Reiniciar la API limpia únicamente este contador local.

Las pausas individuales duran como máximo un segundo. El timeout de interfaz conserva veinte segundos de trabajo útil y excluye solamente esas pausas deliberadas; no se repiten escrituras, no se ignoran HTTP429 ni se convierten fallos en éxitos. La limpieza del navegador no espera presupuesto. La función de espera inicial queda probada por compatibilidad histórica, pero ya no gobierna el recorrido.

ECC y Regression Guard: tres casos nuevos reprodujeron el faltante (3 aprobados/3 fallidos). El gate focal final aprobó **20 casos en dos archivos**, incluidos ocho del runner y doce del limitador HTTP. Una simulación atraviesa seiscientas peticiones en treinta ráfagas usando el limitador Hono real sin recibir HTTP429; cubre también tráfico de fondo, reinicio, poco tráfico, orden del comando real y timeout tras una pausa de un minuto. El fire test quitó temporalmente la espera del comando real: siete casos aprobaron y uno falló; después se restauraron los bytes y los veinte volvieron a aprobar. Sintaxis de ambos scripts y diferencia de espacios aprobadas. Tipos comprobados por separado. La suite completa y el recorrido real se verificarán sobre la nueva cabeza de CI; todavía no se declara reparado el job remoto.

Alcance: sólo el runner, sus pruebas y este informe. Sin cambios de aplicación, SQL, permisos, variables hospedadas, cuentas, servicios ni costos. La compilación del producto sigue correspondiendo a sus fuentes sin cambios; el gate integrado siguiente vuelve a compilar y ejecutar la suite completa.

Revisión independiente: sin P1/P2 en los tres archivos de código/pruebas. El revisor ejecutó 35 casos en runner, HTTP y PV30, comprobó el montaje contra el evento real de operaciones y ambos plazos con `activeNow()`. Este focal independiente no se suma a la suite propia ni sustituye el recorrido real pendiente.

## Antecedente: primera ventana (reemplazado)

El job 116449469245 de PR107 (`11ca69f`) aprobó los 30 casos de Auth/PostgREST, pero el recorrido posterior terminó con HTTP429 en comidas/hábitos. El escenario completo alterna roles, consultas de comprobación y recargas mucho más rápido que una sesión humana. El límite público sigue siendo 300 solicitudes por IP y minuto; el indicador operativo desactivado en la pila temporal no desactiva ese límite público independiente.

El runner conserva todos los límites del servidor y espera únicamente lo que resta de su primera ventana antes de comenzar comidas/hábitos. La referencia es la confirmación de salud de su API temporal y el margen es de un segundo; las pausas individuales duran como máximo un segundo. Si el escenario ya tardó más de esa ventana, no espera. No hay cambios al código del producto, permisos, políticas, límites, claves o configuración alojada.

Regresión del helper: dos casos fallaron con un helper sin espera; al implementar la espera aprueban los tres casos (ventana restante, ya transcurrida y fracción de segundo). Las pruebas de seguridad HTTP siguen aprobando. Tipos comprobados; CI debe repetir el recorrido completo sobre la nueva cabeza. Esto no se presenta como recepción de correo ni prueba de proveedor.
