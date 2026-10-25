import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { request } from '../../api/client';
import { friendlyError } from '../../lib/error-messages';
import { indicatorsCsv } from '../../lib/portfolio-csv';
import { useAppStore } from '../../store/useAppStore';
import type { PortfolioAnswer, PortfolioIndicators } from '../../types/portfolio';
import {
  esPeriodo, fuentesDe, nombresDePropuestas, propuestasDe,
  type PeriodoAsistente,
} from './asistente-presentacion';
import { AccionesAsistente, PanelAsistenteVista, type TurnoAsistente } from './PanelAsistente';

type Modo = 'agregar' | 'reemplazar' | 'ultima';
type Pedido = { days?: PeriodoAsistente; useAi?: boolean; modo?: Modo; silencio?: boolean; avisoExito?: string; limpiar?: boolean; signal?: AbortSignal };

export function PortfolioAssistant({ onOpen, onHeader }: { onOpen: (href: string) => void; onHeader?: (actions: ReactNode) => void }) {
  const pacientes = useAppStore(estado => estado.patients);
  const [pregunta, setPregunta] = useState('');
  const [days, setDays] = useState<PeriodoAsistente>(30);
  const [useAi, setUseAi] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [turnos, setTurnos] = useState<TurnoAsistente[]>([]);
  const [estado, setEstado] = useState<'cargando' | 'lista' | 'error'>('cargando');
  const control = useRef<AbortController | null>(null);
  const operacion = useRef<{ payload: string; id: string } | null>(null);
  const pacientesRef = useRef(pacientes);
  const huboTurnos = useRef(false);
  pacientesRef.current = pacientes;
  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    window.setTimeout(() => setAviso(actual => actual === texto ? '' : actual), 3600);
  }, []);

  const pedir = useCallback(async (texto: string, opciones?: Pedido) => {
    const limpio = texto.trim();
    const modo = opciones?.modo ?? 'agregar';
    if (!limpio) {
      document.querySelector<HTMLTextAreaElement>('#s-asistente [aria-label="Pedido para el asistente"]')?.focus();
      avisar('Escribí el pedido en la caja. Puede ser de una paciente o de toda la cartera.');
      return;
    }
    const periodo = opciones?.days ?? days;
    const ia = opciones?.useAi ?? useAi;
    control.current?.abort();
    const actual = new AbortController();
    control.current = actual;
    const senal = opciones?.signal;
    const cortar = () => actual.abort();
    senal?.addEventListener('abort', cortar);
    setOcupado(true);
    setError('');
    setEstado('cargando');
    try {
      const carga = JSON.stringify({ question: limpio, days: periodo, use_ai: ia });
      if (operacion.current?.payload !== carga) operacion.current = { payload: carga, id: crypto.randomUUID() };
      const respuesta = await request<PortfolioAnswer>('/api/portfolio/assistant', {
        method: 'POST',
        body: JSON.stringify({ question: limpio, days: periodo, use_ai: ia, request_id: operacion.current.id }),
        signal: actual.signal,
      });
      if (actual.signal.aborted) return;
      if (!ia || respuesta.mode === 'ai') operacion.current = null;
      const fuentes = fuentesDe(respuesta, pacientesRef.current);
      const turno: TurnoAsistente = {
        clave: crypto.randomUUID(),
        pregunta: limpio,
        respuesta: respuesta.answer,
        aviso: respuesta.ai_notice ?? '',
        excluidas: respuesta.excluded_without_consent,
        propuestas: nombresDePropuestas(propuestasDe(respuesta, ia), fuentes),
        fuentes,
      };
      const siguientes = modo === 'reemplazar' ? [turno] : modo === 'ultima' ? [turno] : null;
      setTurnos(previos => {
        const lista = siguientes ?? [...previos, turno];
        if (modo === 'ultima' && previos.length) return [...previos.slice(0, -1), turno];
        return lista;
      });
      huboTurnos.current = true;
      if (opciones?.limpiar) setPregunta('');
      setEstado('lista');
      if (!opciones?.silencio) avisar(opciones?.avisoExito ?? 'Respuesta agregada. No se le envió a nadie.');
    } catch (motivo) {
      if (actual.signal.aborted) return;
      setError(friendlyError(motivo));
      setEstado(huboTurnos.current ? 'lista' : 'error');
    } finally {
      senal?.removeEventListener('abort', cortar);
      if (!actual.signal.aborted) setOcupado(false);
    }
  }, [avisar, days, useAi]);

  const pedirRef = useRef(pedir);
  pedirRef.current = pedir;
  useEffect(() => {
    const ac = new AbortController();
    void (async () => {
      let periodo: PeriodoAsistente = 30;
      try {
        const data = await request<{ settings: { default_days: number } }>('/api/portfolio/settings', { signal: ac.signal });
        if (esPeriodo(data.settings.default_days)) periodo = data.settings.default_days;
      } catch {
        if (ac.signal.aborted) return;
      }
      if (ac.signal.aborted) return;
      setDays(periodo);
      await pedirRef.current('Resumen de la cartera', { days: periodo, useAi: false, modo: 'reemplazar', silencio: true, signal: ac.signal });
    })();
    return () => ac.abort();
  }, []);

  const cambiarDias = useCallback((periodo: PeriodoAsistente) => {
    if (periodo === days) {
      avisar(`Ya estás viendo ${periodo} días.`);
      return;
    }
    setDays(periodo);
    avisar(`Período de ${periodo} días.`);
    void pedir('Resumen de la cartera', { days: periodo, modo: 'reemplazar', silencio: true });
  }, [avisar, days, pedir]);

  const alternar = useCallback(() => {
    const siguiente = !useAi;
    setUseAi(siguiente);
    avisar(siguiente ? 'Las propuestas quedan prendidas, siempre para revisar.' : 'Propuestas apagadas. Seguís viendo los números.');
    const ultima = turnos[turnos.length - 1]?.pregunta ?? 'Resumen de la cartera';
    void pedir(ultima, { useAi: siguiente, modo: 'ultima', silencio: true });
  }, [avisar, pedir, turnos, useAi]);

  const exportar = useCallback(async () => {
    setError('');
    try {
      const data = await request<PortfolioIndicators>(`/api/portfolio/indicators?days=${days}`);
      const csv = indicatorsCsv(data);
      const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = 'indicadores-cartera.csv';
      enlace.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      avisar('Listo: indicadores-cartera.csv se descargó en esta computadora.');
    } catch (motivo) {
      setError(friendlyError(motivo));
    }
  }, [avisar, days]);

  const consultarCaja = useCallback(() => { void pedir(pregunta, { modo: 'agregar', limpiar: true }); }, [pedir, pregunta]);

  useEffect(() => () => onHeader?.(null), [onHeader]);
  useEffect(() => {
    if (!onHeader) return undefined;
    onHeader(<AccionesAsistente days={days} ocupado={ocupado} onDays={cambiarDias} onDescargar={() => void exportar()} onConsultar={consultarCaja} />);
    return () => onHeader(null);
  }, [onHeader, days, ocupado, cambiarDias, exportar, consultarCaja]);

  return <PanelAsistenteVista
    pregunta={pregunta}
    propuestasOn={useAi}
    turnos={turnos}
    estado={estado}
    ocupado={ocupado}
    error={error}
    aviso={aviso}
    acciones={onHeader ? null : <AccionesAsistente days={days} ocupado={ocupado} onDays={cambiarDias} onDescargar={() => void exportar()} onConsultar={consultarCaja} />}
    onPregunta={setPregunta}
    onConsultar={consultarCaja}
    onSugerencia={texto => { void pedir(texto, { modo: 'agregar', avisoExito: 'Listo.' }); }}
    onToggle={alternar}
    onFicha={(href, nombre) => { avisar(nombre ? `Ficha de ${nombre}, para revisar la propuesta.` : 'Abriste la ficha para revisar la propuesta.'); onOpen(href); }}
    onFuente={fuente => { avisar(`Fuente: ${fuente.nombre} · su ficha.`); onOpen(fuente.ficha); }}
    onRevisar={() => avisar('Quedó marcada para vos. No se le envió a la paciente.')}
  />;
}
