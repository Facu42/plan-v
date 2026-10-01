# Seguridad y despliegue — 2026-10-01

Facundo autorizó por escrito aplicar la migración y configurar el despliegue, sin
contratar recursos en Supabase. Los cambios se prepararon desde `origin/main`
(`77a27a3`), en una rama propia, preservando el trabajo local previo de otros hilos.

## Base de producción

- Proyecto existente: `plan-v-app` (`wvosvlxpfytokwfbcero`).
- Migración aplicada por el conector de Supabase: `20261001143810_ai_followup_consent`.
- Solo añade el permiso opcional `ai_followup.v1` al catálogo. El hash del texto se
  comprobó contra SHA-256 en producción. No modifica permisos históricos, tablas ni
  reglas de acceso; al verificar la aplicación había cero pacientes con este permiso.
- Los permisos para generar menús no habilitan mensajes de seguimiento. La paciente
  puede conceder y retirar este permiso por separado; la nutricionista no puede darlo
  por ella. Sin permiso vigente, el copiloto responde antes de llamar al proveedor.
- No se crearon proyectos, ramas de base, copias, extensiones pagas ni cambios de plan
  o tamaño. La organización ya tenía un plan Pro: no se cambió esa contratación.

## Publicación

Se conservan los servicios existentes y su publicación automática al integrar el PR:

| Servicio | Dirección o configuración |
| --- | --- |
| Web Vercel | https://plan-v-eight.vercel.app |
| API Railway | https://api-production-aad6.up.railway.app |
| Base | https://wvosvlxpfytokwfbcero.supabase.co |
| Worker Railway | Servicio existente `worker`, misma rama `main` |

Vercel conserva sus variables de producción. La política del navegador permite
únicamente esta API y esta base para conexiones; las tipografías pasan a servirse
desde la web. Se conservan cámara, fotos, instalación y actualizaciones de la app.

En la API se configuraron `CORS_ORIGINS=https://plan-v-eight.vercel.app`,
`RATE_LIMIT_ENABLED=1`, límites de autenticación y operaciones de 5 por minuto,
API de 120 por minuto, y `TRUST_PROXY=railway`. El permiso para confiar en la IP del
intermediario requiere también la variable de entorno de Railway. Se toma una IP
válida de `X-Real-IP`, documentada por su
[red pública](https://docs.railway.com/networking/public-networking/specs-and-limits).
Fuera de ese entorno se usa la conexión nativa. Las cadenas `X-Forwarded-For` no
definen la identidad. Esta configuración presupone entrada pública exclusiva por
Railway; debe revisarse si se incorpora otro intermediario o acceso directo al puerto.

La recuperación y el alta profesional tienen además 5 intentos por 15 minutos por
dirección; la generación de IA comparte 10 intentos por minuto por usuaria verificada
entre las rutas de generación. Las ventanas están en memoria, con un máximo de
10.000 identidades, sobre la única réplica existente. Un reinicio reinicia las ventanas;
si se agregan réplicas se necesita un contador compartido antes de ampliar el servicio.

## Correcciones y comprobaciones

- Dependencias actualizadas: Hono 4.13.12, Undici 7.30.0 y PostCSS 8.5.28.
  Auditoría de dependencias sin vulnerabilidades notificadas.
- Orígenes exactos, bloqueo de alta profesional desde navegador, cabeceras de API
  y `no-store` también en rechazos tempranos; se preserva el identificador de pedidos.
- Cuerpos limitados por bytes realmente recibidos, cancelando el flujo al exceder el
  máximo. Se preservan los máximos existentes: 1 MB general, 12 MB comidas y fotos,
  22 MB documentos y archivos. Las cargas concurrentes reservan como máximo 64 MB
  de cuerpos originales en total hasta terminar cada respuesta; si no queda espacio
  reciben 503 y pueden volver a intentar. Así se verifica el tamaño antes de ejecutar
  la operación y se limita también la memoria conjunta, no solo cada archivo.
- El copiloto externo recibe solo cuatro indicadores numéricos y conteos. No recibe
  nombre, identificadores, etiquetas de comidas, notas, mensajes ni historial libre.
- Gitleaks en todo el historial, con hallazgos ocultos y excepciones exactas para un
  identificador público de Figma y una clave pública anónima de Supabase. CI también
  audita las dependencias y revisa los límites de secretos.
- Pruebas locales finales: **209 archivos, 1055 pruebas aprobadas y 2 omitidas**.
  Comprobación de tipos, compilación, revisión de migraciones y límites de secretos:
  aprobadas. Se probó el flujo de consentimiento en una base local desechable,
  además de autorización y rechazo antes del proveedor, cuerpos fragmentados,
  cancelación, rutas reales y separación de clientes detrás del intermediario.
- `code-reviewer` y `reality-checker` revisaron el cambio final sin bloqueos dentro
  de este alcance. Las pruebas usan datos sintéticos y proveedores simulados.

## Avisos que siguen abiertos

La revisión de Supabase posterior a la migración mantiene los avisos preexistentes:
16 tablas con acceso por fila activado y sin reglas y 116 funciones con permisos
elevados ejecutables por usuarias autenticadas. Esta migración no agrega ninguno.
Esas funciones incluyen operaciones reales de la aplicación: cerrarlas todas sin
revisar su autorización interna rompería funcionalidades. Requieren análisis propio,
función por función, y no se consideran resueltas por este despliegue.

- [Tablas sin reglas](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).
- [Funciones con permisos elevados](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).

No se probaron cuentas reales de pacientes, envíos de mensajes ni llamadas pagas de IA.
Las dos pruebas de acceso remoto se omiten sin sus credenciales específicas.

## Estado de publicación

Migración y variables aplicadas; código verificado en el
[PR 40](https://github.com/Facu42/plan-v/pull/40). Este registro se prepara antes
de integrar el cambio; la evidencia de publicación posterior se anota en ese PR.
