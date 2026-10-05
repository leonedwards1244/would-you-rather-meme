import { Link, useParams } from 'react-router-dom';
import { COINS, MATCHUPS } from '@shared/coins.js';
import { useStore } from '../store/useStore.js';
import GameArena from '../components/game/GameArena.jsx';
import ComparePanel from '../components/compare/ComparePanel.jsx';
import { CoinAvatar, SectionTitle } from '../components/ui/Primitives.jsx';
import { useSeo } from '../lib/seo.js';
import { tweetUrl } from '../lib/share.js';
import NotFound from './NotFound.jsx';

/** Shareable, SEO-tagged page for a single matchup: /m/doge-vs-pepe */
export default function MatchupPage() {
  const { id } = useParams();
  const live = useStore((s) => s.game?.matchup);
  const m = MATCHUPS.find((x) => x.id === id) || (live?.id === id ? live : null);
  const L = m && COINS[m.left], R = m && COINS[m.right];
  useSeo(m ? { title: `${L.ticker} vs ${R.ticker}`, description: `${m.prompt} Vote live on Would You Rather: Meme Edition — ${L.name} vs ${R.name}.` } : { title: 'Matchup not found' });
  if (!m) return <NotFound />;
  const isLive = live?.id === m.id;
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10">
      <div className="glass rounded-3xl p-6 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="flex items-center gap-4"><CoinAvatar id={m.left} size={72} /><span className="heading text-4xl or-glow text-white">VS</span><CoinAvatar id={m.right} size={72} /></div>
        <div className="flex-1 text-center md:text-left">
          <div className="text-xs uppercase tracking-[0.25em] text-cyan">Matchup</div>
          <h1 className="heading text-4xl md:text-5xl">{L.name} vs {R.name}</h1>
          <p className="text-muted">{m.prompt}</p>
        </div>
        <div className="flex gap-2">
          <a className="btn-ghost" href={tweetUrl(m)} target="_blank" rel="noreferrer">𝕏 Share</a>
          {!isLive && <Link to="/" className="btn-neon">Play live round ➜</Link>}
        </div>
      </div>
      {isLive ? <GameArena /> : (
        <p className="glass rounded-2xl p-4 mb-8 text-center">⏳ This matchup is in the live rotation. {live && <>Right now everyone is voting on <b>{live.left} vs {live.right}</b> — <Link to="/" className="text-cyan underline">jump in</Link>.</>}</p>
      )}
      <section className="mt-12">
        <SectionTitle kicker="Deep dive" title="By the numbers" />
        <ComparePanel left={m.left} right={m.right} />
      </section>
    </div>
  );
}
