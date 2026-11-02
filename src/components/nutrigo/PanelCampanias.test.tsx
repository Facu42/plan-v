import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { CampaignBoard, CampaignPreview } from '../../api/client';
import { pedidoDeCampania } from './campanas';
import { PanelCampaniasView } from './PanelCampanias';
import { panelNavGroups } from './PanelNavigation';

const hash = 'a'.repeat(64);
const plantilla = { id: 'agenda_notice', subject: 'Aviso de agenda', text: 'Entrá a Nutridash.', path: '/app/agenda', hash };
const base = {
  settingsEnabled: true,
  channel: 'push' as const,
  channels: { push: true, email: false, whatsapp: false },
  template: 'agenda_notice',
  templateHash: hash,
  confirmed: true,
  days: 30,
  segment: 'no_app_record' as const,
  requestKey: '10000000-0000-4000-a000-000000000010',
};
const preview = (names: Array<{ id: string; name: string; opted_out: boolean }>): CampaignPreview => ({
  segment: { segment: 'no_app_record', days: 30 },
  templates: [plantilla],
  patients: names,
  total: names.length,
  max_recipients: 100,
});
const board = (optouts: CampaignBoard['optouts']): CampaignBoard => ({
  settings: { enabled: true, daily_limit: 20 },
  quota: { daily_limit: 20, used: 8, remaining: 12 },
  templates: [plantilla],
  channels: { push: true, email: false, whatsapp: false },
  whatsapp_template: null,
  campaigns: [{ id: 'c1', segment: 'no_app_record', days: 30, channel: 'push', template: 'agenda_notice', template_hash: hash, created_at: '2026-11-01T12:00:00Z' }],
  deliveries: [],
  optouts,
});

describe('pantalla de campañas', () => {
  it('con la bandera apagada dice Próximamente y no arma el formulario', () => {
    const html = renderToStaticMarkup(<PanelCampaniasView enabled={false} board={null} error="" onPreview={vi.fn()} onConfirm={vi.fn()} />);
    expect(html).toContain('Próximamente');
    expect(html).not.toContain('Vista previa');
    expect(html).not.toContain('Confirmar');
  });
  it('muestra segmento, vista previa, canal, cupo, historial y bajas', () => {
    const html = renderToStaticMarkup(<PanelCampaniasView enabled board={board([{ patient_id: 'p1', name: 'Ana de consultorio A', opted_out: true }])} error="" onPreview={vi.fn()} onConfirm={vi.fn()} initialPreview={preview([{ id: 'p2', name: 'Beto de consultorio A', opted_out: false }, { id: 'p1', name: 'Ana de consultorio A', opted_out: true }])} />);
    expect(html).toContain('Sin registro en la app');
    expect(html).toContain('Vista previa');
    expect(html).toContain('Canal');
    expect(html).toContain('WhatsApp · No disponible');
    expect(html).toContain('Te quedan');
    expect(html).toContain('12');
    expect(html).toContain('Historial');
    expect(html).toContain('Bajas');
    expect(html).toContain('1 destinataria de 2');
    expect(html).toContain('Beto de consultorio A');
    expect(html).not.toContain('>Ana de consultorio A<');
  });
  it('no confirma sin la revisión ni mezcla otro consultorio', () => {
    const propio = preview([{ id: 'p2', name: 'Beto de consultorio A', opted_out: false }]);
    expect(pedidoDeCampania({ ...base, preview: propio, confirmed: false })).toBeNull();
    const pedido = pedidoDeCampania({ ...base, preview: propio });
    expect(pedido?.patient_ids).toEqual(['p2']);
    expect(pedido).not.toHaveProperty('dispatch');
    const ajeno = renderToStaticMarkup(<PanelCampaniasView enabled board={board([{ patient_id: 'p9', name: 'Beto de consultorio B', opted_out: true }])} error="" onPreview={vi.fn()} onConfirm={vi.fn()} />);
    expect(ajeno).toContain('Beto de consultorio B');
    expect(ajeno).not.toContain('consultorio A');
  });
  it('el menú no suma Campañas mientras la bandera está apagada', () => {
    expect(panelNavGroups([], 0).flatMap(group => group.items).some(item => item.label === 'Campañas')).toBe(false);
    expect(panelNavGroups([], 0, { campanas: true }).flatMap(group => group.items).find(item => item.label === 'Campañas')?.href).toBe('/crm/desarrollo?modulo=campanas');
  });
});
