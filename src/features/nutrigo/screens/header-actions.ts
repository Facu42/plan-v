/** Nombres accesibles de los controles de Mensajes: cada uno distinto y acorde a su dibujo y a su acción. */
export const MESSAGE_LABELS = {
  contact: 'Contactar a mi nutricionista',
  agenda: 'Ver mi próxima consulta',
  reload: 'Actualizar conversación',
  compose: 'Redactar un mensaje',
  newMessage: 'Nuevo mensaje',
  attach: 'Adjuntar archivo',
} as const;

/** El «+» del propio archivo (`Icon/Plus`) hace de botón de adjuntar en el campo de texto. */
export const ATTACH_ICON = 'asset:ce0a3.svg';

export type HeaderAction = { label: string; onClick: () => void };

/** Los tres botones del archivo en su orden: teléfono (contactar), videollamada (consulta) y panel (actualizar). */
export function headerActions(handlers: { write: () => void; agenda: () => void; reload: () => void }): [HeaderAction, HeaderAction, HeaderAction] {
  return [
    { label: MESSAGE_LABELS.contact, onClick: handlers.write },
    { label: MESSAGE_LABELS.agenda, onClick: handlers.agenda },
    { label: MESSAGE_LABELS.reload, onClick: handlers.reload },
  ];
}
