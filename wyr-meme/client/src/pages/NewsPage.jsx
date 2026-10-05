import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { COINS } from '@shared/coins.js';
import { NEWS_TAGS } from '@shared/board.js';
import { useApi } from '../lib/useApi.js';
import { useStore } from '../store/useStore.js';
import { CoinAvatar, EmptyState, ErrorState, SectionTitle, Skeleton, TokenIcon, VoteArrows } from '../components/ui/Primitives.jsx';
import { cx, timeAgo } from '../lib/format.js';
import { useSeo } from '../lib/seo.js';

const TAG_STYLE = { bullish: 'var(--green)', bearish: 'var(--pink)', meme: '#c084fc', rug: '#f97316', moon: 'var(--cyan)' };

function Thumb({ item }) {
  const c = COINS[item.coin];
  const [broken, setBroken] = useState(false);
  if (item.image && !broken)
    return <img src={item.image} alt="" loading="lazy" onError={() => setBroken(true)} className="w-full h-36 object-cover rounded-xl" />;
  return (
    <div className="w-full h-36 rounded-xl grid place-items-center text-6xl relative overflow-hidden"
      style={{ background: `radial-gradient(circle at 30% 30%, ${c?.color || '#888'}aa, transparent 60%), linear-gradient(135deg, var(--bg2), ${c?.color || '#888'}44)` }}>
      <span className="bob">{c ? <CoinAvatar id={item.coin} size={72} /> : '📰'}</span>{item.kind === 'tweet' && <span className="absolute top-2 left-3 text-2xl">𝕏</span>}
      <span className="absolute bottom-2 right-3 font-mono text-xs font-bold opacity-80">${c?.ticker || item.coin}</span>
    </div>
  );
}

function NewsCard({ item, onVote }) {
  const Wrapper = item.url ? 'a' : 'div';
  return (
    <motion.article layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -4 }} className="glass rounded-2xl p-3 flex flex-col hover:shadow-glow-cyan transition-shadow">
      <Wrapper {...(item.url ? { href: item.url, target: '_blank', rel: 'noreferrer' } : {})} className="block">
        <Thumb item={item} />
        <div className="flex flex-wrap gap-1 mt-3">
          {item.tags.map((t) => <span key={t} className="chip" style={{ color: TAG_STYLE[t], borderColor: TAG_STYLE[t] }}>#{t}</span>)}
        </div>
        <h3 className={cx('mt-2 font-bold leading-snug', item.kind === 'tweet' && 'italic')}>{item.headline}</h3>
        {item.summary && <p className="text-sm text-muted mt-1 line-clamp-3">{item.summary}</p>}
      </Wrapper>
      <div className="mt-auto pt-3 flex items-center justify-between text-xs text-muted">
        <span>{item.kind === 'tweet' ? '𝕏 ' : '📰 '}{item.source} · {timeAgo(item.at)}</span>
        <VoteArrows horizontal score={item.score} myVote={item.myVote} onVote={(d) => onVote(item.id, d)} />
      </div>
    </motion.article>
  );
}

export default function NewsPage() {
  useSeo({ title: 'Memecoin news', description: 'Latest memecoin headlines and posts, filterable by coin and by #bullish #bearish #meme #rug #moon.' });
  const [coin, setCoin] = useState('ALL');
  const [tag, setTag] = useState('');
  const toast = useStore((s) => s.toast);
  const { data, loading, error, reload, setData } = useApi((api) => api.news({ coin, tag }), [coin, tag]);
  const transport = useStore((s) => s.transport);

  const vote = async (id, dir) => {
    try {
      const res = await transport.api.voteNews(id, dir);
      setData((d) => ({ ...d, items: d.items.map((n) => (n.id === id ? { ...n, ...res } : n)) }));
    } catch (e) { toast(e.message, 'error'); }
  };

  const coins = ['ALL', ...Object.values(COINS).filter((c) => !c.concept).map((c) => c.id)];
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10">
      <SectionTitle kicker="News feed" title="What the timeline is saying">Headlines and posts from around meme-land. Upvote what matters, downvote the FUD.</SectionTitle>
      <div className="glass rounded-2xl p-3 mb-6 sticky top-[72px] z-30">
        <div className="flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Filter by coin">
          {coins.map((c) => (
            <button key={c} onClick={() => setCoin(c)} aria-pressed={coin === c}
              className={cx('chip whitespace-nowrap py-1 px-3 transition', coin === c && 'text-black')}
              style={coin === c ? { background: c === 'ALL' ? 'var(--cyan)' : COINS[c].color, borderColor: 'transparent' } : undefined}>
              {c === 'ALL' ? '🌐 All' : <><TokenIcon id={c} size={16} /> {c}</>}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pt-2" role="group" aria-label="Filter by tag">
          {NEWS_TAGS.map((t) => (
            <button key={t} onClick={() => setTag(tag === t ? '' : t)} aria-pressed={tag === t} className="chip whitespace-nowrap py-1 px-3 transition"
              style={{ color: tag === t ? '#000' : TAG_STYLE[t], background: tag === t ? TAG_STYLE[t] : undefined, borderColor: TAG_STYLE[t] }}>#{t}</button>
          ))}
        </div>
      </div>
      {error ? <ErrorState message={error} onRetry={reload} /> : loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl p-3"><Skeleton className="h-36" /><Skeleton className="h-4 w-1/3 mt-3" /><Skeleton className="h-5 mt-2" /><Skeleton className="h-5 w-2/3 mt-2" /></div>)}
        </div>
      ) : data.items.length ? (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>{data.items.map((n) => <NewsCard key={n.id} item={n} onVote={vote} />)}</AnimatePresence>
        </motion.div>
      ) : (
        <EmptyState emoji="🦗" title="No news. Suspiciously quiet…">Nothing matches that filter. Either it’s a bear market or everyone’s asleep.</EmptyState>
      )}
    </div>
  );
}
