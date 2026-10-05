import { useCallback, useEffect, useRef, useState } from 'react';
import { useStore } from '../store/useStore.js';

/** Fetch helper with loading / error / reload, waits for the transport to exist. */
export function useApi(fn, deps = []) {
  const transport = useStore((s) => s.transport);
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const fnRef = useRef(fn);
  fnRef.current = fn;
  const load = useCallback(async (silent = false) => {
    if (!transport) return;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fnRef.current(transport.api);
      setState({ loading: false, error: null, data });
    } catch (e) {
      setState({ loading: false, error: e.message || 'Rug pulled! Data not found 😭', data: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transport, ...deps]);
  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load, setData: (d) => setState((s) => ({ ...s, data: typeof d === 'function' ? d(s.data) : d })) };
}
