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
import { AVISOS_AUTOMATICOS, CANALES_AVISO, GRUPOS_PLANTILLAS, INTEGRACIONES, REGLAS_DE_REGRESO, avisoConfigurado, datosDeMarca, estadoDosPasos, textoDeEjemplo, type ClaveIntegracion } from './ficha-ajustes';
import { usePrefsPanel } from './ajustes-prefs';
import { CajonAjustes } from './AjustesCajon';
import type { ModoMarca } from './AjustesEditores';
import { CERTIFICATE_VARIABLES, NOTICE_KEYS, certificateVariables, type NoticeKey, type NoticeView, type TemplateView } from '../../types/ajustes';
import type { ClinicBrand } from '../../types/nutrition-capabilities';

type Icono = Parameters<typeof PanelV29Icon>[0]['name'];
export type Marca = ClinicBrand | null;
export type TemaAjustes = { dark: boolean; busy: boolean; status: string; choose: (next: 'light' | 'dark') => void };

const SIN_DATO = 'Sin dato';
const CLAVES_AVISOS = NOTICE_KEYS.slice(0, AVISOS_AUTOMATICOS.length), CLAVES_REGLAS = NOTICE_KEYS.slice(AVISOS_AUTOMATICOS.length);
const PRONTO = 'Todavía no está disponible.';
const Boton = ({ texto, icono, clase = '', onClick, disabled, titulo }: { texto: string; icono?: Icono; clase?: string; onClick?: () => void; disabled?: boolean; titulo?: string }) =>
  <button type="button" className={`sbtn${clase ? ` ${clase}` : ''} cbtn`} onClick={onClick} disabled={disabled} title={disabled && !titulo ? PRONTO : titulo}>{icono ? <PanelV29Icon name={icono} size={13} /> : null}{texto}</button>;
const Interruptor = ({ etiqueta, activo, alCambiar, disabled, titulo }: { etiqueta: string; activo: boolean; alCambiar?: () => void; disabled?: boolean; titulo?: string }) =>
  <button type="button" className="sw" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={disabled} title={disabled && !titulo ? PRONTO : titulo} onClick={alCambiar} />;
const Vacio = ({ texto }: { texto: string }) => <span className="ntempty">{texto}</span>;
const Pastilla = ({ texto, clase }: { texto: string; clase: string }) => <span className={`pill ${clase}`}>{texto}</span>;

type CuentaProps = { marca: Marca; cargando: boolean; tema?: TemaAjustes; onEditar: (modo: ModoMarca) => void; onExportar: () => void; onOpen: (href: string) => void };

export function AjustesCuenta({ marca, cargando, tema, onEditar, onExportar, onOpen }: CuentaProps) {
  const avisos = useAvisosProfesional();
  const datos = datosDeMarca(marca), { prefs, alternar } = usePrefsPanel();
  const nombre = cargando ? 'Cargando…' : datos.nombre;
  return <div className="fx" style={{ gridTemplateColumns: '1.2fr 1fr 1fr' }}>
    <div className="c">
      <FxPanel titulo="Datos del consultorio" meta="salen en certificados y en tu página" derecha={<Boton texto="Editar" icono="pen" onClick={() => onEditar('datos')} disabled={cargando || !marca} />}>
        <FxKv filas={[['Nombre', nombre], ['Matrícula', datos.matricula], ['CUIT', datos.cuit], ['Dirección', datos.direccion], ['Teléfono', datos.telefono], ['Mail', datos.mail]]} />
      </FxPanel>
      <FxPanel titulo="Firma y marca" meta="para certificados e informes" derecha={<Boton texto="Cambiar" onClick={() => onEditar('firma')} disabled={cargando || !marca} />}>
        <div className="ajsig">
          <div className="ajfirma">{datos.firma ? <img src={datos.firma} alt="Tu firma" style={{ maxHeight: 46, maxWidth: 150 }} /> : <small>Sin firma cargada</small>}</div>
          <div className="ajlogo">{marca?.logo ? <img src={marca.logo} width={40} height={40} alt="Logo del consultorio" /> : <span className="mk">V</span>}<small>{marca?.logo ? 'Tu logo' : 'Logo de Plan V'}</small></div>
        </div>
      </FxPanel>
      <FxPanel titulo="Título y matrícula" meta="se imprimen en certificados" derecha={<Boton texto="Editar" onClick={() => onEditar('titulo')} disabled={cargando || !marca} />} grande>
        <FxKv filas={[['Título', datos.titulo], ['Matrícula nacional', datos.matricula], ['Matrícula provincial', datos.provincial], ['Especialidad', datos.especialidad]]} />
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
          <div><b>Letra más grande</b><span>En todo el panel</span><Interruptor etiqueta="Letra más grande" activo={prefs.letra} alCambiar={() => alternar('letra')} titulo="Se guarda en este dispositivo." /></div>
          <div><b>Menos movimiento</b><span>Sin animaciones</span><Interruptor etiqueta="Menos movimiento" activo={prefs.movimiento} alCambiar={() => alternar('movimiento')} titulo="Se guarda en este dispositivo." /></div>
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

type PlantillasProps = { marca: Marca; plantillas: TemplateView[] | null; error: string; onNueva: () => void; onEditar: (t: TemplateView) => void; onCuando: (t: TemplateView) => void; onReintentar: () => void };

export function AjustesPlantillas({ marca, plantillas, error, onNueva, onEditar, onCuando, onReintentar }: PlantillasProps) {
  const [elegida, setElegida] = useState<string | null>(null), [vista, setVista] = useState(false);
  const lista = plantillas ?? [];
  const t = lista.find(x => x.id === elegida) ?? lista[0] ?? null;
  const cert = t?.kind === 'Certificado', datos = datosDeMarca(marca);
  const grupo = (tipo: (typeof GRUPOS_PLANTILLAS)[number]) => {
    const filas = lista.filter(x => x.kind === tipo);
    if (!filas.length) return <Vacio texto={plantillas ? 'Todavía no hay plantillas.' : error ? 'No se pudieron cargar.' : 'Cargando…'} />;
    return filas.map(x => <button key={x.id} type="button" className={`ajtp${x.id === t?.id ? ' on' : ''}`} onClick={() => setElegida(x.id)}><span className="t"><b>{x.name}</b><small>{x.when_text}</small></span><em className="num">—</em></button>);
  };
  const datosFirma = [datos.titulo !== 'Sin completar' ? datos.titulo : 'Nutricionista', datos.matricula !== 'Sin completar' ? `MN ${datos.matricula.replace(/^MN\s*/i, '')}` : '', datos.direccion !== 'Sin completar' ? datos.direccion : ''].filter(Boolean).join(' · ');
  return <div className="fx" style={{ gridTemplateColumns: '330px 1fr 300px' }}>
    <div className="c"><FxPanel titulo="Plantillas" meta="formularios y certificados" derecha={<Boton texto="Nueva" icono="plus" onClick={onNueva} />} grande>
      <div className="fxs"><div className="ajtps">{GRUPOS_PLANTILLAS.map(g => <Fragment key={g}><small>{g === 'Formulario' ? 'Formularios' : 'Certificados'}</small>{grupo(g)}</Fragment>)}</div>
        {error ? <small className="nthint" role="alert">{error} <button type="button" className="lnk" onClick={onReintentar}>Reintentar</button></small> : null}</div>
    </FxPanel></div>
    <div className="c"><FxPanel titulo={t?.name ?? 'Plantilla'} meta={t ? <Pastilla texto={t.kind} clase={cert ? 'p-vid' : 'p-conf'} /> : 'elegí una para verla'}
      derecha={<><Boton texto="Vista de la paciente" icono="eye" disabled={!t} onClick={() => setVista(true)} /><Boton texto="Editar" clase="k" icono="pen" disabled={!t} onClick={() => t && onEditar(t)} /></>} grande>
      {!t ? <div className="fxs"><Vacio texto="Cuando haya una plantilla, la ves acá tal como la recibe la paciente." /></div>
        : t.kind === 'Certificado' ? <div className="ajcert"><div className="ajch">{datos.logo ? <img src={datos.logo} width={32} height={32} alt="" /> : <span className="mk">V</span>}<span><b>{datos.nombre}</b><small>{datosFirma}</small></span></div>
          <h4>{t.name}</h4><p>{partirVariables(t.text)}</p><p>Se extiende a pedido de la interesada para ser presentado ante quien corresponda.</p>
          <div className="ajcf">{datos.firma ? <img src={datos.firma} alt="Tu firma" style={{ maxHeight: 46, maxWidth: 150 }} /> : <svg viewBox="0 0 160 50" aria-hidden="true"><path d="M8 34c14-22 22-24 24-12s-6 18 2 8 14-24 18-14-8 22 4 14 16-20 22-10 4 12 14 4 18-10 28-6 12 4 26-2" /></svg>}<small>Firma y sello · <u>fecha</u></small></div></div>
          : <div className="fxs"><ol className="ajq">{t.questions.map((q, i) => <li key={i}><span className="num">{i + 1}</span><span className="t"><b>{q}</b><small>Respuesta libre</small><i className="ajfld lg" /></span></li>)}</ol></div>}
    </FxPanel></div>
    <div className="c">
      <FxPanel titulo="Uso"><div className="pubkp"><div><small>{cert ? 'Generados' : 'Enviados'}</small><b className="num">—</b><em>todavía no se cuenta</em></div><div><small>{cert ? 'Firmados' : 'Respondieron'}</small><b className="num">—</b><em>{cert ? 'con matrícula' : 'a tiempo'}</em></div></div></FxPanel>
      <FxPanel titulo="Cuándo se usa" derecha={<Boton texto="Cambiar" disabled={!t} onClick={() => t && onCuando(t)} />}>
        <p className="pubbio">{t ? `${t.when_text}.` : 'Sin plantilla elegida.'}</p>
        {t ? <small className="nthint">{cert ? 'Lleva tu firma, matrícula y logo.' : 'Las respuestas quedan en la historia clínica de cada paciente.'}</small> : null}
      </FxPanel>
      <FxPanel titulo="Variables" meta="se completan solas">
        {t ? <div className="ajvar">{(t.kind === 'Certificado' ? [...new Set([...certificateVariables(t.text), ...CERTIFICATE_VARIABLES.slice(0, 3)])] : ['nombre', 'fecha del turno', 'nutricionista']).map(v => <span key={v}>{v}</span>)}</div> : <Vacio texto="Aparecen cuando hay una plantilla." />}
      </FxPanel>
      <FxPanel titulo={cert ? 'Últimos generados' : 'Últimas respuestas'} grande><div className="fxs"><Vacio texto="Todavía no hay respuestas." /></div></FxPanel>
    </div>
    {vista && t ? <CajonAjustes titulo={t.name} sub="Así lo ve la paciente en su app" sinGuardar onGuardar={async () => undefined} onClose={() => setVista(false)}>
      {t.kind === 'Certificado' ? <p className="pubbio">{ejemploCertificado(t.text)}</p> : t.questions.map((q, i) => <label key={i} className="af"><span>{q}</span><input className="ai" type="text" placeholder="Tu respuesta" disabled /></label>)}
    </CajonAjustes> : null}
  </div>;
}

/** Texto del certificado con cada {variable} resaltada, como en el boceto. */
function partirVariables(texto: string) {
  return texto.split(/(\{\w+\})/g).map((parte, i) => /^\{\w+\}$/.test(parte) ? <u key={i}>{parte.slice(1, -1)}</u> : parte);
}
function ejemploCertificado(texto: string) {
  const ejemplo: Record<string, string> = { nombre: 'Sofía Gómez', dni: '38.412.556', fecha: '23/10/2026' };
  return texto.replace(/\{(\w+)\}/g, (_, k: string) => ejemplo[k] ?? '…');
}

type AvisosProps = { avisos: NoticeView[] | null; error: string; irAIntegraciones: () => void; onGuardar: (aviso: { key: NoticeKey; enabled: boolean; when_text: string | null; message: string | null }) => void; onEditar: (aviso: { key: NoticeKey; titulo: string; cuando: string; texto: string; activo: boolean }) => void; onReintentar: () => void };

export function AjustesAvisos({ avisos, error, irAIntegraciones, onGuardar, onEditar, onReintentar }: AvisosProps) {
  const [elegido, setElegido] = useState(0);
  const guardados = avisos ?? [];
  const config = (i: number) => { const [, cuando, texto] = AVISOS_AUTOMATICOS[i]; return avisoConfigurado(CLAVES_AVISOS[i], guardados, { cuando, texto }); };
  const [titulo] = AVISOS_AUTOMATICOS[elegido], actual = config(elegido), prendidos = AVISOS_AUTOMATICOS.filter((_, i) => config(i).enabled).length;
  const cambiar = (clave: NoticeKey, enabled: boolean, cuando: string | null, mensaje: string | null) => onGuardar({ key: clave, enabled, when_text: cuando, message: mensaje });
  return <div className="fx" style={{ gridTemplateColumns: '1.35fr 1fr' }}>
    <div className="c">
      <FxPanel titulo="Avisos a tus pacientes" meta={`${prendidos} de ${AVISOS_AUTOMATICOS.length} prendidos · por la app y por mail`} grande>
        <div className="fxs"><div className="ajav">{AVISOS_AUTOMATICOS.map(([nombre], i) => { const c = config(i); return <div key={nombre} className={i === elegido ? 'on' : ''} tabIndex={0} aria-current={i === elegido}
          onClick={() => setElegido(i)} onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setElegido(i); } }}>
          <span className="t"><b>{nombre}</b><small>{c.cuando}</small></span><span className="ajch2"><i>App</i><i>Mail</i></span>
          <Interruptor etiqueta={nombre} activo={c.enabled} disabled={!avisos} alCambiar={() => cambiar(CLAVES_AVISOS[i], !c.enabled, c.personalizado ? c.cuando : null, c.personalizado ? c.texto : null)} /></div>; })}</div>
          {error ? <small className="nthint" role="alert">{error} <button type="button" className="lnk" onClick={onReintentar}>Reintentar</button></small> : null}</div>
      </FxPanel>
      <FxPanel titulo="Reglas de regreso" meta="para que nadie se pierda">
        <div className="pubhr">{REGLAS_DE_REGRESO.map(([nombre, detalle], i) => { const c = avisoConfigurado(CLAVES_REGLAS[i], guardados, { cuando: detalle, texto: '' });
          return <div key={nombre}><b>{nombre}</b><span>{detalle}</span><Interruptor etiqueta={nombre} activo={c.enabled} disabled={!avisos} alCambiar={() => cambiar(CLAVES_REGLAS[i], !c.enabled, null, null)} /></div>; })}</div>
      </FxPanel>
    </div>
    <div className="c">
      <FxPanel titulo={titulo} meta={<Pastilla texto={actual.enabled ? 'Prendido' : 'Apagado'} clase={actual.enabled ? 'p-conf' : 'p-ok'} />} derecha={<Boton texto="Editar" icono="pen" disabled={!avisos} onClick={() => onEditar({ key: CLAVES_AVISOS[elegido], titulo, cuando: actual.cuando, texto: actual.texto, activo: actual.enabled })} />}>
        <FxKv filas={[['Cuándo', actual.cuando], ['Por dónde', 'App y mail'], ['Enviados', SIN_DATO]]} />
        <div className="ajmsg"><small>Así le llega</small><div className="ajbub">{textoDeEjemplo(actual.texto)}</div></div>
        <small className="nthint">Guardamos tu elección. Cada aviso empieza a salir cuando se conecta su envío.</small>
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
      <FxPanel titulo="Copias de seguridad" meta="automáticas"><FxKv filas={[['Frecuencia', 'Todos los días'], ['Se guardan', '7 días'], ['Última', SIN_DATO]]} /></FxPanel>
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
