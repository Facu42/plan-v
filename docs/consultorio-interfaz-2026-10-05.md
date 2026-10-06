# Consultorio: ficha, seguimiento y cobranzas

Ocho módulos: Inicio, Pacientes, Planes, Seguimiento, Agenda, Mensajes, Biblioteca y Cobranzas. Los enlaces anteriores se resuelven en los nuevos destinos. Inicio y Seguimiento usan la bandeja autorizada del servidor; las tareas abren paciente y sección correspondiente.

La ficha tiene siete pestañas: Resumen, Ingreso y antecedentes, Registros y evolución, Plan alimentario, Consultas, Mensajes y Cobros. La URL conserva paciente y sección tras recargar y volver. El controlador central rechaza cambios de navegación si el usuario cancela el descarte. Los formularios registran cambios reales y bloquean la salida mientras guardan; se descartan lecturas atrasadas con cancelación o cambio de componente.

Pacientes admite búsqueda, etapa, activos/archivados e ingresos pendientes, junto con los controles existentes de alta, invitación, edición y restauración. La ficha consulta el saldo real y las cuotas/revisiones del mismo libro que recibe el paciente. Cobranzas conserva cuotas mensuales, vencimientos, pagos parciales, saldo a favor, revisión y anulación con trazabilidad. Sin Mercado Pago.

La biblioteca funciona sin paciente para editar/publicar; solicita una selección explícita para leer sus asignaciones. Recursos permite borrador, publicación y copia como nueva versión para conservar el material ya recibido. Recetas conserva su editor y publicación, con aviso de cambios pendientes.

Las superficies nuevas usan Poppins, crema #F9F4F2, verde #C2E66E y tarjetas de radio 16 de Nutrigo. La navegación profesional usa una columna lateral en escritorio y disposición compacta en móvil. Los diálogos de alta/edición conservan foco, Escape y retorno al control inicial.

Validación: suite general 1388 aprobadas/2 omitidas; tipos y compilación aprobados. Gstack comprobó cancelar Atrás y cambio de paciente conservando una observación, guardarla, crear/publicar/asignar un recurso y releer su contenido desde paciente, y cambiar una cuota confirmando el mismo importe. Datos únicamente ficticios. La prueba nativa completa de sesiones, persistencia, adjuntos y reinicio se ejecuta en CI; no se ha probado producción.

Revisiones independientes code-reviewer y reality-checker cerradas sin bloqueo concreto para PR. La evidencia visual del paciente se entrega en el apartado siguiente.
