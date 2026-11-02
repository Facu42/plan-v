# Validar el audio de una consulta en producción

Lista para hacer a mano, con una paciente de prueba. No cambia la base ni publica nada. El audio es un dato de salud: no se copia a un chat, a una captura pública ni a un mail.

Antes de empezar, la paciente de prueba tiene que tener activos, en sus permisos, «Grabación de consultas» y «Transcripción y resumen con IA».

## Qué tiene que verse en la ficha

Abrí Ficha → Notas de consulta. Arriba de la grabación hay un bloque «Estado del audio» con cuatro frases:

1. **Permiso.** Si falta alguno de los dos permisos, dice que falta la autorización. Si los dos están, dice que la paciente permitió grabar y transcribir.
2. **Subida.** Mientras el audio viaja, dice que se está subiendo. Si no hay nada en camino, dice que no hay una subida en curso.
3. **Transcripción.** Mientras se está pasando a texto, lo dice. Si no, dice que no se está transcribiendo.
4. **Audio.** Si la transcripción salió bien, dice que el audio se borró. Si falló y todavía se puede reintentar, dice que sigue guardado.

## Recorrido

1. Sin los dos permisos, el botón de grabar no tiene que dejar grabar. El estado tiene que decir que falta la autorización.
2. Con los dos permisos, grabá unos segundos (o cargá un audio corto de prueba) y fijate que pase por «se está subiendo» y después por «se está transcribiendo».
3. Cuando la transcripción aparece en la nota, el estado tiene que decir que el audio se borró. No tiene que quedar un botón Reintentar para ese audio.
4. Si la transcripción falla, el estado tiene que decir que el audio sigue guardado y tiene que aparecer **Reintentar**. Al tocarlo, vuelve a intentar ese trabajo.
5. La paciente no ve la nota privada ni el audio. Solo ve el resumen si lo publicás aparte, después de revisarlo.

## Qué no hacer

- No pegues el audio ni la transcripción en otro lado.
- No borres filas a mano en la base para «probar» el borrado: el servidor lo hace al confirmar la transcripción, y a los siete días si quedó pendiente.
- Si un paso no coincide con esta lista, no se publica el cambio. Anotá en qué paso se apartó.
