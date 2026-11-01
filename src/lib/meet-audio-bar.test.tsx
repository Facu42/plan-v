import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { captureSample } from './consultation-capture';
import { getMeetAudio, ofertaGrabacion, resetMeetAudio, setMeetAudio, tabAudioSupport } from './meet-audio-bar';
import { finishMeetAudio, MeetAudioBar, OfertaGrabarAudio, startMeetAudio } from '../components/nutrigo/MeetAudioBar';
import { consultationsApi } from '../api/consultations';

vi.mock('../api/consultations', () => ({
  consultationsApi: { command: vi.fn(), chunk: vi.fn(), list: vi.fn() },
}));

describe('audio de la llamada de Meet', () => {
  afterEach(() => resetMeetAudio());

  it('reconoce Chrome y Edge, y deja Safari y Firefox en solo micrófono', () => {
    expect(tabAudioSupport('Mozilla/5.0 Chrome/120.0 Safari/537.36')).toBe('tab');
    expect(tabAudioSupport('Mozilla/5.0 Edg/120.0')).toBe('tab');
    expect(tabAudioSupport('Mozilla/5.0 Firefox/121.0')).toBe('mic-only');
    expect(tabAudioSupport('Mozilla/5.0 Version/17.0 Safari/605.1.15')).toBe('mic-only');
    expect(ofertaGrabacion('mic-only', true)?.title).toBe('Grabar solo el micrófono');
    expect(ofertaGrabacion('mic-only', true)?.hint).toMatch(/Chrome o Edge/);
    expect(ofertaGrabacion('mic-only', true)?.hint).toMatch(/compartir pestaña con audio/);
    expect(ofertaGrabacion('tab', false)).toBeNull();
    expect(captureSample(true, false)).toBe(true);
    expect(captureSample(true, true)).toBe(false);
  });

  it('el aviso de grabación sigue al cambiar de pantalla y no muestra video', () => {
    setMeetAudio({ phase: 'recording', patientId: 'p1', sessionId: 's1', notice: '', hint: '' });
    const agenda = renderToStaticMarkup(<><MeetAudioBar /><main>Agenda</main></>);
    const ficha = renderToStaticMarkup(<><MeetAudioBar /><main>Ficha</main></>);
    for (const html of [agenda, ficha]) {
      expect(html).toContain('Grabando audio');
      expect(html).toContain('Pausar');
      expect(html).toContain('Terminar');
      expect(html).toContain('data-meet-audio="recording"');
      expect(html).not.toContain('livekit');
      expect(html).not.toContain('<video');
    }
    expect(agenda).toContain('Agenda');
    expect(ficha).toContain('Ficha');
    setMeetAudio({ phase: 'working', notice: 'Preparando el resumen de la consulta. Podés seguir en otra pantalla.' });
    const cobranzas = renderToStaticMarkup(<><MeetAudioBar /><main>Cobranzas</main></>);
    expect(cobranzas).toContain('Preparando el resumen');
    expect(cobranzas).not.toContain('Pausar');
    setMeetAudio({ phase: 'ready', notice: 'El resumen quedó en la ficha. Revisalo antes de compartirlo.' });
    expect(renderToStaticMarkup(<MeetAudioBar />)).toContain('El resumen quedó en la ficha');
  });

  it('no ofrece grabar si faltan los permisos', () => {
    const html = renderToStaticMarkup(<OfertaGrabarAudio allowed={false} support="tab" onStart={vi.fn()} />);
    expect(html).toBe('');
    const si = renderToStaticMarkup(<OfertaGrabarAudio allowed support="tab" onStart={vi.fn()} />);
    expect(si).toContain('Grabar audio de la llamada');
    expect(si).toContain('No se guarda video');
  });

  it('pide la pestaña con audio antes de abrir la consulta y no graba video', async () => {
    const steps: string[] = [];
    const video = { enabled: true, readyState: 'live', stop: vi.fn(), addEventListener: vi.fn() };
    const remote = { readyState: 'live', stop: vi.fn(), addEventListener: vi.fn() };
    const micTrack = { readyState: 'live', stop: vi.fn(), addEventListener: vi.fn() };
    const processor = { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null as null | (() => void) };
    class Context {
      sampleRate = 48000; state = 'running'; destination = {};
      resume = async () => undefined;
      close = async () => undefined;
      createScriptProcessor = () => processor;
      createGain = () => ({ gain: { value: 1 }, connect: vi.fn() });
      createMediaStreamSource = () => ({ connect: vi.fn() });
      createAnalyser = () => ({ fftSize: 32, getFloatTimeDomainData: vi.fn() });
    }
    vi.stubGlobal('AudioContext', Context);
    vi.stubGlobal('window', { AudioContext: Context });
    vi.stubGlobal('MediaStream', class { constructor(public tracks: unknown[]) {} });
    vi.stubGlobal('navigator', { mediaDevices: {
      getDisplayMedia: vi.fn(async () => { steps.push('tab'); return { getAudioTracks: () => [remote], getVideoTracks: () => [video], getTracks: () => [video, remote] }; }),
      getUserMedia: vi.fn(async () => { steps.push('mic'); return { getAudioTracks: () => [micTrack], getVideoTracks: () => [], getTracks: () => [micTrack] }; }),
    } });
    vi.mocked(consultationsApi.command).mockImplementation(async () => {
      steps.push('command');
      return { session: { id: '11111111-1111-4111-8111-111111111111', revision: 1 } } as Awaited<ReturnType<typeof consultationsApi.command>>;
    });
    await startMeetAudio({ patientId: 'p1', mode: 'tab', consented: ['consultation_recording', 'ai_consultation'] });
    expect(steps).toEqual(['tab', 'mic', 'command']);
    expect(video.enabled).toBe(false);
    expect(getMeetAudio().phase).toBe('recording');
    await finishMeetAudio();
    vi.unstubAllGlobals();
  });
});
