# Foto confirmada (P1)

Borrador. Rama `cursor/foto-confirmada-p1-3f0e`. No se junta, no se despliega y no se toca la base de producción. Los borradores #262–#266 no se tocaron.

Cifra re-revisó el diff: PASA_CON_GAPS. La línea de tiempo que volvía cruda a la paciente quedó recortada. La migración sigue sin aplicar.

## Mapa real (lo que ya estaba en main)

No se inventaron rutas. La foto de la comida ya existía. Este PR cierra el corte de producto encima de eso.

| Qué | Dónde |
|---|---|
| Tabla de comidas | `public.meal_logs` (estado `pending_review`, `confirmed` o `adjusted`; confianza; `note_for_nutri`; `photo_path`) |
| Cada revisión | `public.meal_reviews` |
| Lectura de la foto | `public.meal_analysis_runs` |
| Archivo | balde `meal-photos`, privado (`public = false` desde `20260917190000_core.sql`) |
| Paciente sube | `POST /api/patients/:id/meals/analyze` en `server/diary/routes.ts` |
| Nutri confirma o ajusta | `PATCH /api/patients/:id/meals/:mealId` |
| Cola de trabajo | `GET /api/crm/work-queue` (la cola global sigue de la más nueva a la más vieja) |
| Panel | `/crm/seguimiento`, pantalla `PanelSeguimiento` |
| App de la paciente | Hoy y Mi camino (`PatientCamino`, `MealLogModal`) |
| Lectura de la paciente en la base | `get_patient_meal_logs` y la vista `meal_logs_patient_view`. No traen `note_for_nutri` |
| Foto visible | `signMealPhotos` arma una URL firmada de 60 segundos. Si no se puede firmar, la foto no se muestra |

## Qué agrega este PR

- El indicador de la semana solo cuenta comidas `confirmed` o `adjusted` con confianza de al menos 0,45. Una pendiente o una confianza baja no suma.
- La paciente ve «Estimación pendiente de {nombre}» o «Confirmada por {nombre}». Si todavía no hay nombre, dice «tu nutricionista». No se deja fijo un nombre de una sola profesional.
- En Seguimiento, la lista «Comidas con foto» ordena de la más vieja a la más nueva. Cada fila trae la foto, el texto y dos acciones: Confirmar (píldora lima) y Ajustar (vidrio). No muestra el porcentaje de confianza ni una etiqueta de IA. Si no hay platos, dice «Todo al día» y «No hay platos por revisar». Mientras carga, se ve un esqueleto menta. Ajustar abre el editor en la misma pantalla: foto grande a la izquierda y controles a la derecha. Guardar es la misma píldora lima. No es una página aparte ni un cuadro flotante.
- La migración `20261102140000_meal_photo_review_stamp.sql` (sin aplicar) guarda `reviewed_at` y `reviewed_by` cuando la nutri revisa, y deja el nombre de la nutri de esa paciente en `my_care_nutritionist_name`. La paciente no puede escribir esas columnas. No recibe el id de quien revisó.
- La respuesta de la API a la paciente no incluye `note_for_nutri` ni el id de quien revisó. La línea de tiempo que se reincorpora trae solo id, tipo, hora, título y texto, y deja afuera lo marcado como interno de la profesional.
- Los registros del servidor tachan rutas `patients/…` de fotos, ids en formato UUID y las claves de nota, foto o texto clínico. La ruta de la API sigue diciendo `/api/patients/` con el id tachado.

## Corte de Cifra

- Storage privado y URL firmada: exigido. El balde ya es privado y la API firma. Sin firma, no hay foto.
- RLS paciente contra nutri: exigido. La paciente lee por la función propia; la nutri solo ve a sus pacientes. La migración nueva no abre la tabla cruda. El patrón 016 (vista sin la nota) sigue. No se cambió la firma de `get_patient_meal_logs` para no romper una migración anterior si se vuelve a correr.
- La paciente y la API nunca ven `note_for_nutri`: exigido, con prueba.
- Consentimiento de la foto: GAP conocido. El permiso `meal_photo` ya se pide y, sin él, no se guarda la foto. Este PR no redacta ni cambia ese texto. Falta la revisión legal.
- Registros sin datos de salud: revisado en el registro de operaciones. No se anota el camino de la foto, el id en claro ni la nota clínica.

## Paso 10

- Flujos críticos: subir foto y quedar pendiente ✅ (`server/meal-flow.integration.test.ts`). Confirmar y ajustar en el panel ✅ (`PanelSeguimiento.test.tsx`; Ajustar abre el editor ya cubierto). La paciente no ve la nota ✅ (API y `get_patient_meal_logs`). Indicador con el umbral 0,45 ✅. Login real de una nutri en el navegador ⚠️ (se probó el modo demo local).
- Regresiones: la nota interna no vuelve en la respuesta de la paciente; una comida confirmada con confianza 0,44 no suma al indicador.
- Contratos: la paciente recibe `review_label` y no la nota. La nutri sigue viendo la nota en su lectura. La cola global no se dio vuelta.
- Áreas frágiles: permisos de la base y el balde de fotos. El síntoma si se rompe es una foto ajena o una nota en la app de la paciente. Las pruebas de Postgres y de la API cubren ese corte.
- Migración: aditiva. Sin aplicar. Para volver atrás, en una base de prueba: restaurar las funciones `review_meal_log` y `meal_log_json` de la migración del 5/10, borrar `my_care_nutritionist_name` y, si nadie usa las columnas, quitar `reviewed_at` y `reviewed_by`. No borra comidas.
- Fire test: se bajó el umbral a 0,2 a propósito. Fallaron la prueba del indicador y la del límite 0,449. Se volvió a 0,45 y esas pruebas quedaron verdes. La prueba nueva del JSON de la paciente falló antes del recorte de la línea de tiempo (la nota salía en el evento) y quedó verde después.
- Memoria: la migración está en el manifiesto. No corre sola. Hace falta la frase de Facundo para la base, y el visto de Cifra para el diff.
- Veredicto: HOLD. Borrador hasta el ok de Facundo y la re-revisión de Cifra.
