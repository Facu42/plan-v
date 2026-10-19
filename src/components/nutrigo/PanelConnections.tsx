import { usePanelScheduling } from './use-panel-scheduling';
import './panel-fase5.css';

export type ConnectionKey = 'google' | 'mercadopago';

const ROWS: Array<{ key: ConnectionKey; title: string; detail: string }> = [
  { key: 'mercadopago', title: 'Mercado Pago', detail: 'Para cobrar señas y cuotas' },
  { key: 'google', title: 'Google Calendar', detail: 'Tus turnos en tu calendario' },
];

export function PanelConnections({ connected, onConnect, onDisconnect }: {
  connected: Record<ConnectionKey, boolean>;
  onConnect: (key: ConnectionKey) => void;
  onDisconnect?: (key: ConnectionKey) => void;
}) {
  return <div className="p5-connections">{ROWS.map(row => <div className="p5-li" key={row.key}>
    <div className="p5-tx"><b>{row.title}</b><span>{connected[row.key] ? 'Conectado' : row.detail}</span></div>
    {connected[row.key]
      ? <>
          <span className="p5-pill">Conectado</span>
          {onDisconnect && <button type="button" className="p5-btn" onClick={() => onDisconnect(row.key)}>Desconectar</button>}
        </>
      : <button type="button" className="p5-btn" onClick={() => onConnect(row.key)}>Conectar</button>}
  </div>)}</div>;
}

/** Conexiones del consultorio, sin WhatsApp: los avisos van por la app. */
export function PanelConfigConnections() {
  const scheduling = usePanelScheduling();
  return <section className="p5" aria-label="Conexiones">
    <section className="p5-card">
      <header><h3>Conexiones</h3></header>
      <p className="p5-note">Los mensajes y recordatorios van por el chat y los avisos de la app.</p>
      <PanelConnections connected={{ google: Boolean(scheduling.snapshot?.connections.google), mercadopago: Boolean(scheduling.snapshot?.connections.mercadopago) }} onConnect={key => void scheduling.connect(key)} onDisconnect={key => void scheduling.disconnect(key)} />
      {scheduling.status && <p className="p5-status" role="status">{scheduling.status}</p>}
      {scheduling.error && <p className="p5-alert" role="alert">{scheduling.error}</p>}
    </section>
  </section>;
}
