import { useSearchParams } from 'react-router-dom';
import { COINS } from '@shared/coins.js';
import ComparePanel from '../components/compare/ComparePanel.jsx';
import { CoinAvatar, SectionTitle } from '../components/ui/Primitives.jsx';
import { useSeo } from '../lib/seo.js';

export default function ComparePage() {
  const [params, setParams] = useSearchParams();
  const left = COINS[params.get('a')] ? params.get('a') : 'DOGE';
  const right = COINS[params.get('b')] ? params.get('b') : 'PEPE';
  const set = (k, v) => setParams((p) => { p.set(k, v); return p; });
  useSeo({ title: `Compare ${left} vs ${right}`, description: `Price history, community size, tokenomics, virality and fun facts: ${COINS[left].name} vs ${COINS[right].name}.` });
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10">
      <SectionTitle kicker="Compare" title="Coin vs coin deep-dive">Pick any two coins. Charts, tokenomics and trivia update instantly.</SectionTitle>
      <div className="glass rounded-3xl p-4 mb-6 flex flex-col sm:flex-row items-center gap-4">
        {[['a', left], ['b', right]].map(([k, val], i) => (
          <div key={k} className="flex items-center gap-3 flex-1 w-full">
            {i === 1 && <span className="heading text-3xl or-glow text-white hidden sm:block">VS</span>}
            <CoinAvatar id={val} size={48} />
            <select className="input" value={val} onChange={(e) => set(k, e.target.value)} aria-label={i ? 'Second coin' : 'First coin'}>
              {Object.values(COINS).map((c) => <option key={c.id} value={c.id}>{c.name} ({c.ticker})</option>)}
            </select>
          </div>
        ))}
        <button className="btn-ghost" onClick={() => setParams({ a: right, b: left })} aria-label="Swap coins">⇄ Swap</button>
      </div>
      <ComparePanel left={left} right={right} />
    </div>
  );
}
