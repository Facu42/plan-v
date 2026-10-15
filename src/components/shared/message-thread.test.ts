import { describe, expect, it } from 'vitest';
import type { Message } from '../../types';
import { sortThreadMessages } from './message-thread';

function message(id: string, sentAt: string | null): Omit<Message, 'sent_at'> & { sent_at: string | null } {
  return {
    id,
    patient_id: 'patient-1',
    from: id === 'patient' ? 'patient' : 'vero',
    text: id,
    suggested_by_ai: false,
    sent_at: sentAt,
  };
}

describe('sortThreadMessages', () => {
  it('filters unsent drafts and orders sent messages from oldest to newest', () => {
    const input = [
      message('newest', '2026-09-05T15:00:00.000Z'),
      message('draft', null),
      message('oldest', '2026-09-03T15:00:00.000Z'),
      message('patient', '2026-09-04T15:00:00.000Z'),
    ];

    expect(sortThreadMessages(input).map((item) => item.id)).toEqual(['oldest', 'patient', 'newest']);
    expect(input.map((item) => item.id)).toEqual(['newest', 'draft', 'oldest', 'patient']);
  });
});
