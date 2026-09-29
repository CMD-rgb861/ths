// resources/js/hooks/usePendingBell.js
import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';

const POLL_INTERVAL_MS = 13000;
const SOUND_URL = '/notifier/Notification.mp3';

/**
 * Polls /job-orders/pending-count for admins + technicians.
 *
 * Refetches on:
 *   - interval (13s)
 *   - window focus
 *   - document visibility change (tab back)
 *
 * Plays a short notification sound when the count *increases* (new job arrived),
 * but only if:
 *   - the bell is enabled (admin/tech)
 *   - the tab is visible
 *   - it's not the initial fetch
 *
 * Returns { count, loading, refresh }.
 */
export default function usePendingBell({ enabled }) {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const inFlightRef = useRef(false);
  const intervalRef = useRef(null);
  const lastCountRef = useRef(null);   // null = "we haven't fetched yet"
  const audioRef = useRef(null);

  // Preload the audio element once
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio(SOUND_URL);
    audio.preload = 'auto';
    audio.volume = 0.6;
    audioRef.current = audio;

    return () => {
      try {
        audio.pause();
        audio.src = '';
      } catch (e) {
        // ignore
      }
      audioRef.current = null;
    };
  }, []);

//   const playNotification = useCallback(() => {
//     if (typeof document !== 'undefined' && document.hidden) return;

//     const audio = audioRef.current;
//     if (!audio) return;

//     try {
//       audio.currentTime = 0;
//       const p = audio.play();
//       // Chrome may reject play() if there's been no user interaction yet.
//       // Silently ignore — the visual badge still updates.
//       if (p && typeof p.catch === 'function') {
//         p.catch(() => {});
//       }
//     } catch (e) {
//       // ignore playback errors
//     }
//   }, []);

    const playNotification = useCallback(() => {
    if (typeof document !== 'undefined' && document.hidden) return;

    const audio = audioRef.current;
    if (!audio) return;

    console.log('[bell] playNotification called at', new Date().toLocaleTimeString());

    try {
        audio.currentTime = 0;
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
        p.then(() => console.log('[bell] audio.play() resolved'))
        .catch((err) => console.log('[bell] audio.play() rejected:', err.name, err.message));
        }
    } catch (e) {
        console.error('[bell] audio.play() threw:', e);
    }
    }, []);

  const fetchCount = useCallback(async () => {
    if (!enabled) return;
    if (document.hidden) return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);

    try {
      const res = await axios.get('/job-orders/pending-count');
      const value = res?.data?.count;
      const safe = typeof value === 'number' ? value : 0;

      const previous = lastCountRef.current;
      const isFirstFetch = previous === null;
      const increased = !isFirstFetch && safe > previous;

      if (increased) {
        playNotification();
      }

      lastCountRef.current = safe;
      setCount(safe);
    } catch (err) {
      // Silent — the bell is non-critical
      if (err?.response?.status !== 401) {
        console.error('pending-count failed:', err);
      }
    } finally {
      inFlightRef.current = false;
      setLoading(false);
    }
  }, [enabled, playNotification]);

  // Initial fetch + interval polling
  useEffect(() => {
    if (!enabled) {
      setCount(0);
      lastCountRef.current = null;
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