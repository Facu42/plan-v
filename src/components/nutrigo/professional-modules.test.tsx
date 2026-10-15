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
    const html=renderToStaticMarkup(<ProfessionalModules selectedId="asistente-ia" onOpen={vi.fn()} />);
    expect(html).toContain('Asistente IA');expect(html).toContain('En preparación');expect(html).toContain('Fuentes y motivos');
    expect(html).not.toContain('<form');expect(html).not.toContain('Abrir módulo');
    const available=renderToStaticMarkup(<ProfessionalModules selectedId="alimentos" onOpen={vi.fn()} />);
    expect(available).toContain('Disponible');expect(available).toContain('Abrir módulo');
  });
  it('ofrece todos los destinos futuros con estado explícito y sólo en CRM',()=>{
    const html=renderToStaticMarkup(<PlannedModulesNav onOpen={vi.fn()} />);
    for(const m of PROFESSIONAL_MODULES.filter(m=>!m.href))expect(html).toContain(m.title);
    expect(html).toContain('En preparación');
    expect(isAllowedPage('pro','desarrollo')).toBe(true);expect(isAllowedPage('patient','desarrollo')).toBe(false);
  });
});

describe('nutrición disponible en entrega 4',()=>{
  it('ofrece las cinco funciones nutricionales sin anunciar los módulos futuros',()=>{
    for(const id of ['planificacion','planes','alimentos','equivalencias','configuracion']){const module=PROFESSIONAL_MODULES.find(row=>row.id===id);expect(module?.href).toBeTruthy();expect(module?.current.length).toBeGreaterThan(0);}
    expect(PROFESSIONAL_MODULES.find(row=>row.id==='asistente-ia')?.href).toBeUndefined();
    expect(PROFESSIONAL_MODULES.find(row=>row.id==='configuracion')?.current.join(' ')).not.toContain('reportes');
  });
});
