import { useEffect, useState } from 'react';
import { animate } from 'framer-motion';
import { useStore } from '../../store/useStore.js';

/** ms remaining until `target` (server clock), re-rendering ~5x/sec */
export function useCountdown(target) {
  const offset = useStore((s) => s.clockOffset);
  const calc = () => Math.max(0, (target || 0) - (Date.now() + offset));
  const [left, setLeft] = useState(calc);
  useEffect(() => {
    setLeft(calc());
    const iv = setInterval(() => setLeft(calc()), 200);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, offset]);
  return left;
}

export function useAnimatedNumber(value, duration = 0.6) {
  const [display, setDisplay] = useState(value);
  useEffect(() => {
    const ctrl = animate(display, value, { duration, ease: 'easeOut', onUpdate: (v) => setDisplay(v) });
    return () => ctrl.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return display;
}

export function useIsMobile(bp = 768) {
  const q = `(max-width: ${bp - 1}px)`;
  const [m, setM] = useState(() => typeof window !== 'undefined' && window.matchMedia(q).matches);
  useEffect(() => {
    const mq = window.matchMedia(q);
    const fn = () => setM(mq.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, [q]);
  return m;
}
