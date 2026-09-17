export type MessageReceipt = 'sent' | 'delivered' | 'read';

export type ReceiptMessage = {
  from: 'vero' | 'patient';
  sent_at?: string | null;
  delivered_at?: string | null;
  read_at?: string | null;
};

export function incomingMessageFrom(role: 'patient' | 'pro'): ReceiptMessage['from'] {
  return role === 'pro' ? 'patient' : 'vero';
}

export function messageReceipt(message: ReceiptMessage): MessageReceipt {
  if (message.read_at) return 'read';
  if (message.delivered_at) return 'delivered';
  return 'sent';
}

export function messageReceiptLabel(receipt: MessageReceipt) {
  if (receipt === 'read') return 'Leído';
  if (receipt === 'delivered') return 'Entregado';
  return 'Enviado';
}

export function unreadMessages<T extends ReceiptMessage>(messages: readonly T[], role: 'patient' | 'pro') {
  const from = incomingMessageFrom(role);
  return messages.filter((message) => Boolean(message.sent_at) && message.from === from && !message.read_at);
}

export function unreadCount(messages: readonly ReceiptMessage[], role: 'patient' | 'pro') {
  return unreadMessages(messages, role).length;
}
