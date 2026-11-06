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
  return <header className="pub-pro pub-hero" style={{ color: tinta, ['--pub-accent' as string]: acento }}>
    {foto ? <img src={foto} alt="" width={96} height={96} /> : null}
    <h1>{page.page.title}</h1>
    {page.verified_license ? <p className="pub-verif"><span aria-hidden="true">✓</span> Matrícula verificada por Nutridash · {page.verified_license}</p> : null}
    {page.page.bio ? <p>{page.page.bio}</p> : null}
    {detalle ? <p>{detalle}</p> : null}
    {page.profile.specialties.length ? <ul>{page.profile.specialties.map(item => <li key={item}>{item}</li>)}</ul> : null}
    {precio ? <p>Consulta {precio}</p> : null}
    {estado || proximo ? <p className="pub-vivo">
      {estado ? <span className={estado.abierto ? 'pub-abierto' : 'pub-cerrado-ahora'}><i aria-hidden="true" />{estado.texto}</span> : null}
      {proximo ? <span><i aria-hidden="true" />Próximo turno libre: {proximo}</span> : null}
    </p> : null}
    {reserva || page.types.length || esReseñaGoogle(page.profile.reviews_url) ? <p className="pub-acciones">
      {reserva ? <a className="pub-cta" href={reserva} rel="noreferrer" target="_blank">Reservar turno</a> : page.types.length ? <a className="pub-cta" href="#reservar">Reservar turno</a> : null}
      {esReseñaGoogle(page.profile.reviews_url) ? <a className="pub-resenas" href={page.profile.reviews_url} rel="noreferrer" target="_blank">Ver reseñas en Google</a> : null}
    </p> : null}
  </header>;
}
