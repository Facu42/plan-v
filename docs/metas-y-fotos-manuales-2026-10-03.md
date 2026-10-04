# Metas publicadas y fotos manuales — 2026-10-03

Implementación local en `codex/nutrigo-producto-mcp`. No aplicada en producción,
sin commits propios y sin contratar servicios. El cálculo existente de calorías
permanece igual. La generación de fotos con IA continúa pendiente.

## Metas nutricionales

Guardar otro borrador conserva intacta la meta confirmada que ve la paciente.
La profesional recibe ambas versiones y una revisión para evitar sobrescribir
un cambio efectuado desde otra sesión. Publicar recalcula en la API y en SQL,
actualiza la confirmada y limpia el borrador privado.

| Acción | Entrada | Quién | Cómo se comprueba al recargar |
| --- | --- | --- | --- |
| Consultar meta | `GET /api/patients/:id/nutrition-target` | Paciente propia o profesional asignada | Paciente recibe sólo `target` publicado; profesional recibe `target`, `draft`, `published`, `revision`. |
| Guardar borrador | `PUT` en la misma ruta, `publish:false`, `inputs`, `expected_revision` | Profesional asignada | El borrador reaparece para ella y la paciente conserva la confirmada anterior. |
| Confirmar meta | `PUT` en la misma ruta, `publish:true` y revisión leída | Profesional asignada | Ambas ven la meta confirmada; el borrador queda vacío. |
| Actualizar datos corporales | `PUT /api/patients/:id/body-data` | Paciente propia | La lectura posterior devuelve peso, talla, sexo y fecha de nacimiento; limpia el pedido pendiente. |
| Pedir actualización | `POST /api/patients/:id/body-data/request` | Profesional asignada | La paciente y la profesional ven el pedido pendiente. |

Un conflicto de revisión devuelve 409 y no escribe. Una revisión ausente se
rechaza; la pantalla ofrece recargar antes de guardar. Las rutas se conservan,
pero clientes antiguos necesitan actualizar su petición con la revisión.
`getTarget()` en el servidor devuelve sólo la confirmada: su fecha de actualización
y contenido identifican la meta utilizada por IA. Guardar un borrador privado no
cambia esa versión publicada.

Migración preparada: **20261003172112_separate_nutrition_target_drafts.sql**.

- Conserva `nutrition_targets` exclusivamente para confirmadas; incorpora
  `nutrition_target_drafts`, con lectura exclusiva de la profesional asignada.
- Copia los borradores existentes antes de retirarlos de la tabla publicada.
  Conserva los valores y fechas de las confirmadas. No inventa historia perdida.
- Recalcula en SQL, compara la revisión y comparte el bloqueo por paciente con
  la aplicación de menús IA. El RPC anterior sin revisión deja de admitir escritura.
- Función de escritura con privilegios en el esquema privado; entradas públicas
  con los permisos de quien llama, sin acceso de visitantes.

## Fotos manuales de recetas

La nutricionista puede subir o reemplazar la foto de una revisión publicada.
El catálogo conserva la publicación de recetas y muestra el control de subida.
Una versión todavía en borrador necesita publicarse antes de subir su foto.

| Acción | Entrada | Quién | Comprobación persistente |
| --- | --- | --- | --- |
| Subir o reemplazar foto | `POST /api/recipes/:id/cover/manual`, foto como `data_url`, `expected_version` y `expected_cover_url` | Nutricionista propietaria | Releer catálogo devuelve la portada guardada. |
| Consultar foto asignada | `GET /api/patients/:id/recipes` | Paciente propia o profesional autorizada | La receta publicada y asignada incluye la misma portada. |

Se admiten JPEG, PNG y WebP de hasta 5 MB. El servidor inspecciona el contenido
real, las dimensiones y el límite de píxeles, y retira metadatos con la inspección
existente. El límite de la petición JSON se amplía sólo para esta ruta.

Se reutiliza el bucket **recipe-covers**, que ya existe y es público. El control
lo informa y pide subir sólo el plato. No utiliza archivos de salud ni envía la
foto a un proveedor de IA. La subida utiliza los permisos de la profesional;
no se crean buckets ni se amplían recursos.

Migración preparada: **20261003174117_manual_recipe_cover.sql**. Agrega sólo
funciones para la escritura manual. Reutiliza el guardado de portadas existente,
comprueba propietario, objeto, última versión publicada y portada previa bajo
el bloqueo de publicación. Invalida una finalización IA que estuviera pendiente
para que no reemplace después la foto elegida por la profesional.

Si falla Storage, la portada anterior permanece. Si el guardado entra en conflicto,
se limpia únicamente el nuevo candidato y sólo cuando una lectura confirma que
ninguna portada lo referencia. Una respuesta incierta del guardado se vuelve a
comprobar: si la foto quedó referenciada, se conserva; si no se puede determinar,
no se elimina. Esa última situación puede dejar un objeto sin referencia y requiere
revisión posterior. No se presenta un resultado sin confirmar como un guardado exitoso.

## Verificación y límites

**70 pruebas focales aprobadas en 9 archivos**, incluyendo metas, fotos manuales,
portadas anteriores, catálogo y límites de petición. Los casos nuevos prueban:

- Migración exacta de borradores y confirmadas, recálculo y conservación tras otro borrador.
- Borradores invisibles para pacientes, otras profesionales y cuentas sin identidad.
- Revisiones antiguas, doble envío y ausencia de escritura después del retiro de acceso.
- Foto leída después de asignar la receta; tipo falso, archivo incompleto y exceso de tamaño.
- Rechazo de paciente, cuenta sin rol profesional, receta ajena, versión o portada cambiadas.
- Fallo de Storage, limpieza del candidato y comprobación ante respuesta incierta.
- Finalización IA anterior rechazada después de subir la foto manual.
- Funciones nuevas sin ejecución para visitantes.

TypeScript y el control de archivos de migración finalizaron sin errores. La
revisión de diferencias tampoco detectó errores de formato.

Las pruebas SQL ejecutan la cadena de migraciones en PGlite y reproducen el
catálogo de Storage. Las llamadas de subida de archivos se prueban con un Storage
simulado. **No sustituyen una subida real a Supabase con cuentas firmadas.** Esa
prueba y la comprobación en el navegador requieren primero aplicar las migraciones
aprobadas y publicar la misma versión del producto.

No hubo capturas. El changelog oficial de Supabase fue consultado mediante
`/browse` por el hilo principal; los cambios de PostgreSQL señalados no afectan
los tipos ni funciones usados aquí. Los archivos de migración se generaron con
la CLI 2.119.0, tras consultar su ayuda.

La migración de metas es transaccional, con espera de bloqueo limitada a 2 segundos
y duración por sentencia limitada a 30 segundos. Para producción debe pausarse el
guardado de metas desde clientes anteriores durante el cambio. **PGlite no prueba
contención real entre sesiones de PostgreSQL ni garantiza ausencia de bloqueos.**

Se inspeccionó la alternativa local: no hay `psql` ni `postgres` disponibles, ni
servidor escuchando en 5432/55433. Docker Desktop está instalado, pero el motor no
estaba activo; el intento de inicio oculto no dejó el motor disponible y se terminaron
únicamente las dos consultas propias que quedaron esperando. No se instaló ni se
reconfiguró un servicio. La prueba de bloqueos reales queda para el PostgreSQL
temporal de CI o una instalación local disponible, antes de la aprobación concreta
de la migración productiva.

El hilo principal debe integrar este resultado con la revisión independiente,
las pruebas generales, el PR y las puertas de publicación. No se afirma que las
migraciones, las fotos manuales ni la nueva interfaz estén ya verificadas en producción.
