import { useEffect, useRef, useState } from 'react';
import { exchangeVisibilityApi } from '../../api/exchange-visibility';
import type { ExchangeVisibility } from '../../types/exchange-visibility';
import { careErrorMessage } from '../../api/care';

export function useExchangeVisibility() {
  const [value, setValue] = useState<ExchangeVisibility | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false);
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [attempt, setAttempt] = useState(0);
  const lock = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    exchangeVisibilityApi.get(controller.signal).then(result => { if (!controller.signal.aborted) setValue(result); })
      .catch(reason => { if (!controller.signal.aborted) setError(careErrorMessage(reason)); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [attempt]);
  async function toggle() {
    if (!value || loading || busy || error || lock.current) return;
    lock.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const saved = await exchangeVisibilityApi.save({ enabled: !value.enabled, expected_revision: value.revision });
      setValue(saved);
      setNotice(saved.enabled ? 'Equivalencias visibles en la app.' : 'Equivalencias ocultas en la app.');
    } catch (reason) { setError(careErrorMessage(reason)); }
    finally { lock.current = false; setBusy(false); }
  }
  return { value, loading, busy, error, notice, toggle, reload: () => { setNotice(''); setAttempt(n => n + 1); } };
}
