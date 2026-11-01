# Videollamada dentro del turno

Comparación para decidir más adelante. Esta entrega no contrata nada, no carga claves y no graba. El enlace de la consulta sigue siendo Meet.

La prueba vive dentro del turno. Está apagada. Para prenderla en un entorno de prueba hace falta `VITE_EMBEDDED_VIDEO_CALL=true`. Con cualquier otro valor, o sin la variable, no aparece. La imagen de esa prueba no sale del navegador: no hay sala de un tercero ni archivo de video.

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
- La prueba no graba: no hay botón de grabar ni archivo.
- No se usan claves de Jitsi, Daily ni LiveKit.
- No se muestra el nombre de la paciente dentro de la sala de prueba.
