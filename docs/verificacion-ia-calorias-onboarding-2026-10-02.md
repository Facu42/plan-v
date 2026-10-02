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
| Onboarding | Nueve pasos, reanudación, guardado serializado, consentimiento versionado y conflictos. | Estética propia, no parte de los 24 nodos Figma. Textos largos y profesional fijo; propuesta Higgsfield preparada para revisar. |

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
- Onboarding: nombre/iniciales y textos fijos de Verónica; revisión omite restricciones y
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
Es una referencia visual; aún no se implementó ni publicó. La imagen puede dibujar más puntos
de progreso que el flujo propuesto: la implementación debe mostrar exactamente cinco etapas.

- Paciente: Bienvenida → Privacidad → Sobre vos → Alimentos/hábitos → Revisar/enviar;
  confirmación final y datos corporales opcionales separados, con explicación coherente.
- Profesional: Crear paciente → Compartir invitación → Armar plan; acciones visibles y
  acceso a explorar el consultorio. La asistencia propone y la profesional confirma.
- Paleta y tipografía de la app: crema `#F9F4F2`, blanco, tinta `#272932`, lima `#C2E66E`, Poppins.
  Consentimientos sin preselección, nombre profesional real, guardado y revisión completos.
- Escritorio 1440 y móvil 390, sin tablet. Enlaces y texto con contraste suficiente;
  no trasladar el enlace lima sobre crema de la imagen literalmente.

La aprobación del diseño se solicitó antes de modificar el frontend, según brainstorming.
No hubo cambios de producción, migraciones ni nuevos recursos de Supabase.
