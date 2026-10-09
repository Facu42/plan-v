# Perfil y acceso seguros para varios consultorios

## Decisión de producto

Plan V es un servicio que Facundo administra y vende a múltiples nutricionistas.
Cada paciente está asignada a una nutricionista; cada consultorio conserva sus
pacientes, planes, recursos y seguimiento. No se codifican cuentas o consultorios
únicos. La administración comercial no concede lectura clínica global.

Ya existen nutricionistas identificadas, asignaciones, organizaciones y funciones
administrativas de suscripciones, pruebas y pagos. Este cambio reutiliza ese modelo;
no añade otra tabla de identidad ni convierte la cuenta de Facundo en nutricionista.
Administrar el servicio y cobrar a profesionales son distintos de las cobranzas
que cada profesional lleva con sus pacientes.

## Corrección implementada

Las vistas públicas `patients_patient_view` y `patient_access_view` se vuelven
`security_invoker=true` y mantienen sus nombres y columnas, de modo que la API
actual conserva el perfil y el estado de acceso. No se abre SELECT de la tabla
cruda `patients` a pacientes ni se exponen notas profesionales.

La lectura mínima autorizada pasa por dos funciones en el esquema privado:
identidad de la sesión, columnas explícitas, búsqueda de objetos fija, sin aceptar
identidad ni consultorio suministrados por el cliente. Una paciente recibe sólo su
perfil; el estado de acceso se limita a ella o a pacientes del consultorio del
profesional autenticado. Se excluyen desactivados y anonimizados en el acceso.
Ser administrador no añade un permiso clínico; si esa misma persona tiene además
un rol clínico legítimo, conserva exclusivamente los permisos de ese rol.

Se eliminan concesiones heredadas por tabla y columna, incluso PUBLIC. Sólo
authenticated puede leer las vistas; anon no puede leerlas y ninguno puede
escribir. Las funciones privadas también verifican identidad aunque se llamen
directamente por SQL. El esquema privado no se expone en el ensayo PostgREST.
No debe añadirse a los esquemas expuestos del servicio.

Para crecer, un índice parcial agrupa pacientes activos por nutricionista. Los
identificadores del caller se calculan una vez por consulta. Esto prepara la
búsqueda por consultorio; no equivale a una prueba de capacidad ni garantiza un
número concreto de usuarios simultáneos.

## Evidencia y publicación

ECC: prueba inicial falló al detectar las dos vistas definer (commit6974ad8).
El comportamiento de pacientes/consultorios ya estaba aislado; los avisos no eran
una reproducción de filtración. Tras el cambio, ocho pruebas de PostgreSQL
descartable verifican aislamiento, acceso administrativo separado, ACL de tabla y
columna, escritura denegada, funciones privadas, retiro de acceso y reaplicación.
La prueba histórica de vistas crudas conserva el esquema anterior para reproducir
su fallo; la suite nueva aplica todas las migraciones vigentes.

El runner de Supabase temporal conserva el informe anterior de comidas y agrega
`security-profile-after.json`: exige que desaparezcan estos dos avisos. El ensayo
con Auth/PostgREST incluye dos nutricionistas, sus dos pacientes y un administrador
ficticio; comprueba lectura propia/asignada, denegación a otros y escrituras.
Los datos son ficticios y el entorno se descarta; no se prueban pacientes reales.

Migración: `20261009154511_invoker_patient_profile_projections.sql`.
Producción no modificada por esta corrección. El mensaje «implementémosla» autoriza
preparar y verificar el cambio; la publicación de esta nueva corrección se presentó
previamente como una aprobación posterior. PR y CI quedan registrados al finalizar.

## Criterios para los próximos apartados

Validación local final: 313 archivos, 2173 pruebas aprobadas y 2 omitidas;
tipos, compilación, secretos y migraciones aprobados. Revisión de código y
comportamiento sin bloqueantes. La verificación Auth/PostgREST y advisors reales
se ejecuta en CI; no se sustituye por el simulador local.

1. Todos los accesos clínicos y archivos deben verificar paciente y consultorio
   en el servidor y en la base; cambiar una URL o un identificador no otorga acceso.
2. Añadir pruebas con dos consultorios a cada función nueva, incluida IA, recursos,
   exportaciones y tareas en segundo plano. Validar también qué pasa al transferir
   una paciente o cambiar personal autorizado.
3. Mantener separado el panel comercial del servicio: cuentas, suscripciones,
   cobros y actividad operativa; sin historias clínicas globales por defecto.
4. Antes de ampliar comercialmente, medir carga de consultas, archivos y colas;
   definir límites de IA/almacenamiento por consultorio y evitar que uno consuma
   toda la capacidad. Definir la capacidad objetivo con uso medido.
5. Revisar paginación, índices, aislamiento de biblioteca y almacenamiento,
   auditoría, copias y recuperación. Probar altas/bajas de profesionales y sus
   pacientes, vencimientos y continuidad del servicio.

Estos puntos son criterios y pendientes de expansión; no se declaran implementados
por esta migración. Los equipos con varios profesionales reutilizarán organizaciones
y permisos existentes, con revisión específica antes de ampliar el acceso clínico.

Referencias oficiales consultadas:
[vistas y seguridad](https://supabase.com/docs/guides/database/tables),
[funciones y permisos](https://supabase.com/docs/guides/database/functions).
