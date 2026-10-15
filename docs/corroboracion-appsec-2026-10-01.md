# Corroboración de appsec para Plan V

Fecha: 1 de octubre de 2026.

Actualización de despliegue: migración aplicada al proyecto existente `plan-v-app`, versión remota `20261001143810`. El [PR 40](https://github.com/Facu42/plan-v/pull/40) se integró y la web, API y worker publicaron el commit `44f95c1` con sus comprobaciones remotas aprobadas; configuración sobre los servicios existentes, sin contratar recursos ni cambiar planes de Supabase. Suite final: 1057 pruebas aprobadas y 2 omitidas; CI de `main` aprobado. Se preservó este checkout antiguo y sus cambios. Evidencia y avisos previos de Supabase pendientes: PR 40 e [informe de despliegue](../../security-deployment/docs/despliegue-seguridad-2026-10-01.md). El historial de abajo describe la primera revisión local; sus cifras y pendientes no sustituyen esa evidencia. La migración local con versión `20261001120000` corresponde a esa revisión: no volver a aplicarla a producción.

El plugin descrito existe en el marketplace `florianbuetow/claude-code`. El flujo general es correcto, pero dos nombres de comandos del texto no coinciden con la versión publicada y conviene precisar qué produce el análisis inicial.

Esta revisión contrastó la documentación y las definiciones de las skills del autor con el código local de Plan V. También ejecutó `npm audit --json --ignore-scripts`. No instaló ni ejecutó appsec y no constituye una auditoría completa de la aplicación.

## Correcciones al texto

| Afirmación | Verificación |
| --- | --- |
| El plugin se llama appsec y se instala desde ese marketplace. | Confirmado en el [README del plugin](https://github.com/florianbuetow/claude-code/tree/main/plugins/appsec). |
| `/appsec:start` detecta stack, datos sensibles, arquitectura y herramientas disponibles. | Confirmado en la [definición de start](https://github.com/florianbuetow/claude-code/blob/main/plugins/appsec/skills/start/SKILL.md). Es el punto de entrada recomendado; produce recomendaciones, no hallazgos de vulnerabilidades. |
| Genera un reporte JSON de análisis recomendados y cuáles omitir. | Guarda una evaluación en `.appsec/start-assessment.json`. La presentación por defecto es texto; `--format json` solicita salida JSON. Incluye `recommended_tools` y `skip`. |
| Cada skill es un scanner especializado. | Es una simplificación: son flujos de análisis asistidos por Claude que pueden usar scanners externos. Cuando faltan herramientas, muchas recurren al análisis de código. Detectar CVE de dependencias requiere un scanner; el modelo por sí solo no es suficiente. |
| `/appsec:secrets` revisa secretos commiteados. | Existe. Para revisar todo el proyecto y secretos previamente eliminados del historial, usar `--scope full --depth deep`, según su [definición](https://github.com/florianbuetow/claude-code/blob/main/plugins/appsec/skills/secrets/SKILL.md). |
| `/appsec:authentication` analiza autenticación, sesiones y JWT. | El nombre publicado es [`/appsec:auth`](https://github.com/florianbuetow/claude-code/blob/main/plugins/appsec/skills/auth/SKILL.md). |
| `/appsec:dependency-check` revisa dependencias. | El nombre publicado es [`/appsec:outdated-deps`](https://github.com/florianbuetow/claude-code/blob/main/plugins/appsec/skills/outdated-deps/SKILL.md). |

## Aplicación al proyecto

La raíz de la aplicación activa es `plan-v/`, un repositorio independiente dentro del espacio de trabajo. Así lo indica el README superior. El material archivado pertenece a otra implementación.

Evidencia local:

- `package.json`: TypeScript, React, Vite, Hono, Supabase, Zod y SDK de IA; existe `package-lock.json`.
- `src/types/intake.ts`: consentimientos y notas clínicas; `src/types/index.ts`: pacientes, correo y estado de facturación. Hay tratamiento de datos personales y de salud. El estado de facturación no demuestra tratamiento de tarjetas ni integración de pagos.
- `server/middleware/auth.ts` y `server/security/authorization.ts`: autenticación y controles de acceso por actor y relación con el paciente.
- `server/config/runtime.ts`: separa demo/test de staging/producción y exige configuración persistente para estos últimos.
- `.gitignore`: excluye `.env` y `.env.local`. `.env` está ignorado y no figura entre los archivos actualmente versionados. Esto no prueba ausencia de secretos en el historial.
- `.github/workflows/ci.yml`: pruebas, tipos, build y comprobación de migraciones. El workflow revisado no ejecuta una auditoría de dependencias.
- `server/index.ts:173`: CORS con configuración por defecto (`cors()`). Corresponde revisar los orígenes permitidos para el despliegue; esta observación sola no demuestra una explotación.
- No se encontraron configuraciones locales de rate limiting, CSP o `secureHeaders` en los archivos de servidor, cliente, CI y Vite examinados. Los controles externos del proveedor de autenticación o del hosting no se verificaron.

El registro local de plugins instalados de Claude Code no incluye appsec. En el PATH de esta sesión se detectó npm, pero no Semgrep, Gitleaks, TruffleHog, Trivy ni OSV Scanner. Esto describe esta sesión y no descarta instalaciones fuera del PATH.

## Orden propuesto para Plan V

Este orden es una recomendación de esta revisión, no una salida de appsec:

1. `/appsec:secrets --scope full --depth deep`: claves de servicios e historial Git.
2. `/appsec:access-control --scope full`: aislamiento entre pacientes y profesionales; permisos y políticas de base de datos.
3. `/appsec:auth --scope full --depth deep`: login, recuperación, invitaciones, sesiones y separación del modo demo.
4. `/appsec:outdated-deps --scope full`: dependencias con avisos detectados por npm audit.
5. `/appsec:api --scope full` y `/appsec:misconfig --scope full`: entradas, límites, CORS y configuración del despliegue.
6. `/appsec:linddun --scope full`: privacidad de datos de salud, consentimientos y flujos hacia servicios de IA.

GraphQL, WebSocket y serverless pueden quedar fuera de una primera pasada: no se identificaron esas superficies en los manifiestos y archivos examinados. Una dependencia puede contener capacidades WebSocket aunque la aplicación no las use directamente.

## Resultado real de npm audit

La ejecución terminó con código 1 por los avisos encontrados, sin error de consulta. El resumen agrupa tres paquetes afectados: dos con severidad alta y uno moderada; cero críticos. Un paquete puede tener varios avisos.

| Paquete | Versión local y del lockfile | Severidad máxima | Ubicación |
| --- | --- | --- | --- |
| `hono` | 4.13.5 | Moderada | Dependencia directa de la API. |
| `postcss` | 8.5.6 | Alta | Dependencia de desarrollo y de la cadena de build. |
| `undici` | 7.29.0 | Alta | Dependencia transitiva de `@ai-sdk/openai`, mediante `@ai-sdk/provider-utils`. |

npm indica corrección disponible para los tres paquetes. No se actualizaron dependencias. Para decidir el riesgo efectivo hay que verificar los caminos de código afectados: por ejemplo, el aviso de Hono corresponde a `hono/jsx`, cuyo uso no apareció en la búsqueda de servidor y cliente. Las severidades del scanner no prueban por sí solas que Plan V permita explotar cada aviso.

Referencias de avisos devueltos por npm: [Hono](https://github.com/advisories/GHSA-hxh3-vqpv-xpqv), [PostCSS: lectura de archivos](https://github.com/advisories/GHSA-6g55-p6wh-862q), [Undici: validación TLS](https://github.com/advisories/GHSA-w293-vg96-wgc3).

## Instalación y comienzo en Claude Code

Los siguientes comandos están documentados por el autor; no se ejecutaron durante esta revisión:

```powershell
claude plugin marketplace add florianbuetow/claude-code
claude plugin install appsec
```

Reiniciar Claude Code después de instalar. Abrirlo desde `plan-v/` y ejecutar:

```text
/appsec:start --format json
```

Luego ejecutar los análisis individuales elegidos. `/appsec:run` permite orquestar las prioridades automáticamente, según la documentación del plugin.

## Corrección 1 completada: Undici

El 1 de octubre de 2026 se actualizó `undici` de 7.29.0 a 7.30.0 mediante una actualización dirigida. El rango `^7.28.0` de `@ai-sdk/provider-utils` permite esta versión: no se necesitó cambiar el SDK ni agregar un override.

La comparación contra una copia de los archivos anterior a esta corrección confirma que `package.json` no cambió y que la única entrada modificada del lockfile es `node_modules/undici` (versión, URL e integridad). Se preservaron los cambios que ya existían en el proyecto.

Verificación:

- Antes del cambio: 25 pruebas de IA aprobadas en 9 archivos.
- Después: suite completa con 609 pruebas aprobadas y 2 omitidas, en 121 archivos aprobados.
- `npm run check`: aprobado para cliente y servidor.
- `npm run build`: aprobado, con avisos de anotaciones de Zod eliminadas por el compilador.
- `npm ls undici --all`: 7.30.0, sin copias anteriores listadas.
- `npm audit --json --ignore-scripts`: Undici ya no figura entre los paquetes afectados. Quedan PostCSS (alta) y Hono (moderada); el proceso devuelve código 1 por esos dos pendientes.

Las pruebas usan datos y respuestas simuladas; no se realizaron llamadas de pago al proveedor de IA. No se declara cerrada la auditoría general. La siguiente corrección prevista es PostCSS.

## Corrección 2 completada: PostCSS

El 1 de octubre de 2026 se actualizó PostCSS de 8.5.6 a 8.5.28 y se subió la versión mínima declarada de `^8.5.6` a `^8.5.28`. El cambio queda registrado en `package.json` y `package-lock.json`. Vite, Tailwind y Autoprefixer comparten la versión actualizada, según `npm ls postcss --all`.

La comparación contra una copia de los archivos inmediatamente anterior a esta corrección confirma que solo cambió la declaración de PostCSS en el manifiesto y en la entrada raíz del lockfile, junto con los metadatos de su entrada de paquete. Undici permanece en 7.30.0 y se preservaron los cambios previos del proyecto.

Verificación:

- Se compiló la aplicación antes del cambio en un directorio temporal para obtener una referencia de los estilos.
- Después del cambio, la suite completa aprobó 609 pruebas, con 2 omitidas, en 121 archivos aprobados.
- `npm run check`: aprobado para cliente y servidor.
- `npm run build`: aprobado; persisten los avisos de anotaciones de Zod que el compilador elimina.
- Los tres archivos CSS de la compilación posterior tienen los mismos nombres y hashes que los de la compilación previa: el contenido generado de los estilos es idéntico.
- `npm ls postcss undici --all`: PostCSS 8.5.28 y Undici 7.30.0, sin versiones anteriores listadas.
- `npm audit --json --ignore-scripts`: cero avisos altos o críticos; queda únicamente Hono, de severidad moderada. El proceso devuelve código 1 por ese pendiente.

La siguiente corrección prevista es Hono. Los controles de seguridad de los puntos 4–8 siguen pendientes de revisión.

## Corrección 3 completada: Hono

El 1 de octubre de 2026 se actualizó Hono de 4.13.5 a 4.13.12 y se subió la versión mínima declarada de `^4.13.5` a `^4.13.12`. El cambio está registrado en `package.json` y `package-lock.json`; `@hono/node-server` utiliza la misma versión, sin requerir otra actualización.

La comparación con los archivos guardados inmediatamente antes del cambio confirma que la actualización de dependencias solo afecta la declaración y la entrada de Hono. PostCSS permanece en 8.5.28 y Undici en 7.30.0.

Durante la verificación apareció una falla dependiente de la fecha en `server/appointment-flow.integration.test.ts`: la prueba de reprogramación esperaba HTTP 200, pero la API devolvía HTTP 409 porque faltaban menos de 12 horas para el turno de ejemplo del jueves. La respuesta y la fecha del turno confirmaron la causa. Se reprodujo la falla antes del arreglo y se fijó el reloj únicamente en esa suite a un miércoles al mediodía; se restaura después de cada prueba. No se modificó la regla de anticipación de la aplicación. Las ocho pruebas de esa suite, incluida la que verifica el rechazo de una reprogramación a seis horas del turno, pasan.

Verificación final:

- `npm test`: 609 pruebas aprobadas y 2 omitidas, en 121 archivos aprobados.
- `npm run check`: aprobado para cliente y servidor después del ajuste de la prueba.
- `npm run build`: aprobado con Hono actualizado; persisten los avisos de anotaciones de Zod eliminadas por el compilador.
- `npm ls hono undici postcss --all`: Hono 4.13.12, Undici 7.30.0 y PostCSS 8.5.28, sin versiones anteriores listadas.
- `npm audit --json --ignore-scripts`: código 0, sin error de consulta y cero vulnerabilidades reportadas en todas las severidades.

Quedan resueltos los tres avisos de dependencias detectados al comienzo. Los controles 4–8 se documentan a continuación; esta revisión no constituye una certificación de seguridad de la aplicación.

## Corrección 4 completada: CORS

Se reemplazó `cors()` sin restricciones por una lista explícita de orígenes. `CORS_ALLOWED_ORIGINS` exige valores exactos y HTTPS en staging/producción; falta o configuración inválida impide el arranque. Un origen ajeno, `null` o un hostname proporcionado por el atacante no ejecuta la ruta. Se conservaron los dos orígenes del desarrollo local.

Los preflights reciben la misma comprobación. El alta profesional rechaza cualquier origen de navegador y no permite su cabecera privada en CORS. Las llamadas de servidor sin origen siguen sujetas a autenticación y autorización.

## Corrección 5 completada: límites de solicitudes

Se añadieron límites antes de la verificación de autenticación para la API general y recuperación/alta profesional, y un presupuesto compartido por usuario verificado para operaciones de IA. El rechazo devuelve 429 con `Retry-After`. La dirección procede del socket, sin confiar en cabeceras de IP enviadas por el cliente.

Se limita el cuerpo realmente recibido a 7.100.000 bytes, aunque falte o sea engañosa la cabecera de tamaño. Las pruebas comprueban que no se ejecuta el handler rechazado y que los cuerpos aceptados siguen disponibles para la ruta.

Estos límites son por proceso y no reemplazan los de Supabase Auth ni los controles del proxy/hosting. Los presupuestos y sus límites operativos están en la guía de seguridad.

## Corrección 6 completada: cabeceras y CSP

La API añade `no-store`, protección de tipo de contenido, bloqueo de marcos y política de referencias también en respuestas fallidas. HSTS solo se emite para solicitudes HTTPS. El build del frontend incorpora CSP y `no-referrer`; limita scripts y conexiones al origen local y al Supabase configurado.

La comprobación real del build en el navegador detectó imports de Google Fonts bloqueados por CSP. Se reemplazaron por DM Sans y Fraunces distribuidas localmente mediante paquetes Fontsource 5.3.0 fijados, conservando familias y pesos. En la verificación posterior ambas fuentes están cargadas, no hay recursos externos en la pantalla de acceso y la consola queda sin mensajes. No se habilitaron permisos de scripts remotos para resolver el problema.

Las cabeceras del HTML que requieren el hosting (especialmente `frame-ancestors` y HSTS cuando termina TLS el proxy) están documentadas; no se declara haberlas aplicado al despliegue.

## Corrección 7 completada: secretos y CI

Se ejecutó Gitleaks 8.30.1 con binario oficial y checksum verificado. El escaneo de referencias Git con `--all` completó 134 commits con diferencias y aproximadamente 53,76 MB. El snapshot de archivos versionables incluyó archivos nuevos sin stage y excluyó los `.env` ignorados. Ambos análisis terminaron sin hallazgos pendientes dentro del presupuesto de 5 MB por objetivo y una capa de decodificación.

Los hallazgos iniciales eran un JWT público Supabase de rol `anon` del prototipo y un identificador de archivo Figma. Se retiró la clave fija del código de compatibilidad y se sustituyó por variables públicas. Las excepciones del scanner se limitan exactamente a esos dos valores históricos; no cubren directorios ni otras credenciales. No se detectaron claves privadas que exigieran rotación.

Dos referencias locales de más de 5 MB quedaron fuera del snapshot: `.scratch/nutrigo-local-reference/data.bin` y `decoded.json`. Este alcance no prueba ausencia absoluta de secretos en cualquier archivo o codificación.

La exclusión de archivos privados se amplió en `.gitignore`. CI incorpora auditoría de dependencias y escaneo de historial con Gitleaks fijado y verificado por checksum, permisos de lectura y hallazgos redactados. Se validó la sintaxis YAML; el workflow no se ejecutó en GitHub durante esta sesión.

## Corrección 8 completada: privacidad, permisos y acceso

Se revisaron los controles existentes de acceso por relación, verificación de JWT con Supabase y uso de clientes de base de datos ligados al actor, sin fallback administrativo en modo persistente. Las pruebas locales cubren aislamiento entre pacientes/profesionales y operaciones directas SQL/RPC.

Se corrigió el envío del copiloto: deja de enviar nombre, objetivo, texto de adherencia, mensajes, notas clínicas y cronología. Solo comparte indicadores y una cantidad acotada de turno/confianza de comidas. Los reemplazos también seleccionan los campos necesarios y acotan días/comidas, en lugar de enviar el plan completo con campos privados adicionales.

El permiso de menús no describe el seguimiento. Se incorporó `ai_followup` como consentimiento opcional independiente, visible en los permisos de IA del paciente, con versión y hash. La API comprueba autorización profesional y consentimiento vigente antes de llamar al proveedor. Faltante, retiro, hash antiguo o solo permiso de menú devuelve 403 sin generar ni guardar. La migración `20261001120000_ai_followup_consent.sql` añade el texto al catálogo sin conceder permisos automáticamente ni modificar el historial; se probó exclusivamente en PostgreSQL local.

La prueba SQL comprueba que el permiso empieza deshabilitado, que el menú no lo habilita, que el profesional no puede otorgarlo por el paciente y que un retiro vuelve a bloquearlo. La prueba de generación usa marcadores privados y confirma que no aparecen en el prompt. La reducción de campos no vuelve anónimos los indicadores de salud ni sustituye la revisión de las condiciones del proveedor.

## Verificación y cierre local

Verificación final del código:

- Suite completa: 627 pruebas aprobadas y 2 omitidas, en 124 archivos aprobados.
- `npm run check`, `npm run build` y `npm run check:migrations`: código 0. El build conserva los avisos preexistentes de anotaciones de Zod que Rollup elimina.
- `npm audit --json --ignore-scripts`: código 0 y cero vulnerabilidades en todas las severidades, incluidas las dos dependencias nuevas de tipografías.
- Gitleaks: código 0 en el historial y en el snapshot de 2.231 archivos versionables; sin hallazgos pendientes dentro del alcance indicado.
- Prueba HTTP con servidor Node real: origen ajeno 403, cuerpo excesivo 413, cuerpo aceptado conservado, sexta recuperación 429 aunque se cambie `X-Forwarded-For`, cabeceras `no-store` y `nosniff` presentes.
- Navegador sobre el build de producción: pantalla de acceso visible, DM Sans/Fraunces cargadas localmente, sin recursos externos en esa pantalla y sin mensajes de consola.
- YAML de CI: parseado y comprobados los dos controles de seguridad.

Los controles de la aplicación y los archivos de CI quedan implementados localmente. No se hicieron llamadas de pago a IA, cambios en Supabase remoto, commits ni despliegues. La nueva migración y configuración de orígenes/cabeceras deben acompañar el despliegue. Las dos pruebas con Supabase real permanecen omitidas por falta de una instancia desechable con JWT A/B; las pruebas PostgreSQL locales sí se ejecutaron.
