import { useMemo } from 'react';
import { COINS } from '@shared/coins.js';
import { tokenImage } from '../../lib/tokenImages.js';

/** Floating coin mascots + ticker symbols drifting up behind everything. */
export default function Background() {
  const items = useMemo(() => {
    const coins = Object.values(COINS);
    return Array.from({ length: 22 }, (_, i) => {
      const c = coins[i % coins.length];
      const isTicker = i % 3 === 0;
      return {
        key: i,
        content: isTicker ? `$${c.ticker}` : c.emoji,
        img: isTicker ? null : tokenImage(c),
        isTicker,
        color: c.color,
        left: `${(i * 47) % 100}%`,
        size: isTicker ? 12 + (i % 4) * 3 : 18 + (i % 5) * 8,
        duration: 22 + (i % 7) * 6,
        delay: -((i * 3.7) % 40),
        hideMobile: i % 2 === 1,
      };
    });
  }, []);
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      {items.map((it) => (
        <span
          key={it.key}
          className={`absolute bottom-[-10vh] ${it.hideMobile ? 'hidden md:block' : ''} ${it.isTicker ? 'font-mono font-bold' : ''}`}
          style={{
            left: it.left, fontSize: it.size, color: it.color, opacity: it.isTicker ? 0.22 : 0.14,
            animation: `floaty ${it.duration}s linear ${it.delay}s infinite`,
            textShadow: it.isTicker ? `0 0 8px ${it.color}` : undefined,
          }}
        >
          {it.img ? <img src={it.img} alt="" className="rounded-full" style={{ width: it.size * 1.4, height: it.size * 1.4 }} /> : it.content}
        </span>
      ))}
    </div>
  );
}
