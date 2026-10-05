import { COINS } from '@shared/coins.js';
import { useStore } from '../store/useStore.js';

export function matchupUrl(id) {
  const { origin, pathname } = window.location;
  // with the Express server, /m/:id serves crawler-friendly meta tags for link previews
  if (useStore.getState().mode === 'live') return `${origin}/m/${id}`;
  // HashRouter-friendly link that also works when served by the Express server
  return `${origin}${pathname.replace(/\/$/, '')}#/m/${id}`;
}

export function tweetUrl(matchup, myVote) {
  const l = COINS[matchup.left], r = COINS[matchup.right];
  const pick = myVote ? COINS[matchup[myVote]] : null;
  const text = pick
    ? `I just picked ${pick.emoji} $${pick.ticker} in ${l.ticker} vs ${r.ticker} on Would You Rather: Meme Edition. Old school or new wave — what's your call?`
    : `${matchup.prompt} ${l.emoji} vs ${r.emoji} — vote live on Would You Rather: Meme Edition`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(matchupUrl(matchup.id))}&hashtags=memecoins,${l.ticker.replace(/\W/g, '')},${r.ticker.replace(/\W/g, '')}`;
  return url;
}

export function shareMatchup(matchup, myVote) {
  window.open(tweetUrl(matchup, myVote), '_blank', 'noopener,noreferrer');
}
