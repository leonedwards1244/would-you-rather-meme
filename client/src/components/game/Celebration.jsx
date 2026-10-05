import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';
import { COINS } from '@shared/coins.js';
import { useStore } from '../../store/useStore.js';
import { CoinAvatar, Modal, TokenIcon } from '../ui/Primitives.jsx';
import { useCountdown } from './hooks.js';

/** Shared winner celebration: every client gets `round:end` at the same moment. */
export default function Celebration() {
  const celebration = useStore((s) => s.celebration);
  const dismiss = useStore((s) => s.dismissCelebration);
  const upNext = useStore((s) => s.game?.upNext);
  const myVote = useStore((s) => s.myVote);
  const ms = useCountdown(celebration?.nextAt);
  const { pathname } = useLocation();
  const onGame = pathname === '/' || pathname.startsWith('/m/');
  const toast = useStore((s) => s.toast);

  const winnerId = celebration && celebration.winner !== 'tie' ? celebration[celebration.winner] : null;
  const winner = winnerId && COINS[winnerId];

  useEffect(() => {
    if (!celebration) return;
    if (!onGame) {
      // don't interrupt reading elsewhere — a quiet toast instead of the full celebration
      toast(winner ? `🏆 ${winner.ticker} won round ${celebration.round}!` : `🤝 Round ${celebration.round} was a tie`, 'success');
      dismiss();
      return;
    }
    const colors = winner ? [winner.color, '#ffffff', '#ff2e97', '#22e4ff'] : ['#ff2e97', '#22e4ff', '#39ff88'];
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduce) {
      confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 }, colors, zIndex: 90 });
      setTimeout(() => confetti({ particleCount: 80, angle: 60, spread: 70, origin: { x: 0 }, colors, zIndex: 90 }), 250);
      setTimeout(() => confetti({ particleCount: 80, angle: 120, spread: 70, origin: { x: 1 }, colors, zIndex: 90 }), 400);
    }
    const t = setTimeout(dismiss, Math.max(1500, (celebration.nextAt || Date.now() + 6000) - Date.now() - 400));
    return () => clearTimeout(t);
  }, [celebration]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!celebration || !onGame) return <Modal open={false} />;
  const total = celebration.leftVotes + celebration.rightVotes || 1;
  const winPct = winner ? Math.round((celebration[`${celebration.winner}Votes`] / total) * 100) : 50;
  const calledIt = myVote && myVote === celebration.winner;

  return (
    <Modal open={!!celebration} onClose={dismiss} label="Round winner">
      <div className="text-center">
        <div className="text-xs uppercase tracking-[0.3em] text-muted">Round {celebration.round} {celebration.reason === 'threshold' ? '· vote cap hit' : '· time’s up'}</div>
        {winner ? (
          <>
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }} className="my-4 flex justify-center">
              <CoinAvatar id={winnerId} size={120} />
            </motion.div>
            <div className="heading text-5xl" style={{ color: winner.color, textShadow: `0 0 20px ${winner.color}` }}>🏆 {winner.ticker} wins!</div>
            <p className="font-mono mt-2">{winPct}% of {total.toLocaleString()} votes</p>
          </>
        ) : (
          <div className="heading text-5xl my-6">🤝 It’s a tie!</div>
        )}
        {myVote && (
          <p className={`mt-3 font-semibold ${calledIt ? 'text-green' : 'text-pink'}`}>
            {calledIt ? 'You called it! +1 on the leaderboard 🎯' : 'The crowd went the other way. Contrarian king? 👑'}
          </p>
        )}
        {upNext && (
          <div className="glass rounded-2xl p-3 mt-5 text-sm">
            Up next in <b className="font-mono">{Math.ceil(ms / 1000)}s</b>: <TokenIcon id={upNext.left} /> {upNext.left} <span className="text-muted">vs</span> <TokenIcon id={upNext.right} /> {upNext.right}
          </div>
        )}
        <button className="btn-neon mt-5 w-full" onClick={dismiss}>LFG ➜</button>
      </div>
    </Modal>
  );
}
