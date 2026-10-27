import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { isAbortError } from '../../api/client';
import { crmProgressApi } from '../../api/crm-progress';
import { progressApi } from '../../api/progress';
import type { Patient } from '../../types';
import type { ProgressPeriodDays, ProgressSeries } from '../../types/progress';
import type { GlobalProgressResponse } from '../../types/progress-global';
import { PanelProgresoVista, PeriodoProgreso } from './PanelProgreso';
import { TOAST_DESMONTE_MS } from './panel-v29-motion';
import { filasDe, puntosDeSerie, type FiltroCartera, type OrdenCartera, type PuntoPeso } from './progreso-presentacion';
import { NvButton, NvState } from './primitives';

type Curva = { estado: 'lista' | 'vacia' | 'cargando' | 'error'; puntos: PuntoPeso[]; series: ProgressSeries[] | null };

const vacia: Curva = { estado: 'vacia', puntos: [], series: null };

export function ProfessionalProgressGlobal({ onOpen, onHeader, patients = [] }: {
  onOpen: (href: string) => void;
  onHeader?: (actions: ReactNode) => void;
  patients?: readonly Pick<Patient, 'id' | 'name' | 'initials' | 'tone' | 'created_at' | 'archived_at'>[];
}) {
  const [days, setDays] = useState<ProgressPeriodDays>(30);
  const [data, setData] = useState<GlobalProgressResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refresh, setRefresh] = useState(0);
  const [filtro, setFiltro] = useState<FiltroCartera>('all');
  const [orden, setOrden] = useState<OrdenCartera>('name');
  const [elegida, setElegida] = useState('');
  const [aviso, setAviso] = useState('');
  const [curva, setCurva] = useState<Curva>(vacia);
  const avisar = useCallback((texto: string) => {
    setAviso(texto);
    window.setTimeout(() => setAviso(actual => actual === texto ? '' : actual), TOAST_DESMONTE_MS);
  }, []);
  const cambiarDias = useCallback((periodo: ProgressPeriodDays) => {
    setDays(periodo);
    avisar(`Período de ${periodo} días.`);
  }, [avisar]);
  const cambiarOrden = (siguiente: OrdenCartera) => {
    setOrden(siguiente);
    const etiqueta = siguiente === 'name' ? 'Nombre' : siguiente === 'meals' ? 'Más comidas' : siguiente === 'weight-change' ? 'Cambio de peso' : 'Adherencia';
    avisar(siguiente === 'adherence' ? 'Orden: Adherencia. Sin dato: la app no registra la adherencia al plan.' : `Orden: ${etiqueta}.`);
  };

  useEffect(() => {
    onHeader?.(<PeriodoProgreso days={days} onDays={cambiarDias} />);
    return () => onHeader?.(null);
  }, [onHeader, days, cambiarDias]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    crmProgressApi.global(days, controller.signal)
      .then(resultado => { if (!controller.signal.aborted) setData(resultado); })
      .catch(motivo => { if (!controller.signal.aborted) { setData(null); setError(motivo instanceof Error ? motivo.message : 'No pudimos consultar el progreso.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [days, refresh]);

  const filas = data ? filasDe(data.patients, filtro, orden) : [];
  const quien = filas.some(fila => fila.patient_id === elegida) ? elegida : (filas[0]?.patient_id ?? '');
  const fila = data?.patients.find(item => item.patient_id === quien) ?? null;
  const puntosContados = fila?.weight.state === 'ok' ? fila.weight.points : 0;

  useEffect(() => {
    if (!quien || puntosContados < 2) {
      setCurva(vacia);
      return undefined;
    }
    const controller = new AbortController();
    setCurva({ estado: 'cargando', puntos: [], series: null });
    progressApi.get(quien, days, controller.signal)
      .then(resultado => {
        if (controller.signal.aborted) return;
        const puntos = puntosDeSerie(resultado.progress.series);
        setCurva(puntos.length >= 2 ? { estado: 'lista', puntos, series: resultado.progress.series } : vacia);
      })
      .catch(motivo => {
        if (isAbortError(motivo) || controller.signal.aborted) return;
        setCurva({ estado: 'error', puntos: [], series: null });
      });
    return () => controller.abort();
  }, [quien, puntosContados, days]);

  if (loading && !data) return <NvState kind="loading" title="Consultando el progreso…" description="Estamos reuniendo los registros de tus pacientes." />;
  if (error || !data) return <NvState kind="error" title="No pudimos cargar el progreso" description={error || 'Reintentá en un momento.'} action={<NvButton onClick={() => setRefresh(valor => valor + 1)}>Reintentar</NvButton>} />;
  return <PanelProgresoVista
    data={data} days={days} filtro={filtro} orden={orden} quien={quien} puntos={curva.puntos} series={curva.series} curvaEstado={curva.estado}
    pacientes={patients} aviso={aviso} onFiltro={setFiltro} onOrden={cambiarOrden} onQuien={setElegida} onOpen={onOpen}
    onPromedio={() => avisar('Sin dato. La adherencia al plan no está en la app. Sin registros no es un incumplimiento.')}
    onAviso={avisar}
  />;
}
