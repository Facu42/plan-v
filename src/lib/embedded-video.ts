/** La sala embebida solo existe si la bandera es exactamente "true". Meet sigue siendo el enlace. */
export function embeddedVideoEnabled(env?: { VITE_EMBEDDED_VIDEO_CALL?: string }): boolean {
  const source = env ?? (import.meta.env as { VITE_EMBEDDED_VIDEO_CALL?: string });
  return source.VITE_EMBEDDED_VIDEO_CALL === 'true';
}

export function embeddedCallPlan(enabled: boolean) {
  return { enabled, recording: false as const, provider: null, fallback: 'meet' as const };
}
