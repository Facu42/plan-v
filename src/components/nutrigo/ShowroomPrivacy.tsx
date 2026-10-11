import { useState } from 'react';
import { api } from '../../api/client';
import { NvButton } from './primitives';

type Step = 'idle' | 'exporting' | 'exported' | 'confirm-delete' | 'deleting' | 'deleted';

/** Nombre del archivo de la copia: fecha local, sin datos de la paciente. */
export function exportFileName(now: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `plan-v-mis-datos-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

function saveJson(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/**
 * "Tus datos" (ley 25.326): la paciente descarga una copia de lo que cargó y puede
 * pedir que se borre su cuenta. El servidor arma la copia al momento y registra
 * cada pedido; el borrado desactiva la cuenta y el resto lo termina el servidor.
 */
export function ShowroomPrivacy({ patientId, onClose, onDeleted }: { patientId: string; onClose: () => void; onDeleted: () => void }) {
  const [step, setStep] = useState<Step>('idle');
  const [error, setError] = useState('');
  const busy = step === 'exporting' || step === 'deleting';

  const download = async () => {
    setError('');
    setStep('exporting');
    try {
      const { request } = await api.requestPrivacy(patientId, { kind: 'export' });
      const { package: data } = await api.downloadPrivacyPackage(patientId, request.id);
      saveJson(data, exportFileName(new Date()));
      setStep('exported');
    } catch {
      setError('No pudimos preparar la copia. Probá de nuevo en un rato.');
      setStep('idle');
    }
  };

  const remove = async () => {
    setError('');
    setStep('deleting');
    try {
      await api.requestPrivacy(patientId, { kind: 'delete' });
      setStep('deleted');
    } catch {
      setError('No pudimos registrar el pedido. Probá de nuevo o escribinos.');
      setStep('confirm-delete');
    }
  };

  const close = step === 'deleted' ? onDeleted : onClose;

  return <div className="nv-modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && !busy && close()}>
    <section className="nv-dialog nv-privacy" role="dialog" aria-modal="true" aria-labelledby="nv-privacy-title">
      <header className="nv-dialog-head">
        <div><p className="nv-eyebrow">Tu cuenta</p><h2 id="nv-privacy-title">Tus datos</h2><p>Son tuyos. Podés llevarte una copia o pedir que borremos tu cuenta.</p></div>
        <button type="button" onClick={close} disabled={busy} aria-label="Cerrar">×</button>
      </header>

      {step === 'deleted' ? <>
        <p>Recibimos tu pedido. Tu cuenta quedó desactivada y vamos a borrar tus datos. Tu nutricionista puede tener que guardar la historia clínica el tiempo que pide la ley.</p>
        <footer className="nv-dialog-actions"><NvButton onClick={onDeleted}>Cerrar sesión</NvButton></footer>
      </> : step === 'confirm-delete' || step === 'deleting' ? <>
        <p><strong>¿Seguro que querés borrar tu cuenta?</strong> Vas a dejar de ver tu plan, tus mensajes y tu diario. No se puede deshacer. Si querés, primero descargá una copia.</p>
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <footer className="nv-dialog-actions">
          <NvButton className="nv-ghost" onClick={() => setStep('idle')} disabled={busy}>No, volver</NvButton>
          <NvButton className="nv-danger" onClick={remove} disabled={busy}>{busy ? 'Enviando…' : 'Sí, borrar mi cuenta'}</NvButton>
        </footer>
      </> : <>
        <div className="nv-privacy-row">
          <div><h3>Descargar una copia</h3><p>Un archivo con lo que cargaste: diario, medidas, mensajes, turnos y tu ingreso.</p></div>
          <NvButton className="nv-soft" onClick={download} disabled={busy}>{step === 'exporting' ? 'Preparando…' : step === 'exported' ? 'Descargar otra vez' : 'Descargar'}</NvButton>
        </div>
        {step === 'exported' && <p className="nv-caption" role="status">Listo, la copia se descargó.</p>}
        <div className="nv-privacy-row">
          <div><h3>Borrar mi cuenta</h3><p>Desactivamos tu cuenta y borramos tus datos.</p></div>
          <NvButton className="nv-ghost" onClick={() => setStep('confirm-delete')} disabled={busy}>Borrar cuenta</NvButton>
        </div>
        {error && <p className="nv-dialog-error" role="alert">{error}</p>}
        <p className="nv-privacy-legal"><a href="/legal/privacidad.html" target="_blank" rel="noreferrer">Política de privacidad</a> · <a href="/legal/terminos.html" target="_blank" rel="noreferrer">Términos y condiciones</a></p>
      </>}
    </section>
  </div>;
}
