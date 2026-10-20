import { ledgerCommand, voidNote, type LedgerCommand } from './logic.js';

export type LedgerHit = { id: string; status: 'confirmed' | 'voided' };

export type LedgerPort = {
  find(providerPaymentId: string): Promise<LedgerHit | null>;
  confirm(command: Extract<LedgerCommand, { kind: 'confirm' }>): Promise<string>;
  void(id: string, note: string): Promise<void>;
};

export async function settlePayment(port: LedgerPort, command: LedgerCommand): Promise<'created' | 'duplicate' | 'voided' | 'ignored'> {
  if (command.kind === 'none') return 'ignored';
  const existing = await port.find(command.providerPaymentId);
  if (command.kind === 'confirm') {
    if (existing) return 'duplicate';
    await port.confirm(command);
    return 'created';
  }
  if (!existing || existing.status === 'voided') return 'ignored';
  await port.void(existing.id, voidNote(command.reason));
  return 'voided';
}

export function commandForPayment(payment: Record<string, unknown>, note: string): LedgerCommand {
  const id = payment.id == null ? null : String(payment.id);
  const status = typeof payment.status === 'string' ? payment.status : null;
  const amount = typeof payment.transaction_amount === 'number' ? Math.round(payment.transaction_amount * 100) : 0;
  const paidAt = typeof payment.date_approved === 'string' ? payment.date_approved : null;
  return ledgerCommand(status, id, amount, paidAt, note);
}
