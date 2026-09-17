type MessageInput = { patientId: string; text: string; role: 'patient' | 'pro' };
type MessageServices = {
  send: (patientId: string, text: string, from: 'patient' | 'vero', suggestedByAi: boolean) => Promise<unknown>;
  refresh: (patientId: string) => Promise<unknown>;
};

export async function sendShowroomMessage(input: MessageInput, services: MessageServices): Promise<'sent' | 'sent-refresh-failed'> {
  const text = input.text.trim();
  if (!input.patientId || !text || text.length > 2000) throw new Error('Escribí un mensaje de hasta 2000 caracteres.');
  await services.send(input.patientId, text, input.role === 'pro' ? 'vero' : 'patient', false);
  try {
    await services.refresh(input.patientId);
    return 'sent';
  } catch {
    // The write succeeded. Do not offer to send the same text again on a read failure.
    return 'sent-refresh-failed';
  }
}
