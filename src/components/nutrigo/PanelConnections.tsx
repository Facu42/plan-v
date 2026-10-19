export type ConnectionKey = 'google' | 'mercadopago' | 'whatsapp';

const ROWS: Array<{ key: ConnectionKey; title: string; detail: string }> = [
  { key: 'mercadopago', title: 'Mercado Pago', detail: 'Para cobrar señas y cuotas' },
  { key: 'google', title: 'Google Calendar', detail: 'Tus turnos en tu calendario' },
  { key: 'whatsapp', title: 'WhatsApp', detail: 'Recordatorios automáticos' },
];

export function PanelConnections({ connected, onConnect }: {
  connected: Record<ConnectionKey, boolean>;
  onConnect: (key: ConnectionKey) => void;
}) {
  return <div className="p5-connections">{ROWS.map(row => <div className="p5-li" key={row.key}>
    <div className="p5-tx"><b>{row.title}</b><span>{connected[row.key] ? 'Conectado' : row.detail}</span></div>
    {connected[row.key]
      ? <span className="p5-pill">Conectado</span>
      : <button type="button" className="p5-btn" onClick={() => onConnect(row.key)}>Conectar</button>}
  </div>)}</div>;
}
