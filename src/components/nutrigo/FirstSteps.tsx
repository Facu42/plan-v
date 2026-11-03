// Primeros pasos de la nutricionista, con las piezas del panel v29 (`.fx`, `.fxp`, `.fxb`, `.fxr`): el boceto no dibuja esta pantalla,
// así que se arma con sus bloques. Cada paso lleva a la pantalla real y se tilda solo cuando el dato ya existe.
import { useEffect, useState } from 'react';
import { nutritionCapabilityApi } from '../../api/nutrition-capabilities';
import { schedulingApi } from '../../api/scheduling';
import { FxBar, FxPanel } from './ficha-fx';
import { PanelV29Icon } from './PanelV29Icon';
import type { PanelV29IconName } from './panel-v29-icons';
import { datosDeMarca } from './ficha-ajustes';
import './first-steps.css';

/** Lo que ya está hecho en la cuenta. `null` = todavía no se sabe (no se tilda ni se cuenta como pendiente por error). */
export type EstadoPrimerosPasos = { datos: boolean | null; horarios: boolean | null; pagina: boolean | null };

/** Solo consulta mientras la pantalla está abierta (`activo`). */
export function usePrimerosPasos(activo: boolean): EstadoPrimerosPasos {
  const [estado, setEstado] = useState<EstadoPrimerosPasos>({ datos: null, horarios: null, pagina: null });
  useEffect(() => {
    if (!activo) return undefined;
    const control = new AbortController();
    void nutritionCapabilityApi.settings(control.signal).then(vista => {
      const marca = datosDeMarca(vista.settings.brand);
      if (!control.signal.aborted) setEstado(previo => ({ ...previo, datos: marca.nombre !== 'Sin completar' && marca.matricula !== 'Sin completar' }));
    }).catch(() => undefined);
    void schedulingApi.workspace(0, control.signal).then(vista => {
      const config = vista.profile.config;
      if (!control.signal.aborted) setEstado(previo => ({ ...previo, horarios: config.weekly.length > 0 && config.types.length > 0, pagina: config.page.enabled }));
    }).catch(() => undefined);
    return () => control.abort();
  }, [activo]);
  return estado;
}

type Paso = { titulo: string; texto: string; icono: PanelV29IconName; hecho: boolean | null; accion?: () => void; deshabilitado?: boolean };

/** El nombre ya puede traer el punto final («Sofía R.»): al cerrar la oración no se duplica. */
const cerrar = (texto: string) => (texto.endsWith('.') ? texto : `${texto}.`);

/** Primer uso de la nutricionista: lo que ve antes de tener pacientes, con los pasos en orden. */
export function FirstSteps({ onStart, onExplore, onInvite, onPlan, onOpen, estado, patientName, busy = false, error }: {
  onStart: () => void;
  onExplore: () => void;
  onInvite?: () => void;
  onPlan?: () => void;
  onOpen?: (href: string) => void;
  estado?: EstadoPrimerosPasos;
  patientName?: string;
  busy?: boolean;
  error?: string;
}) {
  const nombre = patientName ?? '';
  const abrir = (href: string) => onOpen ? () => onOpen(href) : undefined;
  const pasos: Paso[] = [
    { titulo: 'Completá los datos de tu consultorio', texto: 'Nombre, matrícula y contacto: salen en tus certificados y en tu página.', icono: 'gear', hecho: estado?.datos ?? null, accion: abrir('/crm/ajustes') },
    { titulo: 'Cargá tus horarios de atención', texto: 'Días, horas y tipos de consulta para que te reserven turno.', icono: 'clock', hecho: estado?.horarios ?? null, accion: abrir('/crm/agenda?agenda=horarios') },
    { titulo: 'Publicá tu página de reservas', texto: 'Tu enlace propio para que las pacientes saquen turno solas.', icono: 'globe', hecho: estado?.pagina ?? null, accion: abrir('/crm/agenda?agenda=publica') },
    { titulo: 'Creá a tu primera paciente', texto: nombre ? `Ya tenés a ${nombre} en tu lista.` : 'Completá su ficha para empezar el acompañamiento.', icono: 'users', hecho: Boolean(nombre), accion: onStart },
    { titulo: 'Invitala a la app', texto: onInvite ? cerrar(`Abrí la invitación de ${nombre}`) : nombre ? cerrar(`${nombre} ya tiene su cuenta vinculada`) : 'Disponible cuando crees tu primera paciente. Podés copiar el enlace.', icono: 'link', hecho: nombre && !onInvite ? true : null, accion: onInvite, deshabilitado: !onInvite },
    { titulo: 'Armá su plan', texto: onPlan ? cerrar(`Abrí el plan de ${nombre}`) : 'Disponible cuando crees tu primera paciente.', icono: 'fork', hecho: null, accion: onPlan, deshabilitado: !onPlan },
  ];
  const medibles = pasos.filter(paso => paso.hecho !== null), listos = medibles.filter(paso => paso.hecho).length;
  const pct = medibles.length ? Math.round(listos / medibles.length * 100) : 0;
  return <div id="s-primeros" className="ea-screen ps-screen">
    <div className="fx ps-fx">
      <div className="c">
        <FxPanel titulo="Tu consultorio empieza acá" meta={`${listos} de ${medibles.length} listos`}>
          <p className="fxhint">Pasos para dejar todo andando. La IA propone; vos revisás y confirmás.</p>
          <FxBar pct={pct} />
          <div className="fxr ps-steps">
            {pasos.map((paso, indice) => {
              const cuerpo = <>
                <span className="ps-ico" aria-hidden="true"><PanelV29Icon name={paso.hecho ? 'check' : paso.icono} size={15} /></span>
                <span className="t"><b>{paso.titulo}</b><small>{paso.texto}</small></span>
                <span className="ps-n" aria-hidden="true">{indice + 1}</span>
                {paso.accion && !paso.deshabilitado ? <PanelV29Icon name="chev" size={12} /> : null}
              </>;
              const tono = paso.hecho ? 'l' : 'n';
              return <button type="button" key={paso.titulo} className={`${tono}${paso.hecho ? ' ps-done' : ''}`} onClick={paso.accion} disabled={busy || !paso.accion || paso.deshabilitado} aria-label={`${indice + 1}. ${paso.titulo}${paso.hecho ? ' (hecho)' : ''}`}>{cuerpo}</button>;
            })}
          </div>
          {busy && <p className="fxhint" role="status">Preparando la invitación…</p>}
          {error && <p className="fxhint" role="alert">{error}</p>}
          <div className="ps-acts">
            <button type="button" className="chip" onClick={onExplore} disabled={busy}>Explorar consultorio</button>
            <button type="button" className="cta" onClick={onStart} disabled={busy}>{nombre ? 'Crear otra paciente' : 'Crear mi primera paciente'}</button>
          </div>
        </FxPanel>
      </div>
    </div>
  </div>;
}
