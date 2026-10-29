import { useEffect, useState } from 'react';
import { request } from '../../api/client';
import type { OwnService } from '../../types/service';
import { serviceNoticeText } from './service-notice';
import './service-notice.css';

/** Aviso del servicio de Nutridash para la nutricionista (prueba por terminar, vencido o solo lectura). */
export function ServiceNotice() {
  const [service, setService] = useState<OwnService | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    // Sin datos (modo demo, red caída) no se muestra nada: el aviso nunca tapa el trabajo.
    request<{ service: OwnService | null }>('/api/me/service', { signal: controller.signal })
      .then(result => setService(result.service)).catch(() => undefined);
    return () => controller.abort();
  }, []);
  const text = serviceNoticeText(service);
  if (!text) return null;
  return <section className={`nv-service-notice nv-service-${text.tone}`} role={text.tone === 'blocked' ? 'alert' : 'status'} aria-label="Tu servicio de Nutridash">
    <strong>{text.title}</strong><p>{text.body}</p>
  </section>;
}
