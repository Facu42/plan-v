import { afterEach, describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { clampPip, closeCall, getCallPip, moveCall, openCall, resetCallPip, setCallPhase, snapCall } from './call-pip';
import { CallPipHost } from '../components/nutrigo/CallPip';

describe('sala flotante', () => {
  afterEach(() => resetCallPip());

  it('no se abre si la bandera está apagada', () => {
    expect(openCall({ patientId: 'p1', label: 'AR' }, false)).toBe(false);
    expect(getCallPip().open).toBe(false);
    expect(renderToStaticMarkup(<CallPipHost enabled={false} />)).toBe('');
  });

  it('queda en la esquina y se puede arrastrar sin salir de la pantalla', () => {
    openCall({ patientId: 'p1', label: 'AR' }, true);
    expect(getCallPip().corner).toBe('right');
    snapCall('left');
    expect(getCallPip().corner).toBe('left');
    moveCall(-40, 5000, { w: 390, h: 800 });
    expect(getCallPip()).toMatchObject(clampPip(-40, 5000, { w: 390, h: 800 }));
    expect(getCallPip().x).toBeGreaterThanOrEqual(8);
    expect(getCallPip().y).toBeLessThanOrEqual(800 - 180 - 8);
  });

  it('sigue montada cuando cambia la pantalla y el aviso del resumen también', () => {
    openCall({ patientId: 'p1', label: 'AR' }, true);
    const agenda = renderToStaticMarkup(<><CallPipHost enabled /><main>Agenda</main></>);
    const ficha = renderToStaticMarkup(<><CallPipHost enabled /><main>Ficha</main></>);
    for (const html of [agenda, ficha]) {
      expect(html).toContain('data-call-pip="on"');
      expect(html).toContain('data-provider="livekit"');
      expect(html).toContain('data-connected="false"');
      expect(html).toContain('data-draggable="true"');
      expect(html).not.toContain('wss://');
      expect(html).not.toContain('api_key');
    }
    expect(agenda).toContain('Agenda');
    expect(ficha).toContain('Ficha');
    setCallPhase('working');
    closeCall();
    const otra = renderToStaticMarkup(<><CallPipHost enabled /><main>Cobranzas</main></>);
    expect(otra).toContain('data-summary-banner="working"');
    expect(otra).toContain('Preparando el resumen');
    expect(otra).toContain('Cobranzas');
    expect(otra).not.toContain('data-call-pip');
  });
});
