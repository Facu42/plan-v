# Videollamada dentro del turno

Comparación para decidir más adelante. Esta entrega no contrata nada y no carga claves. El enlace de la consulta sigue siendo Meet.

La prueba está apagada. Para prenderla en un entorno de prueba hace falta `VITE_EMBEDDED_VIDEO_CALL=true`. Con cualquier otro valor, o sin la variable, no aparece.

## Recomendación: LiveKit

Conviene LiveKit, en un servidor propio, antes que Daily.

- LiveKit se puede instalar en un servidor de la región que elijas. El audio de la consulta no tiene que salir a Estados Unidos o Europa para que exista la sala.
- Daily cobra por minuto y el acuerdo para datos de salud es un plan de pago. La documentación pública habla de regiones de Estados Unidos y Europa. No doy por hecho un centro en Argentina.
- Jitsi público (meet.jit.si) no sirve para una consulta: el audio pasa por 8x8 y no deja elegir el país.

En esta prueba la sala de LiveKit no se conecta. No hay dirección ni clave en el proyecto. La ventana dice eso y deja Meet como salida.

## Ventana flotante

Cuando la bandera está prendida, «Abrir sala» muestra una ventana en la esquina de abajo (derecha al empezar, o izquierda). Se puede arrastrar. Vive en el cascarón del panel, no dentro de una pantalla: al pasar de Agenda a la ficha o a Cobranzas sigue ahí. Así se puede seguir cargando datos durante la llamada.

## Grabación y resumen

El audio no lo graba LiveKit ni Daily. Usa la grabación de consulta que ya existe (`consultation_recording` y `ai_consultation`). Sin esos dos permisos de la paciente no se abre el micrófono ni se manda audio.

Con permiso, los trozos van a la consulta de la ficha. El trabajador que ya procesa las consultas (`runPendingConsultations`) los transcribe y, cuando el texto está, arma el resumen en un trabajo aparte. La pantalla no se queda esperando: arriba aparece «Preparando el resumen» y, al terminar, «El resumen quedó en la ficha». Ese aviso sigue visible al cambiar de pantalla. El texto queda en la nota privada de la consulta, no se publica solo.

## Qué se comparó

Los tres pueden armar una sala entre la nutricionista y la paciente. Los tres pueden grabar si alguien lo prende. Acá no se prende.

| | Jitsi | Daily | LiveKit |
|---|---|---|---|
| Costo | El programa es gratis. El servicio público meet.jit.si también, y no sirve para una consulta. Instalarlo en un servidor propio sale el costo de ese servidor. | Cobran por minuto de cada persona en la sala. El plan chico no alcanza para datos de salud. El acuerdo para datos de salud es un plan de pago. Hay que confirmar el precio antes de contratar. | El programa es abierto. La nube cobra por minuto. Instalarlo en un servidor propio sale el costo de ese servidor. Sin grabación no se guarda video. |
| Datos de salud | En meet.jit.si el audio pasa por la empresa 8x8. No hay un acuerdo pensado para historias clínicas. En un servidor propio los datos quedan en esa máquina. | Con el acuerdo de datos de salud, Daily se compromete a tratar la llamada como dato de salud. Sin ese acuerdo no hay que mandar una consulta. | En un servidor propio los datos no salen de esa máquina. En la nube hace falta el plan que cubre datos de salud. |
| Región | El servicio público no deja elegir Argentina. En uno propio, la región es la del servidor. | La documentación pública habla de Estados Unidos y Europa. No doy por hecho un centro en Argentina. | En uno propio, la región es la del servidor. En la nube hay varias regiones: hay que fijar una en el contrato antes de usarlo con pacientes. No afirmo que haya una en Argentina. |

Mandar el audio de una consulta a otro país es una transferencia internacional (Ley 25.326). Hace falta una base legal y hay que decirlo. Por eso esta prueba no manda la imagen a nadie.

## Qué queda como está

- Meet sigue siendo el enlace del turno.
- La sala de LiveKit no se conecta y no hay claves.
- Grabar pide el permiso que ya usa la consulta. Sin ese permiso no sale audio.
- El resumen lo escribe el trabajador en la ficha. Hay que revisarlo antes de compartirlo.
