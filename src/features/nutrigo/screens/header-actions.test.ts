import { describe, expect, it, vi } from 'vitest';
import { ATTACH_ICON, MESSAGE_LABELS, headerActions } from './header-actions';

describe('acciones del encabezado del chat', () => {
  it('cada ícono del archivo (teléfono, video, panel) dispara su acción: escribir, ir a la agenda, recargar', () => {
    const handlers = { write: vi.fn(), agenda: vi.fn(), reload: vi.fn() };
    const [phone, video, panel] = headerActions(handlers);
    phone.onClick(); expect(handlers.write).toHaveBeenCalledTimes(1); expect(handlers.agenda).not.toHaveBeenCalled();
    video.onClick(); expect(handlers.agenda).toHaveBeenCalledTimes(1);
    panel.onClick(); expect(handlers.reload).toHaveBeenCalledTimes(1); expect(handlers.write).toHaveBeenCalledTimes(1);
  });
  it('cada control tiene un nombre distinto para lectores de pantalla', () => {
    const labels = [...headerActions({ write: vi.fn(), agenda: vi.fn(), reload: vi.fn() }).map(action => action.label), MESSAGE_LABELS.compose, MESSAGE_LABELS.newMessage, MESSAGE_LABELS.attach];
    expect(new Set(labels).size).toBe(labels.length);
    expect(labels).not.toContain('Escribir a mi nutricionista');
  });
  it('adjuntar usa el ícono Plus del archivo', () => { expect(ATTACH_ICON).toBe('asset:ce0a3.svg'); });
});
