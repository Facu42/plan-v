/**
 * Artículos del Centro de ayuda del consultorio.
 *
 * Reglas del contenido:
 * - Sólo se explican funciones que existen en esta versión (ver «current» en professional-modules.ts).
 * - Lo que el plan marca como «en preparación» no se menciona acá; help-center.test.tsx lo comprueba.
 * - Los textos son breves y en español simple. Cada artículo lleva a la pantalla real.
 */
export type HelpCategoryId = 'primeros-pasos' | 'pacientes' | 'agenda' | 'seguimiento' | 'planes' | 'cobranzas' | 'biblioteca';

export type HelpCategory = { id: HelpCategoryId; title: string; description: string };

export type HelpArticle = {
  id: string;
  category: HelpCategoryId;
  /** Formulada como la pregunta que haría la profesional. */
  title: string;
  /** Una línea de respuesta: es lo que se ve en los resultados de búsqueda. */
  summary: string;
  steps: string[];
  tip?: string;
  keywords: string[];
  related: string[];
  goTo: { label: string; href: string };
};

export const HELP_CATEGORIES: HelpCategory[] = [
  { id: 'primeros-pasos', title: 'Primeros pasos y panel', description: 'Cómo arrancar y qué ver en el inicio, el buscador y los avisos.' },
  { id: 'pacientes', title: 'Pacientes y ficha', description: 'Altas, invitaciones, archivo y todo lo que guarda la ficha.' },
  { id: 'agenda', title: 'Agenda y turnos', description: 'Turnos, reprogramaciones, cancelaciones y videollamadas.' },
  { id: 'seguimiento', title: 'Seguimiento y mensajes', description: 'Revisar lo que cargan tus pacientes y conversar con ellos.' },
  { id: 'planes', title: 'Planes y alimentos', description: 'Plan semanal, alimentos propios y modelos reutilizables.' },
  { id: 'cobranzas', title: 'Cobranzas', description: 'Cuotas, vencimientos y pagos informados por tus pacientes.' },
  { id: 'biblioteca', title: 'Biblioteca y recetas', description: 'Recursos para asignar y recetas del consultorio.' },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'primeros-pasos-consultorio',
    category: 'primeros-pasos',
    title: '¿Cómo empiezo a usar mi consultorio?',
    summary: 'Creá tu primer paciente, compartile la invitación y armá su plan: son tres pasos en orden.',
    steps: [
      'Abrí «Primeros pasos» desde el menú de tu cuenta, arriba a la derecha.',
      'Elegí «Crear mi primer paciente» y completá su nombre, su email y su objetivo.',
      'Cuando el paciente esté creado, abrí «Compartir invitación» y copiá el enlace o enviáselo por WhatsApp.',
      'Con la paciente ya vinculada, entrá a «Armar su plan» para preparar el plan semanal.',
    ],
    tip: 'La IA propone, pero siempre revisás y confirmás vos antes de que algo llegue a tu paciente.',
    keywords: ['empezar', 'inicio', 'primer', 'comenzar', 'tutorial'],
    related: ['paciente-nuevo-invitar', 'plan-semanal-publicar'],
    goTo: { label: 'Ir a pacientes', href: '/crm/pacientes' },
  },
  {
    id: 'inicio-pendientes',
    category: 'primeros-pasos',
    title: '¿Qué veo en Inicio y cómo atiendo los pendientes?',
    summary: 'Inicio junta lo que espera tu revisión: ingresos, comidas, registros, propuestas de IA, mensajes, pagos y consultas.',
    steps: [
      'Entrá a «Inicio» desde el menú de la izquierda.',
      'Filtrá por paciente o por tipo de pendiente para ver sólo lo que te interesa.',
      'Tocá «Abrir tarea» en un pendiente: te lleva directo a la pantalla donde se resuelve.',
      'Cuando haya más pendientes de los que entran, usá «Siguientes pendientes» para seguir.',
    ],
    tip: 'Un pendiente desaparece cuando lo resolvés en su pantalla; no hace falta marcarlo desde Inicio.',
    keywords: ['pendientes', 'bandeja', 'tareas', 'revisar', 'panel'],
    related: ['seguimiento-revisar-registros', 'avisos-campana'],
    goTo: { label: 'Ir a Inicio', href: '/crm/inicio' },
  },
  {
    id: 'buscador-global',
    category: 'primeros-pasos',
    title: '¿Cómo busco pacientes, recetas y alimentos desde la barra superior?',
    summary: 'Escribí al menos dos letras en el buscador de arriba: los resultados salen agrupados por pacientes, recetas, alimentos y ayuda.',
    steps: [
      'Hacé clic en el buscador de la barra superior y escribí dos letras o más.',
      'Esperá un instante: los resultados aparecen agrupados bajo cada título.',
      'Tocá un paciente para abrir su ficha, o una receta o un alimento para ir a su catálogo.',
      'Con Escape cerrás la lista sin elegir nada.',
    ],
    tip: 'Sólo aparecen los pacientes de tu consultorio y los alimentos y recetas que ves en tus catálogos.',
    keywords: ['buscar', 'buscador', 'barra', 'encontrar', 'global'],
    related: ['paciente-buscar-archivar'],
    goTo: { label: 'Ir a pacientes', href: '/crm/pacientes' },
  },
  {
    id: 'avisos-campana',
    category: 'primeros-pasos',
    title: '¿Cómo funcionan los avisos de la campana?',
    summary: 'La campana reúne las consultas próximas, los registros de tus pacientes y los mensajes sin leer.',
    steps: [
      'Tocá la campana de la barra superior para abrir el panel de avisos.',
      'En «Mensajes» ves quiénes te escribieron; «Ver todos los mensajes» abre la bandeja completa.',
      'Con «Ver agenda» o «Gestionar» pasás directo a la consulta, y «Listo» retira el aviso de la lista.',
      'Si querés avisos en este dispositivo, activá la casilla correspondiente: el navegador te va a pedir permiso.',
    ],
    tip: 'Un mensaje deja de figurar como sin leer recién cuando abrís la conversación.',
    keywords: ['campana', 'avisos', 'notificaciones', 'mensajes', 'recordatorios'],
    related: ['mensajes-responder-adjuntar', 'turno-editar-cancelar'],
    goTo: { label: 'Ir a Mensajes', href: '/crm/mensajes' },
  },
  {
    id: 'paciente-nuevo-invitar',
    category: 'pacientes',
    title: '¿Cómo registro un paciente nuevo y lo invito a la app?',
    summary: 'Desde Pacientes creás la ficha con «Nuevo paciente» y generás una invitación de un solo uso.',
    steps: [
      'Entrá a «Pacientes» y tocá «Nuevo paciente».',
      'Completá nombre completo, objetivo declarado y el email para la invitación.',
      'Guardá: la ficha queda en tu directorio, pendiente de vincular hasta que acepte la invitación.',
      'Tocá «Invitar» en su fila y compartí el enlace. La invitación es de un solo uso y vence.',
    ],
    tip: 'Cuando el paciente acepta, su estado de acceso a la app se actualiza solo.',
    keywords: ['alta', 'crear', 'invitar', 'invitacion', 'vincular', 'email', 'whatsapp'],
    related: ['paciente-buscar-archivar', 'ficha-que-guarda'],
    goTo: { label: 'Ir a pacientes', href: '/crm/pacientes' },
  },
  {
    id: 'paciente-buscar-archivar',
    category: 'pacientes',
    title: '¿Cómo busco, archivo o restauro un paciente?',
    summary: 'El directorio de Pacientes tiene buscador y una vista «Archivados» para consultar o restaurar fichas.',
    steps: [
      'Entrá a «Pacientes» y escribí el nombre en «Buscar pacientes».',
      'Cuando ya no lo acompañás, tocá «Archivar» en su fila y confirmá con «Confirmar archivo».',
      'Para volver a verlo, entrá a «Archivados» y tocá «Restaurar».',
    ],
    tip: 'Un paciente archivado deja de aparecer en pendientes y en los resultados del buscador.',
    keywords: ['archivar', 'archivados', 'restaurar', 'directorio', 'buscar', 'baja'],
    related: ['paciente-nuevo-invitar', 'buscador-global'],
    goTo: { label: 'Ir a pacientes', href: '/crm/pacientes' },
  },
  {
    id: 'ficha-que-guarda',
    category: 'pacientes',
    title: '¿Qué encuentro en la ficha de un paciente?',
    summary: 'La ficha reúne ingreso y antecedentes, objetivos, historial y los accesos al plan, las consultas, los mensajes y las cobranzas.',
    steps: [
      'Abrí «Pacientes» y entrá a la ficha del paciente que necesitás.',
      'Revisá el ingreso y los antecedentes que completó, y sus objetivos.',
      'Mirá el historial y las mediciones que registró, con su evolución en el tiempo.',
      'Usá los accesos de arriba para saltar al plan, las consultas, los mensajes o las cobranzas de esa persona.',
    ],
    keywords: ['ficha', 'ingreso', 'antecedentes', 'historial', 'objetivos', 'mediciones', 'peso'],
    related: ['paciente-nuevo-invitar', 'plan-semanal-publicar'],
    goTo: { label: 'Ir a pacientes', href: '/crm/pacientes' },
  },
  {
    id: 'turno-editar-cancelar',
    category: 'agenda',
    title: '¿Cómo edito, reagendo o cancelo un turno?',
    summary: 'Abrí el turno desde la Agenda con «Gestionar consulta» y elegí «Reagendar» o «Cancelar turno».',
    steps: [
      'Entrá a «Agenda» y elegí el día del turno en el calendario.',
      'Tocá «Gestionar consulta» en el turno para abrir su detalle.',
      'Para moverlo, elegí «Reagendar» y cambiá el día, la hora, la modalidad o la duración.',
      'Para anularlo, tocá «Cancelar turno» y confirmá con «Sí, cancelar». Con «No, volver» lo dejás como estaba.',
    ],
    tip: 'Si tu paciente pidió un cambio, el pendiente «Consulta para reprogramar» aparece en Inicio.',
    keywords: ['turno', 'cita', 'consulta', 'reprogramar', 'reagendar', 'cancelar', 'editar', 'calendario'],
    related: ['videollamada-enlace', 'avisos-campana'],
    goTo: { label: 'Ir a la agenda', href: '/crm/agenda' },
  },
  {
    id: 'videollamada-enlace',
    category: 'agenda',
    title: '¿Cómo agendo una consulta por videollamada?',
    summary: 'Al agendar elegí la modalidad videollamada y, si querés, pegá tu enlace HTTPS de la sala.',
    steps: [
      'Desde la ficha del paciente, entrá a «Consultas» y elegí «Próxima consulta».',
      'Indicá día, hora y duración, y elegí la modalidad «Videollamada».',
      'Si tenés una sala propia, pegá su enlace HTTPS en «Enlace HTTPS (opcional)».',
      'Guardá. A la hora de la consulta vas a ver «Abrir videollamada» en la agenda.',
    ],
    keywords: ['videollamada', 'meet', 'enlace', 'sala', 'modalidad', 'online'],
    related: ['turno-editar-cancelar'],
    goTo: { label: 'Ir a la agenda', href: '/crm/agenda' },
  },
  {
    id: 'seguimiento-revisar-registros',
    category: 'seguimiento',
    title: '¿Cómo reviso las comidas y los registros que cargan mis pacientes?',
    summary: 'Seguimiento reúne las comidas y los registros que esperan tu revisión, con el registro semanal de cada paciente.',
    steps: [
      'Entrá a «Seguimiento» desde el menú.',
      'Elegí «Revisar comidas» o abrí un registro pendiente para ver su detalle.',
      'Revisalo y guardá tu revisión: el pendiente se retira de Inicio y de la campana.',
      'En la ficha del paciente mirás su registro semanal: días, comidas y agua por separado.',
    ],
    tip: 'Un día sin registros no significa que el paciente no haya cumplido: sólo que no cargó nada.',
    keywords: ['seguimiento', 'comidas', 'registros', 'revisar', 'adherencia', 'semanal', 'agua'],
    related: ['inicio-pendientes', 'mensajes-responder-adjuntar'],
    goTo: { label: 'Ir a Seguimiento', href: '/crm/seguimiento' },
  },
  {
    id: 'mensajes-responder-adjuntar',
    category: 'seguimiento',
    title: '¿Cómo respondo un mensaje y envío un archivo adjunto?',
    summary: 'En Mensajes elegís la conversación, escribís tu respuesta y podés adjuntar una imagen o un PDF de hasta 10 MB.',
    steps: [
      'Entrá a «Mensajes» y buscá la conversación con «Buscar conversaciones», o tocá «Nuevo mensaje».',
      'Activá «Mostrar solo conversaciones sin leer» si querés ver únicamente lo que te falta responder.',
      'Escribí tu respuesta en «Escribí un mensaje…» y enviala.',
      'Para mandar un archivo, usá «Adjuntar archivo»: acepta JPG, PNG, WebP o PDF de hasta 10 MB.',
    ],
    tip: 'Los adjuntos son privados: sólo los ve tu paciente y vos.',
    keywords: ['mensajes', 'chat', 'adjuntar', 'archivo', 'pdf', 'imagen', 'conversacion', 'responder'],
    related: ['avisos-campana', 'seguimiento-revisar-registros'],
    goTo: { label: 'Ir a Mensajes', href: '/crm/mensajes' },
  },
  {
    id: 'plan-semanal-publicar',
    category: 'planes',
    title: '¿Cómo armo y publico el plan semanal de un paciente?',
    summary: 'En Planes elegís al paciente, armás la semana en el editor, revisás las propuestas de IA y publicás una versión.',
    steps: [
      'Entrá a «Planes» y elegí al paciente (o abrí «Plan» desde su ficha).',
      'Armá la semana en el editor: podés copiar un día a otro y editar los componentes de cada comida.',
      'Si hay propuestas de IA, revisalas y aprobá sólo lo que te sirve: nada llega al paciente sin tu confirmación.',
      'Revisá el promedio nutricional, las recomendaciones y los alimentos a evitar, y publicá.',
    ],
    tip: 'Cada publicación guarda una versión nueva; la anterior se conserva y podés imprimir el plan.',
    keywords: ['plan', 'semanal', 'publicar', 'versiones', 'editor', 'imprimir', 'ia', 'propuesta'],
    related: ['modelo-reutilizar', 'alimento-propio'],
    goTo: { label: 'Ir a Planes', href: '/crm/plan' },
  },
  {
    id: 'alimento-propio',
    category: 'planes',
    title: '¿Cómo cargo un alimento propio en el catálogo?',
    summary: 'En Alimentos tocá «Agregar alimento» y completá su nombre, la fuente de los valores y los nutrientes por 100 g.',
    steps: [
      'Entrá a «Alimentos» y tocá «Agregar alimento».',
      'Completá el nombre, la categoría y, en «Fuente declarada», de dónde salen los valores.',
      'Cargá los nutrientes por 100 g. Los micronutrientes son opcionales y pueden quedar sin dato.',
      'Sumá las medidas caseras (por ejemplo «Cucharada» con sus gramos) y guardá.',
    ],
    tip: 'Lo que cargues aparece en «Mis alimentos»; los de la plataforma están marcados como «De la plataforma».',
    keywords: ['alimentos', 'catalogo', 'nutrientes', 'fuente', 'medidas', 'porcion', 'kcal'],
    related: ['plan-semanal-publicar', 'receta-asignar'],
    goTo: { label: 'Ir a Alimentos', href: '/crm/alimentos' },
  },
  {
    id: 'modelo-reutilizar',
    category: 'planes',
    title: '¿Cómo reutilizo una base de plan con Modelos?',
    summary: 'Los modelos guardan planes, recomendaciones y alimentos a evitar para aplicarlos a un nuevo borrador.',
    steps: [
      'Entrá a «Modelos» y elegí si trabajás con planes, recomendaciones o alimentos a evitar.',
      'Creá un modelo desde un paciente de origen o armalo de cero, y revisá las indicaciones antes de publicarlo.',
      'Al preparar el plan de otra persona, aplicá el modelo: se copia a su borrador.',
    ],
    tip: 'Aplicar un modelo no pisa la versión anterior del plan: la conserva.',
    keywords: ['modelos', 'plantilla', 'reutilizar', 'recomendaciones', 'evitar'],
    related: ['plan-semanal-publicar'],
    goTo: { label: 'Ir a Modelos', href: '/crm/modelos' },
  },
  {
    id: 'cobranza-registrar-pago',
    category: 'cobranzas',
    title: '¿Cómo registro un pago o confirmo el aviso de un paciente?',
    summary: 'En Cobranzas registrás pagos a mano y confirmás o rechazás los avisos que informan tus pacientes.',
    steps: [
      'Entrá a «Cobranzas» y filtrá a los pacientes por estado.',
      'Si alguien avisó que pagó, revisá «Avisos por confirmar» y confirmá el pago o tocá «Rechazar».',
      'Para cargar un pago vos, abrí al paciente y tocá «Registrar pago» con el monto y la fecha.',
      'Revisá el «Historial de pagos» y el total adeudado de cada persona.',
    ],
    tip: 'Podés mandar un recordatorio por WhatsApp desde la misma pantalla.',
    keywords: ['cobranzas', 'pagos', 'cuota', 'vencimiento', 'deuda', 'aviso', 'cobrar'],
    related: ['ficha-que-guarda'],
    goTo: { label: 'Ir a Cobranzas', href: '/crm/cobranzas' },
  },
  {
    id: 'receta-asignar',
    category: 'biblioteca',
    title: '¿Cómo creo una receta y la asigno a un paciente?',
    summary: 'En Biblioteca > Recetas armás la receta con sus ingredientes y porciones, y la asignás a un plan.',
    steps: [
      'Entrá a «Biblioteca» y abrí la pestaña de recetas.',
      'Creá una receta con sus ingredientes, porciones y pasos, y guardá el borrador.',
      'Publicá la versión cuando esté revisada.',
      'Asignala al plan del paciente: Plan V controla sus alergias y restricciones antes de confirmarla.',
    ],
    keywords: ['recetas', 'ingredientes', 'porciones', 'asignar', 'alergias', 'publicar'],
    related: ['alimento-propio', 'recurso-asignar'],
    goTo: { label: 'Ir a recetas', href: '/crm/biblioteca?biblioteca=recetas' },
  },
  {
    id: 'recurso-asignar',
    category: 'biblioteca',
    title: '¿Cómo asigno un recurso a mis pacientes?',
    summary: 'Los recursos de la Biblioteca se asignan a uno o varios pacientes y quedan marcados cuando los leen.',
    steps: [
      'Entrá a «Biblioteca» y abrí la sección de recursos.',
      'Elegí el recurso, tocá «Asignar recursos a pacientes» y seleccioná a quiénes lo van a recibir.',
      'Confirmá. Cada paciente lo ve en su sección «Recursos».',
      'Volvé a tu biblioteca para ver cuáles ya fueron leídos y cuáles marcaste como favoritos.',
    ],
    keywords: ['recursos', 'biblioteca', 'asignar', 'leidos', 'favoritos', 'material'],
    related: ['receta-asignar'],
    goTo: { label: 'Ir a recursos', href: '/crm/biblioteca?biblioteca=recursos' },
  },
];

export const helpCategoryOf = (id: HelpCategoryId) => HELP_CATEGORIES.find(category => category.id === id)!;
export const helpArticleOf = (id: string | null | undefined) => HELP_ARTICLES.find(article => article.id === id);
