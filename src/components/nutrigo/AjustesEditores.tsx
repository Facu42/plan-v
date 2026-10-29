// Cajones de Ajustes: Datos del consultorio, Título y matrícula, Firma y marca, plantillas y avisos.
// Mismos campos que `AJA` del boceto (design/panel-nutri/v29/panel-trabajo.html); guardan de verdad.
import { useState } from 'react';
import { nutritionCapabilityApi } from '../../api/nutrition-capabilities';
import { ajustesApi } from '../../api/ajustes';
import { CERTIFICATE_VARIABLES, TEMPLATE_KINDS, TEMPLATE_WHEN, certificateVariables, type NoticeKey, type NoticeView, type TemplateView } from '../../types/ajustes';
import type { NutritionSettingsView } from '../../types/nutrition-capabilities';
import { CajonAjustes, Campo, Fila, Segmentos, Texto } from './AjustesCajon';
import { fusionarMarca, validarImagen, type CambiosMarca } from './ficha-ajustes';

export type ModoMarca = 'datos' | 'titulo' | 'firma';
const leerImagen = (archivo: File) => new Promise<string>((ok, mal) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.onerror = () => mal(new Error('No pudimos leer la imagen.')); r.readAsDataURL(archivo); });

export function EditarMarca({ modo, data, onSaved, onClose }: { modo: ModoMarca; data: NutritionSettingsView; onSaved: (v: NutritionSettingsView) => void; onClose: () => void }) {
  const marca = data.settings.brand;
  const [c, setC] = useState({ name: marca.name, license: marca.license ?? '', cuit: marca.cuit ?? '', address: marca.address ?? '', phone: marca.phone ?? '', email: marca.email ?? '', degree: marca.degree ?? '', province_license: marca.province_license ?? '', specialty: marca.specialty ?? '', signature: marca.signature ?? '', logo: marca.logo ?? '' });
  const [aviso, setAviso] = useState('');
  const poner = (k: keyof typeof c) => (v: string) => setC(a => ({ ...a, [k]: v }));
  async function elegir(clave: 'signature' | 'logo', archivo?: File) {
    if (!archivo) return;
    const mal = validarImagen(archivo); if (mal) { setAviso(mal); return; }
    try { poner(clave)(await leerImagen(archivo)); setAviso(''); } catch (e) { setAviso(e instanceof Error ? e.message : 'No pudimos leer la imagen.'); }
  }
  async function guardar() {
    const cambios: CambiosMarca = modo === 'datos' ? { name: c.name, license: c.license, cuit: c.cuit, address: c.address, phone: c.phone, email: c.email }
      : modo === 'titulo' ? { degree: c.degree, license: c.license, province_license: c.province_license, specialty: c.specialty } : { signature: c.signature, logo: c.logo };
    onSaved(await nutritionCapabilityApi.saveSettings({ ...data.settings, brand: fusionarMarca(marca, cambios) }, data.revision));
  }
  const titulo = modo === 'datos' ? 'Datos del consultorio' : modo === 'titulo' ? 'Título y matrícula' : 'Firma y marca';
  return <CajonAjustes titulo={titulo} sub={modo === 'datos' ? 'Salen en certificados y en tu página' : modo === 'titulo' ? 'Se imprimen en certificados' : 'Se usan en certificados e informes'} onGuardar={guardar} onClose={onClose}>
    {modo === 'datos' ? <>
      <Campo etiqueta="Nombre"><Texto valor={c.name} alCambiar={poner('name')} ayuda="Consultorio Lic. …" /></Campo>
      <Fila><Campo etiqueta="Matrícula"><Texto valor={c.license} alCambiar={poner('license')} max={40} /></Campo><Campo etiqueta="CUIT"><Texto valor={c.cuit} alCambiar={poner('cuit')} max={20} /></Campo></Fila>
      <Campo etiqueta="Dirección"><Texto valor={c.address} alCambiar={poner('address')} max={160} /></Campo>
      <Fila><Campo etiqueta="Teléfono"><Texto valor={c.phone} alCambiar={poner('phone')} max={40} /></Campo><Campo etiqueta="Mail"><Texto valor={c.email} alCambiar={poner('email')} tipo="email" /></Campo></Fila>
    </> : modo === 'titulo' ? <>
      <Campo etiqueta="Título"><Texto valor={c.degree} alCambiar={poner('degree')} ayuda="Lic. en Nutrición · UBA" /></Campo>
      <Fila><Campo etiqueta="Matrícula nacional"><Texto valor={c.license} alCambiar={poner('license')} max={40} /></Campo><Campo etiqueta="Provincial"><Texto valor={c.province_license} alCambiar={poner('province_license')} max={60} /></Campo></Fila>
      <Campo etiqueta="Especialidad"><Texto valor={c.specialty} alCambiar={poner('specialty')} /></Campo>
    </> : <>
      <Campo etiqueta="Firma" ayuda="Foto de tu firma sobre fondo blanco · PNG o JPG de hasta 500 KB">
        <input className="ai" type="file" accept="image/png,image/jpeg" onChange={e => void elegir('signature', e.target.files?.[0])} />
      </Campo>
      {c.signature ? <div className="ajfirma"><img src={c.signature} alt="Tu firma" style={{ maxHeight: 46, maxWidth: 150 }} /></div> : null}
      {c.signature ? <button type="button" className="chip" onClick={() => poner('signature')('')}>Quitar firma</button> : null}
      <Campo etiqueta="Logo" ayuda="Si no subís uno, se usa la V de Nutridash">
        <input className="ai" type="file" accept="image/png,image/jpeg" onChange={e => void elegir('logo', e.target.files?.[0])} />
      </Campo>
      {c.logo ? <img src={c.logo} width={40} height={40} alt="Tu logo" /> : null}
      {c.logo ? <button type="button" className="chip" onClick={() => poner('logo')('')}>Usar la V de Nutridash</button> : null}
    </>}
    {aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}
  </CajonAjustes>;
}

type ModoPlantilla = 'nueva' | 'editar' | 'cuando';
export function EditarPlantilla({ modo, plantilla, onSaved, onEliminada, onClose }: { modo: ModoPlantilla; plantilla?: TemplateView; onSaved: (t: TemplateView) => void; onEliminada: (id: string) => void; onClose: () => void }) {
  const [aviso, setAviso] = useState('');
  const [nombre, setNombre] = useState(plantilla?.name ?? ''), [tipo, setTipo] = useState<(typeof TEMPLATE_KINDS)[number]>(plantilla?.kind ?? 'Formulario');
  const [cuando, setCuando] = useState<(typeof TEMPLATE_WHEN)[number]>(plantilla?.when_text ?? TEMPLATE_WHEN[0]);
  const [preguntas, setPreguntas] = useState<string[]>(plantilla?.kind === 'Formulario' ? plantilla.questions : ['Pregunta 1']);
  const [texto, setTexto] = useState(plantilla?.kind === 'Certificado' ? plantilla.text : 'Certifico que {nombre}, DNI {dni}, asistió a consulta nutricional el {fecha}.');
  async function guardar() {
    const id = plantilla?.id ?? crypto.randomUUID(), comun = { id, name: nombre.trim(), when_text: cuando };
    const entrada = tipo === 'Certificado' ? { ...comun, kind: 'Certificado' as const, text: texto.trim() } : { ...comun, kind: 'Formulario' as const, questions: preguntas.map(p => p.trim()).filter(Boolean) };
    if (entrada.name.length < 2) throw new Error('Poné un nombre para la plantilla.');
    if (entrada.kind === 'Formulario' && !entrada.questions.length) throw new Error('Agregá al menos una pregunta.');
    if (entrada.kind === 'Certificado' && entrada.text.length < 10) throw new Error('Escribí el texto del certificado.');
    onSaved((await ajustesApi.saveTemplate(entrada)).template);
  }
  const titulo = modo === 'nueva' ? 'Nueva plantilla' : modo === 'cuando' ? 'Cuándo se usa' : `Editar «${plantilla?.name}»`;
  return <CajonAjustes titulo={titulo} guardar={modo === 'nueva' ? 'Crear' : 'Guardar'} onGuardar={guardar} onClose={onClose}>
    {modo === 'cuando' ? null : <Campo etiqueta="Nombre"><Texto valor={nombre} alCambiar={setNombre} max={80} ayuda="Ej.: Control de embarazo" /></Campo>}
    {modo === 'nueva' ? <Campo etiqueta="Tipo"><Segmentos opciones={TEMPLATE_KINDS} valor={tipo} alCambiar={setTipo} /></Campo> : null}
    {modo === 'nueva' || modo === 'cuando' ? <Campo etiqueta={modo === 'cuando' ? 'Momento' : 'Cuándo se manda'}>
      <select className="ai" value={cuando} onChange={e => setCuando(e.target.value as typeof cuando)}>{TEMPLATE_WHEN.map(o => <option key={o}>{o}</option>)}</select></Campo> : null}
    {modo === 'editar' && tipo === 'Certificado' ? <Campo etiqueta="Texto" ayuda={`Variables: ${CERTIFICATE_VARIABLES.map(v => `{${v}}`).join(' ')}`}>
      <textarea className="ai" rows={5} maxLength={1200} value={texto} onChange={e => setTexto(e.target.value)} /></Campo> : null}
    {modo === 'editar' && tipo === 'Formulario' ? <>
      {preguntas.map((p, i) => <Campo key={i} etiqueta={`Pregunta ${i + 1}`}><Texto valor={p} alCambiar={v => setPreguntas(a => a.map((x, j) => j === i ? v : x))} max={200} /></Campo>)}
      <div className="arow">{preguntas.length < 30 ? <button type="button" className="chip" onClick={() => setPreguntas(a => [...a, ''])}>Agregar pregunta</button> : null}
        {preguntas.length > 1 ? <button type="button" className="chip" onClick={() => setPreguntas(a => a.slice(0, -1))}>Quitar la última</button> : null}</div>
    </> : null}
    {modo === 'editar' && plantilla ? <button type="button" className="chip" onClick={() => { ajustesApi.deleteTemplate(plantilla.id).then(() => { onEliminada(plantilla.id); onClose(); }).catch(() => setAviso('No pudimos eliminarla. Probá de nuevo.')); }}>Eliminar plantilla</button> : null}
    {aviso ? <p className="sxsub" role="alert">{aviso}</p> : null}
  </CajonAjustes>;
}

export function EditarAviso({ clave, titulo, cuando, texto, activo, onSaved, onClose }: { clave: NoticeKey; titulo: string; cuando: string; texto: string; activo: boolean; onSaved: (n: NoticeView) => void; onClose: () => void }) {
  const [c, setC] = useState(cuando), [t, setT] = useState(texto);
  return <CajonAjustes titulo={titulo} sub="Por la app y por mail" onGuardar={async () => { onSaved((await ajustesApi.saveNotice({ key: clave, enabled: activo, when_text: c.trim() || null, message: t.trim() || null })).notice); }} onClose={onClose}>
    <Campo etiqueta="Cuándo"><Texto valor={c} alCambiar={setC} /></Campo>
    <Campo etiqueta="Mensaje" ayuda="Podés usar {nombre}, {hora} y {fecha}."><textarea className="ai" rows={4} maxLength={500} value={t} onChange={e => setT(e.target.value)} /></Campo>
  </CajonAjustes>;
}
export { certificateVariables };
