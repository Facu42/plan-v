# Plan V · instructivo actualizado de implementación (15/10/2026)

Actualización de estado del 16/10: la entrega 8 incorpora el padre 7 `5c8ea54` (PR #127), cuyos controles verify, e2e, sesiones firmadas, secretos y vista previa fueron comprobados aprobados por ROOT mediante la herramienta oficial. La entrega 8 se verifica y revisa sobre su propia combinación; esos controles del padre no se atribuyen automáticamente a SARA 2.

Este documento actualiza el instructivo del 11/10 que Facundo aportó como referencia. El alcance viene del plan aprobado en el chat y sus decisiones posteriores. Los informes antiguos conservan sus fechas: sus pendientes y conteos no describen automáticamente la versión nueva.

## Base y trabajo que se conserva

Corte de integración: main 9c568541a4c72633bfdb65090a231c3724a3588d. Se incorporaron los PR #109, #110, #112, #113, #114, #116, #117, #119 y #122: coordinación, vistas de paciente de solo lectura, ánimo y síntomas, pruebas y monitor, avisos de recursos, compras por comercio y compartir, próximas acciones y actividad real con calorías declaradas. Ninguna integración de esta pila autoriza borrar trabajo de otras ramas ni resolver sus alternativas sin revisarlas.

Los 25 archivos originales de Nutrigo se conservan. La paciente mantiene ese diseño y el panel utiliza sus piezas y colores; el gris secundario acordado es #8A8C90. Se comprueba escritorio de 1440 px y móvil de 390 px; no hay desarrollo de tablet ni porcentajes inventados de fidelidad.

## Entregas separadas

| Entrega | Contenido | Referencia |
|---|---|---|
|1|Acceso Supabase, cartera paginada, teléfono, identidad profesional y fotos de ingredientes|[PR105](https://github.com/Facu42/plan-v/pull/105)|
|2|Consulta grabada, transcripción, borrador privado y copia compartida aprobada|[PR106](https://github.com/Facu42/plan-v/pull/106)|
|3|Importación revisable de pacientes/documentos y OCR local|[PR107](https://github.com/Facu42/plan-v/pull/107)|
|4|Fórmulas, momentos, equivalencias, grupos, micronutrientes y PDF con marca|[PR108](https://github.com/Facu42/plan-v/pull/108)|
|5|Ficha clínica, laboratorio, documentos y exportación|[PR115](https://github.com/Facu42/plan-v/pull/115)|
|6|Agenda pública, reservas, Google/Meet, Mercado Pago, equipo y recepción|[PR123](https://github.com/Facu42/plan-v/pull/123)|
|7|Asistente de cartera, comunicaciones con preferencias/baja, ayuda y controles operativos|[PR127](https://github.com/Facu42/plan-v/pull/127), cabeza `5c8ea54`|
|8|Composición SARA 2 y su uso en alimentos, recetas y planes|[Rama de SARA 2](https://github.com/Facu42/plan-v/tree/codex/nutridesk-release-sara2)|

La pila se revisa y se integra en ese orden. El estado de pruebas de cada cabeza está en su informe; los conteos focales e históricos no se suman entre sí. Una rama preparada o un proveedor simulado no demuestra una función habilitada en producción.

## Decisiones vigentes

- **Correo:** Facundo pospuso Gmail y SMTP propio porque la cuenta pertenece a su cliente. Mantener Supabase Auth y no volver a pedirle una contraseña de aplicación. El correo incluido de Supabase tiene restricciones; no prometer entrega a pacientes externos sin SMTP propio. Preferencias de avisos, correos de acceso y transporte son cosas separadas. Guardar un permiso no activa un transporte.
- **IA nueva:** primero disponibilidad gratuita comprobada. Sólo se permite modalidad paga explícita dentro de una única bolsa de USD 5 mensuales para todo el servicio. Consultas, organización documental y asistente de cartera comparten reserva/consumo. Agotar el saldo conserva notas manuales y extracción local. La clave Groq está fuera del repositorio; antes de activarla hay que verificar retención cero y la modalidad de costo. No enviar datos reales para ensayar una configuración.
- **Fotos:** conectar imágenes de platos/ingredientes, conservar siempre las manuales y usar el generador existente que exige la modalidad gratuita de Cloudflare. La preparación de pendientes no autoriza activar un proveedor pago.
- **Precios y prueba comercial:** conservar lo configurado en Plan V; no copiar las tarifas de Nutridesk.
- **Servicios externos:** Google, Mercado Pago y WhatsApp requieren configuración y verificación reales antes de habilitarse. WhatsApp tiene costos separados de la bolsa de IA. Ningún PR activa por sí solo esos servicios.

## SARA 2: fuente obligatoria y límites

La tabla solicitada es SARA 2, Ministerio de Salud, 2022. Los PDF indicados de [Ministerio de Salud](https://iah.msal.gov.ar/doc/720.pdf) y [CONICET](https://ri.conicet.gov.ar/bitstream/handle/11336/258411/CONICET_Digital_Nro.b797bd4f-2e57-4853-8ea6-a1d8caef11e6_B.pdf?sequence=2&isAllowed=y) corresponden al mismo documento. Hash SHA256 del PDF:14706a46e0262e2223b0c44d4c77c31090e3554cf63602fe58ab765f32b81c7f.

Hay 930 registros: 906 alimentos y 24 suplementos, con 39 componentes consultables y referencia de página/tabla/fila. Los identificadores internos son derivados; no son códigos oficiales. Se conserva la unidad nativa: nueve suplementos están expresados por 100 ml. No inferir densidad ni transformar crudo en cocido.

Ausente, no determinado y trazas no se convierten en cero. La discrepancia de unidades de B12 se muestra y bloquea su uso automático. Carbohidratos disponibles y declarados mantienen su definición en recetas, análisis diarios/semanales y contexto local de IA; si se mezclan, el total queda incompleto. Las versiones publicadas anteriores permanecen congeladas. No se incluye el PDF ni sus imágenes en el repositorio ni se afirma una licencia comercial que la fuente no declare.

## Qué requiere validación real

- Entrega de correos y enlaces de acceso externos al equipo, una vez que Facundo retome SMTP.
- Captura efectiva de las dos voces en Chrome/Edge, con consentimiento específico; conservar carga de audio/transcripción como alternativa. Las pruebas con audio ficticio no sustituyen ese ensayo.
- Proveedor Groq y sus controles de datos; WhatsApp oficial, conexión Google/Meet y pagos/conciliación en las cuentas correctas. Nunca confirmar un cobro por el regreso del navegador.
- Fórmulas y referencias clínicas aprobadas por cada profesional. Kerr conserva masas declaradas manualmente; la automatización queda pendiente de resolver las ambigüedades de la fuente primaria y validar sus unidades. No inventar coeficientes ni rangos.
- Evaluación con la nutricionista y pacientes que sepan que participan de una prueba. Facundo administra el servicio; no convertir su cuenta en nutricionista para ensayar el flujo.

## Reglas para continuar y publicar

Leer primero AGENTS.md, coordinación, traspaso y reglas del proyecto. ECC: reproducir el faltante, implementar, verificar y obtener revisión independiente. No editar docs/registro-producto-listo.md, que pertenece a otro hilo.

Antes de cada PR: suite completa, tipos web/servidor/e2e, compilación, migraciones, manifiesto, vistas, secretos y revisión independiente. Cada informe incluye Regression Guard y distingue pruebas simuladas, navegador local, CI con sesiones firmadas y comprobación productiva. No bajar límites ni permisos para conseguir pruebas verdes.

La prueba visual incluye datos cargados, vacío y recuperación de error. Medir a 390 px los límites reales de encabezado, formulario, filtros y controles; el ancho total de la página puede esconder un recorte. Las tablas y los días pueden desplazarse dentro de su contenedor, sin recortar el resto. Conservar también escritorio de 1440 px y guardar la evidencia con datos ficticios.

El manifiesto de la entrega 8 distingue 18 migraciones pendientes de tres SQL exactas de main ya observadas aplicadas. No volver a aplicar esas tres bases por sus nombres de archivo: sus alias hospedados están registrados en el manifiesto. Revisar el orden, configuración y posibilidad de reversión antes de cualquier habilitación.

Una rama y un PR por entrega; nada directo a main. Main publica automáticamente web/API/worker. Aplicar SQL, cambiar configuración productiva o activar servicios pagos requiere autorización escrita específica de Facundo. Esta implementación y sus pruebas locales no son esa autorización. Las claves se guardan únicamente en archivos privados fuera del repositorio y nunca en el chat.

Ver [traspaso](traspaso-estado-proyecto.md), [coordinación](coordinacion-agentes.md) e informes de cada entrega para evidencia y limitaciones actuales.
