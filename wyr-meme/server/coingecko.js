// Live prices + history from CoinGecko's public API, cached to stay under rate limits.
// Falls back to seed data / synthetic history if the API is unreachable.
import { COINS } from '../shared/coins.js';
import { syntheticHistory } from '../shared/history.js';
import { lastPrice } from './market.js';

const API = process.env.COINGECKO_API || 'https://api.coingecko.com/api/v3';
const headers = process.env.COINGECKO_KEY ? { 'x-cg-demo-api-key': process.env.COINGECKO_KEY } : {};
let priceCache = { at: 0, coins: null, live: false };
const historyCache = new Map();

export async function getCoins() {
  if (Date.now() - priceCache.at < 60_000 && priceCache.coins) return priceCache;
  const ids = Object.values(COINS).map((c) => c.coingeckoId).filter(Boolean).join(',');
  try {
    const r = await fetch(`${API}/simple/price?ids=${ids}&vs_currencies=usd&include_market_cap=true&include_24hr_change=true`, { headers, signal: AbortSignal.timeout(6000) });
    if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
    const data = await r.json();
    const coins = Object.values(COINS).map((c) => {
      const d = c.coingeckoId && data[c.coingeckoId];
      return d ? { ...c, price: d.usd, marketCap: d.usd_market_cap, change24h: +(d.usd_24h_change ?? 0).toFixed(2), live: true } : { ...c, live: false };
    });
    priceCache = { at: Date.now(), coins, live: true };
  } catch (e) {
    if (!priceCache.coins) console.warn('[coingecko] using seed prices:', e.message);
    priceCache = { at: Date.now(), coins: priceCache.coins || Object.values(COINS).map((c) => ({ ...c, live: false })), live: !!priceCache.live };
  }
  return priceCache;
}

export async function getHistory(id, days = 30) {
  const coin = COINS[id];
  if (!coin) throw new Error('Unknown coin');
  days = [7, 30, 90].includes(+days) ? +days : 30;
  const key = `${id}:${days}`;
  const hit = historyCache.get(key);
  if (hit && Date.now() - hit.at < 15 * 60_000) return hit.value;
  let value;
  if (coin.coingeckoId) {
    try {
      const r = await fetch(`${API}/coins/${coin.coingeckoId}/market_chart?vs_currency=usd&days=${days}`, { headers, signal: AbortSignal.timeout(8000) });
      if (!r.ok) throw new Error(`CoinGecko ${r.status}`);
      const { prices } = await r.json();
      const step = Math.max(1, Math.floor(prices.length / 90));
      value = { points: prices.filter((_, i) => i % step === 0).map(([t, price]) => ({ t, price })), live: true };
    } catch (e) {
      console.warn(`[coingecko] history ${id} fallback:`, e.message);
    }
  }
  value ||= { points: syntheticHistory({ ...coin, price: lastPrice(id) }, days), live: false };
  historyCache.set(key, { at: Date.now(), value });
  return value;
}
