import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const POLL_INTERVAL_MS = 13000;

/**
 * Polls /job-orders/pending-count for admins + technicians.
 * Refetches on:
 *   - interval (13s)
 *   - window focus
 *   - document visibility change (tab back)
 * Returns { count, refresh }.
 */
export default function usePendingBell({ enabled }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef(false);
  const intervalRef = useRef(null);

  const fetchCount = useCallback(async () => {
    if (!enabled) return;
    if (document.hidden) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);

    try {
      const res = await axios.get('/job-orders/pending-count');
      const value = res?.data?.count;
      setCount(typeof value === 'number' ? value : 0);
    } catch (err) {
      // Silent — the bell is non-critical
      if (err?.response?.status !== 401) {
        console.error('pending-count failed:', err);
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [enabled]);

  // Initial fetch + interval polling
  useEffect(() => {
    if (!enabled) {
      setCount(0);
      return;
    }

    fetchCount();

    intervalRef.current = setInterval(fetchCount, POLL_INTERVAL_MS);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [enabled, fetchCount]);

  // Refetch on window focus + tab visibility
  useEffect(() => {
    if (!enabled) return;

    const onFocus = () => fetchCount();
    const onVisible = () => {
      if (document.visibilityState === 'visible') fetchCount();
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, fetchCount]);

  return { count, loading, refresh: fetchCount };
}