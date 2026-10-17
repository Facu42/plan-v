import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { MealCorrectionDialog } from './meal-correction';

const meal = { id: 'm1', slot: 'Almuerzo', description: 'Sopa', status: 'pending_review', title: 'Sopa' };

describe('hoja para corregir una comida', () => {
  it('deja corregir o borrar si todavía no está revisada', () => {
    const html = renderToStaticMarkup(<MealCorrectionDialog meal={meal} busy={false} error="" onClose={() => undefined} onCorrect={() => undefined} onDelete={() => undefined} onRequest={() => undefined} />);
    expect(html).toContain('Corregir esta comida');
    expect(html).toContain('Guardar corrección');
    expect(html).toContain('Borrar esta comida');
    expect(html).not.toContain('Pedir corrección');
  });

  it('si ya está revisada, sólo deja pedir la corrección', () => {
    const html = renderToStaticMarkup(<MealCorrectionDialog meal={{ ...meal, status: 'confirmed' }} busy={false} error="" onClose={() => undefined} onCorrect={() => undefined} onDelete={() => undefined} onRequest={() => undefined} />);
    expect(html).toContain('Pedir una corrección');
    expect(html).toContain('Pedir corrección');
    expect(html).not.toContain('Borrar esta comida');
    expect(html).not.toContain('Guardar corrección');
  });
});
