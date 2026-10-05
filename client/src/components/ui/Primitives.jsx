import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { tokenImage } from '../../lib/tokenImages.js';
import { COINS } from '@shared/coins.js';
import { useStore } from '../../store/useStore.js';
import { cx } from '../../lib/format.js';

export function Skeleton({ className = '' }) {
  return <div className={cx('skeleton', className)} aria-hidden="true" />;
}

const RUGS = [
  'Rug pulled! Data not found 😭',
  'The devs sold the server. Just kidding… probably. 🫠',
  'This data went to zero. Have you tried HODLing the refresh button? 🔄',
];
export function ErrorState({ message, onRetry, compact }) {
  const quip = RUGS[(message?.length || 0) % RUGS.length];
  return (
    <div role="alert" className={cx('glass rounded-2xl text-center', compact ? 'p-4' : 'p-8')}>
      <div className="text-5xl mb-2" aria-hidden>🧶🫳</div>
      <p className="heading text-2xl text-pink">{quip}</p>
      {message && message !== quip && <p className="text-muted text-sm mt-1">{message}</p>}
      {onRetry && <button className="btn-ghost mt-4" onClick={() => onRetry()}>Try again (wagmi)</button>}
    </div>
  );
}

export function EmptyState({ emoji = '🦗', title, children }) {
  return (
    <div className="glass rounded-2xl p-8 text-center">
      <div className="text-5xl mb-2" aria-hidden>{emoji}</div>
      <p className="heading text-2xl">{title}</p>
      {children && <div className="text-muted text-sm mt-1">{children}</div>}
    </div>
  );
}

export function CoinAvatar({ id, size = 48, glow = true, className = '' }) {
  const live = useStore((s) => s.coins[id]);
  const c = live || COINS[id];
  const [broken, setBroken] = useState(false);
  if (!c) return null;
  const src = !broken && tokenImage(c);
  const ring = Math.max(2, size / 24);
  return (
    <div
      className={cx('relative grid place-items-center rounded-full shrink-0 select-none', className)}
      style={{
        width: size, height: size, fontSize: size * 0.52,
        background: `radial-gradient(circle, ${c.color}, ${c.color}88 70%)`,
        boxShadow: glow ? `0 0 ${size / 3}px ${c.color}99` : undefined,
        border: `${ring}px solid ${c.color}`,
      }}
      aria-label={`${c.name} logo`}
      role="img"
    >
      {src ? (
        <img src={src} alt="" draggable="false" onError={() => setBroken(true)}
          className="w-full h-full rounded-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <span aria-hidden>{c.emoji}</span>
      )}
      {c.badge && (
        <span className="absolute -bottom-1 -right-1 rounded-full font-bold leading-none grid place-items-center border-2"
          style={{ background: c.color, color: '#000', borderColor: 'var(--bg)', fontSize: Math.max(9, size * 0.2), minWidth: size * 0.42, height: size * 0.42, padding: '0 3px' }}>
          {c.badge}
        </span>
      )}
    </div>
  );
}

/** Inline token logo for text runs (tickers in lists, feeds, chips). */
export function TokenIcon({ id, size = 18, className = '' }) {
  const c = COINS[id];
  const [broken, setBroken] = useState(false);
  if (!c) return null;
  const src = !broken && tokenImage(c);
  return src ? (
    <img src={src} alt="" width={size} height={size} onError={() => setBroken(true)} draggable="false"
      className={cx('inline-block rounded-full align-[-0.2em] shrink-0', className)} style={{ width: size, height: size, boxShadow: `0 0 0 1.5px ${c.color}` }} />
  ) : <span className={className} aria-hidden>{c.emoji}</span>;
}

export function FlairBadge({ coin }) {
  const c = COINS[coin];
  if (!c) return null;
  return (
    <span className="chip" style={{ borderColor: `${c.color}88`, color: c.color }} title={`Favorite coin: ${c.name}`}>
      <TokenIcon id={coin} size={14} /> {c.ticker}
    </span>
  );
}

export function VoteArrows({ score, myVote, onVote, horizontal }) {
  return (
    <div className={cx('flex items-center gap-1 select-none', horizontal ? 'flex-row' : 'flex-col')}>
      <motion.button whileTap={{ scale: 1.4 }} aria-label="Upvote" aria-pressed={myVote === 1}
        onClick={(e) => { e.stopPropagation(); onVote(1); }}
        className={cx('rounded-lg px-1.5 text-lg leading-none transition', myVote === 1 ? 'text-green drop-shadow-[0_0_6px_var(--green)]' : 'text-muted hover:text-green')}>▲</motion.button>
      <motion.span key={score} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="font-mono text-sm font-bold min-w-[2ch] text-center">{score}</motion.span>
      <motion.button whileTap={{ scale: 1.4 }} aria-label="Downvote" aria-pressed={myVote === -1}
        onClick={(e) => { e.stopPropagation(); onVote(-1); }}
        className={cx('rounded-lg px-1.5 text-lg leading-none transition', myVote === -1 ? 'text-pink drop-shadow-[0_0_6px_var(--pink)]' : 'text-muted hover:text-pink')}>▼</motion.button>
    </div>
  );
}

export function Modal({ open, onClose, children, label, wide }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[70] grid place-items-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={label}>
          <motion.div onClick={(e) => e.stopPropagation()} className={cx('glass-strong rounded-3xl p-6 w-full max-h-[90vh] overflow-y-auto', wide ? 'max-w-2xl' : 'max-w-md')}
            initial={{ scale: 0.85, y: 30, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[80] flex flex-col gap-2 w-[min(92vw,420px)]" aria-live="polite">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div key={t.id} layout initial={{ y: 30, opacity: 0, scale: 0.9 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ opacity: 0, x: 60 }}
            className="glass-strong rounded-xl px-4 py-3 text-sm font-semibold shadow-xl"
            style={{ borderColor: t.kind === 'error' ? 'var(--pink)' : t.kind === 'success' ? 'var(--green)' : 'var(--cyan)' }}>
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export function SectionTitle({ kicker, title, children }) {
  return (
    <div className="mb-6">
      {kicker && <div className="text-xs font-bold tracking-[0.25em] uppercase text-cyan mb-1">{kicker}</div>}
      <h2 className="heading text-4xl md:text-5xl">{title}</h2>
      {children && <p className="text-muted mt-2 max-w-2xl">{children}</p>}
    </div>
  );
}

/** Click ripple + hover glow wrapper for buttons/cards */
export function useRipple() {
  return (e) => {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const d = Math.max(r.width, r.height) / 2;
    const span = document.createElement('span');
    span.className = 'ripple';
    span.style.width = span.style.height = `${d}px`;
    span.style.left = `${(e.clientX ?? r.left + r.width / 2) - r.left - d / 2}px`;
    span.style.top = `${(e.clientY ?? r.top + r.height / 2) - r.top - d / 2}px`;
    el.appendChild(span);
    setTimeout(() => span.remove(), 720);
  };
}
