import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { applyLedger, buildPreapprovalBody, ledgerCommand, ledgerNote, LINK_TTL_MS, reconcileAction, reconcileDue, RECONCILE_EVERY_MS, webhookSignatureOk } from './logic.js';
import { acceptNotice, type StoredNotice } from './notice.js';
import { settlePayment, type LedgerHit } from './ledger.js';
import { subscriptionsAllowed, subscriptionsEnabled } from './flag.js';

const NOW = Date.parse('2026-10-19T15:00:00.000Z');

function sign(id: string, requestId: string, ts: string, secret = 'secret') {
  const mac = createHmac('sha256', secret).update(`id:${id.toLowerCase()};request-id:${requestId};ts:${ts};`).digest('hex');
  return `ts=${ts},v1=${mac}`;
}

describe('firma del aviso de Mercado Pago', () => {
  it('acepta un id con letras y un ts en segundos o en milisegundos', () => {
    const id = 'AbC-12';
    const requestId = 'req-1';
    const seconds = '1697720400';
    const millis = '1697720400123';
    expect(webhookSignatureOk({ id, requestId, signature: sign(id, requestId, seconds), secret: 'secret', now: Number(seconds) * 1000 })).toBe(true);
    expect(webhookSignatureOk({ id, requestId, signature: sign(id, requestId, millis), secret: 'secret', now: Number(millis) })).toBe(true);
    expect(webhookSignatureOk({ id, requestId, signature: sign('otro', requestId, seconds), secret: 'secret', now: Number(seconds) * 1000 })).toBe(false);
  });

  it('guarda la firma inválida sin ponerla en la cola y no duplica un aviso válido', async () => {
    const rows: StoredNotice[] = [];
    const save = async (row: StoredNotice) => {
      const key = `${row.topic}:${row.dataId}:${row.notificationId}`;
      if (row.signatureValid && rows.some(item => `${item.topic}:${item.dataId}:${item.notificationId}` === key)) return 'duplicate' as const;
      rows.push(row);
      return 'saved' as const;
    };
    const base = { dataId: 'AbC-12', requestId: 'req-1', secret: 'secret', now: Number('1697720400') * 1000, topic: 'payment', action: 'payment.created', notificationId: 'n1', userId: '9', liveMode: false };
    expect(await acceptNotice({ ...base, signature: 'ts=1697720400,v1=00' }, save)).toBe(401);
    expect(rows).toEqual([expect.objectContaining({ signatureValid: false, status: 'ignored' })]);
    const signature = sign(base.dataId, base.requestId, '1697720400');
    expect(await acceptNotice({ ...base, signature }, save)).toBe(200);
    expect(await acceptNotice({ ...base, signature }, save)).toBe(200);
    expect(rows.filter(row => row.status === 'queued')).toHaveLength(1);
  });
});

describe('cobros en Cobranzas', () => {
  it('un pago aprobado entra una sola vez y la devolución lo anula', () => {
    const command = ledgerCommand('approved', 'pay-1', 5_400_000, '2026-11-10T13:00:00.000Z', 'Débito automático · Seguimiento mensual · noviembre 2026');
    const first = applyLedger([], command);
    const second = applyLedger(first.rows, command);
    expect(first.createdId).toBeTruthy();
    expect(second.createdId).toBeNull();
    expect(second.rows).toHaveLength(1);
    expect(second.rows[0]?.status).toBe('confirmed');
    const refunded = applyLedger(second.rows, ledgerCommand('refunded', 'pay-1', 5_400_000, null, ''));
    const again = applyLedger(refunded.rows, ledgerCommand('charged_back', 'pay-1', 5_400_000, null, ''));
    expect(refunded.voidedId).toBe(first.createdId);
    expect(refunded.rows[0]?.note).toBe('Anulado por devolución');
    expect(again.voidedId).toBeNull();
    expect(again.rows[0]?.status).toBe('voided');
  });

  it('la misma regla, contra un libro, no vuelve a cobrar ni a anular', async () => {
    const book: LedgerHit[] = [];
    const port = {
      find: async (id: string) => book.find(row => row.id === id) ?? null,
      confirm: async (command: { providerPaymentId: string }) => {
        book.push({ id: command.providerPaymentId, status: 'confirmed' });
        return command.providerPaymentId;
      },
      void: async (id: string) => {
        const row = book.find(item => item.id === id);
        if (row) row.status = 'voided';
      },
    };
    const approved = ledgerCommand('approved', '88', 1_000_000, '2026-11-01T12:00:00.000Z', ledgerNote('Seguimiento', new Date('2026-11-01T12:00:00.000Z')));
    expect(await settlePayment(port, approved)).toBe('created');
    expect(await settlePayment(port, approved)).toBe('duplicate');
    expect(book).toHaveLength(1);
    expect(await settlePayment(port, ledgerCommand('refunded', '88', 1_000_000, null, ''))).toBe('voided');
    expect(await settlePayment(port, ledgerCommand('refunded', '88', 1_000_000, null, ''))).toBe('ignored');
    expect(book[0]?.status).toBe('voided');
  });
});

describe('conciliación', () => {
  const base = {
    status: 'pending',
    createdAt: new Date(NOW - LINK_TTL_MS).toISOString(),
    expiresAt: new Date(NOW).toISOString(),
    nextPaymentDate: null,
    providerAccountId: 'cuenta-a',
    connectedAccountId: 'cuenta-a',
    pendingAmountOn: null,
  };

  it('vence el link a los 7 días y no antes', () => {
    expect(reconcileAction(base, NOW).type).toBe('expire_link');
    expect(reconcileAction({ ...base, expiresAt: new Date(NOW + 60_000).toISOString() }, NOW).type).toBe('none');
    expect(reconcileAction({ ...base, createdAt: new Date(NOW - LINK_TTL_MS + 1000).toISOString(), expiresAt: null }, NOW).type).toBe('none');
  });

  it('busca un alta incierta, no toca otra cuenta y corre cada 6 horas', () => {
    expect(reconcileAction({ ...base, status: 'uncertain', createdAt: new Date(NOW - 11 * 60_000).toISOString() }, NOW).type).toBe('search_external_reference');
    expect(reconcileAction({ ...base, status: 'uncertain', createdAt: new Date(NOW - 60_000).toISOString() }, NOW).type).toBe('none');
    expect(reconcileAction({ ...base, status: 'authorized', connectedAccountId: 'cuenta-b' }, NOW).type).toBe('skip_other_account');
    expect(reconcileDue(0, RECONCILE_EVERY_MS)).toBe(true);
    expect(reconcileDue(NOW, NOW + RECONCILE_EVERY_MS - 1)).toBe(false);
  });
});

describe('alta y bandera', () => {
  it('arma el débito mensual sin comisión ni prueba gratis', () => {
    const body = buildPreapprovalBody({ id: 'sub', planName: 'Seguimiento mensual', nutritionistName: 'Ana', payerEmail: 'ana@correo.com', amountCents: 5_400_000, backUrl: 'https://planv.app/consultorio/ana/suscripcion/sub' });
    expect(body.status).toBe('pending');
    expect(body).not.toHaveProperty('marketplace_fee');
    expect(body.auto_recurring).toMatchObject({ frequency: 1, frequency_type: 'months', transaction_amount: 54_000, currency_id: 'ARS' });
  });

  it('queda apagada si no se prende la bandera', () => {
    expect(subscriptionsEnabled({})).toBe(false);
    expect(subscriptionsAllowed('nutri', {})).toBe(false);
    expect(subscriptionsAllowed('nutri', { PATIENT_SUBSCRIPTIONS_ENABLED: '1' })).toBe(true);
    expect(subscriptionsAllowed('otra', { PATIENT_SUBSCRIPTIONS_ENABLED: 'on', PATIENT_SUBSCRIPTIONS_ALLOWLIST: 'nutri' })).toBe(false);
  });
});
