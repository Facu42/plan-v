# Producto publicado y prueba de IA gratuita — 5 de octubre de 2026

El recorrido de nutricionista y paciente ya se comprobó con las dos cuentas ficticias autorizadas, mediante controles de la app y lecturas nuevas del servidor. Se conserva el frontend de las 24 fuentes MCP, en español y con la marca Plan V. No se usaron capturas, datos clínicos reales, proveedores pagos ni recursos nuevos de Supabase.

## Publicación comprobada

Las cinco migraciones y la configuración gratuita aprobadas se aplicaron exactamente como indica el [paquete de producción](paquete-produccion-pr54-2026-10-05.md). Los PR [#54](https://github.com/Facu42/plan-v/pull/54), [#56](https://github.com/Facu42/plan-v/pull/56) y [#57](https://github.com/Facu42/plan-v/pull/57) están integrados. Para la generación real se comprobó el mismo commit `df8e5d03757e2db6e7380346d7d8b221d621ad8d` en los tres servicios:

| Servicio | Despliegue | Comprobación |
|---|---|---|
| Web | `dpl_8z9f4FsjvGN6nVP5z9FxtBDgAhoS` | READY; dominio público, commit de Git correcto |
| API | `2132b547-c231-4a78-8078-09521316edd1` | SUCCESS; health y ready 200, mismo commit |
| Worker | `661199a2-a5e2-46d1-894e-1d7eb71dfebc` | SUCCESS; mismo commit |

La continuación sólo ajusta la espera del ensayo de navegador y actualiza estos registros. Su commit final, CI y despliegues se anotan en la descripción del PR que integra este cierre; no modifica el código funcional ni el SQL.

## Generación real, edición y publicación

- Trabajo `d0b6f760-11aa-42f9-a112-0fde9385943e`, modelo `openrouter/free`, completado en 45.329 ms, entre las 18:39:13 y 18:39:59 UTC. El corte anterior de 25 s habría interrumpido esta respuesta. Precio máximo cero, sin alternativa paga.
- Se solicitaron y recibieron desayuno, almuerzo, merienda y cena para el 5 de octubre, con cuatro recetas nuevas, ingredientes, cantidades, rinde, pasos y nutrientes. Todas conservan `ai_estimate` y `estimacion_ia.v2`.
- El servidor ajustó las porciones a la meta confirmada de 1857 kcal. Total: 1857,024 kcal; proteínas 91,1872 g, hidratos 229,632 g y grasas 40,6016 g. La interfaz muestra también las diferencias de macros; coincidir en calorías no significa coincidir en cada macro.
- Desde «Editar propuesta» se abrió el borrador privado 2. Se corrigieron notas que la IA había asociado a otros platos y se editó el título del desayuno a «[Prueba IA] Avena con frutas y semillas». El guardado se comprobó por una lectura nueva. Mientras tanto la paciente seguía recibiendo únicamente el plan publicado 1.
- Después de revisar el formulario se pulsó «Publicar v2». Publicación registrada a las 18:46:38 UTC. Una lectura profesional y otra de paciente devolvieron exactamente los mismos ítems aprobados, con notas editadas, ingredientes, porciones y origen estimado conservados.
- La paciente volvió a ingresar y abrió el plan y el detalle del desayuno. En escritorio 1440 y celular 390 se comprobaron título editado, pasos, cantidades escaladas y «Nutrientes estimados por IA». El desayuno muestra 665,6 kcal y 66,6 g de avena para la porción asignada. Recargar conserva el plan publicado.

Es una comprobación de funcionamiento con datos ficticios, no una validación clínica de los menús ni de las estimaciones del modelo. Revisar o publicar una propuesta no transforma sus nutrientes estimados en mediciones verificadas.

## Persistencia y permisos

En producción se comprobaron además la receta manual publicada con foto HTTPS guardada, el registro de comida de 200 kcal y su confirmación profesional, agua de 6 vasos y descanso de 450 minutos tras recargar, y la separación entre meta publicada de 1857 kcal y borrador privado de 1870 kcal. Salir y volver a entrar conserva lo publicado. El permiso de IA se otorgó desde «Mi ficha» de la paciente; el servidor había rechazado correctamente la generación sin ese permiso.

El ensayo temporal con sesiones reales y PostgreSQL cubre invitación/onboarding, fichas, planes, compras, favoritos, agenda, mensajes y descargas de adjuntos, registros de medidas/actividad, fotos y estudios privados, recursos, pagos manuales, archivo/restauración, recuperación y retiro de permisos. El PR #57 aprobó 1364 pruebas generales, dos omitidas por configuración, 25 pruebas nativas y 40 verificaciones de gstack; [CI general](https://github.com/Facu42/plan-v/actions/runs/37356341655) y [sesiones/navegador](https://github.com/Facu42/plan-v/actions/runs/37356341881).

Al repetir en `main`, las 25 pruebas nativas pasaron pero el navegador se detuvo al abrir los permisos de fotos antes de terminar de cargar su catálogo: el acordeón volvía a cerrarse al finalizar la carga. El ensayo ahora espera las tres casillas y la desaparición del estado de carga antes de abrirlo. No se elimina ninguna comprobación ni se considera aprobado un recorrido incompleto. La repetición completa y las revisiones independientes quedan registradas en el PR de cierre.

## Acceso y prueba breve

[Abrir Plan V](https://plan-v-eight.vercel.app/). Las credenciales ficticias están en el chat y no se guardan en el repositorio. Se pueden usar dos ventanas independientes para mantener ambos roles abiertos.

1. Nutricionista: abrir **Pacientes**, elegir **[Prueba] Paciente** y pasar a **Ficha** y **Plan**. Revisar la meta publicada, el borrador privado y el plan v2. Crear otro borrador sin publicarlo permite comprobar que la paciente sigue viendo v2.
2. Paciente: abrir **Plan**, pulsar un plato para ver sus ingredientes, pasos y porciones; abrir **Diario** para registrar comidas, agua y descanso. Recargar y consultar esos registros desde la nutricionista.
3. Probar **Compras**, **Agenda**, **Mensajes**, **Progreso**, **Recursos** y pagos manuales con datos ficticios. Los [contratos y recorridos](recorridos-y-contratos-plan-v-2026-10-05.md) indican la lectura que confirma cada acción.
4. Para otra propuesta gratuita, habilitar el permiso opcional de IA desde **Mi ficha** de paciente y generar desde el editor profesional. Editar, revisar y publicar; si el proveedor está agotado, reintentar o trabajar manualmente.

**Fotos de platos:** la subida manual está comprobada. Generar fotos con IA sigue pendiente de un proveedor gratuito viable y probado. Higgsfield y las alternativas pagas permanecen deshabilitados.
