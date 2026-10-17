import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { exportFileName, ShowroomPrivacy } from './ShowroomPrivacy';

describe('Tus datos', () => {
  it('ofrece descargar la copia, borrar la cuenta y leer la política', () => {
    const html = renderToStaticMarkup(<ShowroomPrivacy patientId="p1" onClose={() => {}} onDeleted={() => {}} />);
    expect(html).toContain('Tus datos');
    expect(html).toContain('Descargar una copia');
    expect(html).toContain('Borrar mi cuenta');
    expect(html).toContain('/legal/privacidad.html');
    expect(html).toContain('/legal/terminos.html');
    expect(html).toContain('Mis avisos por correo');
    expect(html).toContain('Quiero recibir avisos operativos del consultorio por correo.');
  });

  it('nombra la copia sólo con la fecha', () => {
    expect(exportFileName(new Date(2026, 8, 9))).toBe('plan-v-mis-datos-2026-09-09.json');
  });
});
