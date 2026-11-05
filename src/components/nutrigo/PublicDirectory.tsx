// Directorio público «Nutris verificadas»: solo nutris con la matrícula verificada por Nutridash,
// que eligieron aparecer y tienen su página pública prendida. Usa las mismas piezas que la página pública (/slug).
import { useEffect, useMemo, useState } from 'react';
import { directoryApi } from '../../api/directory';
import { friendlyError } from '../../lib/error-messages';
import { etiquetaModalidad } from '../../lib/public-page-profile';
import type { DirectoryCard } from '../../types/directory';
import './care-panel.css';
import './scheduling.css';

const MODOS = [['', 'Todas'], ['presencial', 'Presencial'], ['online', 'Online']] as const;
type Modo = (typeof MODOS)[number][0];

const sinTildes = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** Busca por nombre, zona, ciudad o especialidad; «ambas» entra en presencial y en online. */
export function filtrarDirectorio(nutris: DirectoryCard[], texto: string, modo: Modo): DirectoryCard[] {
  const q = sinTildes(texto.trim());
  return nutris.filter(n => {
    if (modo && n.modality !== modo && n.modality !== 'ambas') return false;
    if (!q) return true;
    return sinTildes([n.title, n.area, n.location, ...n.specialties].join(' ')).includes(q);
  });
}

const iniciales = (nombre: string) => nombre.replace(/^(Lic\.?|Dra?\.?)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');

export function PublicDirectory() {
  const [nutris, setNutris] = useState<DirectoryCard[] | null>(null), [error, setError] = useState('');
  const [texto, setTexto] = useState(''), [modo, setModo] = useState<Modo>('');
  useEffect(() => {
    const controller = new AbortController();
    document.title = 'Nutris verificadas · Nutridash';
    void directoryApi.publicList(controller.signal).then(r => { if (!controller.signal.aborted) setNutris(r.nutris); })
      .catch(e => { if (!controller.signal.aborted) setError(friendlyError(e)); });
    return () => controller.abort();
  }, []);
  const lista = useMemo(() => filtrarDirectorio(nutris ?? [], texto, modo), [nutris, texto, modo]);
  return <section className="care-panel scheduling-panel pub-dir" aria-label="Nutris verificadas">
    <header className="pub-pro">
      <h1>Nutris verificadas</h1>
      <p>Nutricionistas con la matrícula revisada por Nutridash. Elegí la que te quede cerca o atienda online y reservá desde su página.</p>
    </header>
    <form className="pub-dir-buscar" role="search" onSubmit={e => e.preventDefault()}>
      <label>Buscar <input type="search" value={texto} maxLength={60} placeholder="Zona, ciudad o especialidad" onChange={e => setTexto(e.target.value)} /></label>
      <label>Modalidad <select value={modo} onChange={e => setModo(e.target.value as Modo)}>{MODOS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}</select></label>
    </form>
    {error ? <p role="alert">{error}</p> : nutris === null ? <p>Cargando…</p> : lista.length === 0
      ? <p>{nutris.length ? 'No hay nutris con esa búsqueda. Probá con otra zona o especialidad.' : 'Todavía no hay nutris verificadas en el directorio.'}</p>
      : <ul className="pub-dir-lista">{lista.map(n => <li key={n.slug}>
        <a className="pub-pro" href={`/${encodeURIComponent(n.slug)}`}>
          {n.photo ? <img src={n.photo} alt="" width={56} height={56} loading="lazy" /> : <span className="pub-dir-av" aria-hidden="true">{iniciales(n.title)}</span>}
          <span>
            <b>{n.title}</b>
            <small>{[n.area || n.location, etiquetaModalidad(n.modality)].filter(Boolean).join(' · ')}</small>
            <small className="pub-verif">Matrícula verificada · {n.license}</small>
          </span>
          {n.specialties.length ? <ul>{n.specialties.map(e => <li key={e}>{e}</li>)}</ul> : null}
        </a>
      </li>)}</ul>}
    <p><small>Nutridash revisa que la matrícula exista y sea de quien la publica. No recomienda a ninguna profesional en particular.</small></p>
  </section>;
}
