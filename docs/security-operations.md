# Seguridad: configuración y verificación

**Actualización de producción:** despliegue completado y verificado en web, API y
worker (`44f95c1`); CI aprobado en `main`, 1057 pruebas aprobadas y 2 omitidas.
No se contrataron recursos ni se cambiaron planes de Supabase. Este documento
describe el checkout inicial. La
migración ya se aplicó con versión remota `20261001143810`; no volver a aplicar la
versión local `20261001120000`. El despliegue parte de la versión actual de `main`
en el [PR 40](https://github.com/Facu42/plan-v/pull/40). Consultar la configuración y
evidencia vigente en el [informe de despliegue](../../security-deployment/docs/despliegue-seguridad-2026-10-01.md):
usa `CORS_ORIGINS`, IP validada del intermediario de Railway, tamaños por ruta,
cabeceras de Vercel y solo cuatro indicadores agregados en el copiloto.

Revisión local: 1 de octubre de 2026. Evidencia y alcance en [corroboración y correcciones](corroboracion-appsec-2026-10-01.md).

## Orígenes y solicitudes

Configurar `CORS_ALLOWED_ORIGINS` en el servidor con los orígenes exactos del frontend, separados por comas, por ejemplo `https://app.example.com,https://crm.example.com`. Incluir el origen de la aplicación aunque la API se publique bajo el mismo dominio. No usar comodines, barras finales ni rutas. Staging/producción exige HTTPS y aborta el arranque si falta esta configuración. Demo/test permite por defecto `http://localhost:5173` y `http://127.0.0.1:5173`.

Un origen no autorizado recibe 403 antes de ejecutar la ruta, incluidos los preflights. El alta profesional es una operación de servidor: `/api/ops/nutritionists` rechaza cualquier solicitud con `Origin`; conserva la validación de `PROVISION_SECRET`. La ausencia de `Origin` no sustituye la autenticación ni la autorización.

La API limita el cuerpo realmente recibido a 7.100.000 bytes. También comprueba cuerpos sin `Content-Length` o con un tamaño declarado engañoso. Los esquemas de cada ruta mantienen sus validaciones específicas.

## Límites de uso

| Operación | Presupuesto | Identidad |
| --- | --- | --- |
| API general | 300 solicitudes/minuto | Dirección del socket |
| Recuperación y alta profesional | 5 solicitudes/15 minutos por ruta | Dirección del socket |
| Copiloto, análisis de comidas, jobs/imágenes y generación de reemplazos | 10 solicitudes/minuto compartidas | Usuario autenticado; dirección del socket en demo |

El rechazo devuelve 429 y `Retry-After`. Los contadores están en memoria por proceso, con capacidad limitada; no evictan límites activos para aceptar nuevas identidades. Reiniciar el proceso los reinicia. Varias instancias no comparten presupuesto. Detrás de un proxy, la dirección del socket puede agrupar a todos los usuarios del proxy: el servidor no confía en `X-Forwarded-For`. Para un despliegue con balanceo/proxy, configurar límites en la infraestructura y, si se necesitan cuotas globales, almacenamiento compartido antes de habilitar tráfico público.

El acceso y la recuperación que el frontend envía directamente a Supabase Auth dependen de los límites del proveedor. Verificar en el proyecto los límites de Auth y las URL de retorno permitidas; este trabajo no modifica ese panel. [Documentación de límites de Supabase](https://supabase.com/docs/guides/auth/rate-limits).

## Protección del navegador

Todas las respuestas de la API incluyen `Cache-Control: no-store`, protección de tipo de contenido, política de referencias y bloqueo de marcos. HSTS se emite únicamente cuando la URL de la solicitud es HTTPS. Si el proxy termina TLS y conecta por HTTP al servidor, configurar HSTS en el proxy.

El build incorpora CSP en el HTML: scripts y tipografías locales; conexiones al mismo origen y al origen HTTPS/WSS exacto de `VITE_SUPABASE_URL`. No habilita `unsafe-eval` ni comodines de Supabase. Las tipografías DM Sans y Fraunces se distribuyen con la aplicación y ya no solicitan CSS a Google. Se permiten estilos en línea para los componentes actuales e imágenes HTTPS para las fotos.

El hosting del frontend debe emitir además `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer` y HSTS sobre HTTPS. Si configura CSP como cabecera, usar la política del HTML compilado y agregar `frame-ancestors 'none'`: esa directiva requiere una cabecera y no funciona en un metatag. La protección de marcos de la API no se extiende por sí sola al HTML servido por otro hosting.

## Permisos y datos enviados a IA

El copiloto exige el nuevo permiso opcional `ai_followup`, vigente y otorgado por el paciente. Tener permiso de menú no lo habilita. La autorización del profesional se verifica antes de leer datos privados; el permiso se verifica antes de llamar al proveedor o guardar el resultado. El paciente puede otorgarlo o retirarlo en los permisos de IA de su menú.

La migración `20261001120000_ai_followup_consent.sql` incorpora únicamente el texto y hash del permiso al catálogo. Fue probada en PostgreSQL local; no fue aplicada a Supabase remoto. Debe formar parte del despliegue coordinado del backend/frontend y base de datos. No altera consentimientos históricos ni habilita pacientes automáticamente. Sin ese permiso, la generación del copiloto queda bloqueada en el modo persistente.

El contexto del copiloto incluye indicadores de adherencia, hidratación, cantidades de comidas y hasta 20 pares de turno/confianza. Excluye nombre, identificadores, mensajes, notas clínicas y texto de la cronología. Los reemplazos envían alergias/restricciones, tiempo de cocina, solicitud y hasta siete días de títulos/turnos; no incluyen el plan completo ni campos adicionales privados. Estos indicadores siguen siendo datos del paciente: la reducción de campos no los convierte en datos anónimos.

Los controles de autorización, clientes de base de datos con JWT del actor y políticas RLS fueron revisados y cubiertos por pruebas locales. Las dos pruebas contra Supabase real requieren una instancia desechable y JWT A/B; permanecen omitidas si falta esa configuración. Los borradores SQL de `supabase/contracts/` conservan su restricción de revisión y no se aplicaron.

## Secretos y controles continuos

Mantener claves privadas exclusivamente en variables del servidor, nunca con prefijo `VITE_`. El repositorio ignora variantes de `.env`, claves PEM/KEY y `credentials.json`, conservando `.env.example`. La compatibilidad del antiguo archivo generado de Supabase ahora lee variables públicas y ya no contiene una clave fija.

CI audita dependencias con `npm audit --audit-level=moderate` y escanea el historial con Gitleaks 8.30.1, binario fijado y checksum verificado. La configuración conserva las reglas predeterminadas y exceptúa solo dos valores históricos públicos: el JWT Supabase de rol `anon` y el identificador del archivo Figma. No exceptúa directorios completos.

El scanner usa un máximo de 5 MB por objetivo y una capa de decodificación. El escaneo local de archivos versionables excluyó `.env` ignorados y dos referencias voluminosas en `.scratch/nutrigo-local-reference/`: `data.bin` y `decoded.json`. Un resultado sin hallazgos dentro de ese alcance no prueba ausencia absoluta de secretos. No se detectaron credenciales privadas que exigieran rotación.

Para comprobar cambios futuros:

```text
npm test
npm run check
npm run build
npm run check:migrations
npm audit --audit-level=moderate
gitleaks git . --log-opts="--all" --redact --no-banner --max-decode-depth 1 --max-target-megabytes 5
```

El workflow está preparado localmente; su ejecución en GitHub y la configuración del hosting/proyecto Supabase requieren el despliegue correspondiente.
