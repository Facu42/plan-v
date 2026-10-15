# Plan de implementación — expansión Plan V con referencia Nutrigo

> Actualización 2026-09-16: este documento conserva el plan histórico de expansión visual/funcional. La secuencia vigente y las decisiones propuestas están en el [plan de acción revisado](../docs/plan-de-accion-2026-09-16.md), con [arquitectura](../docs/superpowers/specs/2026-09-16-plan-v-arquitectura-design.md) y [onboarding/IA](../docs/superpowers/specs/2026-09-16-plan-v-onboarding-ia-design.md). Se confirmó PWA + CRM web, estudios y fotos corporales opcionales desde el inicio. Se adelantan persistencia y privacidad; el showroom debe promoverse a rutas autenticadas de producción conservando el alcance Nutrigo.

## Objetivo

Ampliar Plan V hasta cubrir funciones equivalentes a las doce superficies observadas en Nutrigo, con una implementación visual original basada en el logo oficial. La plataforma debe conservar dos experiencias coordinadas: CRM multipaciente para la nutricionista y app privada para cada paciente.

## Dirección de producto

La fuente principal pasa a ser el archivo local `../nutrigo_reference/Nutrigo - Nutrition & Diet Dashboard/Nutrigo - Nutrition & Diet Dashboard.fig`, no el montage de la tienda. El inventario verificado, las medidas y la matriz bidireccional están en [Nutrigo local → Plan V](../docs/nutrigo-reference-map.md). Hay 36 frames de interfaz: 12 superficies en escritorio/tablet/móvil. La solicitud actual confirma integrar funciones de ambos productos sin eliminar capacidades de Plan V; la aprobación visual y los gates de datos reales siguen pendientes.

Plan V no será un tracker individual aislado. Cada dominio compartido tendrá tres caras:

1. **Nutricionista:** crear, asignar, revisar, aprobar, editar y ver agregados de sus pacientes.
2. **Paciente:** consultar lo asignado, registrar datos, responder y gestionar acciones personales permitidas.
3. **Sistema:** autorizar por relación, notificar, conservar trazabilidad y ocultar información profesional.

## Decisiones de arquitectura

- Mantener `plan-v` como aplicación canónica; no crear una segunda aplicación permanente.
- Conservar `PlanVExperience` como frontera entre paciente y CRM y preservar el lazy loading de ambas superficies.
- El showroom del paso 1 será aislado y activado por una query de desarrollo, ya que el proyecto no usa router.
- Construir vertical slices: modelo demo + contrato + API + interfaz profesional + interfaz paciente + pruebas.
- Continuar en memoria hasta aprobar el contrato ampliado, RLS y staging. Ninguna función nueva habilita datos reales por sí sola.
- Reabrir el contrato 016 antes de aprobarlo; el modelo actual no contempla recetas, grocery, ejercicios, insights, favoritos ni notificaciones completas.
- No copiar assets del preview de Yellow Images. Usar el logo oficial y recursos propios o con licencia compatible.

## Marca

Fuente: `Logo Plan V Nutrición - Isotipo Circular.png`.

- `#083A30` verde profundo
- `#23955D` verde principal
- `#62AA66` verde hoja
- `#F9B343` dorado
- `#F87D6D` coral
- `#F86648` naranja
- `#F5A067` damasco
- `#F9F6EE` crema

Poppins confirmada por el usuario e incorporada localmente al showroom con `@fontsource/poppins`. Las superficies originales conservan Fraunces y DM Sans hasta su migración. Usuario confirma compra de licencia del pack completo; registrar procedencia de los assets al integrarlos, sin hotlinks al preview.

## Fases

### Propuesta de continuación — corregir el diseño antes de ampliar

Estado: propuesta para acordar el siguiente corte; no implica aprobación visual ni autoriza migraciones. La implementación actual sirve como base funcional, pero no como referencia visual aprobada.

1. **V1 — Fijar la referencia visual.** Elegir un Dashboard de Nutrigo como patrón principal; comparar al mismo tamaño y registrar proporciones de columnas, espaciado, jerarquía, tarjetas, gráficos e imágenes. No mezclar composiciones de diferentes previews. Tipografía exacta por confirmar; no instalar fuentes ni reutilizar assets sin validación. Entrega: mapa de diferencias y especificación breve en el sistema de diseño. Dependencias: ninguna; alcance pequeño.
2. **V2 — Pantalla patrón paciente, escritorio.** Corregir solo el Dashboard paciente para que permita comparación directa con el patrón. Mantener marca Plan V y datos demo existentes, sin inventar peso/macros ni otras mediciones. Gráficos y panel diario deben ocupar lugares y proporciones comparables, no quedar desplazados por bloques añadidos. Entrega: pantalla ejecutable más comparación lado a lado. Dependencia: V1; alcance mediano, separar shell y tarjetas si requiere más de cinco archivos.
3. **V3 — Adaptación profesional del mismo sistema.** Aplicar la composición resuelta al CRM, sin empezar otro diseño. Reducir la prominencia del bloque de acciones y evitar duplicar KPIs sin jerarquía. Conservar los once módulos, lista/selector multipaciente, Mi seguimiento separado del menú y los accesos de edición/revisión. Entrega: CRM de escritorio más comparación visual y cambio de paciente comprobado. Dependencia: V2; alcance mediano.
4. **V4 — Responsive y oscuro.** Adaptar las dos pantallas patrón a tablet/móvil y tema oscuro, manteniendo jerarquía y accesos; no encoger sin reorganizar. Entrega: capturas comparables y controles utilizables a 800/390/320. Dependencia: V2/V3; alcance mediano.
5. **V5 — Revisión explícita del usuario.** Presentar las dos superficies, comparación con Nutrigo y diferencias que permanecen. Las pruebas técnicas protegen los flujos, no acreditan parecido. La aprobación solo la da el usuario; si rechaza, iterar sin avanzar de fase. Dependencia: V4.

Durante V1–V5 se congela la expansión funcional: sin nuevos módulos, persistencia ni integraciones. Se conserva la base operativa ya verificada. Los cambios puramente visuales se juzgan con capturas; la lógica modificada sí requiere pruebas focalizadas, y la regresión completa se ejecuta al cerrar el corte, no repetidamente sin cambios.

Tras aprobar el sistema visual, completar el contrato ampliado de la fase 2 y continuar por flujos verticales. Para las funciones existentes, migrar directorio/ficha → plan/revisión → agenda/mensajes al mismo diseño: abrir una acción no debe terminar siendo una transición permanente a una interfaz antigua. Las nuevas funciones y datos reales conservan sus gates de alcance, privacidad y RLS.

### Fase 1 — Diseño y shell

1. Integrar logo y tokens.
2. Crear primitives compartidas.
3. Crear showroom de Dashboard paciente y CRM Inicio.
4. Validar claro/oscuro y 1440/800/390/320 px.
5. Aprobar visualmente antes de reemplazar rutas existentes.

### Fase 2 — Contrato ampliado

1. Modelar recetas, ingredientes, favoritos, grocery, ejercicios, insights, notificaciones y progreso autorizado.
2. Definir acciones y serializers para nutricionista/paciente.
3. Actualizar draft y matriz RLS sin ejecutar SQL.
4. Crear seeds y contratos API demo.

### Fase 3 — Núcleo diario

1. Dashboard dual.
2. Calendario/agenda.
3. Mensajería multipaciente.
4. Notificaciones y búsqueda global.

### Fase 4 — Alimentación

1. Menú saludable y recetas.
2. Detalle de receta.
3. Planificador semanal.
4. Grocery.
5. Diario de comidas y revisión profesional.

### Fase 5 — Evolución

1. Progreso y tendencias.
2. Ejercicio/actividad bajo alcance aprobado.
3. Insights y Guardado.
4. Completar módulos analíticos del CRM.

### Fase 6 — Producción

1. Contrato/RLS aprobado y probado.
2. Auth, email, Storage, Mercado Pago, IA y notificaciones reales.
3. E2E, observabilidad, backups, incidentes y despliegue.
4. Organizaciones y multi-nutricionista comercial después de validar el producto con una profesional.

## Dependencias críticas

```text
Paso 1: identidad/showroom
  └─ aprobación visual
      └─ Paso 2: contrato ampliado
          ├─ Dashboard + calendario + mensajes
          ├─ Recetas + plan + grocery + diario
          └─ Progreso + ejercicio + insights
              └─ RLS/staging/proveedores
                  └─ producción
```

## Riesgos y mitigaciones

| Riesgo | Impacto | Mitigación |
| --- | --- | --- |
| Copiar el kit sin licencia adecuada | Alto | Diseño original; no usar assets hasta acreditar licencia compatible con web apps |
| Convertir el CRM en tracker individual | Alto | Mantener lista multipaciente y permisos duales como criterio de aceptación de cada slice |
| Expandir 016 después de migrar | Alto | Reabrir el contrato antes de cualquier aprobación o conexión real |
| Exponer datos clínicos entre pacientes | Crítico | Acciones explícitas, serializers, RLS sintético A/B y pruebas negativas |
| Peso/fotos/ejercicio sin finalidad aprobada | Alto | Gate clínico y de privacidad antes de modelar o persistir |
| UI completa con botones decorativos | Medio | Ningún CTA visible cuenta como terminado sin handler, estado, persistencia y prueba de navegador |
| Alcance demasiado grande | Alto | Entregar y aprobar una vertical slice por vez; no migración masiva |

## Decisiones pendientes

- Resuelto: el usuario confirma compra de licencia de todo el pack y su uso para Plan V; no volver a bloquear el desarrollo pidiendo la misma confirmación.
- Aprobar o excluir presupuesto/gastos de supermercado.
- Resuelto: incluir peso y medidas opcionales. Fotografías corporales, consentimiento y retención siguen pendientes antes de datos reales.
- Resuelto: incluir registro de actividad y rutinas asignadas por profesional habilitado. Falta definir acreditación y permisos de servidor; no habilitar automáticamente a toda nutricionista.
- Definir quién crea y revisa Insights y sus imágenes.

Estas decisiones no bloquean el showroom del paso 1.

## Seguimiento

- Backlog canónico: `docs/pending-work.md`.
- Tareas ejecutables: `tasks/todo.md`.
- Evidencia de cortes: `.scratch/`.
