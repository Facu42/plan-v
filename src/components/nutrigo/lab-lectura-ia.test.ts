import { describe, expect, it } from 'vitest';
import { pedidoParaIA } from './lab-lectura';

describe('pedido a la IA', () => {
  it('sin valores no arma pedido', () => { expect(pedidoParaIA([])).toBeNull(); });
});
