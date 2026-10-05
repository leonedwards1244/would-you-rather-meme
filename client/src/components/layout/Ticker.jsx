import { useStore } from '../../store/useStore.js';
import { fmtPct, fmtPrice } from '../../lib/format.js';
import { TokenIcon } from '../ui/Primitives.jsx';

/** Scrolling price marquee under the navbar. */
export default function Ticker() {
  const coins = useStore((s) => s.coins);
  const live = useStore((s) => s.coinsLive);
  const source = useStore((s) => s.coinsSource);
  const list = Object.values(coins).filter((c) => !c.concept);
  const row = list.map((c) => (
    <span key={c.id} className="inline-flex items-center gap-2 px-5 font-mono text-xs">
      <TokenIcon id={c.id} size={16} /><b>{c.ticker}</b>
      <span>{fmtPrice(c.price)}</span>
      <span className={c.change24h >= 0 ? 'text-green' : 'text-pink'}>{fmtPct(c.change24h)}</span>
    </span>
  ));
  return (
    <div className="border-b border-theme overflow-hidden whitespace-nowrap py-1.5 relative" style={{ background: 'color-mix(in srgb, var(--bg2) 70%, transparent)' }}>
      <div className="inline-flex animate-marquee">{row}{row}</div>
      <span className="absolute right-0 top-0 bottom-0 px-2 grid place-items-center text-[10px] uppercase tracking-wider text-muted" style={{ background: 'var(--bg2)' }}>
        {live ? `● live · ${source === 'coingecko' ? 'CoinGecko' : 'DexScreener'}` : '○ DexScreener snapshot · Oct 4–5'}
      </span>
    </div>
  );
}
