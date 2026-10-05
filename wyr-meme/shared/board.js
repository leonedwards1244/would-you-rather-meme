// News + forum data logic, shared by the server (persists to JSON / Supabase) and the
// browser demo (persists to localStorage). Votes are toggled per session to prevent stacking.
import { seedNews, seedForum } from './seed.js';

export const CATEGORIES = ['General', 'Coin Analysis', 'Meme Drops', 'Predictions', 'Newcomers'];
export const NEWS_TAGS = ['bullish', 'bearish', 'meme', 'rug', 'moon'];

const uid = (p) => `${p}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

// Strip anything that isn't a small whitelist of formatting tags (defence in depth; the
// client sanitizes too). Images are only allowed as data: URLs or https.
export function sanitizeHtml(html = '') {
  return String(html)
    .slice(0, 400_000)
    .replace(/<\s*(script|style|iframe|object|embed|svg|math)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<(?!\/?(b|strong|i|em|u|p|br|ul|ol|li|a|img|div|span)\b)[^>]*>/gi, '')
    .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/(href|src)\s*=\s*("|')\s*(javascript|vbscript|data:text)[^"']*\2/gi, '$1="#"')
    .replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, '');
}

export function emptyData() {
  return { news: seedNews(), posts: seedForum(), votes: {} };
}

function findComment(list, id) {
  for (const c of list) {
    if (c.id === id) return c;
    const hit = findComment(c.replies || [], id);
    if (hit) return hit;
  }
  return null;
}
const countComments = (list) => list.reduce((n, c) => n + 1 + countComments(c.replies || []), 0);

export function createBoard(data = emptyData()) {
  data.votes ||= {};

  function applyVote(key, sessionId, dir, target) {
    const vk = `${key}:${sessionId}`;
    const prev = data.votes[vk] || 0;
    const next = prev === dir ? 0 : dir; // clicking the same arrow again removes the vote
    target.score += next - prev;
    if (next) data.votes[vk] = next; else delete data.votes[vk];
    return { score: target.score, myVote: next };
  }

  const myVote = (key, sid) => data.votes[`${key}:${sid}`] || 0;

  return {
    data,
    listNews({ coin, tag, sessionId } = {}) {
      return data.news
        .filter((n) => (!coin || coin === 'ALL' || n.coin === coin) && (!tag || n.tags.includes(tag)))
        .sort((a, b) => b.at - a.at)
        .map((n) => ({ ...n, myVote: myVote(`news:${n.id}`, sessionId) }));
    },
    replaceNews(items) {
      const keep = new Map(data.news.map((n) => [n.id, n.score]));
      data.news = items.map((n) => ({ ...n, score: keep.get(n.id) ?? n.score ?? 0 }));
    },
    voteNews(id, sessionId, dir) {
      const n = data.news.find((x) => x.id === id);
      if (!n) throw new Error('Rug pulled! That news item vanished 😭');
      return applyVote(`news:${id}`, sessionId, dir, n);
    },
    listPosts({ category, sort = 'hot', sessionId, q } = {}) {
      const t = Date.now();
      const hot = (p) => (p.score + 1) / Math.pow((t - p.at) / 3600_000 + 2, 1.5);
      const sorters = { hot: (a, b) => hot(b) - hot(a), new: (a, b) => b.at - a.at, top: (a, b) => b.score - a.score };
      const query = (q || '').toLowerCase();
      return data.posts
        .filter((p) => (!category || category === 'All' || p.category === category) && (!query || p.title.toLowerCase().includes(query)))
        .sort(sorters[sort] || sorters.hot)
        .map(({ comments, ...p }) => ({ ...p, commentCount: countComments(comments), myVote: myVote(`post:${p.id}`, sessionId) }));
    },
    getPost(id, sessionId) {
      const p = data.posts.find((x) => x.id === id);
      if (!p) return null;
      const decorate = (list) => list.map((c) => ({ ...c, myVote: myVote(`comment:${c.id}`, sessionId), replies: decorate(c.replies || []) }));
      return { ...p, myVote: myVote(`post:${p.id}`, sessionId), comments: decorate(p.comments) };
    },
    createPost({ title, body, category, author, flair }) {
      title = String(title || '').trim().slice(0, 140);
      if (title.length < 4) throw new Error('Title too short — even memes need a headline.');
      if (!CATEGORIES.includes(category)) category = 'General';
      const post = { id: uid('p'), title, body: sanitizeHtml(body), category, author: String(author).slice(0, 40), flair, at: Date.now(), score: 1, comments: [] };
      data.posts.unshift(post);
      return post;
    },
    votePost(id, sessionId, dir) {
      const p = data.posts.find((x) => x.id === id);
      if (!p) throw new Error('Rug pulled! Post not found 😭');
      return applyVote(`post:${id}`, sessionId, dir, p);
    },
    addComment({ postId, parentId, body, author, flair }) {
      const p = data.posts.find((x) => x.id === postId);
      if (!p) throw new Error('Rug pulled! Post not found 😭');
      body = String(body || '').trim().slice(0, 2000);
      if (!body) throw new Error('Empty comment? That’s a rug.');
      const c = { id: uid('c'), author: String(author).slice(0, 40), flair, body, at: Date.now(), score: 1, replies: [] };
      if (parentId) {
        const parent = findComment(p.comments, parentId);
        if (!parent) throw new Error('Parent comment vanished.');
        (parent.replies ||= []).push(c);
      } else p.comments.push(c);
      return c;
    },
    voteComment(postId, commentId, sessionId, dir) {
      const p = data.posts.find((x) => x.id === postId);
      const c = p && findComment(p.comments, commentId);
      if (!c) throw new Error('Comment not found.');
      return applyVote(`comment:${commentId}`, sessionId, dir, c);
    },
  };
}
