type Paso = { id: string; label: string; estado: 'hecho' | 'pendiente' | 'sin_dato' };

const TEXTO: Record<Paso['estado'], string> = { hecho: 'Hecho', pendiente: 'Pendiente', sin_dato: 'Sin dato' };

/** Checklist de arranque, con los pasos ya resueltos. Se puede ocultar. */
export function ActivacionTarjeta({ pasos, nota, trabada, onOcultar }: { pasos: Paso[]; nota: string; trabada: boolean; onOcultar: () => void }) {
  return (
    <section className="card activacion-nutri" aria-label="Tu arranque">
      <div className="ch"><h2>Tu arranque{trabada ? ' · hace varios días que falta un paso' : ''}</h2><button type="button" className="lnk" onClick={onOcultar}>Ocultar</button></div>
      <ol>{pasos.map((paso) => <li key={paso.id}><b>{paso.label}</b> · {TEXTO[paso.estado]}</li>)}</ol>
      {nota ? <p>{nota}</p> : null}
    </section>
  );
}
