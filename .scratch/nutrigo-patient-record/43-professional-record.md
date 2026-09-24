# 43 — Ficha profesional en el diseño Nutrigo

## Implementado

- El módulo **Fichas** y el acceso **Abrir ficha** ya abren `ShowroomPatientRecord`, no el resumen legacy.
- Encabezado de paciente con estado, etapa, cobranza, selector multipaciente y edición operativa reutilizando `ShowroomPatientEdit`.
- **Actualización posterior:** Revisar comidas ya abre la superficie Nutrigo del corte 44; Editar plan y Gestionar consultas conservan el editor operativo anterior con el mismo paciente seleccionado.
- Resumen real: objetivo/estado/progreso/fecha, próxima consulta y adherencia de siete días.
- Bloque explícito **Información profesional privada**, con horario sensible, Plan B, próximo foco y lectura de adherencia. Rotulado semántico «Solo visible para profesionales».
- Historial en tres superficies: línea de tiempo, notas privadas del historial de objetivos y observaciones `note_for_nutri` de comidas. `professionalMealNotes` filtra defensivamente por `patient_id` y ordena por fecha descendente.
- Estados vacíos honestos; no se agregó un CTA «Agregar nota» porque todavía no existe entidad/API para una nota profesional libre.
- La Ficha usa toda el área de detalle y elimina el rail de menú semanal. Se corrigió una colisión de especificidad que todavía reservaba 325 px invisibles: ancho medido pasó de 877 a 1120 px en canvas 1440.
- El paciente no tiene ruta Ficha y el cambio de rol vuelve a Inicio.

## Verificación

- RED: suite nueva falla porque `ShowroomPatientRecord` no existe. GREEN: 5 pruebas de identidad/objetivo, privacidad, aislamiento de notas de comidas, vacíos y acciones; 21 pruebas focalizadas de Ficha/privacidad/directorio.
- Browser: 6 flujos — Fichas abre vista nueva y queda `aria-current`; valores privados coinciden con API demo; cambio Sofía→Marina elimina valores anteriores; edición reversible de próximo foco con lectura de API antes y después; Revisar comidas abre el Diario Nutrigo para Marina y conserva selección al volver a Fichas; rol Paciente no contiene Ficha, bloque privado, lectura de adherencia ni notas `note_for_nutri`.
- 8 vistas (claro/oscuro × 1440/800/390/320), 3 tarjetas resumen, 4 campos privados, 3 tarjetas de historial, sin rail y sin overflow horizontal. Capturas inspeccionadas en escritorio claro y móvil oscuro.
- Hallazgo visual corregido: escritorio seguía usando la grilla 892+325 aun sin rail; selector reforzado a `.nv-app.nv-pro.nv-record` y nuevo assert `main >= 1050` a 1440. Resultado 1120 px.
- Suite completa: 246 pruebas / 45 archivos; TypeScript frontend/server, build 121 módulos, npm audit 0 vulnerabilidades, firmas 91/attestations 46 y `git diff --check` aprobados.

## No incluido

- No se creó persistencia de notas libres ni se cambió contrato 016/RLS.
- Comidas se migró en el corte 44; Plan y Consultas aún abren sus editores anteriores. Datos reales/Supabase continúan bloqueados.
- Sin commit, despliegue ni aprobación visual general.
