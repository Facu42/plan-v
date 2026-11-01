import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HabitReminderFields } from './habit-reminders-form';
import { DEFAULT_HABIT_REMINDERS } from '../../habit-reminders';

describe('configuración de recordatorios', () => {
  it('muestra comer, agua y dormir apagados, y se pueden guardar', () => {
    const html = renderToStaticMarkup(<HabitReminderFields />);
    expect(html).toContain('Avisame para comer');
    expect(html).toContain('Avisame para tomar agua');
    expect(html).toContain('Avisame para dormir');
    expect(html).toContain('Guardar recordatorios');
    expect(html).toContain('Empiezan apagados');
    expect(html).not.toContain('checked=""');
  });

  it('muestra prendido lo que la paciente eligió', () => {
    const html = renderToStaticMarkup(<HabitReminderFields prefs={{ ...DEFAULT_HABIT_REMINDERS, sleepOn: true, sleepTime: '22:30' }} />);
    expect(html).toContain('checked=""');
    expect(html).toContain('value="22:30"');
  });
});
