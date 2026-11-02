import { describe, expect, it } from 'vitest';
import { ENTRADA_TARJETAS, HOVER_TARJETA, movimientoPermitido } from './inicio-tarjetas';

describe('movimiento de las tarjetas de Inicio', () => {
  it('entra en escalera y se queda quieto si piden menos movimiento', () => {
    expect(movimientoPermitido(false)).toBe(true);
    expect(movimientoPermitido(true)).toBe(false);
    expect(ENTRADA_TARJETAS.stagger).toBe(0.07);
    expect(ENTRADA_TARJETAS.y).toBeGreaterThan(0);
    expect(HOVER_TARJETA).toBeLessThan(0);
  });
});
