import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api } from '../../api/client';
import { assetsApi } from '../../api/assets';
import { careErrorMessage, notifyCareChanged } from '../../api/care';
import { useCare } from './useCare';
import { Icon } from '../shared/Icon';
import type { PatientAssetView } from '../../types/assets';
import './care-panel.css';

function readFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsDataURL(file);
  });
}

export function StudiesPanel({ patientId, professional = false }: { patientId: string; professional?: boolean }) {
  return <StudiesPanelContent key={`${patientId}:${professional ? 'pro' : 'patient'}`} patientId={patientId} professional={professional} />;
}

function StudiesPanelContent({ patientId, professional }: { patientId: string; professional: boolean }) {
  const { data, error, reload } = useCare(patientId, professional);
  const [assets, setAssets] = useState<PatientAssetView[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const [viewer, setViewer] = useState<{ url: string; mime: string | null } | null>(null);
  const lock = useRef(false);
  const consented = data?.consented.includes('clinical_document') ?? false;

  useEffect(() => {
    if (!consented) { setAssets([]); setViewer(null); return; }
    const controller = new AbortController();
    assetsApi.list(patientId, 'clinical_document', controller.signal)
      .then(result => setAssets(result.assets))
      .catch(err => { if (err instanceof DOMException && err.name === 'AbortError') return; setStatus(careErrorMessage(err)); });
    return () => controller.abort();
  }, [patientId, consented, data?.consented]);

  useEffect(() => {
    if (!viewer) return;
    const timer = window.setTimeout(() => setViewer(null), 60_000);
    return () => window.clearTimeout(timer);
  }, [viewer]);

  async function action(work: () => Promise<unknown>, success: string) {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setStatus('');
    try {
      await work();
      setStatus(success);
      notifyCareChanged();
    } catch (err) {
      setStatus(careErrorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem('study') as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) { setStatus('Elegí un PDF, JPG o PNG.'); return; }
    if (file.size > 20 * 1024 * 1024) { setStatus('El archivo debe pesar menos de 20 MB.'); return; }
    await action(async () => {
      const image = await readFile(file);
      const reserved = await assetsApi.reserve(patientId, 'clinical_document');
      await assetsApi.complete(patientId, reserved.asset.id, image);
      setAssets((await assetsApi.list(patientId, 'clinical_document')).assets);
      input.value = '';
    }, 'Estudio guardado. Se abre con un enlace de un minuto.');
  }

  return (
    <section className="care-panel" aria-label={professional ? 'Estudios del paciente' : 'Tus estudios'}>
      <header className="care-heading">
        <div>
          <span className="care-eyebrow">{professional ? 'FICHA' : 'PRIVACIDAD'}</span>
          <h2>{professional ? 'Estudios y análisis' : 'Estudios opcionales'}</h2>
          <p>PDF o imagen, sólo con permiso vigente. No se interpretan con IA ni se infiere un resultado clínico.</p>
        </div>
        <Icon name="pin" size={24} />
      </header>
      {error && <p className="care-error" role="alert">{error} <button type="button" onClick={reload}>Reintentar</button></p>}
      {!data && !error && <p role="status">Cargando estudios…</p>}
      {data && !professional && <ClinicalConsent patientId={patientId} granted={consented} />}
      {data && professional && !consented && <p>El paciente no habilitó el permiso de estudios. No se pueden abrir archivos.</p>}
      {data && !professional && consented && (
        <form className="care-form-row" onSubmit={event => void upload(event)}>
          <label>Archivo privado<input name="study" type="file" accept="application/pdf,image/jpeg,image/png" disabled={busy} /></label>
          <button className="nv-button primary" type="submit" disabled={busy}>Subir estudio</button>
        </form>
      )}
      {data && (
      <div className="care-records">
        {assets.length ? assets.map(asset => (
          <article key={asset.id}>
            <div>
              <span className="care-eyebrow">{asset.mime === 'application/pdf' ? 'PDF' : 'IMAGEN'}</span>
              <h3>Estudio del {new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(asset.created_at))}</h3>
              <small>{Math.max(1, Math.round(asset.byte_size / 1024))} KB · visor de 60 segundos</small>
            </div>
            <div className="care-actions">
              <button className="nv-button" type="button" disabled={busy || !consented} onClick={() => void action(async () => {
                const opened = await assetsApi.access(patientId, asset.id);
                setViewer({ url: opened.url, mime: asset.mime });
              }, 'Abierto durante un minuto.')}>Ver</button>
              {!professional && <button className="nv-button" type="button" disabled={busy} onClick={() => {
                if (window.confirm('¿Retirar este estudio? Deja de estar disponible para nuevas lecturas.')) {
                  void action(async () => {
                    await assetsApi.withdraw(patientId, asset.id);
                    setViewer(null);
                    setAssets(current => current.filter(row => row.id !== asset.id));
                  }, 'Estudio retirado.');
                }
              }}>Retirar</button>}
            </div>
          </article>
        )) : <p className="care-empty">{consented ? 'Todavía no hay estudios en esta ficha.' : professional ? 'Sin permiso vigente para abrir estudios.' : 'Activá el permiso para cargar o ver estudios.'}</p>}
      </div>
      )}
      {status && <p className="care-status" role="status">{status}</p>}
      {viewer && (
        <div className="care-modal" role="dialog" aria-modal="true" aria-label="Estudio privado">
          <div className="care-photo-view">
            <button className="nv-button" type="button" autoFocus onClick={() => setViewer(null)}>Cerrar visor</button>
            {viewer.mime === 'application/pdf' || viewer.url.startsWith('data:application/pdf')
              ? <iframe title="Estudio en PDF" src={viewer.url} />
              : <img src={viewer.url} alt="Estudio cargado por el paciente" />}
          </div>
        </div>
      )}
    </section>
  );
}

function ClinicalConsent({ patientId, granted }: { patientId: string; granted: boolean }) {
  const [catalog, setCatalog] = useState<Awaited<ReturnType<typeof api.getConsentCatalog>>['consents']>([]);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    api.getConsentCatalog({ signal: controller.signal }).then(result => setCatalog(result.consents)).catch(err => {
      if (!controller.signal.aborted) setStatus(careErrorMessage(err));
    });
    return () => controller.abort();
  }, []);
  async function toggle() {
    const text = catalog.find(entry => entry.purpose === 'clinical_document');
    if (!text || lock.current) return;
    lock.current = true;
    setBusy(true);
    setStatus('');
    try {
      await api.recordConsent(patientId, {
        purpose: text.purpose,
        text_version: text.text_version,
        text_hash: text.text_hash,
        decision: granted ? 'withdrawn' : 'granted',
      });
      notifyCareChanged();
    } catch (err) {
      setStatus(careErrorMessage(err));
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  return (
    <details className="care-consent" open={!granted}>
      <summary>Permiso para estudios</summary>
      {catalog.filter(entry => entry.purpose === 'clinical_document').map(entry => (
        <label key={entry.purpose}>
          <input type="checkbox" disabled={busy} checked={granted} onChange={() => void toggle()} />
          <span>{entry.text}</span>
        </label>
      ))}
      {status && <p role="alert">{status}</p>}
    </details>
  );
}
