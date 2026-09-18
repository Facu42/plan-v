import { useCallback, useEffect, useState } from 'react';
import { careApi, careErrorMessage } from '../../api/care';
import type { CareSnapshot } from '../../types/care';

export function useCare(patientId: string, professional = false) {
  const [result, setResult] = useState<{key:string; data:CareSnapshot} | null>(null);
  const [failure, setFailure] = useState<{key:string; message:string} | null>(null);
  const [revision, setRevision] = useState(0);
  const key = `${patientId}:${professional}`;
  const reload = useCallback(() => setRevision(r => r + 1), []);
  useEffect(() => {
    if (!patientId) return;
    const controller = new AbortController(); let inFlight = false;
    const load = async () => {
      if (inFlight) return; inFlight = true;
      try { const data = await careApi.snapshot(patientId, professional, controller.signal); if (!controller.signal.aborted) { setResult({key,data}); setFailure(null); } }
      catch (error) { if (!controller.signal.aborted) setFailure({key,message:careErrorMessage(error)}); }
      finally { inFlight = false; }
    };
    void load(); const timer = window.setInterval(() => { void load(); },30000);
    window.addEventListener('plan-v:care-changed',reload);
    return () => { controller.abort(); window.clearInterval(timer); window.removeEventListener('plan-v:care-changed',reload); };
  },[patientId,professional,key,revision,reload]);
  return { data: result?.key === key ? result.data : null, error: failure?.key === key ? failure.message : '', reload };
}
