# Probar los recordatorios en un teléfono de verdad

Los recordatorios de comer, tomar agua y dormir le llegan a la paciente como un aviso corto, sin datos de salud. Esta guía sirve para comprobarlo en un teléfono real, en local o en staging. En la versión publicada el botón de prueba no aparece y el servidor lo rechaza.

## En el teléfono

1. Abrí la app de la paciente en Chrome (Android) o Safari (iPhone) y agregala a la pantalla de inicio. Los avisos piden eso.
2. Entrá con la cuenta de prueba. No uses la cuenta de una paciente real.
3. Abrí Avisos. Abajo de los horarios está «Diagnóstico de avisos».
4. Tocá para permitir los avisos si el teléfono todavía no los pidió. El diagnóstico tiene que decir que el teléfono permite los avisos.
5. Si dice que están bloqueados, andá a los ajustes del teléfono, permití las notificaciones de Nutridash y volvé a abrir Avisos.
6. Activá los avisos del teléfono (el interruptor que ya estaba) y guardá un horario, por ejemplo dormir a la hora de ahora más un minuto. Empiezan apagados: si no los prendés, no llega nada.
7. Si el diagnóstico dice que el teléfono está anotado, tocá **Mandar aviso de prueba**. En unos segundos tiene que llegar un aviso que dice «Aviso de prueba». No dice qué comió ni cuánto pesa.
8. Si tocás de nuevo enseguida, te pide esperar. Es para no llenar el teléfono.
9. Esperá el horario que guardaste y fijate que llegue el recordatorio de ese hábito, también sin datos de salud.

## Si no llega

- El diagnóstico dice que este navegador no recibe avisos: probá con Chrome o Safari, no con una vista embebida.
- Dice que el teléfono no está anotado: volvé a activar los avisos y recargá Avisos.
- Estás en la versión publicada: el botón no está. La prueba se hace en local o en staging.
- El servidor no tiene cargadas las claves de avisos: el diagnóstico lo dice y no manda nada. No hace falta pegar esas claves en ningún archivo.

No hace falta mirar la base ni tocar producción para este recorrido.
