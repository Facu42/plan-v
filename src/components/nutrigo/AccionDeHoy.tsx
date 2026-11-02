// Misma fila en el riel de Hoy y en la ficha. El clic abre la pantalla; no envía.
import type { MouseEvent } from 'react';
import { contarHechos, textoHechas, type HechoAccion, type ItemHoy } from '../../lib/hoy-accion';
import { guardarIntencion } from '../../lib/hoy-sesion';
import { PanelV29Icon } from './PanelV29Icon';
import type { PanelV29IconName } from './panel-v29-icons';

const ICONO: Record<ItemHoy['action'], PanelV29IconName> = {
  mensaje: 'chat',
  ajuste_menu: 'fork',
  turno: 'cal',
};

export function AccionDeHoy({ item, onAbrir }: { item: ItemHoy; onAbrir: (href: string) => void }) {
  const abrir = (evento: MouseEvent<HTMLAnchorElement>) => {
    if (evento.button || evento.metaKey || evento.ctrlKey || evento.shiftKey || evento.altKey) return;
    evento.preventDefault();
    guardarIntencion(item);
    onAbrir(item.href);
  };
  return <a className="li pick" href={item.href} onClick={abrir} style={{ textDecoration: 'none' }}>
    <span className="ico b"><PanelV29Icon name={ICONO[item.action]} /></span>
    <span className="tx"><b>{item.nombre}</b><small>{item.titulo}. {item.cuerpo}</small></span>
    <span className="kind">{item.titulo}</span>
  </a>;
}

export function ListaHoy({ items, hechos, now, onAbrir }: { items: readonly ItemHoy[]; hechos: readonly HechoAccion[]; now: Date; onAbrir: (href: string) => void }) {
  return <div className="card" id="hoy-rail" style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
    <div className="ch"><h2>Hoy</h2><span className="meta num">{textoHechas(contarHechos(hechos, now))}</span></div>
    <div className="lst" id="hoy-list" aria-label="Qué hacer hoy" style={{ maxHeight: 240 }}>
      {items.length
        ? items.map(item => <AccionDeHoy key={`${item.patientId}:${item.sourceKey}`} item={item} onAbrir={onAbrir} />)
        : <p className="sxsub">Todo al día</p>}
    </div>
  </div>;
}
