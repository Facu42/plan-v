// Las cinco vistas de Ajustes (`ajV0` a `ajV4` de design/panel-nutri/v29/panel-trabajo.html): mismas clases y orden.
// Lo que la app todavía no guarda o no puede hacer se muestra en el mismo bloque con cero o un texto corto, sin inventar datos.
import { Fragment, useState } from 'react';
import './ajustes-v29.css';
import { supabase } from '../../lib/supabase';
import { friendlyError } from '../../lib/error-messages';
import { useAuth } from '../../context/AuthContext';
import { FxKv, FxPanel } from './ficha-fx';
import { PanelV29Icon } from './PanelV29Icon';
import { SettingsDialog } from './EquipoAjustesShared';
import { usePanelScheduling } from './use-panel-scheduling';
import { useAvisosProfesional, useDosPasos } from './AjustesAccount';
import { AVISOS_AUTOMATICOS, CANALES_AVISO, GRUPOS_PLANTILLAS, INTEGRACIONES, REGLAS_DE_REGRESO, SIN_COMPLETAR, estadoDosPasos, separarContacto, textoDeEjemplo, type ClaveIntegracion } from './ficha-ajustes';

type Icono = Parameters<typeof PanelV29Icon>[0]['name'];
export type Marca = { name: string; contact: string; logo?: string | null } | null;
export type TemaAjustes = { dark: boolean; busy: boolean; status: string; choose: (next: 'light' | 'dark') => void };

const SIN_DATO = 'Sin dato';
const PRONTO = 'Todavía no está disponible.';
const Boton = ({ texto, icono, clase = '', onClick, disabled, titulo }: { texto: string; icono?: Icono; clase?: string; onClick?: () => void; disabled?: boolean; titulo?: string }) =>
  <button type="button" className={`sbtn${clase ? ` ${clase}` : ''} cbtn`} onClick={onClick} disabled={disabled} title={disabled && !titulo ? PRONTO : titulo}>{icono ? <PanelV29Icon name={icono} size={13} /> : null}{texto}</button>;
const Interruptor = ({ etiqueta, activo, alCambiar, disabled, titulo }: { etiqueta: string; activo: boolean; alCambiar?: () => void; disabled?: boolean; titulo?: string }) =>
  <button type="button" className="sw" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={disabled} title={disabled && !titulo ? PRONTO : titulo} onClick={alCambiar} />;
const Vacio = ({ texto }: { texto: string }) => <span className="ntempty">{texto}</span>;
const Pastilla = ({ texto, clase }: { texto: string; clase: string }) => <span className={`pill ${clase}`}>{texto}</span>;

type CuentaProps = { marca: Marca; cargando: boolean; tema?: TemaAjustes; onEditar: () => void; onExportar: () => void; onOpen: (href: string) => void };

export function AjustesCuenta({ marca, cargando, tema, onEditar, onExportar, onOpen }: CuentaProps) {
  const avisos = useAvisosProfesional();
  const contacto = separarContacto(marca?.contact);
  const nombre = cargando ? 'Cargando…' : marca?.name || SIN_COMPLETAR;
  return <div className="fx" style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}>
    <div className="c">
      <FxPanel titulo="Datos del consultorio" meta="salen en certificados y en tu página" derecha={<Boton texto="Editar" icono="pen" onClick={onEditar} />}>
        <FxKv filas={[['Nombre', nombre], ['Matrícula', SIN_COMPLETAR], ['CUIT', SIN_COMPLETAR], ['Dirección', SIN_COMPLETAR], ['Teléfono', contacto.telefono], ['Mail', contacto.mail]]} />
      </FxPanel>
      <FxPanel titulo="Firma y marca" meta="para certificados e informes" derecha={<Boton texto="Cambiar" onClick={onEditar} />}>
        <div className="ajsig">
          <div className="ajfirma"><small>Sin firma cargada</small></div>
          <div className="ajlogo">{marca?.logo ? <img src={marca.logo} width={40} height={40} alt="Logo del consultorio" /> : <span className="mk">V</span>}<small>{marca?.logo ? 'Tu logo' : 'Logo de Plan V'}</small></div>
        </div>
      </FxPanel>
      <FxPanel titulo="Título y matrícula" meta="se imprimen en certificados" derecha={<Boton texto="Editar" disabled />} grande>
        <FxKv filas={[['Título', SIN_COMPLETAR], ['Matrícula nacional', SIN_COMPLETAR], ['Matrícula provincial', SIN_COMPLETAR], ['Especialidad', SIN_COMPLETAR]]} />
      </FxPanel>
    </div>
    <div className="c">
      <FxPanel titulo="Tu servicio de Plan V">
        <div className="ajplan"><b>—</b><small>Todavía no hay datos de tu servicio</small></div>
        <FxKv filas={[['Pacientes activas', '—'], ['Equipo', '—'], ['Próximo pago', '—'], ['Medio', '—']]} />
        <div className="fxfoot"><Boton texto="Ver pagos" disabled /><Boton texto="Descargar factura" icono="dl" disabled /></div>
      </FxPanel>
      <FxPanel titulo="Obras sociales y reservas" meta="se configuran en tu página pública" grande>
        <FxKv filas={[['Obras sociales', '—'], ['Reservas', '—'], ['Cancelar', '—']]} />
        <div className="fxfoot"><Boton texto="Ir a Página pública" icono="globe" onClick={() => onOpen('/crm/agenda?agenda=publica')} /><Boton texto="Planilla por obra social" icono="dl" disabled /></div>
      </FxPanel>
    </div>
    <div className="c">
      <FxPanel titulo="Apariencia">
        <div className="pubhr">
          <div><b>Tema oscuro</b><span>Para trabajar de noche</span><Interruptor etiqueta="Tema oscuro" activo={Boolean(tema?.dark)} disabled={!tema || tema.busy} titulo={tema ? undefined : PRONTO} alCambiar={() => tema?.choose(tema.dark ? 'light' : 'dark')} /></div>
          <div><b>Letra más grande</b><span>En todo el panel</span><Interruptor etiqueta="Letra más grande" activo={false} disabled /></div>
          <div><b>Menos movimiento</b><span>Sin animaciones</span><Interruptor etiqueta="Menos movimiento" activo={false} disabled titulo="El panel ya respeta la preferencia de reducir movimiento de tu dispositivo." /></div>
        </div>
        {tema?.status ? <small className="nthint" role="status">{tema.status}</small> : null}
      </FxPanel>
      <FxPanel titulo="Idioma y horario">
        <FxKv filas={[['Idioma', 'Español (Argentina)'], ['Zona horaria', 'Buenos Aires (GMT−3)'], ['Moneda', 'Pesos argentinos'], ['Semana empieza', 'Lunes']]} />
      </FxPanel>
      <FxPanel titulo="Avisos para vos" meta="qué te llega y por dónde" grande>
        <div className="ajav sm">{CANALES_AVISO.map(([clave, titulo, detalle]) => <div key={clave}><span className="t"><b>{titulo}</b><small>{detalle}</small></span>
          <Interruptor etiqueta={titulo} activo={Boolean(avisos.prefs?.[clave])} disabled={!avisos.prefs || avisos.busy} titulo={avisos.prefs ? undefined : 'Cargando tus preferencias…'} alCambiar={() => void avisos.toggle(clave)} /></div>)}</div>
        {avisos.error ? <small className="nthint" role="alert">{avisos.error} <button type="button" className="lnk" onClick={avisos.retry}>Reintentar</button></small> : avisos.status ? <small className="nthint" role="status">{avisos.status}</small> : null}
      </FxPanel>
      <FxPanel titulo="Tus datos" derecha={<Boton texto="Descargar" icono="dl" onClick={onExportar} />}>
        <p className="pubbio">Pacientes, fichas, planes y cobros, cuando quieras.</p>
      </FxPanel>
    </div>
  </div>;
}

export function AjustesPlantillas() {
  return <div className="fx" style={{ gridTemplateColumns: '330px 1fr 300px' }}>
    <div className="c"><FxPanel titulo="Plantillas" meta="formularios y certificados" derecha={<Boton texto="Nueva" icono="plus" disabled />} grande>
      <div className="fxs"><div className="ajtps">{GRUPOS_PLANTILLAS.map(grupo => <Fragment key={grupo}><small>{grupo === 'Formulario' ? 'Formularios' : 'Certificados'}</small><Vacio texto="Todavía no hay plantillas." /></Fragment>)}</div></div>
    </FxPanel></div>
    <div className="c"><FxPanel titulo="Plantilla" meta="elegí una para verla" derecha={<><Boton texto="Vista de la paciente" icono="eye" disabled /><Boton texto="Editar" clase="k" icono="pen" disabled /></>} grande>
      <div className="fxs"><Vacio texto="Cuando haya una plantilla, la ves acá tal como la recibe la paciente." /></div>
    </FxPanel></div>
    <div className="c">
      <FxPanel titulo="Uso"><div className="pubkp"><div><small>Enviados</small><b className="num">0</b><em>este año</em></div><div><small>Respondieron</small><b className="num">—</b><em>a tiempo</em></div></div></FxPanel>
      <FxPanel titulo="Cuándo se usa" derecha={<Boton texto="Cambiar" disabled />}><p className="pubbio">Sin plantilla elegida.</p></FxPanel>
      <FxPanel titulo="Variables" meta="se completan solas"><Vacio texto="Aparecen cuando hay una plantilla." /></FxPanel>
      <FxPanel titulo="Últimas respuestas" grande><div className="fxs"><Vacio texto="Todavía no hay respuestas." /></div></FxPanel>
    </div>
  </div>;
}

export function AjustesAvisos({ irAIntegraciones }: { irAIntegraciones: () => void }) {
  const [elegido, setElegido] = useState(0);
  const [titulo, cuando, texto] = AVISOS_AUTOMATICOS[elegido];
  return <div className="fx" style={{ gridTemplateColumns: '1.35fr 1fr' }}>
    <div className="c">
      <FxPanel titulo="Avisos a tus pacientes" meta={`${AVISOS_AUTOMATICOS.length} para configurar · por la app y por mail`} grande>
        <div className="fxs"><div className="ajav">{AVISOS_AUTOMATICOS.map(([nombre, detalle], i) => <div key={nombre} className={i === elegido ? 'on' : ''} tabIndex={0} aria-current={i === elegido}
          onClick={() => setElegido(i)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setElegido(i); } }}>
          <span className="t"><b>{nombre}</b><small>{detalle}</small></span><span className="ajch2"><i>App</i><i>Mail</i></span><Interruptor etiqueta={nombre} activo={false} disabled titulo="Todavía no se prenden ni se apagan desde acá." /></div>)}</div></div>
      </FxPanel>
      <FxPanel titulo="Reglas de regreso" meta="para que nadie se pierda">
        <div className="pubhr">{REGLAS_DE_REGRESO.map(([nombre, detalle]) => <div key={nombre}><b>{nombre}</b><span>{detalle}</span><Interruptor etiqueta={nombre} activo={false} disabled /></div>)}</div>
      </FxPanel>
    </div>
    <div className="c">
      <FxPanel titulo={titulo} meta={<Pastilla texto="Sin configurar" clase="p-ok" />} derecha={<Boton texto="Editar" icono="pen" disabled />}>
        <FxKv filas={[['Cuándo', cuando], ['Por dónde', 'App y mail'], ['Enviados', SIN_DATO]]} />
        <div className="ajmsg"><small>Mensaje sugerido</small><div className="ajbub">{textoDeEjemplo(texto)}</div></div>
      </FxPanel>
      <FxPanel titulo="Últimos enviados" grande><div className="fxs"><Vacio texto="Todavía no hay envíos registrados." /></div></FxPanel>
      <div className="fxai"><PanelV29Icon name="spark" size={14} /><span><b>El mail</b> se activa cuando conectes Brevo en <button type="button" className="lnk" onClick={irAIntegraciones}>Integraciones</button>. Mientras tanto, todos los avisos llegan a la app.</span></div>
    </div>
  </div>;
}

export function AjustesSeguridad({ onOpen, onSecurity }: { onOpen: (href: string) => void; onSecurity?: () => void }) {
  const { mfa, error } = useDosPasos();
  const dosPasos = estadoDosPasos(mfa);
  const { session, requestPasswordReset } = useAuth();
  const correo = session?.user.email ?? '';
  const [aviso, setAviso] = useState(''), [ocupado, setOcupado] = useState(false);
  async function pedirClave() {
    if (!correo || ocupado) return; setOcupado(true); setAviso('');
    const r = await requestPasswordReset(correo); setAviso(r.error ?? `Te mandamos un enlace a ${correo} para elegir una clave nueva.`); setOcupado(false);
  }
  async function cerrarLasDemas() {
    if (!supabase || ocupado) return; setOcupado(true); setAviso('');
    try { const { error: e } = await supabase.auth.signOut({ scope: 'others' }); setAviso(e ? friendlyError(e) : 'Cerramos las otras sesiones.'); } catch (e) { setAviso(friendlyError(e)); } finally { setOcupado(false); }
  }
  return <div className="fx" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
    <div className="c">
      <FxPanel titulo="Verificación en dos pasos" meta={<Pastilla texto={dosPasos.texto} clase={dosPasos.clase} />}>
        <p className="pubbio">Además de la clave, te pedimos un código de tu celular al entrar desde un dispositivo nuevo.</p>
        <div className="pubhr">
          <div><b>Para vos</b><span>App de códigos</span><Interruptor etiqueta="Dos pasos para vos" activo={dosPasos.activa} disabled={!onSecurity} alCambiar={onSecurity} titulo={onSecurity ? 'Abre la pantalla para configurarla.' : undefined} /></div>
          <div><b>Para el equipo</b><span>Obligatoria para todos</span><Interruptor etiqueta="Dos pasos obligatoria para el equipo" activo={false} disabled /></div>
        </div>
        {error ? <small className="nthint" role="alert">{error}</small> : null}
      </FxPanel>
      <FxPanel titulo="Clave" derecha={<Boton texto="Cambiar clave" onClick={() => void pedirClave()} disabled={!correo || ocupado} titulo={correo ? 'Te mandamos un enlace por mail.' : 'Ingresá con tu cuenta para cambiarla.'} />}>
        <p className="pubbio">Usá una clave que no uses en otro lado. Si te olvidás, te mandamos un link a tu mail.</p>
        {aviso ? <small className="nthint" role="status">{aviso}</small> : null}
      </FxPanel>
      <FxPanel titulo="Ingresos a tu cuenta" meta="últimos" grande><div className="fxs"><Vacio texto="Todavía no se guarda el historial de ingresos." /></div></FxPanel>
    </div>
    <div className="c">
      <FxPanel titulo="Sesiones abiertas" meta={correo ? '1 conocida' : undefined} derecha={<Boton texto="Cerrar las demás" onClick={() => void cerrarLasDemas()} disabled={!correo || !supabase || ocupado} titulo="Cierra tu cuenta en todos los otros dispositivos." />}>
        <div className="publk"><div><span className="t"><b>Este dispositivo</b><small>ahora</small></span><span className="ntsig"><PanelV29Icon name="check" size={13} />Vos</span></div></div>
        <small className="nthint">Todavía no podemos listar los otros dispositivos; el botón los cierra a todos.</small>
      </FxPanel>
      <FxPanel titulo="Registro de accesos" meta="quién abrió cada ficha" derecha={<button className="lnk" type="button" onClick={() => onOpen('/crm/equipo?vista=registro')}>Ver <PanelV29Icon name="chev" size={11} /></button>} grande>
        <div className="fxs"><Vacio texto="Todavía no hay accesos registrados." /></div>
      </FxPanel>
    </div>
    <div className="c">
      <FxPanel titulo="Copias de seguridad"><FxKv filas={[['Frecuencia', SIN_DATO], ['Se guardan', SIN_DATO], ['Última', SIN_DATO]]} /></FxPanel>
      <FxPanel titulo="Datos de salud"><div className="pubpide">{['Las fichas se comparten por asignación explícita', 'Recepción no accede a las notas clínicas', 'No compartas claves ni datos de pacientes por canales públicos'].map(t => <div key={t}><PanelV29Icon name="shield" size={13} /><span>{t}</span></div>)}</div></FxPanel>
      <FxPanel titulo="Consentimientos" derecha={<Boton texto="Pedir firma" clase="k" disabled />} grande>
        <div className="publk"><Vacio texto="Todavía no hay un resumen de firmas." /></div>
        <small className="nthint">Los consentimientos se revisan en la ficha de cada paciente.</small>
      </FxPanel>
    </div>
  </div>;
}

export function AjustesIntegraciones({ onOpen }: { onOpen: (href: string) => void }) {
  const programacion = usePanelScheduling();
  const [aviso, setAviso] = useState<ClaveIntegracion | null>(null);
  const conectada = (clave: ClaveIntegracion) => clave === 'balanzas' || (clave === 'google' || clave === 'mercadopago' ? Boolean(programacion.snapshot?.connections[clave]) : false);
  const actual = INTEGRACIONES.find(x => x.clave === aviso);
  return <div className="fx aji4" style={{ gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'minmax(0,1fr) minmax(0,1fr)' }}>
    {INTEGRACIONES.map(x => {
      const lista = conectada(x.clave), propia = x.clave === 'google' || x.clave === 'mercadopago';
      const boton = x.clave === 'balanzas' ? <Boton texto="Cómo se usa" onClick={() => setAviso(x.clave)} />
        : propia && lista ? <Boton texto="Desconectar" onClick={() => void programacion.disconnect(x.clave as 'google' | 'mercadopago')} />
        : propia ? <Boton texto="Conectar" clase="k" onClick={() => void programacion.connect(x.clave as 'google' | 'mercadopago')} />
        : <Boton texto="Conectar" clase="k" onClick={() => setAviso(x.clave)} />;
      return <FxPanel key={x.clave} titulo={x.titulo} meta={<Pastilla texto={lista ? 'Lista' : 'Sin conectar'} clase={lista ? 'p-conf' : 'p-ok'} />} derecha={boton} grande>
        <div className="ajint"><span className="ajic"><PanelV29Icon name={x.icono} size={22} /></span><p>{x.texto}.</p></div>
        <div className="pubpide">{x.puntos.map(t => <div key={t}><PanelV29Icon name="check" size={13} /><span>{t}</span></div>)}</div>
        <div className="pubins"><p>{x.nota}</p></div>
        {lista || !x.pedido ? null : <small className="nthint">{x.pedido}</small>}
      </FxPanel>;
    })}
    {programacion.status || programacion.error ? <p className="nthint" role={programacion.error ? 'alert' : 'status'} style={{ gridColumn: '1 / -1' }}>{programacion.error || programacion.status}</p> : null}
    {actual ? <SettingsDialog title={actual.clave === 'balanzas' ? 'Balanzas' : `Conectar ${actual.titulo}`} onClose={() => setAviso(null)}>
      {actual.clave === 'balanzas'
        ? <><p className="pubbio">En la ficha, Mediciones → «Importar balanza». Subís el PDF o una foto del ticket, revisás cada valor y lo confirmás.</p><Boton texto="Elegir paciente" onClick={() => { setAviso(null); onOpen('/crm/pacientes'); }} /></>
        : <p className="pubbio">{actual.texto}. {actual.pedido} Esta conexión todavía no está habilitada; mientras tanto, todo sigue andando sin ella.</p>}
    </SettingsDialog> : null}
  </div>;
}
