import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AjustesIntegraciones } from './PanelAjustesVistas';
import { AjustesWhatsappEstado, FichaWhatsappEstado } from './FichaWhatsappEstado';

describe('estado de WhatsApp', () => {
  it('en la ficha muestra la baja o que no está disponible', () => {
    const baja = renderToStaticMarkup(<FichaWhatsappEstado patientId="10000000-0000-4000-a000-000000000002" status={{ patient_id: '10000000-0000-4000-a000-000000000002', campaign_opted_out: true, whatsapp: { configured: true, enabled: true, opted_out: true } }} />);
    expect(baja).toContain('Se dio de baja de los avisos');
    const apagado = renderToStaticMarkup(<FichaWhatsappEstado patientId="10000000-0000-4000-a000-000000000002" status={{ patient_id: '10000000-0000-4000-a000-000000000002', campaign_opted_out: false, whatsapp: { configured: false, enabled: false, status: 'unavailable' } }} />);
    expect(apagado).toContain('No disponible');
  });
  it('en ajustes dice No disponible si la cuenta no está cargada', () => {
    const html = renderToStaticMarkup(<AjustesWhatsappEstado status={{ configured: false, enabled: false, status: 'unavailable' }} />);
    expect(html).toContain('WhatsApp del consultorio: No disponible');
  });
  it('con las banderas apagadas ajustes no suma el bloque', () => {
    const html = renderToStaticMarkup(<AjustesIntegraciones onOpen={vi.fn()} />);
    expect(html).not.toContain('WhatsApp del consultorio');
    expect(renderToStaticMarkup(<FichaWhatsappEstado patientId="p1" />)).toBe('');
  });
});
