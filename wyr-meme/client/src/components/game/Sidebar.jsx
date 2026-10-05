import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COINS, MATCHUPS } from '@shared/coins.js';
import { useStore } from '../../store/useStore.js';
import { Skeleton, EmptyState, TokenIcon, CoinAvatar } from '../ui/Primitives.jsx';
import { cx, timeAgo } from '../../lib/format.js';

export function LiveFeed() {
  const feed = useStore((s) => s.feed);
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="heading text-2xl mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" /> Live votes
      </h3>
      <ul className="space-y-1.5 min-h-[220px]" aria-live="polite">
        <AnimatePresence initial={false}>
          {feed.slice(0, 7).map((f) => (
            <motion.li key={f.id} layout initial={{ opacity: 0, x: -20, height: 0 }} animate={{ opacity: 1, x: 0, height: 'auto' }} exit={{ opacity: 0 }}
              className={cx('text-sm rounded-lg px-2 py-1 truncate', f.mine && 'font-bold')} style={f.mine ? { background: 'color-mix(in srgb, var(--green) 15%, transparent)' } : undefined}>
              {f.emoji} {f.mine ? 'You' : f.name} just voted <TokenIcon id={f.ticker} size={16} /> <b style={{ color: COINS[f.ticker]?.color }}>{f.ticker}</b>
            </motion.li>
          ))}
        </AnimatePresence>
        {!feed.length && <li className="text-sm text-muted">Waiting for the first brave voter…</li>}
      </ul>
    </div>
  );
}

export function Leaderboard() {
  const lb = useStore((s) => s.game?.leaderboard);
  const me = useStore((s) => s.identity);
  const [tab, setTab] = useState('coins');
  if (!lb) return <div className="glass rounded-2xl p-4"><Skeleton className="h-6 w-32 mb-3" />{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-7 mb-2" />)}</div>;
  const maxCoin = Math.max(1, ...lb.coins.map((c) => c.votes));
  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="heading text-2xl">Leaderboard</h3>
        <div className="flex rounded-lg overflow-hidden border border-theme text-xs" role="tablist">
          {[['coins', 'Coins'], ['voters', 'Voters']].map(([k, l]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cx('px-2.5 py-1 font-semibold', tab === k ? 'bg-[var(--cyan)] text-black' : 'text-muted')}>{l}</button>
          ))}
        </div>
      </div>
      {tab === 'coins' ? (
        lb.coins.length ? (
          <ol className="space-y-2">
            {lb.coins.map((c, i) => (
              <li key={c.ticker} className="text-sm">
                <div className="flex justify-between"><span>{['🥇', '🥈', '🥉'][i] || `#${i + 1}`} <TokenIcon id={c.ticker} /> <b>{c.ticker}</b></span><span className="font-mono">{c.votes.toLocaleString()}</span></div>
                <div className="h-1.5 rounded-full bg-black/20 mt-1 overflow-hidden">
                  <motion.div className="h-full rounded-full" style={{ background: COINS[c.ticker]?.color }} initial={{ width: 0 }} animate={{ width: `${(c.votes / maxCoin) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        ) : <p className="text-sm text-muted">No votes yet today. Be the first!</p>
      ) : lb.voters.length ? (
        <ol className="space-y-1.5 text-sm">
          {lb.voters.map((v, i) => (
            <li key={v.name + i} className={cx('flex justify-between gap-2', v.name === me.name && 'text-green font-bold')}>
              <span className="truncate">{['🥇', '🥈', '🥉'][i] || `#${i + 1}`} {v.emoji} {v.name}</span>
              <span className="font-mono shrink-0" title="Correct calls / total votes">🎯 {v.calls}/{v.votes}</span>
            </li>
          ))}
        </ol>
      ) : <p className="text-sm text-muted">No voters yet.</p>}
      <p className="text-[11px] text-muted mt-3">Voters rank by “correct calls” — siding with the round winner.</p>
    </div>
  );
}

export function RoundHistory() {
  const history = useStore((s) => s.game?.history) || [];
  if (!history.length) return <EmptyState emoji="⏳" title="Round history loading…">Finished rounds show up here.</EmptyState>;
  return (
    <div className="glass rounded-2xl p-4">
      <h3 className="heading text-2xl mb-3">Round history</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
        {[...history].reverse().map((h) => {
          const w = h.winner === 'tie' ? null : COINS[h[h.winner]];
          const total = h.leftVotes + h.rightVotes || 1;
          return (
            <motion.div key={h.round} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              className="snap-start shrink-0 w-44 rounded-xl p-3 border border-theme" style={{ background: w ? `linear-gradient(160deg, ${w.color}33, transparent)` : undefined }}>
              <div className="text-[11px] uppercase tracking-wider text-muted">Round {h.round}</div>
              <div className="font-semibold flex items-center gap-1"><TokenIcon id={h.left} /> {h.left} <span className="text-muted">vs</span> <TokenIcon id={h.right} /> {h.right}</div>
              <div className="mt-1 text-sm">{w ? <>🏆 <b style={{ color: w.color }}>{w.ticker}</b> {Math.round((h[`${h.winner}Votes`] / total) * 100)}%</> : '🤝 Tie'}</div>
              <div className="text-[11px] font-mono text-muted">{total.toLocaleString()} votes</div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function MatchupCreator() {
  const suggest = useStore((s) => s.suggest);
  const toast = useStore((s) => s.toast);
  const upNext = useStore((s) => s.game?.upNext);
  const ids = Object.keys(COINS);
  const [left, setLeft] = useState('BONK');
  const [right, setRight] = useState('WIF');
  const [prompt, setPrompt] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const res = await suggest({ left, right, prompt });
    setBusy(false);
    if (res.ok) { toast(`Queued! ${left} vs ${right} plays in ${res.position} round(s) ⚔️`, 'success'); setPrompt(''); }
    else toast(res.error, 'error');
  };
  return (
    <form onSubmit={submit} className="glass rounded-2xl p-4">
      <h3 className="heading text-2xl">Custom matchup creator</h3>
      <p className="text-sm text-muted mb-3">Suggest a battle — it jumps into the live rotation for everyone.</p>
      <div className="flex items-center gap-2">
        <CoinAvatar id={left} size={36} glow={false} />
        <select className="input" value={left} onChange={(e) => setLeft(e.target.value)} aria-label="Left coin">
          {ids.map((id) => <option key={id} value={id}>{COINS[id].ticker}</option>)}
        </select>
        <span className="heading text-xl neon-text-pink">VS</span>
        <select className="input" value={right} onChange={(e) => setRight(e.target.value)} aria-label="Right coin">
          {ids.map((id) => <option key={id} value={id}>{COINS[id].ticker}</option>)}
        </select>
        <CoinAvatar id={right} size={36} glow={false} />
      </div>
      <input className="input mt-2" maxLength={160} value={prompt} onChange={(e) => setPrompt(e.target.value)}
        placeholder={`Would you rather… (e.g. “eat a ${COINS[left].ticker} pizza or a ${COINS[right].ticker} burger?”)`} aria-label="Prompt" />
      <button className="btn-neon w-full mt-3" disabled={busy || left === right}>{left === right ? 'Pick two different coins' : busy ? 'Queuing…' : 'Start the battle ⚔️'}</button>
      {upNext && (
        <p className="text-xs text-muted mt-3">Up next: <TokenIcon id={upNext.left} size={14} /> {upNext.left} vs <TokenIcon id={upNext.right} size={14} /> {upNext.right}{upNext.custom ? ` · suggested by ${upNext.by}` : ''}</p>
      )}
      <p className="text-[11px] text-muted mt-1">Classic rotation: {MATCHUPS.map((m) => `${m.left}/${m.right}`).join(' · ')}</p>
    </form>
  );
}
