// Token logos captured from DexScreener token profiles (PEPE, WIF, FLOKI, BONK, BRETT) and
// Trust Wallet assets (DOGE, SHIB have no DexScreener profile image). Bundled so they work
// offline and inside the sandboxed demo; live DexScreener image URLs are used as a fallback.
const files = import.meta.glob('../assets/tokens/*.webp', { eager: true, import: 'default' });
export const TOKEN_IMAGES = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.match(/([\w-]+)\.webp$/)[1], url]),
);
export function tokenImage(coin) {
  if (!coin) return null;
  return TOKEN_IMAGES[coin.imageFrom || coin.id] || coin.image || null;
}
