// Lo que busca quien llega a /slug: precios, horarios de atención y dónde queda el consultorio.
// Se arma con lo que la nutri ya cargó (servicios, agenda semanal, dirección y modalidad).
import type { PublicSchedulingPage } from '../../types/scheduling';
import { dineroPublico, filasHorarios, urlMapa } from '../../lib/public-page-info';

export function PublicProfessionalInfo({ page }: { page: PublicSchedulingPage }) {
  const filas = filasHorarios(page.hours);
  const modalidad = page.profile.modality;
  const presencial = modalidad !== 'online' && page.page.location.trim() !== '';
  const online = modalidad === 'online' || modalidad === 'ambas' || page.types.some(t => t.channel === 'video');
  return <div className="pub-info">
    {page.types.length ? <section className="pub-card pub-precios-card" aria-labelledby="pub-precios">
      <h2 id="pub-precios">Servicios y precios</h2>
      <ul className="pub-precios">{page.types.map(t => <li key={t.id}>
        <span><b>{t.name}</b><small>{t.channel === 'video' ? 'Videollamada' : 'Presencial'} · {t.duration_min} min</small></span>
        <strong>{dineroPublico(t.price_minor)}</strong>
      </li>)}</ul>
    </section> : null}
    {filas.length ? <section className="pub-card pub-horarios-card" aria-labelledby="pub-horarios">
      <h2 id="pub-horarios">Horarios de atención</h2>
      <dl className="pub-horarios">{filas.map(f => <div key={f.dia}><dt>{f.dia}</dt><dd className={f.tramos === 'Cerrado' ? 'pub-cerrado' : undefined}>{f.tramos}</dd></div>)}</dl>
      <small>Horario de Argentina.</small>
    </section> : null}
    {presencial || online ? <section className="pub-card pub-lugar" aria-labelledby="pub-lugar">
      <h2 id="pub-lugar">Dónde atiende</h2>
      <ul className="pub-modos">
        {presencial ? <li>Atiende en consultorio</li> : null}
        <li className={online ? 'pub-si' : 'pub-no'}>{online ? 'Atiende online por videollamada' : 'No atiende online'}</li>
      </ul>
      {presencial ? <>
        <p>{[page.page.location, page.profile.area].filter(Boolean).join(' · ')}</p>
        <iframe className="pub-mapa" title={`Mapa: ${page.page.location}`} loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={urlMapa(page.page.location, true)} />
        <a className="pub-como" href={urlMapa(page.page.location, false)} target="_blank" rel="noreferrer">Cómo llegar</a>
      </> : null}
    </section> : null}
  </div>;
}
