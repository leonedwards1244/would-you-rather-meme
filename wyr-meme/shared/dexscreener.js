// DexScreener integration, shared by the server and the browser.
// Docs: https://docs.dexscreener.com/api/reference
//   GET /latest/dex/tokens/{addr1,addr2,...}   (chain-agnostic, ~300 req/min, no key)
// That endpoint returns at most 30 pairs per call IN TOTAL, so popular tokens with many pairs
// can crowd others out of a big batch. We therefore ask for a few addresses per call
// (DEX_BATCH_SIZE) and re-ask individually for any token that still comes back missing.
// DexScreener has no public price-history endpoint, so the 7/30/90-day charts still come from
// CoinGecko (server) or a synthetic series anchored on the live price.
import { COINS } from './coins.js';

export const DEX_API = 'https://api.dexscreener.com';
export const DEX_BATCH_SIZE = 3;

/** Every real (non-concept) coin → { id, chainId, address } */
function dexCoins() {
  return Object.values(COINS).filter((c) => c.dex).map((c) => ({ id: c.id, chainId: c.dex.chainId, address: c.dex.address }));
}

/** Pick the most liquid pair where our token is the BASE token. */
function bestPair(pairs, address, chainId) {
  const a = address.toLowerCase();
  return pairs
    .filter((p) => p.baseToken?.address?.toLowerCase() === a && (!chainId || p.chainId === chainId))
    .sort((x, y) => (y.liquidity?.usd || 0) - (x.liquidity?.usd || 0))[0];
}

/** Normalise one DexScreener pair into the fields the app uses. */
export function fromPair(coin, pair, image) {
  const price = Number(pair.priceUsd);
  // DEX market caps for bridged/pegged tokens only cover the bridged supply, so for those
  // we compute market cap from the coin's known circulating supply instead.
  const marketCap = coin.dex.marketCapFromSupply ? price * coin.supply.circulating : pair.marketCap ?? pair.fdv;
  return {
    id: coin.id,
    price,
    change24h: pair.priceChange?.h24 ?? 0,
    changes: { m5: pair.priceChange?.m5, h1: pair.priceChange?.h1, h6: pair.priceChange?.h6, h24: pair.priceChange?.h24 },
    marketCap,
    fdv: pair.fdv,
    liquidity: pair.liquidity?.usd,
    volume24h: pair.volume?.h24,
    txns24h: pair.txns?.h24,
    dexId: pair.dexId,
    pairUrl: pair.url,
    pairCreatedAt: pair.pairCreatedAt,
    image: image || coin.dex.snapshot?.image || null,
    socials: pair.info?.socials,
    websites: pair.info?.websites?.map((w) => w.url ?? w),
    source: 'dexscreener',
    live: true,
  };
}

/** One call to /latest/dex/tokens for a handful of addresses → raw pairs */
async function fetchPairs(fetchImpl, addresses, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${DEX_API}/latest/dex/tokens/${addresses.join(',')}`, { signal: ctl.signal });
    if (!res.ok) throw new Error(`DexScreener ${res.status}`);
    const body = await res.json();
    return body.pairs || [];
  } finally {
    clearTimeout(t);
  }
}

function normalise(coinRef, pairs) {
  const p = bestPair(pairs, coinRef.address, coinRef.chainId);
  if (!p) return null;
  // the token's profile image (info.imageUrl) can sit on any of its pairs
  const image = pairs.find((x) => x.baseToken?.address?.toLowerCase() === coinRef.address.toLowerCase() && x.info?.imageUrl)?.info.imageUrl;
  return fromPair(COINS[coinRef.id], p, image);
}

/**
 * Fetch live data for every real coin. `fetchImpl` lets the server pass its own fetch with
 * timeouts. Throws if DexScreener is unreachable (callers fall back to the snapshot).
 */
export async function fetchDexCoins(fetchImpl = fetch, { timeoutMs = 7000, batchSize = DEX_BATCH_SIZE } = {}) {
  const refs = dexCoins();
  const out = {};
  const batches = [];
  for (let i = 0; i < refs.length; i += batchSize) batches.push(refs.slice(i, i + batchSize));
  const results = await Promise.allSettled(batches.map((b) => fetchPairs(fetchImpl, b.map((r) => r.address), timeoutMs)));
  results.forEach((r, i) => {
    if (r.status !== 'fulfilled') return;
    for (const ref of batches[i]) {
      const n = normalise(ref, r.value);
      if (n) out[ref.id] = n;
    }
  });
  if (!Object.keys(out).length) throw new Error('DexScreener returned no pairs');
  // anything crowded out of its batch (or whose batch failed) gets one individual retry
  const missing = refs.filter((r) => !out[r.id]);
  await Promise.allSettled(missing.map(async (ref) => {
    const n = normalise(ref, await fetchPairs(fetchImpl, [ref.address], timeoutMs));
    if (n) out[ref.id] = n;
  }));
  return out;
}

/** Offline snapshot (captured from DexScreener) merged onto the coin catalogue. */
export function snapshotCoins() {
  return Object.values(COINS).map((c) => {
    const s = c.dex?.snapshot;
    if (!s) return { ...c, live: false };
    return {
      ...c,
      price: s.price, change24h: s.changes.h24, changes: s.changes,
      marketCap: c.dex.marketCapFromSupply ? s.price * c.supply.circulating : s.marketCap,
      liquidity: s.liquidity, volume24h: s.volume24h, txns24h: s.txns24h,
      dexId: s.dexId, pairUrl: s.pairUrl, image: s.image || null, socials: s.socials, websites: s.websites,
      source: 'dexscreener-snapshot', live: false,
    };
  });
}
