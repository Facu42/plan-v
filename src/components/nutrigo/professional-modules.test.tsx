import {renderToStaticMarkup} from 'react-dom/server';
import {describe,it,expect,vi} from 'vitest';
import {PROFESSIONAL_MODULES} from './professional-modules';
import {ProfessionalModules,PlannedModulesNav} from './ProfessionalModules';
import {isAllowedPage} from './app-location';

describe('funciones presentes y previstas del consultorio',()=>{
  it('conserva todas las familias del plan, excluyendo Academy',()=>{
    const ids=PROFESSIONAL_MODULES.map(m=>m.id);
    expect(ids).toEqual(expect.arrayContaining(['inicio','pacientes','seguimiento','mediciones','planificacion','planes','alimentos','recetas','equivalencias','modelos','asistente-ia','mensajes','agenda','cobranzas','pagina-publica','recursos','ayuda','configuracion','progreso-global']));
    expect(ids).not.toContain('academy');expect(new Set(ids).size).toBe(ids.length);
  });
  it('distingue futuro de disponible y no ofrece formularios simulados',()=>{
    const html=renderToStaticMarkup(<ProfessionalModules selectedId="pagina-publica" onOpen={vi.fn()} />);
    expect(html).toContain('Página pública');expect(html).toContain('Disponible');expect(html).toContain('Vista previa');
    expect(html).not.toContain('<form');expect(html).toContain('Abrir módulo');
    const available=renderToStaticMarkup(<ProfessionalModules selectedId="alimentos" onOpen={vi.fn()} />);
    expect(available).toContain('Disponible');expect(available).toContain('Abrir módulo');
  });
  it('el asistente y ayuda abren funciones reales, con revisión y fuentes',()=>{
    const assistant=renderToStaticMarkup(<ProfessionalModules selectedId="asistente-ia" onOpen={vi.fn()} />);
    expect(assistant).toContain('Asistente de cartera');expect(assistant).toContain('Consultar');expect(assistant).not.toContain('En preparación');
    const help=renderToStaticMarkup(<ProfessionalModules selectedId="ayuda" onOpen={vi.fn()} />);
    expect(help).toContain('Centro de ayuda');expect(help).toContain('Buscar una guía');expect(help).toContain('Importar una cartera');
  });
  it('ofrece todos los destinos futuros con estado explícito y sólo en CRM',()=>{
    const html=renderToStaticMarkup(<PlannedModulesNav onOpen={vi.fn()} />);
    for(const m of PROFESSIONAL_MODULES.filter(m=>!m.href))expect(html).toContain(m.title);
    expect(html).not.toContain('En preparación');
    expect(isAllowedPage('pro','desarrollo')).toBe(true);expect(isAllowedPage('patient','desarrollo')).toBe(false);
  });
  it('abre difusiones con revisión individual y configuración con reportes',()=>{
    const communications=renderToStaticMarkup(<ProfessionalModules selectedId="comunicaciones" onOpen={vi.fn()}/>);
    expect(communications).toContain('Mensajes y avisos');
    expect(communications).toContain('Abrir mensajes');
    expect(communications).not.toContain('WhatsApp');
    const settings=renderToStaticMarkup(<ProfessionalModules selectedId="configuracion" onOpen={vi.fn()}/>);
    expect(settings).toContain('Configuración y reportes');
    expect(settings).toContain('Descargar indicadores');
    expect(settings).not.toContain('En preparación');
  });
});
