/* ============================================================
   Nutridash — datos demo, estado y mutaciones
   ============================================================ */
(function () {
  const ND = (window.ND = window.ND || {});
  const KEY = 'nutridash.v1';

  const NOW = new Date();
  const at = (daysAgo, h, m) => {
    const d = new Date(NOW);
    d.setDate(d.getDate() - daysAgo);
    d.setHours(h == null ? 10 : h, m || 0, 0, 0);
    return d.toISOString();
  };
  const atFuture = (days, h, m) => at(-days, h, m);
  const minsAgo = (mins) => new Date(Date.now() - mins * 60000).toISOString();

  const monday = () => {
    const d = new Date(NOW);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const weekAt = (offset, h, m) => {
    const d = monday();
    d.setDate(d.getDate() + offset);
    d.setHours(h, m || 0, 0, 0);
    return d.toISOString();
  };

  function seed() {
    const leads = [
      {
        id: 'L1', name: 'Camila Ferreyra', handle: '@cami.ferr', source: 'instagram', stage: 'nuevo',
        value: 42000, score: 82, createdAt: at(0, 9, 12), lastContact: at(0, 9, 12), owner: 'Verónica',
        headline: 'Quiere bajar 8 kg antes del verano', tags: ['Pérdida de peso', 'Primera consulta'],
        phone: '+54 9 11 5521 8834', email: 'cami.ferreyra@gmail.com',
        timeline: [
          { type: 'message', text: 'Escribió por Instagram: “Hola Vero, vi tu reel de desayunos y quiero arrancar.”', at: at(0, 9, 12) },
          { type: 'system', text: 'Contacto creado automáticamente desde Instagram.', at: at(0, 9, 12) }
        ],
        tasks: [{ id: 'T1', text: 'Responder y enviar link de agenda', done: false }]
      },
      {
        id: 'L2', name: 'Lucía Benítez', handle: '@lu.benitez', source: 'instagram', stage: 'nuevo',
        value: 36000, score: 71, createdAt: at(0, 7, 40), lastContact: at(0, 7, 40), owner: 'Verónica',
        headline: 'Consulta por plan vegano', tags: ['Vegano', 'Info de planes'],
        phone: '+54 9 11 6633 1290', email: 'lucia.benitez@outlook.com',
        timeline: [{ type: 'message', text: 'Preguntó si el plan puede ser 100 % basado en plantas.', at: at(0, 7, 40) }],
        tasks: []
      },
      {
        id: 'L3', name: 'Martina Ruiz', handle: 'martina.ruiz@gmail.com', source: 'email', stage: 'nuevo',
        value: 48000, score: 64, createdAt: at(1, 18, 5), lastContact: at(1, 18, 5), owner: 'Verónica',
        headline: 'Formulario web: reeducación alimentaria', tags: ['Reeducación'],
        phone: '+54 9 11 4477 2231', email: 'martina.ruiz@gmail.com',
        timeline: [{ type: 'email', text: 'Completó el formulario de la web. Motivo: reeducación y energía.', at: at(1, 18, 5) }],
        tasks: [{ id: 'T3', text: 'Enviar propuesta de primera consulta', done: false }]
      },
      {
        id: 'L4', name: 'Sofía Aguirre', handle: '@sofi.aguirre', source: 'instagram', stage: 'contactado',
        value: 42000, score: 76, createdAt: at(2, 11, 20), lastContact: at(1, 12, 10), owner: 'Verónica',
        headline: 'Le interesa el plan trimestral', tags: ['Pérdida de peso'],
        phone: '+54 9 11 3388 7712', email: 'sofia.aguirre@gmail.com',
        timeline: [
          { type: 'message', text: 'Consultó precios por Instagram.', at: at(2, 11, 20) },
          { type: 'message', text: 'Le envié los planes y la agenda.', at: at(1, 12, 10) }
        ],
        tasks: [{ id: 'T4', text: 'Retomar si no responde hoy', done: false }]
      },
      {
        id: 'L5', name: 'Valentina Ponce', handle: '@vale.ponce', source: 'instagram', stage: 'conversando',
        value: 54000, score: 88, createdAt: at(4, 16, 0), lastContact: at(0, 8, 15), owner: 'Verónica',
        headline: 'Pidió turnos por la tarde', tags: ['Alta prioridad', 'Pérdida de peso'],
        phone: '+54 9 11 2299 0044', email: 'vale.ponce@gmail.com',
        timeline: [
          { type: 'message', text: 'Contó que trabaja hasta las 18 y necesita turnos vespertinos.', at: at(4, 16, 0) },
          { type: 'note', text: 'Tiene obra social OSDE. Prefiere modalidad online.', at: at(2, 10, 0) },
          { type: 'message', text: 'Le ofrecí martes 19:00. Quedó en confirmar.', at: at(0, 8, 15) }
        ],
        tasks: [{ id: 'T5', text: 'Confirmar turno martes 19:00', done: false }]
      },
      {
        id: 'L6', name: 'Rocío Medina', handle: 'rocio.medina@hotmail.com', source: 'email', stage: 'conversando',
        value: 36000, score: 69, createdAt: at(5, 9, 30), lastContact: at(1, 15, 40), owner: 'Verónica',
        headline: 'Consulta por intolerancias', tags: ['Intolerancias', 'Digestivo'],
        phone: '+54 9 11 5544 8890', email: 'rocio.medina@hotmail.com',
        timeline: [
          { type: 'email', text: 'Consultó por plan para colon irritable.', at: at(5, 9, 30) },
          { type: 'note', text: 'Le pedí estudios previos antes de la primera consulta.', at: at(1, 15, 40) }
        ],
        tasks: [{ id: 'T6', text: 'Revisar estudios recibidos', done: false }]
      },
      {
        id: 'L7', name: 'Agustina Ledesma', handle: '@agus.ledesma', source: 'instagram', stage: 'consulta',
        value: 48000, score: 91, createdAt: at(7, 13, 0), lastContact: at(0, 10, 5), owner: 'Verónica',
        headline: 'Primera consulta agendada', tags: ['Pérdida de peso', 'Online'],
        phone: '+54 9 11 7766 3321', email: 'agus.ledesma@gmail.com',
        timeline: [
          { type: 'message', text: 'Vino desde el reel de “3 meriendas sin culpa”.', at: at(7, 13, 0) },
          { type: 'stage', text: 'Consulta agendada para el miércoles 09:30.', at: at(0, 10, 5) }
        ],
        tasks: [{ id: 'T7', text: 'Enviar recordatorio 24 h antes', done: true }]
      },
      {
        id: 'L8', name: 'Florencia Cabrera', handle: '@flor.cabrera', source: 'referral', stage: 'consulta',
        value: 54000, score: 85, createdAt: at(9, 17, 30), lastContact: at(2, 11, 0), owner: 'Verónica',
        headline: 'Llegó por recomendación de Paula', tags: ['Referida', 'Online'],
        phone: '+54 9 11 8899 1122', email: 'flor.cabrera@gmail.com',
        timeline: [
          { type: 'system', text: 'Contacto referido por Paula Giménez.', at: at(9, 17, 30) },
          { type: 'stage', text: 'Consulta online agendada para el jueves 10:00.', at: at(2, 11, 0) }
        ],
        tasks: []
      },
      {
        id: 'L9', name: 'Julieta Sosa', handle: '@juli.sosa', source: 'instagram', stage: 'propuesta',
        value: 96000, score: 79, createdAt: at(12, 10, 20), lastContact: at(1, 9, 0), owner: 'Verónica',
        headline: 'Plan trimestral enviado, esperando respuesta', tags: ['Plan trimestral', 'Seguimiento'],
        phone: '+54 9 11 6655 4433', email: 'juli.sosa@gmail.com',
        timeline: [
          { type: 'message', text: 'Interesada en el acompañamiento de 3 meses.', at: at(12, 10, 20) },
          { type: 'note', text: 'Presupuesto: plan trimestral $96.000. Enviado por email.', at: at(1, 9, 0) }
        ],
        tasks: [{ id: 'T9', text: 'Hacer seguimiento de la propuesta', done: false }]
      },
      {
        id: 'L10', name: 'Milagros Vera', handle: 'mili.vera@gmail.com', source: 'email', stage: 'propuesta',
        value: 42000, score: 83, createdAt: at(14, 8, 45), lastContact: at(3, 16, 20), owner: 'Verónica',
        headline: 'Propuesta mensual enviada', tags: ['Plan mensual'],
        phone: '+54 9 11 3344 5566', email: 'mili.vera@gmail.com',
        timeline: [
          { type: 'email', text: 'Pidió detalle de qué incluye el plan mensual.', at: at(14, 8, 45) },
          { type: 'note', text: 'Le envié propuesta con seguimiento semanal.', at: at(3, 16, 20) }
        ],
        tasks: []
      },
      {
        id: 'L11', name: 'Paula Giménez', handle: '@pau.gimenez', source: 'instagram', stage: 'ganada',
        value: 54000, score: 95, createdAt: at(22, 12, 0), lastContact: at(1, 10, 0), owner: 'Verónica',
        headline: 'Clienta desde este mes', tags: ['Plan trimestral', 'Referidora'],
        phone: '+54 9 11 2233 4455', email: 'paula.gimenez@gmail.com',
        timeline: [
          { type: 'stage', text: 'Se convirtió en clienta. Plan trimestral.', at: at(18, 10, 0) },
          { type: 'note', text: 'Ya refirió a Florencia Cabrera.', at: at(6, 12, 0) }
        ],
        tasks: []
      },
      {
        id: 'L12', name: 'Belén Ortiz', handle: '@bele.ortiz', source: 'instagram', stage: 'ganada',
        value: 42000, score: 90, createdAt: at(26, 15, 20), lastContact: at(2, 9, 30), owner: 'Verónica',
        headline: 'Clienta — plan mensual', tags: ['Plan mensual'],
        phone: '+54 9 11 9988 7766', email: 'belen.ortiz@gmail.com',
        timeline: [{ type: 'stage', text: 'Se convirtió en clienta. Plan mensual.', at: at(20, 11, 0) }],
        tasks: []
      },
      {
        id: 'L13', name: 'Clara Domínguez', handle: '@clara.dmz', source: 'whatsapp', stage: 'pausa',
        value: 36000, score: 58, createdAt: at(19, 11, 0), lastContact: at(11, 14, 0), owner: 'Verónica',
        headline: 'Pidió retomar más adelante', tags: ['En pausa'],
        phone: '+54 9 11 5566 7788', email: '',
        timeline: [{ type: 'note', text: 'Por temas económicos prefiere retomar en 2 meses.', at: at(11, 14, 0) }],
        tasks: []
      },
      {
        id: 'L14', name: 'Renata Alonso', handle: 'renata.alonso@gmail.com', source: 'web', stage: 'pausa',
        value: 36000, score: 52, createdAt: at(24, 9, 0), lastContact: at(16, 10, 0), owner: 'Verónica',
        headline: 'No respondió después del presupuesto', tags: ['Sin respuesta'],
        phone: '', email: 'renata.alonso@gmail.com',
        timeline: [{ type: 'system', text: 'Sin respuesta después de 3 intentos.', at: at(16, 10, 0) }],
        tasks: []
      }
    ];

    const conversations = [
      {
        id: 'C1', channel: 'instagram', leadId: 'L1', name: 'Camila Ferreyra', handle: '@cami.ferr', unread: 2,
        updatedAt: at(0, 9, 12), lastMessage: 'Hola Vero, vi tu reel de desayunos y quiero arrancar 🥰',
        messages: [
          { from: 'them', text: 'Hola Vero, vi tu reel de desayunos y quiero arrancar 🥰', at: at(0, 9, 12) },
          { from: 'them', text: '¿Cómo es la modalidad? ¿Atendés online?', at: at(0, 9, 13) }
        ]
      },
      {
        id: 'C2', channel: 'instagram', leadId: 'L2', name: 'Lucía Benítez', handle: '@lu.benitez', unread: 0,
        updatedAt: at(0, 7, 40), lastMessage: '¿El plan puede ser 100% vegano?',
        messages: [
          { from: 'them', text: 'Hola! ¿El plan puede ser 100% vegano?', at: at(0, 7, 40) },
          { from: 'me', text: '¡Hola Lucía! Sí, armamos planes basados en plantas. ¿Querés que te cuente cómo empezamos?', at: at(0, 7, 52) },
          { from: 'them', text: 'Sí, me interesa. ¿Qué precio tiene?', at: at(0, 7, 58) }
        ]
      },
      {
        id: 'C3', channel: 'instagram', leadId: 'L5', name: 'Valentina Ponce', handle: '@vale.ponce', unread: 1,
        updatedAt: at(0, 8, 15), lastMessage: 'El martes 19 me viene bien, lo confirmo hoy',
        messages: [
          { from: 'them', text: 'Hola! Vi que atendés online. Trabajo hasta las 18, ¿tenés turnos más tarde?', at: at(1, 14, 0) },
          { from: 'me', text: '¡Hola Vale! Sí, tengo martes 19:00 y jueves 19:30 disponibles.', at: at(1, 14, 20) },
          { from: 'them', text: 'El martes 19 me viene bien, lo confirmo hoy 🙌', at: at(0, 8, 15) }
        ]
      },
      {
        id: 'C4', channel: 'email', leadId: 'L3', name: 'Martina Ruiz', handle: 'martina.ruiz@gmail.com', unread: 1,
        updatedAt: at(1, 18, 5), lastMessage: 'Formulario de contacto — Reeducación alimentaria',
        messages: [
          { from: 'them', text: 'Hola, completé el formulario de la web. Mi motivo principal es reeducación alimentaria y sentirme con más energía. Trabajo 9 horas sentada.', at: at(1, 18, 5) },
          { from: 'them', text: '¿Cómo seguimos?', at: at(1, 18, 6) }
        ],
        subject: 'Formulario de contacto — Reeducación alimentaria'
      },
      {
        id: 'C5', channel: 'instagram', leadId: 'L4', name: 'Sofía Aguirre', handle: '@sofi.aguirre', unread: 0,
        updatedAt: at(1, 12, 10), lastMessage: 'Vos: Te paso los planes y la agenda 📋',
        messages: [
          { from: 'them', text: 'Hola! ¿Me pasás precios de los planes?', at: at(2, 11, 20) },
          { from: 'me', text: '¡Hola Sofi! Te paso los planes y la agenda 📋', at: at(1, 12, 10) },
          { from: 'me', text: 'Mensual $42.000 · Trimestral $96.000 (incluye seguimiento semanal).', at: at(1, 12, 11) }
        ]
      },
      {
        id: 'C6', channel: 'whatsapp', leadId: 'L13', name: 'Clara Domínguez', handle: '+54 9 11 5566 7788', unread: 0,
        updatedAt: at(11, 14, 0), lastMessage: 'Dale, te escribo en un par de meses',
        messages: [
          { from: 'them', text: 'Hola Vero, por ahora no puedo seguir. Te escribo en un par de meses.', at: at(11, 13, 50) },
          { from: 'me', text: 'Sin problema Clara, quedo atenta. ¡Gracias por avisarme!', at: at(11, 14, 0) }
        ]
      },
      {
        id: 'C7', channel: 'email', leadId: 'L10', name: 'Milagros Vera', handle: 'mili.vera@gmail.com', unread: 0,
        updatedAt: at(3, 16, 20), lastMessage: 'Vos: Te envío la propuesta del plan mensual',
        messages: [
          { from: 'them', text: 'Hola, ¿me podés contar qué incluye el plan mensual?', at: at(14, 8, 45) },
          { from: 'me', text: 'Hola Mili! Incluye plan personalizado, seguimiento semanal y ajustes. Te envío la propuesta.', at: at(3, 16, 20) }
        ],
        subject: 'Propuesta plan mensual'
      },
      {
        id: 'C8', channel: 'instagram', leadId: 'L9', name: 'Julieta Sosa', handle: '@juli.sosa', unread: 0,
        updatedAt: at(1, 9, 0), lastMessage: 'Vos: Te dejo la propuesta del trimestral ✨',
        messages: [
          { from: 'them', text: 'Me interesa el acompañamiento de 3 meses 🙌', at: at(12, 10, 20) },
          { from: 'me', text: 'Te dejo la propuesta del trimestral ✨', at: at(1, 9, 0) },
          { from: 'me', text: 'Queda reservado el precio hasta el viernes.', at: at(1, 9, 1) }
        ]
      }
    ];

    const clients = [
      { id: 'K1', name: 'Paula Giménez', email: 'paula.gimenez@gmail.com', phone: '+54 9 11 2233 4455', plan: 'Plan Integral Trimestral', status: 'Activa', since: at(18, 10, 0), mrr: 54000, adherence: 92, source: 'instagram', nextAt: atFuture(2, 9, 0), notes: ['Muy constante con los registros.', 'Refirió a Florencia.'], tags: ['Pérdida de peso'] },
      { id: 'K2', name: 'Belén Ortiz', email: 'belen.ortiz@gmail.com', phone: '+54 9 11 9988 7766', plan: 'Plan Mensual', status: 'Activa', since: at(20, 11, 0), mrr: 42000, adherence: 78, source: 'instagram', nextAt: atFuture(1, 11, 30), notes: [], tags: ['Mantenimiento'] },
      { id: 'K3', name: 'Delfina Castro', email: 'delfi.castro@gmail.com', phone: '+54 9 11 4455 1234', plan: 'Plan Integral Trimestral', status: 'Activa', since: at(46, 9, 0), mrr: 54000, adherence: 86, source: 'referral', nextAt: atFuture(1, 15, 0), notes: ['Entrena 4 veces por semana.'], tags: ['Deportistas'] },
      { id: 'K4', name: 'Micaela Ríos', email: 'mica.rios@gmail.com', phone: '+54 9 11 7788 3311', plan: 'Plan Mensual', status: 'Activa', since: at(33, 14, 0), mrr: 42000, adherence: 64, source: 'instagram', nextAt: atFuture(2, 13, 0), notes: ['Le cuesta registrar cenas.'], tags: ['Digestivo'] },
      { id: 'K5', name: 'Antonella Paz', email: 'anto.paz@gmail.com', phone: '+54 9 11 2231 9987', plan: 'Plan Mensual', status: 'Activa', since: at(61, 10, 0), mrr: 42000, adherence: 71, source: 'email', nextAt: atFuture(3, 16, 30), notes: [], tags: ['Reeducación'] },
      { id: 'K6', name: 'Josefina Luna', email: 'jose.luna@gmail.com', phone: '+54 9 11 6677 8822', plan: 'Plan Integral Trimestral', status: 'Activa', since: at(72, 11, 0), mrr: 54000, adherence: 95, source: 'instagram', nextAt: atFuture(4, 12, 0), notes: ['Excelente adherencia. Renovó 3 veces.'], tags: ['Pérdida de peso'] },
      { id: 'K7', name: 'Carla Herrera', email: 'carla.herrera@gmail.com', phone: '+54 9 11 3322 1144', plan: 'Plan Integral Trimestral', status: 'Activa', since: at(88, 15, 0), mrr: 54000, adherence: 58, source: 'whatsapp', nextAt: atFuture(5, 10, 0), notes: ['Reactivar seguimiento semanal.'], tags: ['Digestivo'] },
      { id: 'K8', name: 'Emilia Duarte', email: 'emi.duarte@gmail.com', phone: '+54 9 11 8877 6655', plan: 'Plan Mensual', status: 'Finalizando', since: at(120, 9, 0), mrr: 42000, adherence: 81, source: 'instagram', nextAt: atFuture(6, 11, 0), notes: ['Renovación a definir este mes.'], tags: ['Mantenimiento'] },
      { id: 'K9', name: 'Victoria Salas', email: 'vicky.salas@gmail.com', phone: '+54 9 11 5544 3322', plan: 'Plan Mensual', status: 'Activa', since: at(27, 12, 0), mrr: 42000, adherence: 88, source: 'web', nextAt: atFuture(8, 15, 0), notes: [], tags: ['Reeducación'] },
      { id: 'K10', name: 'Natalia Ferro', email: 'nati.ferro@gmail.com', phone: '+54 9 11 9988 1122', plan: 'Plan Integral Trimestral', status: 'En pausa', since: at(150, 10, 0), mrr: 0, adherence: 34, source: 'email', nextAt: null, notes: ['Pausó por viaje. Retoma en noviembre.'], tags: ['En pausa'] },
      { id: 'K11', name: 'Renata Quiroga', email: 'renata.q@gmail.com', phone: '+54 9 11 4411 7788', plan: 'Plan Mensual', status: 'Activa', since: at(12, 16, 0), mrr: 42000, adherence: 74, source: 'instagram', nextAt: atFuture(9, 16, 0), notes: [], tags: ['Pérdida de peso'] }
    ];

    const appointments = [
      { id: 'A1', name: 'Paula Giménez', clientId: 'K1', type: 'Primera consulta', time: weekAt(0, 9, 0), duration: 60, channel: 'presencial', status: 'confirmado' },
      { id: 'A2', name: 'Belén Ortiz', clientId: 'K2', type: 'Seguimiento', time: weekAt(0, 11, 30), duration: 45, channel: 'online', status: 'confirmado' },
      { id: 'A3', name: 'Valentina Ponce', leadId: 'L5', type: 'Primera consulta', time: weekAt(1, 19, 0), duration: 60, channel: 'online', status: 'pendiente' },
      { id: 'A4', name: 'Delfina Castro', clientId: 'K3', type: 'Control', time: weekAt(1, 15, 0), duration: 30, channel: 'presencial', status: 'confirmado' },
      { id: 'A5', name: 'Agustina Ledesma', leadId: 'L7', type: 'Primera consulta', time: weekAt(2, 9, 30), duration: 60, channel: 'online', status: 'confirmado' },
      { id: 'A6', name: 'Micaela Ríos', clientId: 'K4', type: 'Seguimiento', time: weekAt(2, 13, 0), duration: 45, channel: 'online', status: 'confirmado' },
      { id: 'A7', name: 'Florencia Cabrera', leadId: 'L8', type: 'Consulta online', time: weekAt(3, 10, 0), duration: 60, channel: 'online', status: 'confirmado' },
      { id: 'A8', name: 'Antonella Paz', clientId: 'K5', type: 'Control', time: weekAt(3, 16, 30), duration: 30, channel: 'presencial', status: 'pendiente' },
      { id: 'A9', name: 'Sofía Aguirre', leadId: 'L4', type: 'Primera consulta', time: weekAt(4, 9, 0), duration: 60, channel: 'online', status: 'pendiente' },
      { id: 'A10', name: 'Josefina Luna', clientId: 'K6', type: 'Seguimiento', time: weekAt(4, 12, 0), duration: 45, channel: 'online', status: 'confirmado' },
      { id: 'A11', name: 'Carla Herrera', clientId: 'K7', type: 'Consulta online', time: weekAt(5, 10, 0), duration: 45, channel: 'online', status: 'confirmado' }
    ];

    const automations = [
      { id: 'AU1', title: 'Bienvenida automática por Instagram', desc: 'Responde el primer mensaje y crea el contacto en el pipeline.', trigger: 'DM nuevo', action: 'Responder + crear lead', on: true, runs: 148, icon: 'instagram', tone: '' },
      { id: 'AU2', title: 'Cada email crea un contacto', desc: 'Los correos del formulario y de la casilla entran como prospecto.', trigger: 'Email entrante', action: 'Crear lead · etapa Nuevas', on: true, runs: 92, icon: 'mail', tone: 'is-sky' },
      { id: 'AU3', title: 'Recordatorio a las 48 h sin respuesta', desc: 'Si no contestó, te avisa para retomar la conversación.', trigger: 'Sin respuesta 48 h', action: 'Crear tarea', on: true, runs: 37, icon: 'clock', tone: 'is-gold' },
      { id: 'AU4', title: 'Confirmación de turno por WhatsApp', desc: 'Envía el detalle del turno y pide confirmación.', trigger: 'Turno agendado', action: 'WhatsApp automático', on: true, runs: 61, icon: 'whatsapp', tone: '' },
      { id: 'AU5', title: 'Reactivar clientas inactivas', desc: 'A los 30 días sin registros, envía un mensaje de seguimiento.', trigger: '30 días inactiva', action: 'Mensaje + tarea', on: false, runs: 12, icon: 'refresh', tone: 'is-coral' },
      { id: 'AU6', title: 'Pedir reseña después de la 4.ª consulta', desc: 'Invita a dejar una reseña cuando se cumple el hito.', trigger: '4.ª consulta', action: 'Email de reseña', on: false, runs: 4, icon: 'sparkle', tone: 'is-gold' }
    ];

    const connections = {
      instagram: { id: 'instagram', name: 'Instagram', connected: true, account: '@planv.nutricion', lastSync: minsAgo(4), synced: 1284, newItems: 6, detail: 'Mensajes directos y comentarios', tone: 'is-instagram', icon: 'instagram' },
      email: { id: 'email', name: 'Email', connected: true, account: 'vero@planvnutricion.com', lastSync: minsAgo(11), synced: 642, newItems: 3, detail: 'Gmail · hola@planvnutricion.com', tone: 'is-email', icon: 'mail' },
      whatsapp: { id: 'whatsapp', name: 'WhatsApp', connected: true, account: '+54 9 11 5555 2020', lastSync: minsAgo(7), synced: 318, newItems: 1, detail: 'WhatsApp Business', tone: 'is-whatsapp', icon: 'whatsapp' },
      calendar: { id: 'calendar', name: 'Google Calendar', connected: false, account: 'Sin conectar', lastSync: null, synced: 0, newItems: 0, detail: 'Sincronizá turnos y disponibilidad', tone: 'is-calendar', icon: 'calendar' }
    };

    return {
      version: 1,
      profile: { name: 'Verónica Trenti', role: 'Nutricionista · Plan V', email: 'vero@planvnutricion.com' },
      leads, conversations, clients, appointments, automations, connections,
      activity: [
        { type: 'message', text: '<b>Camila Ferreyra</b> escribió por Instagram', at: at(0, 9, 12) },
        { type: 'stage', text: '<b>Agustina Ledesma</b> agendó su primera consulta', at: at(0, 10, 5) },
        { type: 'email', text: '<b>Martina Ruiz</b> completó el formulario web', at: at(1, 18, 5) },
        { type: 'stage', text: '<b>Julieta Sosa</b> recibió el plan trimestral', at: at(1, 9, 0) },
        { type: 'note', text: 'Se conectó <b>Instagram</b> y se sincronizaron 6 mensajes', at: at(1, 8, 30) }
      ]
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === 1 && Array.isArray(parsed.leads)) return parsed;
      }
    } catch (err) { /* file:// sin storage: seguimos en memoria */ }
    return seed();
  }

  const state = (ND.state = load());
  ND.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (err) { /* memoria */ }
  };
  ND.resetDemo = function () {
    try { localStorage.removeItem(KEY); } catch (err) { /* noop */ }
    const fresh = seed();
    Object.keys(fresh).forEach((k) => { state[k] = fresh[k]; });
    ND.save();
  };

  ND.lead = (id) => state.leads.find((l) => l.id === id);
  ND.client = (id) => state.clients.find((c) => c.id === id);
  ND.conversation = (id) => state.conversations.find((c) => c.id === id);

  ND.log = function (leadId, type, text) {
    const lead = ND.lead(leadId);
    if (!lead) return;
    lead.timeline = lead.timeline || [];
    lead.timeline.unshift({ type, text, at: new Date().toISOString() });
    lead.lastContact = new Date().toISOString();
    state.activity.unshift({ type, text, at: lead.lastContact });
    state.activity = state.activity.slice(0, 12);
  };

  ND.moveLead = function (leadId, stage) {
    const lead = ND.lead(leadId);
    if (!lead || lead.stage === stage) return false;
    const from = ND.stageMeta[lead.stage].label;
    lead.stage = stage;
    ND.log(leadId, 'stage', `Etapa actualizada: ${from} → ${ND.stageMeta[stage].label}.`);
    ND.save();
    return true;
  };

  ND.addLead = function (data) {
    const id = 'L' + Date.now().toString(36);
    const lead = {
      id, name: data.name, handle: data.handle || '', source: data.source || 'instagram',
      stage: 'nuevo', value: Number(data.value) || 42000, score: 60,
      createdAt: new Date().toISOString(), lastContact: new Date().toISOString(),
      owner: 'Verónica', headline: data.headline || 'Consulta nueva', tags: data.tags || [],
      phone: data.phone || '', email: data.email || '',
      timeline: [{ type: 'system', text: 'Contacto creado manualmente.', at: new Date().toISOString() }],
      tasks: []
    };
    state.leads.unshift(lead);
    state.activity.unshift({ type: 'system', text: `<b>${ND.esc(lead.name)}</b> se agregó al pipeline`, at: lead.createdAt });
    ND.save();
    return lead;
  };

  ND.addNote = function (leadId, text) {
    if (!text.trim()) return;
    ND.log(leadId, 'note', text.trim());
    ND.save();
  };

  ND.addTask = function (leadId, text) {
    const lead = ND.lead(leadId);
    if (!lead || !text.trim()) return;
    lead.tasks = lead.tasks || [];
    lead.tasks.push({ id: 'T' + Date.now().toString(36), text: text.trim(), done: false });
    ND.save();
  };

  ND.toggleTask = function (leadId, taskId) {
    const lead = ND.lead(leadId);
    if (!lead) return;
    const task = (lead.tasks || []).find((t) => t.id === taskId);
    if (!task) return;
    task.done = !task.done;
    if (task.done) ND.log(leadId, 'task', `Tarea completada: ${task.text}`);
    ND.save();
  };

  ND.sendMessage = function (convId, text) {
    const conv = ND.conversation(convId);
    if (!conv || !text.trim()) return;
    const when = new Date().toISOString();
    conv.messages.push({ from: 'me', text: text.trim(), at: when });
    conv.lastMessage = 'Vos: ' + text.trim();
    conv.updatedAt = when;
    conv.unread = 0;
    if (conv.leadId) ND.log(conv.leadId, 'message', `Mensaje enviado por ${conv.channel === 'email' ? 'email' : conv.channel === 'whatsapp' ? 'WhatsApp' : 'Instagram'}.`);
    ND.save();
  };

  ND.markRead = function (convId) {
    const conv = ND.conversation(convId);
    if (!conv) return;
    conv.unread = 0;
    ND.save();
  };

  ND.convertLead = function (leadId) {
    const lead = ND.lead(leadId);
    if (!lead) return null;
    const existing = state.clients.find((c) => c.email && c.email === lead.email);
    if (existing) return existing;
    const client = {
      id: 'K' + Date.now().toString(36),
      name: lead.name, email: lead.email || '', phone: lead.phone || '',
      plan: 'Plan Mensual', status: 'Activa', since: new Date().toISOString(),
      mrr: lead.value || 42000, adherence: 0, source: lead.source,
      nextAt: null, notes: ['Alta desde el pipeline.'], tags: (lead.tags || []).slice(0, 2)
    };
    state.clients.unshift(client);
    ND.moveLead(leadId, 'ganada');
    ND.log(leadId, 'stage', 'Se convirtió en clienta.');
    ND.save();
    return client;
  };

  ND.addAppointment = function (data) {
    const appt = {
      id: 'A' + Date.now().toString(36),
      name: data.name, clientId: data.clientId || null, leadId: data.leadId || null,
      type: data.type || 'Primera consulta', time: data.time, duration: 45,
      channel: data.channel || 'online', status: 'pendiente'
    };
    state.appointments.push(appt);
    ND.save();
    return appt;
  };

  ND.toggleAutomation = function (id) {
    const rule = state.automations.find((a) => a.id === id);
    if (!rule) return;
    rule.on = !rule.on;
    ND.save();
  };

  ND.setConnection = function (id, connected) {
    const conn = state.connections[id];
    if (!conn) return;
    conn.connected = connected;
    if (connected) {
      conn.account = id === 'calendar' ? 'vero@planvnutricion.com' : conn.account;
      conn.lastSync = new Date().toISOString();
      conn.newItems = 0;
    } else {
      conn.account = 'Sin conectar';
      conn.lastSync = null;
    }
    ND.save();
  };

  ND.syncConnection = function (id) {
    const conn = state.connections[id];
    if (!conn) return;
    conn.lastSync = new Date().toISOString();
    conn.newItems = 0;
    ND.save();
  };

  /* ---------------- métricas ---------------- */
  ND.metrics = function () {
    const active = state.clients.filter((c) => c.status === 'Activa');
    const mrr = active.reduce((sum, c) => sum + (c.mrr || 0), 0);
    const pipeline = state.leads.filter((l) => !['ganada', 'pausa'].includes(l.stage));
    const pipelineValue = pipeline.reduce((sum, l) => sum + (l.value || 0), 0);
    const nuevos7 = state.leads.filter((l) => Date.now() - new Date(l.createdAt).getTime() < 7 * 864e5).length;
    const qualified = state.leads.filter((l) => ['propuesta', 'ganada', 'pausa'].includes(l.stage)).length;
    const won = state.leads.filter((l) => l.stage === 'ganada').length;
    const conversion = qualified ? Math.round((won / qualified) * 100) : 0;
    const unread = state.conversations.reduce((sum, c) => sum + (c.unread || 0), 0);
    return { active: active.length, mrr, pipelineValue, nuevos7, conversion, unread, totalClients: state.clients.length };
  };

  ND.stageStats = function () {
    return ND.stageOrder.map((stage) => {
      const items = state.leads.filter((l) => l.stage === stage);
      return { stage, items, value: items.reduce((s, l) => s + (l.value || 0), 0) };
    });
  };

  ND.sourceStats = function () {
    const counts = {};
    state.leads.forEach((l) => { counts[l.source] = (counts[l.source] || 0) + 1; });
    return Object.keys(ND.sourceMeta).map((key) => ({ key, label: ND.sourceMeta[key].label, value: counts[key] || 0 })).filter((s) => s.value > 0);
  };
})();
