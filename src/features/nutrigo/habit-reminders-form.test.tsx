import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { HabitPushDiagnostics, HabitReminderFields, textoDiagnostico, type PermisoAviso } from './habit-reminders-form';
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

  it('el diagnóstico dice permiso, suscripción y solo ofrece la prueba fuera de la versión publicada', () => {
    const permisos: PermisoAviso[] = ['permitido', 'bloqueado', 'sin-pedir', 'no-disponible'];
    const esperados = ['permite los avisos', 'bloqueados en los ajustes', 'todavía no pedimos permiso', 'no recibe avisos'];
    permisos.forEach((permiso, index) => {
      expect(textoDiagnostico({ permiso, suscripcion: false, prueba: false, avisosActivos: false }).permiso).toContain(esperados[index]);
    });
    expect(textoDiagnostico({ permiso: 'permitido', suscripcion: true, prueba: true, avisosActivos: true }).suscripcion).toContain('está anotado');
    expect(textoDiagnostico({ permiso: 'permitido', suscripcion: false, prueba: true, avisosActivos: true }).suscripcion).toContain('no está anotado');
    expect(textoDiagnostico({ permiso: 'permitido', suscripcion: true, prueba: true, avisosActivos: false }).prueba).toContain('no están activos');
    const local = renderToStaticMarkup(<HabitPushDiagnostics permiso="permitido" suscripcion prueba avisosActivos />);
    expect(local).toContain('Mandar aviso de prueba');
    expect(local).not.toContain('versión publicada');
    const publicado = renderToStaticMarkup(<HabitPushDiagnostics permiso="bloqueado" suscripcion={false} prueba={false} avisosActivos={false} />);
    expect(publicado).toContain('versión publicada');
    expect(publicado).not.toContain('Mandar aviso de prueba');
    expect(renderToStaticMarkup(<HabitPushDiagnostics permiso="permitido" suscripcion={false} prueba avisosActivos />)).toContain('disabled=""');
  });

  it('muestra prendido lo que la paciente eligió', () => {
    const html = renderToStaticMarkup(<HabitReminderFields prefs={{ ...DEFAULT_HABIT_REMINDERS, sleepOn: true, sleepTime: '22:30' }} />);
    expect(html).toContain('checked=""');
    expect(html).toContain('value="22:30"');
  });
});
