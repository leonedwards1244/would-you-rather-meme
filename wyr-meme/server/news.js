// Optional real headlines: set NEWS_RSS_URLS to a comma-separated list of RSS feeds.
// Items are tagged with a coin (by keyword) and #tags (by simple sentiment keywords).
import { COINS } from '../shared/coins.js';

const KEYWORDS = {
  DOGE: /\b(doge|dogecoin)\b/i, SHIB: /\b(shib|shiba inu|shibarium)\b/i, PEPE: /\bpepe\b/i, WIF: /\b(wif|dogwifhat)\b/i,
  FLOKI: /\bfloki\b/i, BONK: /\bbonk\b/i, BRETT: /\bbrett\b/i,
  SAI: /\bsigma ai\b/i, AICOIN: /\baicoin\b/i, TEK: /\btekcoin\b/i,
  CHILLGUY: /\b(chillguy|chill guy)\b/i, PNUT: /\b(pnut|peanut the squirrel)\b/i, NEET: /\$neet\b/i, KET: /\$ket\b/i,
  CATE: /\b(catecoin|\$cate)\b/i, PENGU: /\b(pengu|pudgy penguins)\b/i, ANSEM: /\$ansem\b/i, USELESS: /\$useless\b|\buseless coin\b/i,
  TROLL: /\$troll\b/i, TOSHI: /\$toshi\b|\btoshi the cat\b/i, POPCAT: /\bpopcat\b/i,
  GOAT: /\b(goatseus|\$goat)\b/i, RETARDIO: /\bretardio\b/i, WOJAK: /\$wojak\b/i, USDUC: /\busduc\b/i,
};
const TAGS = {
  bullish: /\b(surge|rall(y|ies)|soar|jump|gain|record|bull|breakout|pump)\w*/i,
  bearish: /\b(drop|fall|plunge|slump|bear|crash|sell-?off|decline|dump)\w*/i,
  rug: /\b(rug|scam|exploit|hack|drain|fraud)\w*/i,
  moon: /\b(moon|all-time high|ath|skyrocket|10x)\w*/i,
};
const pick = (xml, tag) => (xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'))?.[1] || '')
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').trim();

export async function fetchRssNews() {
  const urls = (process.env.NEWS_RSS_URLS || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!urls.length) return null;
  const out = [];
  for (const url of urls) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { 'user-agent': 'wyr-meme/1.0' } });
      const xml = await r.text();
      const source = pick(xml.split('<item')[0], 'title') || new URL(url).hostname;
      for (const chunk of xml.split(/<item[\s>]/i).slice(1, 40)) {
        const headline = pick(chunk, 'title');
        const summary = pick(chunk, 'description').slice(0, 220);
        const text = `${headline} ${summary}`;
        const coin = Object.keys(KEYWORDS).find((k) => KEYWORDS[k].test(text));
        if (!coin) continue; // only memecoin news
        const tags = Object.keys(TAGS).filter((t) => TAGS[t].test(text));
        if (/meme/i.test(text)) tags.push('meme');
        const image = chunk.match(/<(?:media:content|media:thumbnail|enclosure)[^>]+url="([^"]+)"/i)?.[1];
        const link = pick(chunk, 'link') || chunk.match(/<link[^>]*href="([^"]+)"/i)?.[1];
        out.push({
          id: `rss-${Buffer.from(link || headline).toString('base64url').slice(0, 24)}`,
          kind: 'article', coin, tags: tags.length ? [...new Set(tags)] : ['meme'], source,
          at: Date.parse(pick(chunk, 'pubDate')) || Date.now(), headline, summary,
          url: /^https:\/\//.test(link || '') ? link : undefined, image: /^https:\/\//.test(image || '') ? image : undefined, score: 0,
        });
      }
    } catch (e) {
      console.warn('[news] feed failed', url, e.message);
    }
  }
  return out.length ? out : null;
}
export const KNOWN = Object.keys(COINS);
