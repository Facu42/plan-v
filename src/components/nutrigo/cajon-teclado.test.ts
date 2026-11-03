import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const carpeta = new URL('./', import.meta.url);
const fuentes = readdirSync(carpeta).filter(nombre => nombre.endsWith('.tsx') && !nombre.endsWith('.test.tsx'))
  .map(nombre => [nombre, readFileSync(new URL(nombre, carpeta), 'utf8')] as const);

describe('cajones laterales del panel', () => {
  const propios = fuentes.filter(([, fuente]) => fuente.includes('id="actw"'));
  const conMarco = fuentes.filter(([, fuente]) => fuente.includes('<CajonMarco'));

  it('la mayoría se arma con el armazón único', () => {
    expect(conMarco.map(([n]) => n).sort()).toEqual(expect.arrayContaining(['AjustesCajon.tsx', 'CajonV29.tsx', 'FichaEtiquetas.tsx', 'LabLectura.tsx', 'PanelFichaPedirRegistro.tsx', 'PanelGrupos.tsx', 'PanelMensajeVarias.tsx']));
  });

  // Biblioteca y Ayuda tienen su propio manejo del teclado (Tab adentro y Escape); el resto usa el foco compartido.
  const TECLADO_PROPIO = new Set(['PanelBiblioteca.tsx', 'HelpCenter.tsx']);
  it('todo cajón armado a mano mantiene el teclado adentro y se cierra con Escape', () => {
    const sin = propios.filter(([nombre, fuente]) => !TECLADO_PROPIO.has(nombre) && !fuente.includes('useModalFocus')).map(([nombre]) => nombre);
    expect(sin).toEqual([]);
    for (const [nombre, fuente] of propios) if (TECLADO_PROPIO.has(nombre)) { expect(fuente, nombre).toContain('Escape'); expect(fuente, nombre).toContain("event.key !== 'Tab'"); }
  });

  it('no aparecen cajones nuevos armados a mano', () => {
    expect(propios.map(([n]) => n).sort()).toEqual(['CajonV29.tsx', 'HelpCenter.tsx', 'PanelAlimentos.tsx', 'PanelBiblioteca.tsx', 'PanelSeguimiento.tsx']);
  });
});
