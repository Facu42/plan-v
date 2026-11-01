import { useEffect, useRef, useState } from 'react';
import { embeddedVideoEnabled } from '../../lib/embedded-video';

/**
 * Prueba local dentro del turno. No graba, no nombra a la paciente y no llama a un proveedor.
 * Con la bandera apagada no se muestra. El enlace de Meet queda en el turno.
 */
export function EmbeddedVideoCall({ enabled = embeddedVideoEnabled() }: { enabled?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [on, setOn] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => () => {
    const stream = video.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach(track => track.stop());
  }, []);
  if (!enabled) return null;
  async function start() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (video.current) { video.current.srcObject = stream; setOn(true); }
    } catch {
      setError('No se pudo usar la cámara. El enlace de Meet sigue disponible.');
    }
  }
  return <div className="nvc-embedded" data-embedded-video="local" data-recording="off">
    <p>Prueba de sala en este turno. No graba y la imagen no sale de este navegador. Meet sigue siendo el enlace.</p>
    <video ref={video} muted playsInline autoPlay hidden={!on} aria-label={on ? 'Vista previa local, sin grabación' : undefined} />
    <button type="button" onClick={() => void start()}>Probar cámara</button>
    {error ? <p role="alert">{error}</p> : null}
  </div>;
}
