import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { FxCurva } from './ficha-fx';

describe('FxCurva', () => {
  it('marca la curva chica en rojo solo cuando el valor está fuera de rango', () => {
    const fuera = renderToStaticMarkup(<FxCurva valores={[1, 2, 3]} mini alerta />);
    const dentro = renderToStaticMarkup(<FxCurva valores={[1, 2, 3]} mini />);

    expect(fuera).toContain('fxc mini wa');
    expect(dentro).not.toContain(' wa');
  });
});
