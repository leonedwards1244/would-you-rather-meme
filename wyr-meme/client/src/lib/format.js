const SUB = '₀₁₂₃₄₅₆₇₈₉';
/** DexScreener-style prices: tiny values use subscript zero counts, e.g. $0.0₅4379 */
export function fmtPrice(p) {
  if (p == null || Number.isNaN(p)) return '—';
  if (p >= 1) return `$${p.toLocaleString(undefined, { maximumFractionDigits: 2, minimumFractionDigits: 2 })}`;
  if (p >= 0.0001) return `$${p.toPrecision(4).replace(/0+$/, '').replace(/\.$/, '')}`;
  const zeros = Math.floor(-Math.log10(p)); // zeros right after the decimal point
  const digits = Math.round(p * 10 ** (zeros + 4)).toString().slice(0, 4).replace(/0+$/, '');
  return `$0.0${String(zeros).split('').map((d) => SUB[d]).join('')}${digits}`;
}
export function fmtBig(n) {
  if (n == null) return '—';
  const abs = Math.abs(n);
  const units = [[1e15, 'Q'], [1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];
  for (const [v, s] of units) if (abs >= v) return `${(n / v).toFixed(abs / v >= 100 ? 0 : 1)}${s}`;
  return `${Math.round(n)}`;
}
export const fmtUsdBig = (n) => (n == null ? '—' : `$${fmtBig(n)}`);
export function fmtPct(p) {
  if (p == null) return '—';
  return `${p >= 0 ? '+' : ''}${p.toFixed(2)}%`;
}
export function timeAgo(t) {
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
export const cx = (...a) => a.filter(Boolean).join(' ');
