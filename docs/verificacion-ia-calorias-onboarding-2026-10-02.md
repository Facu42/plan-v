# Comprobación de IA, calorías y primer ingreso

2026-10-02. Pedido de Facundo: comprobar imágenes de platos, asistencia para planes,
cálculo con los datos de pacientes y rediseñar el onboarding usando la API de Higgsfield.
Base revisada: `980f1e3bf984886220c0fe0939d84f684e320ebd`.

## Resultado actual

| Función | Comprobación | Estado |
| --- | --- | --- |
| Fotos de platos | Implementadas después de aprobar la receta. Usan OpenAI directamente. | Bloqueadas por el resolutor de configuración; OpenAI no figura entre las variables de producción. La clave de Higgsfield local todavía no es un proveedor de la app. |
| Planes con IA | Borradores, alergias/restricciones y aprobación profesional implementados con OpenRouter/OpenAI. | Bloqueados en producción por el mismo resolutor. No se hizo una generación real paga para esta comprobación. |
| Calorías y macros | Fórmula fija, datos corporales del paciente y ajustes profesionales; servidor y SQL recalculan. | Cálculo ordinario comprobado; guardar otro borrador oculta la meta confirmada anterior. |
| Onboarding | Rediseño Higgsfield aprobado e implementado: cinco etapas, reanudación y consentimiento versionado. | Paciente y nutricionista comprobados localmente en escritorio/móvil; detalle y capturas en `design-qa.md`. Estado de integración y publicación en [PR #49](https://github.com/Facu42/plan-v/pull/49). |

El control público de la API devuelve producción, `ai: true` y el SHA revisado. Ese indicador
lee la configuración completa: no demuestra que el generador funcione. El conector Railway
devuelve solo nombres de variables: `AI_MODE` y `OPENROUTER_API_KEY`; no revela sus valores.
No se consultaron ni exportaron datos de salud de producción.

## Problemas reproducidos

1. `server/ai/mode.ts` no pasa `SUPABASE_ANON_KEY`/`VITE_SUPABASE_ANON_KEY` al validador,
   que las exige en producción/staging. Con un entorno sintético completo, el validador
   devuelve `live` y `resolveAiMode()` devuelve `AIUnavailableError`. Cero llamadas externas.
   La portada invoca ese resolutor fuera del `try`: publicar puede persistir antes del error.
2. Una meta publicada se reemplaza al guardar borrador y pierde `published_at`.
   Repro en memoria: publicada antes `true`, publicada después del borrador `false`.
   El SQL actual usa la misma transición. La interfaz promete conservar la meta anterior.
3. Caso sintético de la fórmula: femenino, 30 años, 65 kg, 165 cm, actividad ligera,
   objetivo bajar: GEB 1370, gasto 1884, meta 1601 kcal, proteína 117 g,
   carbohidratos 171 g y grasa 50 g. Es una comprobación matemática, no indicación clínica.

Repros privados en `.gstack/ia-calorias-repro.ts` y `.json`, sin credenciales reales.

## Otros límites de implementación

- Portadas: no hay reintento visible de una versión fallida ni reserva previa para impedir
  generación duplicada en publicaciones simultáneas. No hay timeout explícito de esa operación.
- Calorías: vista previa/memoria no replican el límite SQL de 8000 kcal; combinaciones de
  ajustes pueden generar macros incompatibles con la meta y permitir confirmar con aviso.
- El canal de datos corporales no comprueba los consentimientos que sí exige el registro de
  medidas. Revisar ambos canales y revocación antes de cambiar la base. No se hizo ese cambio.
- Onboarding antes del rediseño: nombre/iniciales y textos fijos de Verónica; revisión omite restricciones y
  hábitos que sí se envían; privacidad contradice el formulario corporal abierto al finalizar.
  Los botones finales no esperan su guardado. Errores de datos/metas se presentan como ausencia.

## Pruebas realizadas

86 pruebas aprobadas en dos ejecuciones focalizadas, 15 archivos: fórmula/datos corporales,
metas en memoria y PostgreSQL local, onboarding, configuración, proveedores y fallos,
portadas, contexto, trabajos de IA, recetas y versiones de planes. Los proveedores fueron
mockeados; PostgreSQL fue local. Logs `.gstack/onboarding-audit-tests.log` y `ia-audit-tests.log`.
Los repros anteriores muestran casos que esas pruebas todavía no cubren.
Auditorías independientes de código y realidad realizadas.

## Propuesta de rediseño preparada

Generada con API Higgsfield, modelo `ideogram/v4.0` documentado en su catálogo público,
una sola imagen. La credencial se leyó del archivo externo indicado por Facundo mediante
variables del proceso. No se copió a la app, el navegador, documentos ni Git.

La propuesta está en la PC: `C:/Users/facun/higgsfield-fotos/salida/onboarding-plan-v-2026-10-02.png`.
La referencia aprobada se conserva también en `design/onboarding/reference-higgsfield.png`.
El frontend ya está implementado. La imagen dibuja más puntos que el flujo: la app muestra
exactamente cinco etapas y una confirmación final separada.

- Paciente: Bienvenida → Privacidad → Sobre vos → Alimentos/hábitos → Revisar/enviar;
  confirmación final y datos corporales opcionales separados, con explicación coherente.
- Profesional: Crear paciente → Compartir invitación → Armar plan; acciones visibles y
  acceso a explorar el consultorio. La asistencia propone y la profesional confirma.
- Paleta y tipografía de la app: crema `#F9F4F2`, blanco, tinta `#272932`, lima `#C2E66E`, Poppins.
  Consentimientos sin preselección, sin nombre profesional inventado, guardado y revisión completos.
- Escritorio 1440 y móvil 390, sin tablet. Enlaces y texto con contraste suficiente;
  no trasladar el enlace lima sobre crema de la imagen literalmente.

Facundo aprobó aplicar el diseño a ambos roles: «Sí, aplicalo» (2026-10-02).
No hubo migraciones, cambios de configuración ni nuevos recursos de Supabase.

## Implementación aprobada y comprobada

- Bienvenida con foto original generada por Higgsfield (`ideogram/v4.0`), optimizada a
  WebP 960 × 960, 155.644 bytes. El PNG de 6,49 MB se conserva fuera del repositorio.
  La app sirve la foto localmente; no usa la credencial Higgsfield ni genera al abrir.
- Privacidad con casilla sin marcar, texto de consentimiento obtenido de la API y registro
  de la versión/hash vigente. El texto profesional fijo se reemplazó por «tu nutricionista».
- Perfil y pedido reunidos; alimentos/restricciones y hábitos reunidos. La reanudación de
  `intent` anterior abre Perfil y la de `habits` abre Alimentos/hábitos, sin perder datos.
- Revisión incluye nombre, consentimiento, pedido, alimentos, restricciones, agua, sueño
  y energía. Cero vasos sigue siendo distinto de no responder. Los hábitos se pueden desmarcar.
- Peso/medidas quedó fuera del ingreso; continúa en Inicio como formulario opcional separado.
  Esto elimina el cierre del ingreso mientras ese segundo formulario estaba guardando.
  El problema de autorización del canal corporal y el cálculo siguen pendientes.
- Primeros pasos profesional abre el alta real, el directorio, la invitación del paciente
  seleccionado y su plan. Sin pacientes, explica por qué invitación/plan todavía no están
  disponibles. Se puede reabrir desde el menú de cuenta, también desde Mensajes.
- Cambio de paciente, navegación o historial descartan la respuesta tardía de una invitación.

Validación final: 213 archivos de pruebas, 1.116 aprobadas y 2 omitidas; TypeScript aprobado;
build aprobado (persiste aviso de tamaño de bundle). Navegador gstack con API local en memoria,
IA desactivada y datos ficticios: consentimiento otorgado/retirado, guardado, recuperación
legacy, revisión, envío/reapertura, destinos reales y cancelación de invitaciones tardías.
Escritorio 1440 × 900 y móvil 390 × 844, temas claro/oscuro, sin desborde horizontal.
Revisiones `code-reviewer` y `reality-checker` con hallazgos corregidos.
Capturas y resultados conservados en `design/onboarding/`; informe visual `design-qa.md`.
Esto no certifica una generación IA en producción ni corrige los fallos de IA/metas anteriores.
El estado final del despliegue y su comprobación se registra en el
[PR #49](https://github.com/Facu42/plan-v/pull/49), asociado a esta rama.
