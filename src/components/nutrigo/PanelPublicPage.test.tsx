import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { schedulingDefaultSettings } from '../../types/scheduling';
import { PanelPublicPageView } from './PanelPublicPage';

describe('Página pública del boceto', () => {
  it('edita el perfil, muestra la vista previa y deja las conexiones en Conectar', () => {
    const html = renderToStaticMarkup(<PanelPublicPageView config={schedulingDefaultSettings()} published={false} pageUrl="" connections={{ google: false, mercadopago: false, whatsapp: false }} status="" busy={false} loading={false} error="" onChange={vi.fn()} onPublish={vi.fn()} onToggleEnabled={vi.fn()} onConnect={vi.fn()} onRetry={vi.fn()} />);
    for (const label of ['Página pública', 'Presentación', 'Dirección del link', 'Así la ve la paciente', 'Reservar turno', 'Mercado Pago', 'Google Calendar', 'WhatsApp', 'Conectar', '24 horas']) expect(html).toContain(label);
    expect(html).toContain('Todavía no está publicada.');
    expect(html).not.toContain('Conectado');
    expect(html).not.toContain('>Publicar<');
  });
});
