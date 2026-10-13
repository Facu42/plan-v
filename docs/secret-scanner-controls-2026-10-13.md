# Comprobación del escáner de secretos

El CI del primer commit del PR106 marcó una clave aparente en `.env.example`. La reproducción redacted con Gitleaks 8.30.1 aisló una sola entrada nueva. Una fixture que contenía únicamente una clave vacía y opciones públicas confirmó que el valor detectado era exactamente `GROQ_ZDR_VERIFIED=0`, capturado por el salto de línea. No se trató de una credencial.

El ejemplo ahora usa `GROQ_API_KEY=""`. Para el historial ya publicado, la regla `generic-api-key` permite sólo ese valor exacto Y el archivo `.env.example`; todas las demás reglas y verificaciones se conservan. No se reescribió historial ni se excluyeron archivos completos.

`scripts/test-secret-scanner.mjs` verifica el binario real en CI: ejemplo histórico más un canario ficticio derivado de SHA-256 debe producir exactamente un hallazgo en la línea del canario; ejemplo vacío entre comillas debe producir cero. La prueba falló antes del cambio y pasó después. Sólo usa controles sintéticos y una carpeta temporal única con ubicación y prefijo comprobados al eliminarla. Errores, informes inesperados y tiempos agotados fallan cerrados; no hay llamadas a proveedores ni impresión de claves.

Comprobaciones del coordinador: controles GREEN, fuentes nuevas GREEN, todo el historial Git GREEN y todos los objetos grandes en fragmentos superpuestos GREEN. Informes locales redactados en el directorio temporal. Revisor independiente confirmó la excepción estricta, canario obligatorio, ruta de limpieza y compatibilidad con el escáner de objetos grandes; no detectó P1/P2. El escaneo real corresponde al coordinador, no al revisor.

Regression Guard, paso 10: autenticación y código de aplicación no cambian; suites finales anteriores conservan 2.836 aprobadas/2 omitidas en core y 2.575 aprobadas/2 omitidas en la segunda entrega. Regresión nueva reproducida y control automatizado; sin cambios SQL ni migraciones. Secret scanning es el área frágil y se comprueba su control positivo y negativo. Publicación sigue pendiente; el nuevo CI del PR106 corre sobre `66fe1e0`.
