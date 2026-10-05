import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sentimentFor } from '@shared/coins.js';
import { useStore } from '../../store/useStore.js';
import { CoinAvatar, Skeleton, ErrorState, useRipple } from '../ui/Primitives.jsx';
import { cx, fmtPct, fmtPrice, fmtUsdBig } from '../../lib/format.js';
import { tweetUrl } from '../../lib/share.js';
import { useAnimatedNumber, useCountdown, useIsMobile } from './hooks.js';

const SIDE_TINT = { left: 'var(--pink)', right: 'var(--cyan)' };

function RoundTimer({ game }) {
  const voting = game.phase === 'voting';
  const target = voting ? game.endsAt : game.nextAt;
  const ms = useCountdown(target);
  const total = voting ? game.endsAt - game.startedAt : 7000;
  const frac = Math.max(0, Math.min(1, ms / (total || 1)));
  const secs = Math.ceil(ms / 1000);
  const urgent = voting && secs <= 10;
  const R = 26, C = 2 * Math.PI * R;
  return (
    <div className={cx('flex items-center gap-3', urgent && 'animate-pulseGlow')} role="timer" aria-live="off">
      <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
        <circle cx="32" cy="32" r={R} fill="none" stroke="var(--border)" strokeWidth="6" />
        <circle cx="32" cy="32" r={R} fill="none" strokeWidth="6" strokeLinecap="round"
          stroke={urgent ? 'var(--pink)' : voting ? 'var(--green)' : 'var(--cyan)'}
          strokeDasharray={C} strokeDashoffset={C * (1 - frac)} style={{ transition: 'stroke-dashoffset .2s linear', filter: 'drop-shadow(0 0 6px currentColor)' }} />
      </svg>
      <div>
        <div className={cx('font-mono text-3xl font-bold tabular-nums leading-none', urgent ? 'text-pink' : '')}>
          0:{String(Math.min(secs, 59)).padStart(2, '0')}
        </div>
        <div className="text-[11px] uppercase tracking-wider text-muted">{voting ? 'left to vote' : 'next round'}</div>
      </div>
    </div>
  );
}

function OrDivider({ phase }) {
  return (
    <div className="pointer-events-none relative z-20 self-center w-0 h-0 shrink-0 grow-0">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
      <motion.div
        className="grid place-items-center rounded-full w-14 h-14 md:w-28 md:h-28 bg-[#0b0e24] border border-white/20"
        style={{ boxShadow: '0 0 0 3px var(--bg), 0 0 30px var(--pink), 0 0 60px var(--cyan)' }}
        animate={phase === 'voting' ? { rotate: [0, -6, 6, 0], scale: [1, 1.06, 1] } : { scale: 0.85 }}
        transition={{ repeat: phase === 'voting' ? Infinity : 0, duration: 2.4 }}
      >
        <span className="heading text-2xl md:text-6xl text-white or-glow">OR</span>
      </motion.div>
      </div>
    </div>
  );
}

function CoinPanel({ side, coinId, matchup, pct, votes, showResults, myVote, phase, winner, hovered, setHovered, onVote, mobile }) {
  const coin = useStore((s) => s.coins[coinId]);
  const ripple = useRipple();
  const canVote = phase === 'voting' && !myVote;
  const shownPct = useAnimatedNumber(showResults ? pct : 0, 0.9);
  const isPick = myVote === side;
  const isWinner = phase === 'results' && winner === side;
  const otherHovered = hovered && hovered !== side;

  let grow = 1;
  if (showResults) grow = Math.max(0.6, Math.min(1.6, pct / 50));
  else if (hovered === side) grow = 1.18;
  else if (otherHovered) grow = 0.85;

  const handle = (e) => {
    if (!canVote) return;
    ripple(e);
    onVote(side);
  };

  return (
    <motion.button
      type="button"
      onClick={handle}
      onMouseEnter={() => canVote && setHovered(side)}
      onMouseLeave={() => setHovered(null)}
      drag={mobile && canVote ? 'x' : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 90 && canVote) onVote(side); }}
      disabled={!canVote && !isPick}
      aria-label={`Vote ${coin.name} (${coin.ticker})`}
      aria-pressed={isPick}
      className={cx(
        'relative overflow-hidden text-left rounded-3xl p-5 md:p-8 flex flex-col justify-between min-h-[300px] md:min-h-[480px] min-w-0',
        'transition-[flex-grow,opacity,filter,transform] duration-700 ease-out focus:outline-none focus-visible:ring-4',
        canVote ? 'cursor-pointer' : 'cursor-default',
        otherHovered && 'opacity-60 saturate-50',
        myVote && !isPick && phase === 'voting' && 'opacity-75',
      )}
      style={{
        flexGrow: grow, flexBasis: 0,
        '--tw-ring-color': SIDE_TINT[side],
        background: `radial-gradient(120% 90% at ${side === 'left' ? '0% 0%' : '100% 0%'}, ${coin.color}55, transparent 60%),
          linear-gradient(160deg, color-mix(in srgb, ${SIDE_TINT[side]} 28%, var(--bg2)), var(--bg2))`,
        border: `2px solid ${isPick || isWinner ? coin.color : 'var(--border)'}`,
        boxShadow: isPick || isWinner ? `0 0 40px ${coin.color}88, inset 0 0 60px ${coin.color}22` : hovered === side ? `0 0 30px ${coin.color}66` : 'none',
      }}
      whileTap={canVote ? { scale: 0.98 } : undefined}
    >
      {/* fill bar behind content */}
      <motion.div
        className="absolute inset-x-0 bottom-0 -z-0"
        style={{ background: `linear-gradient(to top, ${coin.color}55, transparent)` }}
        initial={{ height: 0 }}
        animate={{ height: showResults ? `${pct}%` : '0%' }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span className="chip uppercase tracking-wider" style={{ color: coin.color, borderColor: `${coin.color}88` }}>
          {coin.era === 'OG' ? '📼 Old school' : coin.era === 'Concept' ? '🧪 Concept' : coin.category === 'AI' ? '🤖 AI wave' : '🌊 New wave'} · {coin.year}
        </span>
        <AnimatePresence>
          {isPick && (
            <motion.span initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} className="chip bg-white text-black border-transparent font-bold">
              ✓ Your pick
            </motion.span>
          )}
          {isWinner && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="chip font-bold" style={{ background: coin.color, color: '#000' }}>🏆 Winner</motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className={cx('relative z-10 flex flex-col items-center text-center my-4', side === 'right' && 'md:items-center')}>
        <div className="bob" style={{ animationDelay: side === 'right' ? '-1.6s' : '0s' }}>
          <CoinAvatar id={coinId} size={mobile ? 84 : 132} />
        </div>
        <div className="heading text-4xl md:text-6xl mt-4 break-words" style={{ color: `color-mix(in srgb, ${coin.color} 78%, var(--fg))`, textShadow: `0 0 18px ${coin.color}88` }}>
          {coin.name}
        </div>
        <div className="font-mono text-sm text-muted">${coin.ticker} · {coin.chain}</div>
        <p className="mt-2 text-sm md:text-base max-w-xs opacity-90">{coin.tagline}</p>
      </div>

      <div className="relative z-10">
        {showResults ? (
          <div>
            <div className="flex items-end justify-between">
              <span className="heading text-6xl md:text-8xl tabular-nums" style={{ color: coin.color, textShadow: `0 0 24px ${coin.color}` }}>
                {Math.round(shownPct)}%
              </span>
              <span className="font-mono text-sm text-muted mb-2">{votes.toLocaleString()} votes</span>
            </div>
            <div className="h-3 rounded-full bg-black/30 overflow-hidden mt-1">
              <motion.div className="h-full rounded-full" style={{ background: coin.color, boxShadow: `0 0 12px ${coin.color}` }}
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 text-center">
            <Stat label="Price" value={fmtPrice(coin.price)} />
            <Stat label="24h" value={fmtPct(coin.change24h)} color={coin.change24h >= 0 ? 'var(--green)' : 'var(--pink)'} />
            <Stat label="Mkt cap" value={fmtUsdBig(coin.marketCap)} />
          </div>
        )}
        {canVote && (
          <div className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-muted">
            {mobile ? 'Tap or swipe → to vote' : 'Click to lock in'}
          </div>
        )}
      </div>
    </motion.button>
  );
}

function Stat({ label, value, color }) {
  return (
    <div className="glass rounded-xl px-2 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div className="font-mono font-bold text-sm md:text-base truncate" style={{ color }}>{value}</div>
    </div>
  );
}

export default function GameArena() {
  const { game, myVote, vote, mode } = useStore();
  const [hovered, setHovered] = useState(null);
  const mobile = useIsMobile();

  if (mode === 'error') return <ErrorState message="Couldn’t join the round. The server might be napping." onRetry={() => window.location.reload()} />;
  if (!game?.matchup) return <ArenaSkeleton />;

  const { matchup, votes, phase, winner } = game;
  const total = votes.left + votes.right;
  const leftPct = total ? (votes.left / total) * 100 : 50;
  const showResults = !!myVote || phase === 'results';

  return (
    <section aria-labelledby="round-title" className="relative">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <div id="round-title" className="heading text-3xl md:text-4xl">
            Round <span className="neon-text-green">{game.round}</span>
            {matchup.custom && <span className="chip ml-2 align-middle text-xs">👥 community pick</span>}
          </div>
          <motion.div key={total} initial={{ scale: 1.15 }} animate={{ scale: 1 }} className="font-mono text-sm text-muted">
            🗳️ {total.toLocaleString()} votes · ends at {game.threshold.toLocaleString()} or 60s
          </motion.div>
        </div>
        <div className="flex items-center gap-3">
          <RoundTimer game={game} />
          <a className="btn-ghost text-sm" href={tweetUrl(matchup, myVote)} target="_blank" rel="noreferrer" aria-label="Share this matchup on X">𝕏 Share</a>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.h1 key={matchup.id + game.round} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
          className="heading text-3xl md:text-5xl text-center mb-5 px-2">
          {matchup.prompt}
        </motion.h1>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div key={game.round} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.02 }} transition={{ duration: 0.35 }}
          className="relative flex flex-col md:flex-row gap-2">
          {['left', 'right'].map((side) => [
            side === 'right' && <OrDivider key="or" phase={phase} />,
            <CoinPanel key={side} side={side} coinId={matchup[side]} matchup={matchup}
              pct={side === 'left' ? leftPct : 100 - leftPct} votes={votes[side]}
              showResults={showResults} myVote={myVote} phase={phase} winner={winner}
              hovered={hovered} setHovered={setHovered} onVote={vote} mobile={mobile} />,
          ])}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {showResults && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-4 text-center">
            <span className="glass rounded-full px-5 py-2 inline-block heading text-xl md:text-2xl">
              {sentimentFor(leftPct, matchup.left, matchup.right)}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function ArenaSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading round">
      <Skeleton className="h-10 w-48 mb-4" />
      <Skeleton className="h-12 w-3/4 mx-auto mb-5" />
      <div className="flex flex-col md:flex-row gap-4">
        <Skeleton className="flex-1 h-[300px] md:h-[520px] rounded-3xl" />
        <Skeleton className="flex-1 h-[300px] md:h-[520px] rounded-3xl" />
      </div>
    </div>
  );
}
