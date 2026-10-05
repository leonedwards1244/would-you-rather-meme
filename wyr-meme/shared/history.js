// Deterministic synthetic price history (used when live CoinGecko history is unavailable,
// and for the hypothetical "concept" coins). Same seed → same chart on server and client.
function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash = (s) => [...s].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) | 0, 7);

export function syntheticHistory(coin, days = 30, points = 60) {
  const rand = mulberry32(hash(coin.id + days));
  const vol = coin.era === 'OG' ? 0.035 : coin.concept ? 0.09 : 0.06;
  const series = [coin.price];
  for (let i = 1; i < points; i++) {
    const shock = (rand() - 0.5) * 2 * vol + (rand() < 0.04 ? (rand() - 0.4) * vol * 6 : 0);
    series.unshift(Math.max(series[0] / (1 + shock), coin.price * 0.05));
  }
  const step = (days * 86400_000) / (points - 1);
  const end = Date.now();
  return series.map((p, i) => ({ t: end - (points - 1 - i) * step, price: p }));
}
