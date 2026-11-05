// «Directorio de nutris» en Mi página: la nutri sube su matrícula, ve si está verificada y elige si aparece.
// El boceto v29 no dibuja este bloque: se arma solo con sus piezas (`.fxp`, `.fxkv`, `.pill`, `.pubask`, `.sw`, `.sbtn`)
// y el cajón de edición (`#actw`, `.af`, `.ai`, `.arow`, `.aseg`), igual que los demás bloques de la página.
import { useEffect, useState } from 'react';
import { directoryApi } from '../../api/directory';
import { friendlyError } from '../../lib/error-messages';
import { LICENSE_MAX_BYTES, LICENSE_MIMES, STATUS_TEXT, licenseLabel, type DirectoryListingView, type LicenseScope } from '../../types/directory';
import { FxKv, FxPanel } from './ficha-fx';
import { CajonAjustes, Campo, Fila, Segmentos, Texto } from './AjustesCajon';

const CLASE_ESTADO = { pending: 'p-wait', verified: 'p-conf', rejected: 'p-bad' } as const;
const ALCANCES = ['Nacional', 'Provincial'] as const;
export const LINK_DIRECTORIO = '/profesionales';

export function textoDirectorio(listing: DirectoryListingView | null, publicada: boolean): string {
  if (!listing) return 'Gratis para nutris matriculadas. Subí tu matrícula: la revisamos y salís en el directorio con el sello de verificada.';
  if (listing.status === 'rejected') return `No pudimos verificarla: ${listing.reject_reason || 'revisá el archivo'}. Subila de nuevo con «Cambiar».`;
  if (listing.status === 'pending') return 'La estamos revisando. Cuando la verifiquemos vas a ver el sello acá; no hace falta que hagas nada.';
  if (!publicada) return 'Verificada. Publicá tu página para salir en el directorio.';
  return listing.listed ? 'Verificada. Salís en el directorio de Nutridash.' : 'Verificada. Elegiste no salir en el directorio.';
}

export function validarMatricula(archivo: File): string {
  if (!(LICENSE_MIMES as readonly string[]).includes(archivo.type)) return 'Subí la matrícula en PDF, JPG o PNG.';
  if (archivo.size > LICENSE_MAX_BYTES) return 'El archivo pesa más de 5 MB. Probá con una foto más liviana.';
  return '';
}

const leer = (archivo: File) => new Promise<string>((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => mal(new Error('No pudimos leer el archivo.')); r.readAsDataURL(archivo); });

function Interruptor({ etiqueta, activo, onCambiar }: { etiqueta: string; activo: boolean; onCambiar?: () => void }) {
  return <button type="button" className="sw" role="switch" aria-checked={activo} aria-label={etiqueta} disabled={!onCambiar} onClick={onCambiar} />;
}

export function PanelDirectorio({ publicada, matriculaSugerida = '' }: { publicada: boolean; matriculaSugerida?: string }) {
  const [listing, setListing] = useState<DirectoryListingView | null>(null);
  const [cargando, setCargando] = useState(true), [error, setError] = useState(''), [ocupado, setOcupado] = useState(false), [cajon, setCajon] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    void directoryApi.mine(controller.signal).then(r => { if (!controller.signal.aborted) setListing(r.listing); })
      .catch(e => { if (!controller.signal.aborted) setError(friendlyError(e)); })
      .finally(() => { if (!controller.signal.aborted) setCargando(false); });
    return () => controller.abort();
  }, []);
  async function alternar() {
    if (!listing) return;
    setOcupado(true); setError('');
    try { setListing((await directoryApi.setListed(!listing.listed)).listing); } catch (e) { setError(friendlyError(e)); } finally { setOcupado(false); }
  }
  const meta = cargando ? undefined : <span className={`pill ${listing ? CLASE_ESTADO[listing.status] : 'p-ok'}`}>{listing ? STATUS_TEXT[listing.status] : 'Sin matrícula'}</span>;
  return <>
    <FxPanel titulo="Directorio de nutris" meta={meta} derecha={<button type="button" className="sbtn cbtn" disabled={cargando} onClick={() => setCajon(true)}>{listing ? 'Cambiar' : 'Subir matrícula'}</button>}>
      {cargando ? <p className="sxsub">Cargando…</p> : <>
        <FxKv filas={[['Matrícula', listing ? licenseLabel(listing.license_scope, listing.license_number, listing.license_province) : 'Sin subir'], ['Archivo', listing ? listing.file_kind : 'Sin subir']]} />
        <p className="sxsub">{textoDirectorio(listing, publicada)}</p>
        <span className="pubask">Aparecer en el directorio <Interruptor etiqueta="Aparecer en el directorio" activo={Boolean(listing?.listed)} onCambiar={listing && !ocupado ? () => void alternar() : undefined} /></span>
        <small className="nthint">El archivo es privado: solo lo ve Nutridash para verificarla. {listing?.status === 'verified' ? <a href={LINK_DIRECTORIO} target="_blank" rel="noreferrer">Ver el directorio</a> : null}</small>
      </>}
      {error ? <p className="sxsub" role="alert">{error}</p> : null}
    </FxPanel>
    {cajon ? <CajonMatricula actual={listing} sugerida={matriculaSugerida} onSaved={setListing} onClose={() => setCajon(false)} /> : null}
  </>;
}

function CajonMatricula({ actual, sugerida, onSaved, onClose }: { actual: DirectoryListingView | null; sugerida: string; onSaved: (l: DirectoryListingView) => void; onClose: () => void }) {
  const [alcance, setAlcance] = useState<(typeof ALCANCES)[number]>(actual?.license_scope === 'provincial' ? 'Provincial' : 'Nacional');
  const [numero, setNumero] = useState(actual?.license_number ?? sugerida.replace(/^MN\s*/i, ''));
  const [provincia, setProvincia] = useState(actual?.license_province ?? '');
  const [archivo, setArchivo] = useState(''), [nombre, setNombre] = useState(''), [aviso, setAviso] = useState('');
  async function elegir(file?: File) {
    if (!file) return;
    const mal = validarMatricula(file); if (mal) { setAviso(mal); setArchivo(''); return; }
    try { setArchivo(await leer(file)); setNombre(file.name); setAviso(''); } catch (e) { setAviso(e instanceof Error ? e.message : 'No pudimos leer el archivo.'); }
  }
  async function guardar() {
    if (numero.trim().length < 2) throw new Error('Escribí el número de matrícula.');
    if (alcance === 'Provincial' && !provincia.trim()) throw new Error('Escribí la provincia de la matrícula.');
    if (!archivo) throw new Error('Elegí la foto o el PDF de tu matrícula.');
    const scope: LicenseScope = alcance === 'Nacional' ? 'nacional' : 'provincial';
    onSaved((await directoryApi.submit({ license_number: numero.trim(), license_scope: scope, license_province: provincia.trim(), listed: actual?.listed ?? true, file: archivo })).listing);
  }
  return <CajonAjustes titulo="Tu matrícula" sub="Para salir en el directorio con el sello de verificada" guardar="Enviar a revisar" onGuardar={guardar} onClose={onClose}>
    <Campo etiqueta="Tipo"><Segmentos opciones={ALCANCES} valor={alcance} alCambiar={setAlcance} /></Campo>
    <Fila>
      <Campo etiqueta="Número"><Texto valor={numero} alCambiar={setNumero} max={40} ayuda="4521" /></Campo>
      {alcance === 'Provincial' ? <Campo etiqueta="Provincia"><Texto valor={provincia} alCambiar={setProvincia} max={60} ayuda="Buenos Aires" /></Campo> : null}
    </Fila>
    <Campo etiqueta="Foto o PDF de la matrícula" ayuda="Que se lean tu nombre y el número · PDF, JPG o PNG de hasta 5 MB">
      <input className="ai" type="file" accept={LICENSE_MIMES.join(',')} onChange={e => void elegir(e.target.files?.[0])} />
    </Campo>
    {nombre ? <small className="nthint">Elegiste {nombre}.</small> : null}
    {actual ? <small className="nthint">Al enviarla de nuevo vuelve a revisión y salís del directorio hasta que la verifiquemos.</small> : null}
    {aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}
  </CajonAjustes>;
}
