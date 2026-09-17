import type { Message } from '../../types';

export type ThreadMessage = Omit<Message, 'sent_at'> & { sent_at: string | null };

export function sortThreadMessages<T extends ThreadMessage>(messages: readonly T[]): T[] {
  return messages
    .filter((message): message is T & { sent_at: string } => Boolean(message.sent_at))
    .slice()
    .sort((a, b) => new Date(a.sent_at).getTime() - new Date(b.sent_at).getTime());
}
