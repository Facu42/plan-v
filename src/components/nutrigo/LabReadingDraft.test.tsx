import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { pedidoLaboratorio } from './lab-borrador';
import { LabReadingDraft } from './LabReadingDraft';

const fila = (reviewed: boolean) => ({ name: 'Glucemia', value: '91', unit: 'mg/dL', range: '70-99', reviewed });

describe('borrador de laboratorio', () => {
  it('apagado no se ve', () => {
    expect(renderToStaticMarkup(<LabReadingDraft patientId="p1" enabled={false} />)).toBe('');
  });
  it('pide revisión antes de guardar y deja editar el borrador', () => {
    const pendiente = renderToStaticMarkup(<LabReadingDraft patientId="p1" enabled rows={[fila(false)]} />);
    expect(pendiente).toContain('Borrador del informe');
    expect(pendiente).toContain('Preparar borrador');
    expect(pendiente).toContain('disabled="">Guardar revisado');
    const listo = renderToStaticMarkup(<LabReadingDraft patientId="p1" enabled rows={[fila(true)]} />);
    expect(listo).toContain('>Guardar revisado<');
    expect(listo).not.toContain('disabled="">Guardar revisado');
  });
  it('sin revisión el pedido no existe', () => {
    expect(pedidoLaboratorio([fila(false)])).toBeNull();
    expect(pedidoLaboratorio([fila(true)])?.[0].reviewed).toBe(true);
  });
});
