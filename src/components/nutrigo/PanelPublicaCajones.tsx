// Cajones de la Página pública (los de `PUBA` del boceto v29): perfil, lugar, obras sociales, descuentos, servicio, qué se pide, horarios y reglas.
// Cada uno edita una copia y, al guardar, entrega la configuración nueva; «Publicar cambios» la guarda en la base.
import { useState } from 'react';
import { nutritionCapabilityApi } from '../../api/nutrition-capabilities';
import type { PageExtras, PublicModality, SchedulingSettings } from '../../types/scheduling';
import { Campo, CajonV29, Chips, Fila, Segmentado, Tildes } from './CajonV29';
import { FxKv } from './ficha-fx';
import { validarImagen } from './ficha-ajustes';
import { MODALIDADES } from '../../lib/public-page-profile';
import { ESPECIALIDADES_SUGERIDAS, MODOS_OBRA_SOCIAL, OBRAS_SUGERIDAS, conHorarioDelDia, leerHorario, pedidosAlReservar, type ModoObraSocial } from './publica-extras';
import { horariosPorDia } from './PanelPublicaV29';

type Config = SchedulingSettings;
type Tipo = Config['types'][number];
type Comun = { config: Config; onAplicar: (siguiente: Config) => void; onClose: () => void };

export const conExtras = (config: Config, parche: Partial<PageExtras>): Config => ({ ...config, page_extras: { ...config.page_extras, ...parche } });
const pesos = (centavos: number) => String(Math.round(centavos / 100));
const aCentavos = (texto: string) => Math.max(0, Math.round(Number(texto.replace(/\D/g, '')) || 0)) * 100;
const SLUG = /^[a-z0-9][a-z0-9-]{2,59}$/;

const HEX = /^#[0-9A-Fa-f]{6}$/;
const leerImagen = (archivo: File) => new Promise<string>((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => mal(new Error('No pudimos leer la imagen.')); r.readAsDataURL(archivo); });

export function CajonPerfil({ config, onAplicar, onClose, onFoto, fotoInicial = '' }: Comun & { onFoto?: (dataUrl: string) => void; fotoInicial?: string }) {
  const { page, page_extras: extras } = config;
  const [titulo, setTitulo] = useState(page.title);
  const [matricula, setMatricula] = useState(extras?.license ?? '');
  const [zona, setZona] = useState(extras?.area ?? '');
  const [bio, setBio] = useState(page.bio);
  const [especialidades, setEspecialidades] = useState<string[]>(extras?.specialties ?? []);
  const [otra, setOtra] = useState('');
  const [slug, setSlug] = useState(page.slug);
  const [contacto, setContacto] = useState(page.contact);
  const [logo, setLogo] = useState(page.logo_url);
  const [modalidad, setModalidad] = useState<PublicModality>(extras?.modality ?? 'ambas');
  const [precio, setPrecio] = useState(pesos(extras?.consult_price_minor ?? 0));
  const [reserva, setReserva] = useState(extras?.booking_url ?? '');
  const [color, setColor] = useState(extras?.color ?? '');
  const [acento, setAcento] = useState(extras?.accent ?? '');
  const [foto, setFoto] = useState(fotoInicial.startsWith('data:image/') ? fotoInicial : '');
  const [aviso, setAviso] = useState('');
  const opciones = [...ESPECIALIDADES_SUGERIDAS, ...especialidades.filter(e => !(ESPECIALIDADES_SUGERIDAS as readonly string[]).includes(e))];
  async function subirFoto(archivo?: File) {
    if (!archivo) return;
    const mal = validarImagen(archivo); if (mal) { setAviso(mal); return; }
    try {
      const dataUrl = await leerImagen(archivo);
      const view = await nutritionCapabilityApi.settings();
      await nutritionCapabilityApi.saveSettings({ ...view.settings, brand: { ...view.settings.brand, logo: dataUrl } }, view.revision);
      setFoto(dataUrl); onFoto?.(dataUrl); setAviso('Foto guardada en tu marca. Publicá los cambios para que se vea en /' + slug + '.');
    } catch (error) {
      setAviso(error instanceof Error ? error.message : 'No pudimos guardar la foto.');
    }
  }
  const guardar = () => {
    if (!SLUG.test(slug)) { setAviso('La dirección usa minúsculas, números y guiones (mínimo 3 letras).'); return false; }
    if (logo && !logo.startsWith('https://')) { setAviso('La imagen tiene que ser un enlace https, o subí un archivo PNG/JPG.'); return false; }
    if (reserva && !reserva.startsWith('https://')) { setAviso('El link de reserva tiene que ser https.'); return false; }
    if (color && !HEX.test(color)) { setAviso('El color de texto usa el formato #RRGGBB.'); return false; }
    if (acento && !HEX.test(acento)) { setAviso('El color de acento usa el formato #RRGGBB.'); return false; }
    const nueva = otra.trim();
    const final = nueva && !especialidades.includes(nueva) ? [...especialidades, nueva] : especialidades;
    if (final.length > 12) { setAviso('Hasta 12 especialidades.'); return false; }
    const centavos = Math.max(0, Math.round(Number(precio.replace(/\D/g, '')) || 0)) * 100;
    onAplicar(conExtras({ ...config, page: { ...page, title: titulo, bio, slug, contact: contacto, logo_url: logo } }, {
      license: matricula.trim(), area: zona.trim(), specialties: final, modality: modalidad,
      consult_price_minor: centavos || undefined, booking_url: reserva.trim() || undefined,
      color: color || undefined, accent: acento || undefined,
    }));
    return true;
  };
  return <CajonV29 titulo="Editar perfil" sub="Se ve en tu página pública /slug" aviso={aviso} onGuardar={guardar} onClose={onClose}>
    <Campo etiqueta="Nombre"><input className="ai" value={titulo} maxLength={100} onChange={e => setTitulo(e.target.value)} /></Campo>
    <Fila><Campo etiqueta="Matrícula"><input className="ai" value={matricula} maxLength={60} placeholder="MN 0000" onChange={e => setMatricula(e.target.value)} /></Campo><Campo etiqueta="Zona"><input className="ai" value={zona} maxLength={80} placeholder="Belgrano, CABA" onChange={e => setZona(e.target.value)} /></Campo></Fila>
    <Campo etiqueta="Sobre vos"><textarea className="ai" rows={4} maxLength={1200} value={bio} onChange={e => setBio(e.target.value)} /></Campo>
    <Chips etiqueta="Especialidades" opciones={opciones} elegidas={especialidades} onCambiar={setEspecialidades} />
    <Campo etiqueta="Sumar otra"><input className="ai" value={otra} maxLength={40} placeholder="Ej.: Running" onChange={e => setOtra(e.target.value)} /></Campo>
    <Segmentado etiqueta="Modalidad" opciones={MODALIDADES} valor={modalidad} onCambiar={setModalidad} />
    <Fila>
      <Campo etiqueta="Precio de consulta (opcional)"><input className="ai" inputMode="numeric" value={precio} placeholder="Sin publicar" onChange={e => setPrecio(e.target.value)} /></Campo>
      <Campo etiqueta="Link de reserva" ayuda="Si usás otro turno (Calendly u otro), pegá el https. Si no, se usa el de Nutridash."><input className="ai" type="url" value={reserva} placeholder="https://" onChange={e => setReserva(e.target.value)} /></Campo>
    </Fila>
    <Campo etiqueta="Dirección del link" ayuda="Minúsculas, números y guiones. Queda en nutridash.app/tu-slug"><input className="ai" value={slug} onChange={e => setSlug(e.target.value)} /></Campo>
    <Fila><Campo etiqueta="Contacto público"><input className="ai" value={contacto} maxLength={150} onChange={e => setContacto(e.target.value)} /></Campo><Campo etiqueta="Foto o logo (enlace)"><input className="ai" type="url" value={logo} placeholder="https://" onChange={e => setLogo(e.target.value)} /></Campo></Fila>
    <Campo etiqueta="Subir foto o logo" ayuda="PNG o JPG de hasta 500 KB. Se guarda en tu marca y sale en el PDF y en tu página.">
      <input className="ai" type="file" accept="image/png,image/jpeg" onChange={e => void subirFoto(e.target.files?.[0])} />
    </Campo>
    {foto ? <img src={foto} alt="" width={56} height={56} style={{ objectFit: 'cover', borderRadius: 8 }} /> : null}
    <Fila>
      <Campo etiqueta="Color de texto"><input className="ai" type="color" value={HEX.test(color) ? color : '#272832'} onChange={e => setColor(e.target.value)} /></Campo>
      <Campo etiqueta="Color de acento" ayuda="Sale en el PDF del plan. Si no elegís, se usa el lima de Nutridash."><input className="ai" type="color" value={HEX.test(acento) ? acento : '#C2E66E'} onChange={e => setAcento(e.target.value)} /></Campo>
    </Fila>
  </CajonV29>;
}

export function CajonLugar({ config, onAplicar, onClose }: Comun) {
  const [lugar, setLugar] = useState(config.page.location);
  const [meet, setMeet] = useState(config.create_meet);
  return <CajonV29 titulo="Dónde atendés" onGuardar={() => { onAplicar({ ...config, create_meet: meet, page: { ...config.page, location: lugar } }); return true; }} onClose={onClose}>
    <Campo etiqueta="Consultorio"><input className="ai" value={lugar} maxLength={200} onChange={e => setLugar(e.target.value)} /></Campo>
    <Segmentado etiqueta="Videollamada" opciones={[['si', 'Sí, con Meet'], ['no', 'No']]} valor={meet ? 'si' : 'no'} onCambiar={v => setMeet(v === 'si')} />
    <small className="nthint">Los horarios que se muestran salen de «Horarios de atención» en Reservas en línea. Los turnos libres salen de tu agenda.</small>
  </CajonV29>;
}

type Obra = NonNullable<PageExtras['insurers']>[number];
export function CajonObras({ config, onAplicar, onClose }: Comun) {
  const [obras, setObras] = useState<Obra[]>(config.page_extras?.insurers ?? []);
  const [nueva, setNueva] = useState('');
  const cambiar = (nombre: string, parche: Partial<Obra>) => setObras(actual => actual.map(o => (o.name === nombre ? { ...o, ...parche } : o)));
  const sumar = (nombre: string) => { const n = nombre.trim(); if (n && !obras.some(o => o.name.toLowerCase() === n.toLowerCase())) setObras([...obras, { name: n, mode: 'copago', note: '' }]); setNueva(''); };
  const sugeridas = OBRAS_SUGERIDAS.filter(n => !obras.some(o => o.name === n));
  return <CajonV29 titulo="Obras sociales" sub="Qué ve la paciente al elegir la suya" onGuardar={() => { const pendiente = nueva.trim(); onAplicar(conExtras(config, { insurers: pendiente && !obras.some(o => o.name.toLowerCase() === pendiente.toLowerCase()) ? [...obras, { name: pendiente, mode: 'copago', note: '' }] : obras })); return true; }} onClose={onClose}>
    {obras.map(o => <Fila key={o.name}>
      <Campo etiqueta={o.name}><select className="ai" value={o.mode} onChange={e => cambiar(o.name, { mode: e.target.value as ModoObraSocial })}>{MODOS_OBRA_SOCIAL.map(([v, texto]) => <option key={v} value={v}>{texto}</option>)}</select></Campo>
      <Campo etiqueta="Copago"><input className="ai" value={o.note} maxLength={60} placeholder="$8.000" disabled={o.mode !== 'copago'} onChange={e => cambiar(o.name, { note: e.target.value })} /></Campo>
    </Fila>)}
    <Campo etiqueta="Sumar otra"><select className="ai" value="" onChange={e => sumar(e.target.value)}><option value="">Elegir…</option>{sugeridas.map(n => <option key={n}>{n}</option>)}</select></Campo>
    <Campo etiqueta="O escribí el nombre"><input className="ai" value={nueva} maxLength={60} onChange={e => setNueva(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sumar(nueva); } }} /></Campo>
    <small className="nthint">Se guarda para tu panel y tu página; la reserva en línea todavía no le muestra el copago a la paciente. Para facturar, Cobranzas arma la planilla de cada obra social.</small>
  </CajonV29>;
}

export function CajonDescuentos({ config, onAplicar, onClose }: Comun) {
  const base = config.page_extras?.discounts;
  const [v, setV] = useState({ transfer: String(base?.transfer ?? 0), cash: String(base?.cash ?? 0), card: String(base?.card ?? 0) });
  const [aviso, setAviso] = useState('');
  const num = (t: string) => Math.min(100, Math.max(0, Math.round(Number(t.replace(/\D/g, '')) || 0)));
  const campo = (clave: 'transfer' | 'cash' | 'card', etiqueta: string) => <Campo etiqueta={etiqueta}><input className="ai" inputMode="numeric" value={v[clave]} onChange={e => { setAviso(''); setV({ ...v, [clave]: e.target.value }); }} /></Campo>;
  return <CajonV29 titulo="Descuentos por medio de pago" aviso={aviso} onGuardar={() => { const todos = [v.transfer, v.cash, v.card].map(num); if ([v.transfer, v.cash, v.card].some((t, i) => String(todos[i]) !== t.trim())) { setAviso('Escribí un número entre 0 y 100.'); return false; } onAplicar(conExtras(config, { discounts: { transfer: todos[0], cash: todos[1], card: todos[2] } })); return true; }} onClose={onClose}>
    <Fila>{campo('transfer', 'Transferencia (%)')}{campo('cash', 'Efectivo (%)')}{campo('card', 'Tarjeta (%)')}</Fila>
    <small className="nthint">Quedan guardados para tu página. Todavía no se descuentan solos al reservar: el importe lo ves y lo cobrás vos.</small>
  </CajonV29>;
}

export function CajonServicio({ config, tipoId, onAplicar, onClose }: Comun & { tipoId: string | null }) {
  const existente = tipoId ? config.types.find(t => t.id === tipoId) : undefined;
  const [id] = useState(() => existente?.id ?? crypto.randomUUID());
  const nota = config.page_extras?.service_notes?.[id];
  const [nombre, setNombre] = useState(existente?.name ?? '');
  const [minutos, setMinutos] = useState(String(existente?.duration_min ?? 60));
  const [precio, setPrecio] = useState(existente ? pesos(existente.price_minor) : '');
  const [sena, setSena] = useState(existente ? pesos(existente.deposit_minor) : '0');
  const [canal, setCanal] = useState<Tipo['channel']>(existente?.channel ?? 'presencial');
  const [quien, setQuien] = useState<'any' | 'patients'>(nota?.who ?? 'any');
  const [obra, setObra] = useState(nota?.insurer ?? true);
  const [indicaciones, setIndicaciones] = useState(nota?.instructions ?? '');
  const [aviso, setAviso] = useState('');
  const guardar = () => {
    const limpio = nombre.trim();
    if (!limpio) { setAviso('Poné un nombre para el servicio.'); return false; }
    const min = Math.min(180, Math.max(10, Math.round(Number(minutos) || 0)));
    const total = aCentavos(precio);
    const seña = aCentavos(sena);
    if (seña > total) { setAviso('La seña no puede ser más que el precio.'); return false; }
    const tipo: Tipo = { id, name: limpio, calendar_id: existente?.calendar_id ?? config.calendars[0].id, duration_min: min, channel: canal, price_minor: total, deposit_minor: seña };
    const tipos = existente ? config.types.map(t => (t.id === id ? tipo : t)) : [...config.types, tipo];
    onAplicar(conExtras({ ...config, types: tipos }, { service_notes: { ...config.page_extras?.service_notes, [id]: { instructions: indicaciones.trim(), who: quien, insurer: obra } } }));
    return true;
  };
  return <CajonV29 titulo={existente ? `Editar «${existente.name}»` : 'Nuevo servicio'} sub={existente ? undefined : 'Consulta, paquete o membresía'} ok={existente ? 'Guardar' : 'Crear servicio'} aviso={aviso} onGuardar={guardar} onClose={onClose}>
    <Campo etiqueta="Nombre"><input className="ai" value={nombre} maxLength={80} placeholder="Ej.: Consulta de embarazo" onChange={e => setNombre(e.target.value)} /></Campo>
    <Fila><Campo etiqueta="Duración (minutos)"><input className="ai" inputMode="numeric" value={minutos} onChange={e => setMinutos(e.target.value)} /></Campo><Campo etiqueta="Precio ($)"><input className="ai" inputMode="numeric" value={precio} placeholder="$ 0" onChange={e => setPrecio(e.target.value)} /></Campo></Fila>
    <Campo etiqueta="Seña ($)" ayuda="Se cobra con Mercado Pago cuando lo conectes."><input className="ai" inputMode="numeric" value={sena} onChange={e => setSena(e.target.value)} /></Campo>
    <Segmentado etiqueta="Dónde" opciones={[['presencial', 'Consultorio'], ['video', 'Videollamada']]} valor={canal} onCambiar={setCanal} />
    <Segmentado etiqueta="Quién reserva" opciones={[['any', 'Cualquier persona'], ['patients', 'Solo pacientes']]} valor={quien} onCambiar={setQuien} />
    <Segmentado etiqueta="Obra social" opciones={[['si', 'Acepta'], ['no', 'Solo particular']]} valor={obra ? 'si' : 'no'} onCambiar={v => setObra(v === 'si')} />
    <Campo etiqueta="Instrucciones previas"><textarea className="ai" rows={4} maxLength={400} value={indicaciones} placeholder="Le llega a la paciente al reservar" onChange={e => setIndicaciones(e.target.value)} /></Campo>
    <small className="nthint">«Quién reserva», obra social e instrucciones quedan guardados; la reserva en línea todavía deja reservar a cualquiera.</small>
  </CajonV29>;
}

export function CajonPide({ config, onAplicar, onClose }: Comun) {
  const [filas, setFilas] = useState(pedidosAlReservar(config.page_extras));
  return <CajonV29 titulo="Qué le pedimos al reservar" onGuardar={() => { onAplicar(conExtras(config, { intake: filas })); return true; }} onClose={onClose}>
    <Tildes filas={filas} onCambiar={(texto, on) => setFilas(actual => actual.map(f => (f.text === texto ? { ...f, on } : f)))} />
    <small className="nthint">Hoy la página de reservas pide nombre, teléfono y mail. Lo demás queda guardado para cuando se active.</small>
  </CajonV29>;
}

export function CajonHorarios({ config, onAplicar, onClose }: Comun) {
  const dias = horariosPorDia(config.weekly);
  const [textos, setTextos] = useState(dias.map(([, t]) => t ?? 'No atiendo'));
  const [aviso, setAviso] = useState('');
  const guardar = () => {
    let semana = config.weekly;
    for (let i = 0; i < dias.length; i += 1) {
      if (textos[i] === (dias[i][1] ?? 'No atiendo')) continue;
      const franjas = leerHorario(textos[i]);
      if (!franjas) { setAviso(`Revisá el horario del ${dias[i][0].toLowerCase()}: escribilo como «9 a 13 · 15 a 19» o «No atiendo».`); return false; }
      semana = conHorarioDelDia(semana, dias[i][2], franjas, config.calendars[0].id);
    }
    onAplicar({ ...config, weekly: semana });
    return true;
  };
  return <CajonV29 titulo="Horarios de atención" sub="Los lugares libres salen de acá y de tu agenda" aviso={aviso} onGuardar={guardar} onClose={onClose}>
    {dias.map(([dia], i) => <Campo key={dia} etiqueta={dia}><input className="ai" value={textos[i]} onChange={e => { setAviso(''); setTextos(actual => actual.map((t, k) => (k === i ? e.target.value : t))); }} /></Campo>)}
  </CajonV29>;
}

export function CajonReglas({ onClose }: { onClose: () => void }) {
  return <CajonV29 titulo="Reglas para reservar" sub="Así funciona hoy la página de reservas" ok={false} onClose={onClose}>
    <FxKv filas={[['Anticipación', 'mínimo 1 h antes'], ['Hasta', '90 días adelante'], ['Por día', 'sin tope: sale de tus horarios'], ['Primera vez', 'cualquier turno libre'], ['Cambiar o cancelar', 'hasta 24 h antes, desde la app o el link del mail']]} />
    <small className="nthint">Elegir otras reglas (anticipación, días hacia adelante, turnos por día) llega más adelante. Hoy las aplica la página igual para todas.</small>
  </CajonV29>;
}
