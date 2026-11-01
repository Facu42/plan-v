export type HelpGuide = {
  topic: string;
  title: string;
  slug: string;
  summary: string;
  body: string[];
  steps: string[];
  href: string;
  error: string;
};

export const HELP_GUIDES: HelpGuide[] = [
  {
    topic: 'alta', slug: 'alta', title: 'Dar de alta tu consultorio',
    summary: 'Creá la cuenta, elegí que sos nutricionista y publicá tu página.',
    body: [
      'En la entrada de Nutridash elegí «Soy nutricionista». Completá nombre, mail y clave. Si te invitaron desde el panel, usá el mismo mail de la invitación.',
      'Cuando entra la cuenta se abre el consultorio. Completá tus datos en Ajustes (nombre, matrícula, logo) y en Página pública tu bio, zona y especialidades.',
      'La página /tu-slug no se ve hasta que la publiques. El link corto es el que copiás desde Página pública.',
    ],
    steps: ['Elegí «Soy nutricionista» y creá la cuenta.', 'Completá Ajustes y Página pública.', 'Publicá la página para tener el link /slug.'],
    href: '/crm/inicio',
    error: 'Si el alta se queda en «Cargando…», recargá. No hace falta un mail de Verónica: el soporte se configura por el mail del servicio.',
  },
  {
    topic: 'pacientes', slug: 'primer-paciente', title: 'Tu primera paciente',
    summary: 'Creá la ficha, invitá y esperá que confirme el mail.',
    body: [
      'En Pacientes creá una ficha con nombre y mail. La importación no invita sola: después tenés que preparar la invitación.',
      '«Mandar invitación» usa el mail de envío de Nutridash. «Desde mi mail» abre tu correo. «Copiar enlace» sirve para mandarlo por otro lado.',
      'La paciente confirma su correo y acepta con la misma dirección. Recién ahí ves la conversación y ella ve el plan.',
    ],
    steps: ['Creá la ficha o importá y revisá.', 'Prepará la invitación por correo o copiá el enlace.', 'Ella confirma el mail y acepta con la misma dirección.'],
    href: '/crm/pacientes',
    error: 'Si el correo no llega, revisá Spam. Una invitación vencida pide un enlace nuevo.',
  },
  {
    topic: 'pacientes', slug: 'pacientes', title: 'Pacientes e invitaciones',
    summary: 'Altas, importación y el estado de cada invitación.',
    body: [
      'Podés crear de a una o importar un archivo. La importación deja fichas para revisar: no manda invitaciones sola.',
      'Cada paciente queda en tu consultorio. No ves las de otra nutri.',
    ],
    steps: ['Creá una ficha o importá los datos y revisá la vista previa.', 'Prepará la invitación y elegí enviarla por correo o compartir su enlace. La importación no invita automáticamente.', 'La paciente debe confirmar su correo y aceptar la invitación con la misma dirección.'],
    href: '/crm/pacientes',
    error: 'Si el correo no llega, revisá Spam y el estado del envío. Una invitación vencida requiere preparar un enlace nuevo.',
  },
  {
    topic: 'plan', slug: 'plan', title: 'Plan y lista de compras',
    summary: 'El plan se edita, se revisa y recién después se publica.',
    body: [
      'En Planes o en la Ficha armás un borrador. La IA propone; vos revisás alergias y metas antes de publicar.',
      'La paciente ve solo la versión publicada. La lista de compras sale de ese plan, no del borrador.',
      'Si cambiás la meta, una propuesta anterior puede quedar vieja. Guardá y generá otra.',
    ],
    steps: ['Abrí la ficha y revisá ingreso, alergias y permisos.', 'Elegí la meta y editá un borrador del plan.', 'Revisá las propuestas antes de publicar. La lista de compras usa el plan publicado.'],
    href: '/crm/plan',
    error: 'Una meta modificada puede invalidar una propuesta anterior. Guardá tus cambios y generá otra propuesta.',
  },
  {
    topic: 'app', slug: 'app-paciente', title: 'La app de la paciente',
    summary: 'Entra por invitación. Ve el plan, carga comidas y te escribe en el chat.',
    body: [
      'No hay tienda aparte: es la misma web, instalable en el celular. Sin invitación no entra.',
      'Ahí ve el plan publicado, carga comidas con foto, peso, agua y mensajes. Si no cargó un día, falta el dato: no es un incumplimiento.',
      'Los avisos de turno y de cuota aparecen en su inicio. No hace falta WhatsApp para eso.',
    ],
    steps: ['Invitala desde Pacientes.', 'Ella confirma el mail y entra a su inicio.', 'Publicá el plan para que lo vea y cargue comidas.'],
    href: '/crm/pacientes',
    error: 'Si no ve el plan, confirmá que esté publicado y que la ficha esté vinculada.',
  },
  {
    topic: 'cobros', slug: 'cobros', title: 'Cobros y Cobranzas',
    summary: 'Anotás lo cobrado. Mercado Pago se conecta en tu página si está habilitado.',
    body: [
      'Cobranzas muestra lo por cobrar, lo vencido y los movimientos. Podés cargar un pago a mano (transferencia, efectivo, Mercado Pago).',
      'La seña al reservar y el débito de un plan de seguimiento piden que conectes Mercado Pago. Sin esa conexión no se cobra solo.',
      'Volver de la página de pago no confirma el cobro. El movimiento entra cuando el medio lo avisa o cuando lo anotás.',
    ],
    steps: ['Revisá importe, medio y a quién corresponde.', 'Conectá Mercado Pago si querés seña o débito.', 'Anotá el pago a mano si te transfirieron.'],
    href: '/crm/cobranzas',
    error: 'La vuelta de la página de pago no confirma el cobro. Esperá la confirmación o revisá la conciliación.',
  },
  {
    topic: 'privacidad', slug: 'privacidad', title: 'Permisos y privacidad',
    summary: 'Cada permiso lo da la paciente. Retirarlo corta el uso futuro.',
    body: [
      'Fotos, grabación de consulta y lectura de laboratorio con IA piden un permiso puntual. Sin ese permiso no se manda nada a un proveedor.',
      'Retirar un permiso bloquea el procesamiento futuro. Las fotos corporales no se analizan con IA.',
      'Exportar o pedir el retiro de la cuenta está en los controles de privacidad de la paciente.',
    ],
    steps: ['Cada permiso se otorga desde la cuenta de la paciente.', 'Retirar un permiso bloquea su procesamiento futuro. Las fotos corporales no se analizan con IA.', 'La exportación y el retiro de cuenta están en los controles de privacidad; las retenciones clínicas se informan allí.'],
    href: '/crm/pacientes',
    error: 'Si cambió un permiso durante un trabajo, revisalo y confirmá la opción elegida por la paciente antes de reintentar.',
  },
  {
    topic: 'mensajes', slug: 'mensajes', title: 'Mensajes y avisos',
    summary: 'El chat es el de la app. No hace falta un canal aparte.',
    body: [
      'Abrí Mensajes y elegí a la paciente vinculada. El aviso de una cuota vencida ya aparece en su inicio.',
    ],
    steps: ['Abrí Mensajes y elegí a la paciente.', 'Escribile por el chat de la app. El aviso de una cuota vencida ya aparece en su inicio.', 'No hace falta un canal aparte: ella lo ve al entrar a Nutridash.'],
    href: '/crm/mensajes',
    error: 'Si no ves la conversación, confirmá que la paciente tenga la ficha vinculada.',
  },
  {
    topic: 'consultas', slug: 'consultas', title: 'Notas y resumen de consulta',
    summary: 'Las notas manuales andan sin grabar. Grabar pide permiso.',
    body: [
      'En Ficha → Notas de consulta cargás a mano. Para grabar, la paciente tiene que haber dado el permiso y tenés que elegir micrófono y pestaña con audio.',
      'La transcripción y el resumen se revisan. Lo que ve la paciente se publica aparte.',
    ],
    steps: ['Abrí Ficha → Notas de consulta. Las notas manuales están disponibles sin grabación.', 'Para grabar, la paciente debe otorgar permisos específicos. Seleccioná micrófono y pestaña con audio.', 'Revisá la transcripción y el borrador. Publicá por separado la versión que verá la paciente.'],
    href: '/crm/pacientes',
    error: 'Si no se captura la otra voz, el registro queda incompleto. Podés cargar una grabación o transcripción y corregir las notas.',
  },
  {
    topic: 'datos', slug: 'importar', title: 'Importar una cartera',
    summary: 'CSV, planilla, Word, PDF o fotos. Confirmás solo lo revisado.',
    body: [
      'Importar pacientes acepta CSV, XLSX, DOCX, PDF o JPG/PNG. XLS y DOC piden conversión previa.',
      'Asociá cada registro y corregí fechas, unidades y duplicados. Un archivo dañado puede fallar sin frenar el resto.',
    ],
    steps: ['Usá Importar pacientes en el directorio. Elegí CSV, XLSX, DOCX, PDF o imágenes JPG/PNG.', 'Asociá cada registro y corregí fechas, unidades y duplicados. Los formatos XLS/DOC necesitan conversión.', 'Confirmá únicamente lo revisado. Ante fallos parciales, reanudá los registros pendientes.'],
    href: '/crm/pacientes',
    error: 'Un archivo dañado puede fallar sin impedir el resto del lote. Conservá el original y revisá el resultado individual.',
  },
  {
    topic: 'agenda', slug: 'resenas-google', title: 'Pedir una reseña en Google',
    summary: 'Cargá el link de tu ficha de Google y pedí la reseña por el chat.',
    body: [
      'En Página pública → Editar perfil pegá el link de tu ficha de Google. Sirve el de g.page o el de reseña que trae placeid.',
      '«Pedir reseña» arma el link y un texto corto, sin datos de la consulta. Si no elegís a nadie, copia el texto.',
      'Si elegís una paciente, se manda por el chat de la app. Si se dio de baja de avisos o apagó los mensajes de la app, no se manda. El mail y WhatsApp no salen por este botón.',
    ],
    steps: ['Pegá el link de Google en Editar perfil.', 'Elegí a la paciente o copiá el texto con Pedir reseña.', 'Si hay baja, el chat no lo envía.'],
    href: '/crm/agenda?agenda=publica',
    error: 'Si la paciente se dio de baja de avisos, el pedido no se manda. Podés copiar el link y no enviarlo.',
  },
  {
    topic: 'agenda', slug: 'agenda', title: 'Agenda y cobranzas',
    summary: 'Confirmar asistencia no es lo mismo que terminar la consulta.',
    body: [
      'La agenda usa tus horarios y tipos de consulta. Las reservas de la página pública quedan para confirmar.',
      'Google Calendar y Meet se conectan en Ajustes o en Página pública, si las claves están en el servidor.',
    ],
    steps: ['La confirmación de asistencia y la finalización de una consulta son estados distintos.', 'Revisá importe, método y destinatario de cada pago.', 'Los servicios externos requieren configurar la integración correspondiente antes de activarlos.'],
    href: '/crm/agenda',
    error: 'La vuelta de la página de pago no confirma el cobro. Esperá la confirmación verificada o revisá la conciliación.',
  },
  {
    topic: 'ia', slug: 'asistente', title: 'Asistente de cartera',
    summary: 'Consulta 7, 30 o 90 días. Las propuestas se revisan.',
    body: [
      'El asistente lee registros y pendientes de tu cartera. La falta de registros no es incumplimiento.',
      'Las propuestas de IA solo salen para pacientes con permiso. Si no hay cuota o configuración, seguís viendo indicadores.',
    ],
    steps: ['Elegí 7, 30 o 90 días y consultá registros o pendientes.', 'Abrí las fuentes de cada respuesta. La falta de registros no significa incumplimiento.', 'Las propuestas de IA se limitan a pacientes con permiso; revisalas antes de actuar.'],
    href: '/crm/desarrollo?modulo=asistente-ia',
    error: 'Si la IA está sin cuota o configuración, podés seguir consultando indicadores sin activar propuestas.',
  },
];

export const HELP_TOPICS: ReadonlyArray<readonly [string, string]> = [
  ['todas', 'Todas'],
  ['alta', 'Alta'],
  ['pacientes', 'Pacientes'],
  ['plan', 'Plan'],
  ['app', 'App de la paciente'],
  ['cobros', 'Cobros'],
  ['privacidad', 'Privacidad'],
  ['mensajes', 'Mensajes'],
  ['consultas', 'Consultas'],
  ['datos', 'Datos'],
  ['agenda', 'Agenda'],
  ['ia', 'Asistente'],
];

export const HELP_FAQ = [
  { q: 'No veo la conversación', a: 'Confirmá que la paciente tenga la ficha vinculada. Si no, la invitación sigue pendiente.', href: '/crm/mensajes' },
  { q: 'La invitación no llegó', a: 'Revisá Spam. Si venció, generá un enlace nuevo. No se reenvía sola.', href: '/crm/pacientes' },
  { q: 'Volví del pago y no figura', a: 'Volver de la página de pago no confirma el cobro. El pago entra cuando el medio lo avisa.', href: '/crm/cobranzas' },
  { q: '¿Sin registros es una falta?', a: 'No. Si no cargó, falta el dato. No queda marcada en incumplimiento.', href: '/crm/progreso-global' },
  { q: '¿Puedo corregir SARA 2?', a: 'No. SARA 2 se consulta. Para usar otro valor, creá un alimento propio.', href: '/crm/alimentos' },
  { q: '¿Dónde edito mi página /slug?', a: 'En Página pública → Editar perfil. Ahí están foto, bio, especialidades, modalidad, zona, precio y el link de reserva.', href: '/crm/agenda?agenda=publica' },
  { q: '¿Cómo pido una reseña de Google?', a: 'En Página pública cargá el link de tu ficha y tocá Pedir reseña. El texto va por el chat y no sale si la paciente se dio de baja.', href: '/crm/agenda?agenda=publica' },
];

export const HELP_START = ['alta', 'primer-paciente', 'plan', 'app-paciente', 'cobros', 'privacidad'] as const;

export function filterGuides(query: string, topic: string) {
  const q = query.trim().toLocaleLowerCase('es-AR');
  const rank = (slug: string) => {
    const i = (HELP_START as readonly string[]).indexOf(slug);
    return i === -1 ? HELP_START.length : i;
  };
  return HELP_GUIDES
    .filter(g => (topic === 'todas' || g.topic === topic) && `${g.title} ${g.summary} ${g.body.join(' ')} ${g.steps.join(' ')} ${g.error}`.toLocaleLowerCase('es-AR').includes(q))
    .sort((a, b) => rank(a.slug) - rank(b.slug));
}

export function guideBySlug(slug: string) {
  return HELP_GUIDES.find(g => g.slug === slug) ?? null;
}
