import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, Legend,
  PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LabelList,
} from 'recharts';
import { useStore } from '../../store/useStore.js';
import { useApi } from '../../lib/useApi.js';
import { CoinAvatar, ErrorState, Skeleton } from '../ui/Primitives.jsx';
import { cx, fmtBig, fmtPct, fmtPrice } from '../../lib/format.js';

const TABS = [
  ['price', '📈 Price History'],
  ['community', '👥 Community'],
  ['tokenomics', '🪙 Tokenomics'],
  ['virality', '🔥 Virality Score'],
  ['facts', '🤓 Fun Facts'],
];

function useSeriesColors() {
  const theme = useStore((s) => s.theme);
  return theme === 'dark'
    ? { s1: '#ff2e97', s2: '#1a9cd8', axis: '#9aa0c8', grid: 'rgba(140,150,255,.12)', surface: '#11152e' }
    : { s1: '#e0157a', s2: '#0587a8', axis: '#5b5880', grid: 'rgba(30,20,80,.08)', surface: '#ffffff' };
}

const tooltipStyle = (c) => ({
  contentStyle: { background: c.surface, border: '1px solid var(--border)', borderRadius: 12, color: 'var(--fg)', fontSize: 12 },
  labelStyle: { color: 'var(--muted)' },
  itemStyle: { color: 'var(--fg)' },
});

/** Composite virality: social mentions, search trend, longevity, plus today's community vote share. */
/**
 * Curated indexes where we have them; otherwise estimated from DexScreener activity:
 * mentions ← 24h transaction count, trends ← volume/market-cap turnover, longevity ← age.
 */
export function viralityOf(coin) {
  if (coin.virality) return { ...coin.virality, estimated: false };
  const clamp = (n) => Math.max(0, Math.min(100, Math.round(n)));
  const tx = (coin.txns24h?.buys || 0) + (coin.txns24h?.sells || 0);
  const turnover = coin.marketCap ? (coin.volume24h || 0) / coin.marketCap : 0;
  return {
    mentions: clamp((Math.log10(tx + 1) / Math.log10(50_000)) * 100),
    trends: clamp(Math.sqrt(turnover) * 200),
    longevity: clamp(((new Date().getFullYear() - coin.year) / 13) * 100),
    estimated: true,
  };
}

export function viralityScore(coin, voteShare = 50) {
  const v = viralityOf(coin);
  return Math.round(v.mentions * 0.35 + v.trends * 0.25 + v.longevity * 0.2 + voteShare * 0.2);
}

function CoinHeader({ id, color }) {
  const c = useStore((s) => s.coins[id]);
  return (
    <div className="flex items-center gap-3 min-w-0">
      <CoinAvatar id={id} size={40} />
      <div className="min-w-0">
        <div className="font-bold truncate flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-sm shrink-0" style={{ background: color }} aria-hidden /> {c.name}
        </div>
        <div className="font-mono text-xs text-muted">{fmtPrice(c.price)} · <span className={c.change24h >= 0 ? 'text-green' : 'text-pink'}>{fmtPct(c.change24h)}</span></div>
      </div>
    </div>
  );
}


/* Official links reported on the token's DexScreener profile */
function SocialLinks({ coin }) {
  const links = [...(coin.socials || []).map((s) => [s.type, s.url]), ...(coin.websites || []).map((u) => ['website', u])]
    .filter(([, u]) => /^https:\/\//.test(u || ''));
  if (!links.length) return null;
  const icon = { twitter: '𝕏', telegram: '✈️', discord: '💬', website: '🌐' };
  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {links.slice(0, 4).map(([type, url]) => (
        <a key={url} href={url} target="_blank" rel="noreferrer nofollow" className="chip hover:border-[var(--cyan)] capitalize">{icon[type] || '🔗'} {type}</a>
      ))}
    </div>
  );
}

/* DexScreener market stats for one coin */
function DexStats({ id, color }) {
  const c = useStore((s) => s.coins[id]);
  const toast = useStore((s) => s.toast);
  if (!c.dex) {
    return (
      <div className="glass rounded-2xl p-4">
        <CoinHeader id={id} color={color} />
        <p className="text-sm text-muted mt-3">Hypothetical concept coin — not traded on any DEX, so there is no DexScreener data.</p>
      </div>
    );
  }
  const tx = c.txns24h || { buys: 0, sells: 0 };
  const buyPct = tx.buys + tx.sells ? (tx.buys / (tx.buys + tx.sells)) * 100 : 50;
  const copy = async () => {
    try { await navigator.clipboard.writeText(c.dex.address); toast('Contract address copied 📋', 'success'); }
    catch { toast(c.dex.address, 'info'); }
  };
  return (
    <div className="glass rounded-2xl p-4 min-w-0">
      <div className="flex items-start justify-between gap-2">
        <CoinHeader id={id} color={color} />
        {c.pairUrl && (
          <a href={c.pairUrl} target="_blank" rel="noreferrer" className="btn-ghost text-xs px-2.5 py-1 shrink-0">DexScreener ↗</a>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-3">
        {[['5m', 'm5'], ['1h', 'h1'], ['6h', 'h6'], ['24h', 'h24']].map(([label, k]) => {
          const v = c.changes?.[k];
          return (
            <span key={k} className="chip font-mono" style={{ color: v == null ? undefined : v >= 0 ? 'var(--green)' : 'var(--pink)' }}>
              {label} {v == null ? '—' : fmtPct(v)}
            </span>
          );
        })}
      </div>
      <dl className="grid grid-cols-2 gap-2 mt-3 text-sm">
        <div className="glass rounded-xl p-2"><dt className="text-[11px] uppercase text-muted">Liquidity</dt><dd className="font-mono font-bold">${fmtBig(c.liquidity)}</dd></div>
        <div className="glass rounded-xl p-2"><dt className="text-[11px] uppercase text-muted">24h volume</dt><dd className="font-mono font-bold">${fmtBig(c.volume24h)}</dd></div>
        <div className="glass rounded-xl p-2 col-span-2">
          <dt className="text-[11px] uppercase text-muted flex justify-between"><span>24h buys {tx.buys.toLocaleString()}</span><span>sells {tx.sells.toLocaleString()}</span></dt>
          <dd className="h-2 rounded-full overflow-hidden flex mt-1.5 gap-0.5" aria-label={`${Math.round(buyPct)}% buys`}>
            <span style={{ width: `${buyPct}%`, background: 'var(--green)' }} className="rounded-l-full" />
            <span style={{ width: `${100 - buyPct}%`, background: 'var(--pink)' }} className="rounded-r-full" />
          </dd>
        </div>
      </dl>
      <div className="mt-3 text-xs text-muted flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="capitalize">{c.dexId} · {c.dex.chainId}</span>
        <button onClick={copy} className="font-mono hover:text-cyan underline decoration-dotted" title="Copy contract address">
          {c.dex.address.slice(0, 6)}…{c.dex.address.slice(-4)} ⧉
        </button>
      </div>
      {c.closestMatchFor && (
        <p className="text-[11px] text-pink mt-2">⚠️ Closest DexScreener match for “{c.closestMatchFor}”. Very thin liquidity — verify the contract yourself before trading.</p>
      )}
      {c.dex.note && <p className="text-[11px] text-muted mt-1">ℹ️ {c.dex.note}. Market cap uses DOGE’s full circulating supply.</p>}
    </div>
  );
}

function DexSourceNote() {
  const live = useStore((s) => s.coinsLive);
  const source = useStore((s) => s.coinsSource);
  return (
    <p className="text-[11px] text-muted mt-3">
      Market data: {live ? `live from ${source === 'coingecko' ? 'CoinGecko (DexScreener unreachable)' : 'DexScreener, refreshed every 30s'}` : 'DexScreener snapshot from Oct 4–5, 2026 (live API not reachable from here)'}. Each coin uses its most liquid DEX pair.
    </p>
  );
}

/* ----------------------------- tabs ----------------------------- */
function PriceTab({ left, right, colors }) {
  const [days, setDays] = useState(30);
  const { data, loading, error, reload } = useApi((api) => Promise.all([api.history(left, days), api.history(right, days)]), [left, right, days]);
  const perf = (pts) => (pts?.length ? ((pts.at(-1).price - pts[0].price) / pts[0].price) * 100 : 0);
  const fmtDate = (t) => new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-sm text-muted">Each coin on its own scale (their prices differ by up to 100,000×). {data && !data[0].live && <span className="chip ml-1" title="DexScreener has no public price-history API. With the server running and CoinGecko reachable, real history is shown instead.">illustrative history</span>}</p>
        <div className="flex rounded-lg overflow-hidden border border-theme text-sm" role="group" aria-label="Time range">
          {[7, 30, 90].map((d) => (
            <button key={d} onClick={() => setDays(d)} aria-pressed={days === d} className={cx('px-3 py-1 font-semibold', days === d ? 'bg-[var(--cyan)] text-black' : 'text-muted')}>{d}D</button>
          ))}
        </div>
      </div>
      {error ? <ErrorState message={error} onRetry={reload} compact /> : (
        <div className="grid md:grid-cols-2 gap-4">
          {[[left, colors.s1, 0], [right, colors.s2, 1]].map(([id, color, i]) => (
            <div key={id} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2 gap-2">
                <CoinHeader id={id} color={color} />
                {data && <div className="text-right"><div className="text-[11px] uppercase text-muted">{days}D change</div><div className={cx('font-mono font-bold', perf(data[i].points) >= 0 ? 'text-green' : 'text-pink')}>{fmtPct(perf(data[i].points))}</div></div>}
              </div>
              {loading || !data ? <Skeleton className="h-56" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={data[i].points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={colors.grid} vertical={false} />
                    <XAxis dataKey="t" tickFormatter={fmtDate} stroke={colors.axis} tick={{ fontSize: 11 }} minTickGap={40} axisLine={false} tickLine={false} />
                    <YAxis tickFormatter={fmtPrice} stroke={colors.axis} tick={{ fontSize: 11 }} width={72} domain={['auto', 'auto']} axisLine={false} tickLine={false} />
                    <Tooltip {...tooltipStyle(colors)} labelFormatter={(t) => new Date(t).toLocaleString()} formatter={(v) => [fmtPrice(v), 'Price']} />
                    <Line type="monotone" dataKey="price" stroke={color} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: colors.surface, strokeWidth: 2 }} animationDuration={900} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          ))}
        </div>
      )}
      <h4 className="font-bold mt-6 mb-2">DEX market stats</h4>
      <div className="grid md:grid-cols-2 gap-4">
        <DexStats id={left} color={colors.s1} />
        <DexStats id={right} color={colors.s2} />
      </div>
      <DexSourceNote />
    </div>
  );
}

function CommunityTab({ left, right, colors }) {
  const coins = useStore((s) => s.coins);
  const L = coins[left], R = coins[right];
  const rows = [['Reddit', 'reddit'], ['X / Twitter', 'twitter'], ['Telegram', 'telegram']].map(([name, k]) => ({ name, [L.ticker]: L.community?.[k] ?? null, [R.ticker]: R.community?.[k] ?? null }));
  const total = (c) => (c.community ? c.community.reddit + c.community.twitter + c.community.telegram : null);
  const anyCounts = !!(L.community || R.community);
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="glass rounded-2xl p-4 lg:col-span-2">
        <h4 className="font-bold mb-2">Followers by platform</h4>
        {!anyCounts ? (
          <p className="text-sm text-muted py-16 text-center">Follower counts aren’t tracked for {L.ticker} or {R.ticker} yet — see their official links on the right.</p>
        ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={rows} margin={{ top: 20, right: 8, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid stroke={colors.grid} vertical={false} />
            <XAxis dataKey="name" stroke={colors.axis} tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={fmtBig} stroke={colors.axis} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={48} />
            <Tooltip {...tooltipStyle(colors)} formatter={(v, n) => [fmtBig(v), n]} cursor={{ fill: 'rgba(127,127,127,.08)' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey={L.ticker} fill={colors.s1} radius={[4, 4, 0, 0]} maxBarSize={44}><LabelList dataKey={L.ticker} position="top" formatter={fmtBig} style={{ fontSize: 11, fill: colors.axis }} /></Bar>
            <Bar dataKey={R.ticker} fill={colors.s2} radius={[4, 4, 0, 0]} maxBarSize={44}><LabelList dataKey={R.ticker} position="top" formatter={fmtBig} style={{ fontSize: 11, fill: colors.axis }} /></Bar>
          </BarChart>
        </ResponsiveContainer>
        )}
        <p className="text-[11px] text-muted">Rounded approximations of public channel sizes{anyCounts && (!L.community || !R.community) ? `; ${!L.community ? L.ticker : R.ticker} isn’t tracked` : ''}.</p>
      </div>
      <div className="grid gap-4">
        {[[L, colors.s1], [R, colors.s2]].map(([c, color]) => (
          <div key={c.id} className="glass rounded-2xl p-4">
            <CoinHeader id={c.id} color={color} />
            {total(c) != null ? (
              <>
                <div className="heading text-5xl mt-3">{fmtBig(total(c))}</div>
                <div className="text-xs text-muted uppercase tracking-wider">combined community</div>
              </>
            ) : (
              <div className="text-sm text-muted mt-3">Follower counts not tracked.</div>
            )}
            <SocialLinks coin={c} />
          </div>
        ))}
      </div>
    </div>
  );
}

function TokenomicsTab({ left, right, colors }) {
  const coins = useStore((s) => s.coins);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[[coins[left], colors.s1], [coins[right], colors.s2]].map(([c, color]) => {
        const shades = [color, `${color}b3`, `${color}66`];
        return (
          <div key={c.id} className="glass rounded-2xl p-4">
            <CoinHeader id={c.id} color={color} />
            <dl className="grid grid-cols-2 gap-2 mt-4 text-sm">
              <div className="glass rounded-xl p-2"><dt className="text-[11px] uppercase text-muted">Circulating</dt><dd className="font-mono font-bold">{fmtBig(c.supply.circulating)}</dd></div>
              <div className="glass rounded-xl p-2"><dt className="text-[11px] uppercase text-muted">Max supply</dt><dd className="font-mono font-bold">{c.supply.max ? fmtBig(c.supply.max) : '∞'}</dd></div>
              <div className="glass rounded-xl p-2 col-span-2"><dt className="text-[11px] uppercase text-muted">Supply notes</dt><dd>{c.supply.label}</dd></div>
              <div className="glass rounded-xl p-2 col-span-2"><dt className="text-[11px] uppercase text-muted">🔥 Burn rate</dt><dd>{c.burnRate}</dd></div>
            </dl>
            <h4 className="font-bold mt-4">Holder distribution</h4>
            {!c.holders ? (
              <p className="text-sm text-muted mt-1">Not available — DexScreener doesn’t report holder concentration for this token.</p>
            ) : (<>
            <div className="flex items-center gap-2">
              <div className="shrink-0" style={{ width: 170, height: 170 }}>
                <PieChart width={170} height={170}>
                  <Pie data={c.holders} dataKey="value" nameKey="name" innerRadius={44} outerRadius={78} paddingAngle={2} stroke={colors.surface} strokeWidth={2} animationDuration={800}>
                    {c.holders.map((h, i) => <Cell key={h.name} fill={shades[i]} />)}
                  </Pie>
                  <Tooltip {...tooltipStyle(colors)} formatter={(v, n) => [`${v}%`, n]} />
                </PieChart>
              </div>
              <ul className="text-sm space-y-1.5 flex-1">
                {c.holders.map((h, i) => (
                  <li key={h.name} className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm shrink-0" style={{ background: shades[i] }} />{h.name} <b className="ml-auto font-mono">{h.value}%</b></li>
                ))}
              </ul>
            </div>
            {c.holders[0].value >= 55 && <p className="text-xs text-pink mt-2">⚠️ Highly concentrated — a few wallets can move this market.</p>}
            </>)}
          </div>
        );
      })}
    </div>
  );
}

function ViralityTab({ left, right, colors }) {
  const coins = useStore((s) => s.coins);
  const lb = useStore((s) => s.game?.leaderboard);
  const L = coins[left], R = coins[right];
  const share = useMemo(() => {
    const get = (t) => lb?.coins.find((c) => c.ticker === t)?.votes || 0;
    const a = get(left), b = get(right);
    return a + b ? (a / (a + b)) * 100 : 50;
  }, [lb, left, right]);
  const vL = viralityOf(L), vR = viralityOf(R);
  const data = [
    { k: 'Social mentions', [L.ticker]: vL.mentions, [R.ticker]: vR.mentions },
    { k: 'Search trends', [L.ticker]: vL.trends, [R.ticker]: vR.trends },
    { k: 'Longevity', [L.ticker]: vL.longevity, [R.ticker]: vR.longevity },
    { k: 'Crowd votes', [L.ticker]: Math.round(share), [R.ticker]: Math.round(100 - share) },
  ];
  const sL = viralityScore(L, share), sR = viralityScore(R, 100 - share);
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="grid gap-4 content-start">
        {[[L, sL, colors.s1], [R, sR, colors.s2]].map(([c, score, color]) => (
          <div key={c.id} className="glass rounded-2xl p-4">
            <CoinHeader id={c.id} color={color} />
            <div className="flex items-end gap-2 mt-3">
              <span className="heading text-6xl">{score}</span><span className="text-muted mb-2">/ 100</span>
              {score === Math.max(sL, sR) && sL !== sR && <span className="chip mb-3 ml-auto">👑 more viral</span>}
            </div>
            <div className="h-2 rounded-full bg-black/20 overflow-hidden"><motion.div className="h-full rounded-full" style={{ background: color }} initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1 }} /></div>
          </div>
        ))}
        <p className="text-[11px] text-muted">Meme Virality Score = 35% social mentions + 25% search-trend interest + 20% longevity + 20% today’s crowd vote share. Indexes are 0–100 estimates; crowd votes update live.{(vL.estimated || vR.estimated) && ` For ${[vL.estimated && L.ticker, vR.estimated && R.ticker].filter(Boolean).join(' and ')}, mentions/trends/longevity are estimated from DexScreener activity (24h trades, volume ÷ market cap, age).`}</p>
      </div>
      <div className="glass rounded-2xl p-4 lg:col-span-2">
        <ResponsiveContainer width="100%" height={340}>
          <RadarChart data={data} outerRadius="72%">
            <PolarGrid stroke={colors.grid} />
            <PolarAngleAxis dataKey="k" tick={{ fill: colors.axis, fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name={L.ticker} dataKey={L.ticker} stroke={colors.s1} fill={colors.s1} fillOpacity={0.2} strokeWidth={2} />
            <Radar name={R.ticker} dataKey={R.ticker} stroke={colors.s2} fill={colors.s2} fillOpacity={0.2} strokeWidth={2} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Tooltip {...tooltipStyle(colors)} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FactsTab({ left, right, colors }) {
  const coins = useStore((s) => s.coins);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {[[coins[left], colors.s1], [coins[right], colors.s2]].map(([c, color]) => (
        <div key={c.id} className="glass rounded-2xl p-4">
          <CoinHeader id={c.id} color={color} />
          <ul className="mt-3 space-y-2">
            {c.funFacts.map((f, i) => (
              <motion.li key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-xl p-3 text-sm border border-theme hover:border-[var(--cyan)] transition" style={{ background: `${c.color}12` }}>
                <span className="mr-1">{['💡', '😂', '🤯', '📜'][i % 4]}</span>{f}
              </motion.li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

const TAB_COMPONENTS = { price: PriceTab, community: CommunityTab, tokenomics: TokenomicsTab, virality: ViralityTab, facts: FactsTab };

export default function ComparePanel({ left, right }) {
  const [tab, setTab] = useState('price');
  const colors = useSeriesColors();
  const Comp = TAB_COMPONENTS[tab];
  return (
    <section className="glass rounded-3xl p-4 md:p-6" aria-label="Coin comparison">
      <div className="flex gap-1 overflow-x-auto pb-2 mb-4 border-b border-theme" role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={cx('relative px-3 py-2 rounded-lg whitespace-nowrap font-semibold text-sm transition', tab === k ? 'tab-active' : 'text-muted hover:text-cyan')}>
            {label}
            {tab === k && <motion.span layoutId={`tab-ul-${left}-${right}`} className="absolute left-2 right-2 -bottom-[9px] h-0.5 rounded bg-[var(--pink)] shadow-glow-pink" />}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={tab + left + right} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }} role="tabpanel">
          <Comp left={left} right={right} colors={colors} />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}
