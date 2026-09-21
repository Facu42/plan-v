type MessageInput = {
  patientId: string;
  text: string;
  role: 'patient' | 'pro';
  client_id?: string;
  asset_id?: string;
  filename?: string;
};
type MessageServices = {
  send: (
    patientId: string,
    text: string,
    from: 'patient' | 'vero',
    suggestedByAi: boolean,
    clientId?: string,
    attachment?: { asset_id: string; filename: string },
  ) => Promise<unknown>;
  refresh: (patientId: string) => Promise<unknown>;
};

export async function sendShowroomMessage(input: MessageInput, services: MessageServices): Promise<'sent' | 'sent-refresh-failed'> {
  const text = input.text.trim();
  const hasFile = Boolean(input.asset_id);
  if (!input.patientId || (!text && !hasFile) || text.length > 2000) {
    throw new Error(hasFile ? 'El adjunto no se pudo enviar.' : 'Escribí un mensaje de hasta 2000 caracteres.');
  }
  const attachment = hasFile && input.asset_id && input.filename
    ? { asset_id: input.asset_id, filename: input.filename }
    : undefined;
  await services.send(
    input.patientId,
    text,
    input.role === 'pro' ? 'vero' : 'patient',
    false,
    input.client_id,
    ...(attachment ? [attachment] : []),
  );
  try {
    await services.refresh(input.patientId);
    return 'sent';
  } catch {
    // The write succeeded. Do not offer to send the same text again on a read failure.
    return 'sent-refresh-failed';
  }
}
