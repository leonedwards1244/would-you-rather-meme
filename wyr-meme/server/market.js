// Market data: DexScreener first (live), CoinGecko second, DexScreener snapshot last.
import { COINS } from '../shared/coins.js';
import { fetchDexCoins, snapshotCoins } from '../shared/dexscreener.js';
import { getCoins as getCoingecko } from './coingecko.js';

const TTL = +process.env.DEX_CACHE_MS || 30_000; // DexScreener allows ~300 req/min; we use ~4 per refresh
let cache = { at: 0, value: null };
let inflight = null;

async function load() {
  try {
    const live = await fetchDexCoins(fetch);
    const coins = snapshotCoins().map((c) => (live[c.id] ? { ...c, ...live[c.id] } : c));
    return { coins, live: true, source: 'dexscreener', at: Date.now() };
  } catch (e) {
    console.warn('[market] DexScreener unavailable:', e.message);
  }
  const cg = await getCoingecko();
  if (cg.live) return { coins: cg.coins.map((c) => ({ ...snapshotCoins().find((s) => s.id === c.id), ...c, source: 'coingecko' })), live: true, source: 'coingecko', at: Date.now() };
  return { coins: snapshotCoins(), live: false, source: 'snapshot', at: Date.now() };
}

export async function getMarket() {
  if (cache.value && Date.now() - cache.at < TTL) return cache.value;
  inflight ||= load().finally(() => { inflight = null; });
  cache = { at: Date.now(), value: await inflight };
  return cache.value;
}

/** latest known price for a coin (used to anchor synthetic history) */
export function lastPrice(id) {
  return cache.value?.coins.find((c) => c.id === id)?.price ?? COINS[id]?.price;
}
