/**
 * Conecta la sala en vivo. No llama a Egress ni graba la sala.
 * El video de la llamada no se guarda. El audio de la transcripción va por la consulta y después se borra.
 */
export async function joinLiveKitRoom(url: string, token: string, container: HTMLElement) {
  const { Room, RoomEvent, Track } = await import('livekit-client');
  const room = new Room();
  await room.connect(url, token);
  await room.localParticipant.setMicrophoneEnabled(true);
  await room.localParticipant.setCameraEnabled(true);
  room.on(RoomEvent.TrackSubscribed, track => {
    if (track.kind !== Track.Kind.Video && track.kind !== Track.Kind.Audio) return;
    container.appendChild(track.attach());
  });
  return room;
}
