import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import type { Patient } from '../../types';
import { ProfessionalWorkQueue } from './ProfessionalWorkQueue';

const patients = [{ id: 'p1', name: 'Ana', appointment_history: [] }] as unknown as Patient[];

describe('bandeja según la pantalla', () => {
  it('Seguimiento suma las novedades de la cartera; Inicio y Planes no', () => {
    expect(renderToStaticMarkup(<ProfessionalWorkQueue patients={patients} mode="seguimiento" onOpen={vi.fn()} />)).toContain('Novedades de la cartera');
    expect(renderToStaticMarkup(<ProfessionalWorkQueue patients={patients} mode="inicio" onOpen={vi.fn()} />)).not.toContain('Novedades de la cartera');
    expect(renderToStaticMarkup(<ProfessionalWorkQueue patients={patients} mode="planes" onOpen={vi.fn()} />)).not.toContain('Novedades de la cartera');
  });
});
