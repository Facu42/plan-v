/** La sala embebida solo existe si la bandera es exactamente "true". Meet sigue siendo el enlace. */
export function embeddedVideoEnabled(env?: { VITE_EMBEDDED_VIDEO_CALL?: string }): boolean {
  const source = env ?? (import.meta.env as { VITE_EMBEDDED_VIDEO_CALL?: string });
  return source.VITE_EMBEDDED_VIDEO_CALL === 'true';
}

export function embeddedCallPlan(enabled: boolean) {
  return { enabled, provider: 'livekit' as const, connected: false as const, recording: 'consultation-consent' as const, fallback: 'meet' as const };
}
