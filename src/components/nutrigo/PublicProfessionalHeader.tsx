import type { PublicSchedulingPage } from '../../types/scheduling';
import { etiquetaModalidad, fotoPublica, precioConsulta } from '../../lib/public-page-profile';

export function PublicProfessionalHeader({ page }: { page: PublicSchedulingPage }) {
  const foto = fotoPublica(page.page, page.profile.photo);
  const modalidad = etiquetaModalidad(page.profile.modality);
  const precio = precioConsulta(page.profile.consult_price_minor);
  const reserva = page.profile.booking_url.startsWith('https://') ? page.profile.booking_url : '';
  const detalle = [page.page.location, page.profile.area, modalidad, page.profile.license, page.page.contact].filter(Boolean).join(' · ');
  const tinta = page.profile.color && /^#[0-9A-Fa-f]{6}$/.test(page.profile.color) ? page.profile.color : undefined;
  const acento = page.profile.accent && /^#[0-9A-Fa-f]{6}$/.test(page.profile.accent) ? page.profile.accent : undefined;
  return <header className="pub-pro" style={{ color: tinta, ['--pub-accent' as string]: acento }}>
    {foto ? <img src={foto} alt="" width={96} height={96} /> : null}
    <h1>{page.page.title}</h1>
    {page.page.bio ? <p>{page.page.bio}</p> : null}
    {detalle ? <p>{detalle}</p> : null}
    {page.profile.specialties.length ? <ul>{page.profile.specialties.map(item => <li key={item}>{item}</li>)}</ul> : null}
    {precio ? <p>Consulta {precio}</p> : null}
    {reserva ? <p><a href={reserva} rel="noreferrer" target="_blank">Reservar turno</a></p> : null}
  </header>;
}
