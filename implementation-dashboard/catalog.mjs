const ids = (...ranges) => ranges.flatMap(([from, to = from]) => Array.from({ length: to - from + 1 }, (_, i) => `PV-${String(from + i).padStart(2, '0')}`));

export const milestones = [
  { id: 'H0', title: 'Base verificable', description: 'Modos explícitos, privacidad y una base reproducible.', tasks: ids([1, 5], [7]) },
  { id: 'H1', title: 'Identidad y datos', description: 'Cuentas, permisos y persistencia real.', tasks: ids([6], [8, 11]) },
  { id: 'H2', title: 'Ingreso y archivos', description: 'Onboarding, estudios y fotos privadas.', tasks: ids([12, 17]) },
  { id: 'H3', title: 'Plan nutricional', description: 'Recetas, versiones y publicación al paciente.', tasks: ids([18, 21]) },
  { id: 'H4', title: 'Acompañamiento e IA', description: 'Comunicación humana y generación supervisada.', tasks: ids([22, 28]) },
  { id: 'H5', title: 'Piloto operable', description: 'PWA, operación y recorrido completo verificado.', tasks: ids([29, 33]) },
  { id: 'H6', title: 'Lanzamiento completo', description: 'Paridad Nutrigo y expansión posterior al piloto.', tasks: ids([34, 39]) },
];

export const titles = [
  'Consolidar la base de trabajo', 'Separar demo y producción', 'Proteger la información profesional',
  'Eliminar resultados simulados ante errores', 'Automatizar las verificaciones', 'Cerrar el contrato de datos',
  'Llevar Nutrigo a producción', 'Implementar migraciones y permisos', 'Invitar y dar acceso a pacientes',
  'Completar la persistencia en Supabase', 'Optimizar consultas y sesiones', 'Definir ingreso y consentimientos',
  'Construir el onboarding reanudable', 'Revisar el ingreso desde el CRM', 'Subir archivos de forma privada',
  'Incorporar estudios y fotos corporales', 'Registrar medidas e historial', 'Crear el catálogo de recetas',
  'Versionar y publicar planes', 'Mostrar el plan al paciente', 'Generar la lista de compras',
  'Persistir el diario de comidas', 'Conectar mensajes y lecturas', 'Adjuntar archivos al chat',
  'Resolver turnos y reprogramaciones', 'Enviar notificaciones reales', 'Generar menús y recetas con IA',
  'Evaluar la IA antes de publicar', 'Instalar la app en el celular', 'Preparar staging y operación',
  'Probar exportación y recuperación', 'Integrar cobros auditables', 'Validar la salida al piloto',
  'Mostrar la evolución del paciente', 'Asignar ejercicios y rutinas', 'Publicar recursos profesionales',
  'Completar la paridad de Nutrigo', 'Ampliar a equipos y organizaciones', 'Evaluar integraciones y expansión',
];

export const findingTasks = {
  'A-01': ids([2]), 'A-02': ids([5, 6], [8]), 'A-03': ids([3]), 'A-04': ids([8]),
  'A-05': ids([4]), 'A-06': ids([7]), 'A-07': ids([12, 14]), 'A-08': ids([15, 16], [22]),
  'A-09': ids([4], [10]), 'A-10': ids([11]), 'A-11': ids([18, 19], [25]), 'A-12': ids([29, 30]),
};

export const coverage = [
  { title: 'Nutrigo dentro del producto', description: 'Diseño en rutas autenticadas y verificación del build.', tasks: ids([7], [37]), icon: 'layout' },
  { title: 'Ingreso completo y reanudable', description: 'Datos, consentimiento, archivos y revisión en el CRM.', tasks: ids([12, 16]), icon: 'user' },
  { title: 'IA con revisión profesional', description: 'Menús y recetas reales; errores explícitos y aprobación humana.', tasks: ids([4], [27, 28]), icon: 'spark' },
  { title: 'Historia profesional protegida', description: 'Separación de notas privadas y contenido del paciente.', tasks: ids([3], [6], [8]), icon: 'shield' },
  { title: 'Persistencia en Supabase', description: 'Escrituras completas, archivos y datos entre dispositivos.', tasks: ids([8], [10], [15], [19], [22, 23]), icon: 'database' },
];

export const documents = [
  { id: 'plan', title: 'Plan de acción', path: 'docs/plan-de-accion-2026-09-16.md' },
  { id: 'architecture', title: 'Arquitectura y datos', path: 'docs/superpowers/specs/2026-09-16-plan-v-arquitectura-design.md' },
  { id: 'onboarding', title: 'Onboarding e IA', path: 'docs/superpowers/specs/2026-09-16-plan-v-onboarding-ia-design.md' },
  { id: 'foundations', title: 'Primer bloque ejecutable', path: 'docs/superpowers/plans/2026-09-16-plan-v-fundaciones.md' },
];

export const statuses = {
  pending: 'Pendiente', in_progress: 'En curso', review: 'En revisión', blocked: 'Bloqueada', done: 'Completada',
};
