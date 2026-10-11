import { renderToStaticMarkup } from 'react-dom/server';
import { describe,expect,it,vi } from 'vitest';
import shopping from './source/105-2472.json';
import { findSource,SourceView,nodeName,sourceText,type SourceNode } from './SourceView';
import { patientNavBinding,patientNavigation } from './patient-navigation';
import { translateSource } from './translation';

describe('navegación del paciente desde el archivo',()=>{
  it('abre Compras desde su submenú sin convertir todo el grupo en un botón del plan',()=>{
    const source=shopping as SourceNode;
    const group=findSource(source,node=>nodeName(node)==='Button Nav'&&sourceText(node).includes('Grocery List'))!;
    const navigate=vi.fn();
    const html=renderToStaticMarkup(<SourceView source={group} resolve={node=>patientNavBinding(node,navigate,0)} translate={translateSource}/>);
    expect(html.replace(/<link[^>]*>/g,'')).toMatch(/^<div/);
    expect(html.match(/<button\s/g)).toHaveLength(3);
    expect(html).toContain('role="group"');expect(html).toContain('aria-label="Compras"');
    const submenu=findSource(group,node=>nodeName(node)==='SubMenu'&&sourceText(node)==='Grocery List')!;
    patientNavBinding(submenu,navigate,0)?.onClick?.();expect(navigate).toHaveBeenCalledWith('compras');
    expect(patientNavBinding(group,navigate,0)?.onClick).toBeUndefined();
  });
  it('el contador de mensajes proviene del hilo y se oculta cuando no hay pendientes',()=>{
    const messages=findSource(shopping as SourceNode,node=>nodeName(node)==='Button Nav'&&sourceText(node).startsWith('Messages'))!;
    const render=(unread:number)=>renderToStaticMarkup(<SourceView source={messages} resolve={node=>patientNavBinding(node,()=>undefined,unread)} translate={translateSource}/>);
    expect(render(0)).not.toContain('data-name="Badge"');expect(render(3)).toContain('>3</p>');expect(render(3)).not.toContain('>6</p>');
  });
  it('el contador tolera cifras grandes, negativas o inválidas sin romper el diseño',()=>{
    const messages=findSource(shopping as SourceNode,node=>nodeName(node)==='Button Nav'&&sourceText(node).startsWith('Messages'))!;
    const render=(unread:number)=>renderToStaticMarkup(<SourceView source={messages} resolve={node=>patientNavBinding(node,()=>undefined,unread)} translate={translateSource}/>);
    expect(render(0.5)).not.toContain('data-name="Badge"');expect(render(250)).toContain('>99+</p>');expect(render(99)).toContain('>99</p>');
    for(const bad of [-2,Number.NaN,Number.POSITIVE_INFINITY*0])expect(render(bad)).not.toContain('data-name="Badge"');
  });
  it('incluye los diez destinos principales reales',()=>{
    expect(new Set(Object.values(patientNavigation))).toEqual(new Set(['inicio','agenda','mensajes','recetas','plan','compras','diario','progreso','ejercicio','recursos']));
  });
});
