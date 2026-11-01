# Videollamada dentro del turno

Comparación para decidir más adelante. Esta entrega no contrata nada y no carga claves. El enlace de la consulta sigue siendo Meet.

La prueba está apagada. Para prenderla en un entorno de prueba hace falta `VITE_EMBEDDED_VIDEO_CALL=true`. Con cualquier otro valor, o sin la variable, no aparece.

## Recomendación: LiveKit

Conviene LiveKit, en un servidor propio, antes que Daily.

- LiveKit se puede instalar en un servidor de la región que elijas. El audio de la consulta no tiene que salir a Estados Unidos o Europa para que exista la sala.
- Daily cobra por minuto y el acuerdo para datos de salud es un plan de pago. La documentación pública habla de regiones de Estados Unidos y Europa. No doy por hecho un centro en Argentina.
- Jitsi público (meet.jit.si) no sirve para una consulta: el audio pasa por 8x8 y no deja elegir el país.

La sala se conecta sola cuando en el servidor están las tres: `LIVEKIT_URL` (wss://…), `LIVEKIT_API_KEY` y `LIVEKIT_API_SECRET`. No van en el navegador y no se commitean. Si falta alguna, el botón abre el enlace de Meet.

No se graba ni se guarda video. No se usa LiveKit Egress ni la grabación de la sala (`roomRecord` queda en falso). La imagen en vivo, si la hay, no se archiva.

## Ventana flotante

Con la prueba prendida, desde 10 minutos antes del turno y hasta que termina, la Agenda de la nutricionista y la agenda de la paciente muestran «Entrar a la videollamada» en ese turno. Abre la ventana de esa sala, en la esquina de abajo (derecha al empezar, o izquierda). Se puede arrastrar. Vive en el cascarón, no dentro de una pantalla: al pasar de Agenda a la ficha sigue ahí.

## Grabación y resumen

No se graba ni se guarda video. No hay Egress ni grabación de sala.

El audio, solo si la paciente dio permiso de grabación y de resumen con IA, entra por la grabación de consulta que ya existe. Es un WAV, no un video. El trabajador lo transcribe y después borra el audio. Con ese texto arma el resumen en otro trabajo, sin frenar la pantalla. Arriba se ve «Preparando el resumen» y, al terminar, «El resumen quedó en la ficha». Ese aviso sigue al cambiar de pantalla. El texto queda en la nota privada y no se publica solo.

## Qué se comparó

Los tres pueden armar una sala entre la nutricionista y la paciente. Los tres pueden grabar si alguien lo prende. Acá no se prende.

| | Jitsi | Daily | LiveKit |
|---|---|---|---|
| Costo | El programa es gratis. El servicio público meet.jit.si también, y no sirve para una consulta. Instalarlo en un servidor propio sale el costo de ese servidor. | Cobran por minuto de cada persona en la sala. El plan chico no alcanza para datos de salud. El acuerdo para datos de salud es un plan de pago. Hay que confirmar el precio antes de contratar. | El programa es abierto. La nube cobra por minuto. Instalarlo en un servidor propio sale el costo de ese servidor. Sin grabación no se guarda video. |
| Datos de salud | En meet.jit.si el audio pasa por la empresa 8x8. No hay un acuerdo pensado para historias clínicas. En un servidor propio los datos quedan en esa máquina. | Con el acuerdo de datos de salud, Daily se compromete a tratar la llamada como dato de salud. Sin ese acuerdo no hay que mandar una consulta. | En un servidor propio los datos no salen de esa máquina. En la nube hace falta el plan que cubre datos de salud. |
| Región | El servicio público no deja elegir Argentina. En uno propio, la región es la del servidor. | La documentación pública habla de Estados Unidos y Europa. No doy por hecho un centro en Argentina. | En uno propio, la región es la del servidor. En la nube hay varias regiones: hay que fijar una en el contrato antes de usarlo con pacientes. No afirmo que haya una en Argentina. |

Mandar el audio de una consulta a otro país es una transferencia internacional (Ley 25.326). Hace falta una base legal y hay que decirlo. Por eso esta prueba no manda la imagen a nadie.

## Qué queda como está

- Sin las tres claves, el botón deja Meet.
- No se graba ni se guarda video. El audio de la transcripción se borra al procesarlo.
- Grabar pide el permiso que ya usa la consulta. Sin ese permiso no sale audio.
- El resumen lo escribe el trabajador en la ficha. Hay que revisarlo antes de compartirlo.
