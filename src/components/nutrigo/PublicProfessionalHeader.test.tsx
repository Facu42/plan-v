import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { schedulingDefaultSettings } from '../../types/scheduling';
import { publicPageProfile } from '../../lib/public-page-profile';
import { PublicProfessionalHeader } from './PublicProfessionalHeader';

const page = {
  ...schedulingDefaultSettings(),
  page: { ...schedulingDefaultSettings().page, title: 'Lic. Ana Pérez', bio: 'Acompaño sin dietas extremas.', location: 'Cabildo 100', contact: 'MN 12' },
  page_extras: { area: 'Belgrano', specialties: ['Embarazo'], modality: 'ambas' as const, consult_price_minor: 3500000, booking_url: 'https://turno.example/ana', color: '#112233', accent: '#C2E66E' },
};

describe('encabezado público /slug', () => {
  it('muestra foto, bio, especialidades, modalidad, zona, precio y el link de reserva', () => {
    const html = renderToStaticMarkup(<PublicProfessionalHeader page={{
      page: page.page, profile: publicPageProfile(page.page_extras, 'data:image/png;base64,xx'),
      calendars: page.calendars, types: page.types, timezone: page.timezone, transfer_alias: '', mercado_pago_connected: false,
    }} />);
    for (const texto of ['Lic. Ana Pérez', 'Acompaño sin dietas extremas.', 'Embarazo', 'Presencial y online', 'Belgrano', '$35.000', 'https://turno.example/ana', 'Reservar turno']) {
      expect(html).toContain(texto);
    }
    expect(html).toContain('data:image/png;base64,xx');
    expect(html).not.toContain('Verónica');
  });

  it('sin extras no inventa precio ni un mail de reserva', () => {
    const html = renderToStaticMarkup(<PublicProfessionalHeader page={{
      page: schedulingDefaultSettings().page, profile: publicPageProfile(undefined),
      calendars: [], types: [], timezone: 'America/Argentina/Buenos_Aires', transfer_alias: '', mercado_pago_connected: false,
    }} />);
    expect(html).not.toContain('Consulta $');
    expect(html).not.toContain('Reservar turno');
    expect(html).not.toContain('mailto:');
  });
});
