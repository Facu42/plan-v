import type { PublicSchedulingPage } from '../../types/scheduling';
import { etiquetaModalidad, fotoPublica, precioConsulta } from '../../lib/public-page-profile';
import { esReseñaGoogle, estadoAtencion } from '../../lib/public-page-info';

export function PublicProfessionalHeader({ page, proximo = '' }: { page: PublicSchedulingPage; proximo?: string }) {
  const estado = estadoAtencion(page.hours);
  const foto = fotoPublica(page.page, page.profile.photo);
  const modalidad = etiquetaModalidad(page.profile.modality);
  const precio = precioConsulta(page.profile.consult_price_minor);
  const reserva = page.profile.booking_url.startsWith('https://') ? page.profile.booking_url : '';
  const detalle = [page.page.location, page.profile.area, modalidad, page.profile.license, page.page.contact].filter(Boolean).join(' · ');
  const tinta = page.profile.color && /^#[0-9A-Fa-f]{6}$/.test(page.profile.color) ? page.profile.color : undefined;
  const acento = page.profile.accent && /^#[0-9A-Fa-f]{6}$/.test(page.profile.accent) ? page.profile.accent : undefined;
  const iniciales = page.page.title.replace(/^(Lic\.?|Dra?\.?)\s+/i, '').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('');
  return <header className="pub-pro pub-hero" style={{ color: tinta, ['--pub-accent' as string]: acento }}>
    <div className="pub-hero-txt">
      {page.verified_license ? <p className="pub-verif"><span aria-hidden="true">✓</span> Matrícula verificada por Nutridash · {page.verified_license}</p> : null}
      <h1>{page.page.title}</h1>
      {page.page.bio ? <p className="pub-bio">{page.page.bio}</p> : null}
      {detalle ? <p>{detalle}</p> : null}
      {page.profile.specialties.length ? <ul>{page.profile.specialties.map(item => <li key={item}>{item}</li>)}</ul> : null}
      {precio ? <p>Consulta {precio}</p> : null}
      {reserva || page.types.length || esReseñaGoogle(page.profile.reviews_url) ? <p className="pub-acciones">
        {reserva ? <a className="pub-cta" href={reserva} rel="noreferrer" target="_blank">Reservar turno</a> : page.types.length ? <a className="pub-cta" href="#reservar">Reservar turno</a> : null}
        {esReseñaGoogle(page.profile.reviews_url) ? <a className="pub-resenas" href={page.profile.reviews_url} rel="noreferrer" target="_blank">Ver reseñas en Google</a> : null}
      </p> : null}
    </div>
    <div className="pub-stack">
      <figure className="pub-foto">{foto ? <img src={foto} alt="" width={240} height={300} /> : <span aria-hidden="true">{iniciales}</span>}</figure>
      {proximo ? <div className="pub-tarjeta pub-prox"><small>Próximo turno libre</small><b>{proximo}</b></div> : null}
      {estado ? <div className={`pub-tarjeta pub-est ${estado.abierto ? 'pub-abierto' : 'pub-cerrado-ahora'}`}><i aria-hidden="true" />{estado.texto}</div> : null}
    </div>
  </header>;
}
