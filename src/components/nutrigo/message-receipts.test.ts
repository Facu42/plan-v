import { describe, expect, it } from 'vitest';
import { messageReceipt, messageReceiptLabel, unreadCount } from './message-receipts';

const base = { from: 'vero' as const, sent_at: '2026-09-16T12:00:00.000Z' };

describe('estados de entrega y lectura', () => {
  it('distingue enviado, entregado y leído sin inventar un estado intermedio', () => {
    expect(messageReceipt(base)).toBe('sent');
    expect(messageReceipt({ ...base, delivered_at: base.sent_at })).toBe('delivered');
    expect(messageReceipt({ ...base, delivered_at: base.sent_at, read_at: '2026-09-16T12:05:00.000Z' })).toBe('read');
    expect(messageReceiptLabel('delivered')).toBe('Entregado');
    expect(messageReceiptLabel('read')).toBe('Leído');
  });

  it('cuenta sólo mensajes entrantes no leídos del hilo abierto', () => {
    const thread = [
      { ...base, from: 'vero' as const },
      { ...base, from: 'patient' as const, delivered_at: base.sent_at },
      { ...base, from: 'vero' as const, read_at: base.sent_at },
    ];
    expect(unreadCount(thread, 'patient')).toBe(1);
    expect(unreadCount(thread, 'pro')).toBe(1);
    expect(unreadCount(thread, 'patient')).not.toBe(thread.length);
  });
});
