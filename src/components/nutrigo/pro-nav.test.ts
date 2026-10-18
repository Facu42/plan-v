import { describe, expect, it } from 'vitest';
import { PRO_MOBILE_IDS, PRO_NAV_GROUPS, proNavItems, rememberPatient } from './pro-nav';

describe('menú del consultorio', () => {
  it('ordena los cuatro grupos y no esconde lo que todavía no está', () => {
    expect(PRO_NAV_GROUPS.map((group) => group.title)).toEqual(['Gestión', 'Acompañamiento', 'Plan', 'Recursos']);
    expect(PRO_NAV_GROUPS[0].items.map((item) => item.label)).toEqual(['Inicio', 'Pacientes', 'Agenda', 'Cobranzas', 'Página pública']);
    expect(PRO_NAV_GROUPS[1].items.map((item) => item.label)).toEqual(['Asistente IA', 'Seguimiento', 'Mensajes', 'Progreso']);
    expect(PRO_NAV_GROUPS[2].items.map((item) => item.label)).toEqual(['Planes', 'Alimentos', 'Recetas', 'Equivalencias', 'Modelos', 'Ejercicio']);
    expect(PRO_NAV_GROUPS[3].items.map((item) => item.label)).toEqual(['Biblioteca', 'Centro de ayuda']);
    expect(proNavItems().find((item) => item.id === 'pagina-publica')?.soon).toBe(true);
    expect(proNavItems().every((item) => item.href.startsWith('/crm/'))).toBe(true);
  });

  it('deja la barra del celular en Inicio, Pacientes, Seguimiento y Agenda', () => {
    expect([...PRO_MOBILE_IDS]).toEqual(['inicio', 'pacientes', 'seguimiento', 'agenda']);
  });

  it('recuerda la paciente abierta al armar el enlace', () => {
    expect(rememberPatient('/crm/agenda', 'pat-sofia')).toBe('/crm/agenda?paciente=pat-sofia');
    expect(rememberPatient('/crm/ficha?seccion=resumen&paciente=otra', 'pat-sofia')).toBe('/crm/ficha?seccion=resumen&paciente=otra');
    expect(rememberPatient('/crm/inicio', null)).toBe('/crm/inicio');
  });

  it('marca Recetas y Biblioteca según el parámetro, sin pisarse', () => {
    const recetas = proNavItems().find((item) => item.id === 'recetas')!;
    const biblioteca = proNavItems().find((item) => item.id === 'biblioteca')!;
    const recipes = new URLSearchParams('biblioteca=recetas');
    const resources = new URLSearchParams('biblioteca=recursos');
    expect(recetas.current('biblioteca', recipes, '')).toBe(true);
    expect(biblioteca.current('biblioteca', recipes, '')).toBe(false);
    expect(biblioteca.current('biblioteca', resources, '')).toBe(true);
    expect(recetas.current('biblioteca', resources, '')).toBe(false);
  });
});
