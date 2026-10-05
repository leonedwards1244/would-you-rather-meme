// Would You Rather: Meme Edition — realtime server (Express + Socket.io)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { createEngine, attachBots, randomIdentity } from '../shared/engine.js';
import { createBoard } from '../shared/board.js';
import { COINS, MATCHUPS } from '../shared/coins.js';
import { getHistory } from './coingecko.js';
import { getMarket } from './market.js';
import { fetchRssNews } from './news.js';
import { loadBoard, saveBoard, sbInsert, supabaseEnabled } from './persistence.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = +process.env.PORT || 4000;
const SIM_BOTS = (process.env.SIM_BOTS ?? 'true') === 'true';
const ROUND_MS = +process.env.ROUND_MS || 60_000;
const VOTE_THRESHOLD = +process.env.VOTE_THRESHOLD || 1_000;
const CLIENT_DIST = path.resolve(__dirname, '../client/dist');
const ORIGINS = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : true;

const app = express();
app.set('trust proxy', 1);
app.use(cors({ origin: ORIGINS }));
app.use(express.json({ limit: '3mb' })); // posts may carry inline images / GIFs

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: ORIGINS } });

/* ------------------------------ helpers ------------------------------ */
const buckets = new Map();
/** tiny token-bucket rate limiter, keyed per IP + action */
function allow(key, perMinute) {
  const now = Date.now();
  const b = buckets.get(key) || { tokens: perMinute, at: now };
  b.tokens = Math.min(perMinute, b.tokens + ((now - b.at) / 60_000) * perMinute);
  b.at = now;
  if (b.tokens < 1) { buckets.set(key, b); return false; }
  b.tokens -= 1;
  buckets.set(key, b);
  return true;
}
setInterval(() => { const cut = Date.now() - 5 * 60_000; for (const [k, b] of buckets) if (b.at < cut) buckets.delete(k); }, 60_000);
const cleanId = (s) => (typeof s === 'string' && /^[\w-]{6,80}$/.test(s) ? s : null);
const cleanText = (s, n) => String(s ?? '').replace(/[<>]/g, '').slice(0, n);

/* ------------------------------ game engine ------------------------------ */
let botPresence = 0;
const engine = createEngine({
  roundMs: ROUND_MS,
  threshold: VOTE_THRESHOLD,
  emit: (event, payload) => {
    io.emit(event, payload);
    if (event === 'round:end') sbInsert('rounds', { round: payload.round, matchup_id: payload.matchupId, winner: payload.winner, left_votes: payload.leftVotes, right_votes: payload.rightVotes });
  },
});
engine.tick();
setInterval(engine.tick, 250);
if (SIM_BOTS) attachBots(engine, { votesPerSecond: 5, onPresence: (n) => { botPresence = n; } });

const online = () => io.engine.clientsCount + (SIM_BOTS ? botPresence : 0);
setInterval(() => io.emit('presence', { online: online() }), 3000);

const ipVotes = new Map(); // `${round}:${ip}` -> count (limits session-id spoofing)

io.on('connection', (socket) => {
  const ip = socket.handshake.headers['x-forwarded-for']?.split(',')[0].trim() || socket.handshake.address;

  socket.on('hello', (identity = {}, ack) => {
    const sessionId = cleanId(identity.sessionId);
    if (!sessionId) return ack?.({ ok: false, error: 'Bad session' });
    const fallback = randomIdentity();
    socket.data.sessionId = sessionId;
    socket.data.identity = { name: cleanText(identity.name, 40) || fallback.name, emoji: cleanText(identity.emoji, 4) || fallback.emoji };
    ack?.({ ok: true, state: engine.snapshot(), myVote: engine.hasVoted(sessionId), online: online() });
  });

  socket.on('vote', ({ side } = {}, ack) => {
    const sid = socket.data.sessionId;
    if (!sid) return ack?.({ ok: false, error: 'Say hello first' });
    if (!allow(`vote:${ip}`, 30)) return ack?.({ ok: false, error: 'Whoa there, speed demon. Slow down 🐢' });
    const key = `${engine.state.round}:${ip}`;
    if ((ipVotes.get(key) || 0) >= 5) return ack?.({ ok: false, error: 'Too many votes from your network this round 🕵️' });
    const res = engine.vote(sid, side, socket.data.identity);
    if (res.ok) {
      ipVotes.set(key, (ipVotes.get(key) || 0) + 1);
      sbInsert('votes', { session_id: sid, round: engine.state.round, matchup_id: engine.state.matchup.id, side, coin: engine.state.matchup[side] });
    }
    ack?.(res);
  });

  socket.on('suggest', (m = {}, ack) => {
    if (!allow(`suggest:${ip}`, 3)) return ack?.({ ok: false, error: 'One suggestion at a time, chief.' });
    ack?.(engine.suggest({ left: m.left, right: m.right, prompt: cleanText(m.prompt, 160), by: socket.data.identity?.name }));
  });
});
// keep ipVotes from growing forever
setInterval(() => { const r = engine.state.round; for (const k of ipVotes.keys()) if (+k.split(':')[0] < r - 1) ipVotes.delete(k); }, 30_000);

/* ------------------------------ REST API ------------------------------ */
const board = createBoard(loadBoard());
const persist = () => saveBoard(board.data);
const sid = (req) => cleanId(req.get('x-session-id')) || `ip-${req.ip}`;
const wrap = (fn) => async (req, res) => {
  try { res.json(await fn(req, res)); } catch (e) { res.status(e.status || 400).json({ error: e.message || 'Rug pulled! 😭' }); }
};
const limit = (action, perMinute) => (req, res, next) => (allow(`${action}:${req.ip}`, perMinute) ? next() : res.status(429).json({ error: 'Rate limited — touch grass for a minute 🌱' }));

async function refreshNews() {
  const items = await fetchRssNews();
  if (items) { board.replaceNews(items); persist(); console.log(`[news] loaded ${items.length} RSS items`); }
}
refreshNews();
setInterval(refreshNews, 10 * 60_000);

app.get('/api/health', (req, res) => res.json({ ok: true, round: engine.state.round, online: online(), supabase: supabaseEnabled, bots: SIM_BOTS }));
app.get('/api/state', (req, res) => res.json(engine.snapshot()));
app.get('/api/matchups', (req, res) => res.json({ matchups: MATCHUPS }));
app.get('/api/coins', wrap(async () => getMarket()));
app.get('/api/history/:id', wrap(async (req) => getHistory(req.params.id, req.query.days)));

app.get('/api/news', wrap(async (req) => ({ items: board.listNews({ coin: req.query.coin, tag: req.query.tag, sessionId: sid(req) }) })));
app.post('/api/news/:id/vote', limit('nvote', 60), wrap(async (req) => { const r = board.voteNews(req.params.id, sid(req), Math.sign(+req.body.dir) || 0); persist(); return r; }));

app.get('/api/posts', wrap(async (req) => ({ posts: board.listPosts({ category: req.query.category, sort: req.query.sort, q: req.query.q, sessionId: sid(req) }) })));
app.get('/api/posts/:id', wrap(async (req) => {
  const post = board.getPost(req.params.id, sid(req));
  if (!post) throw Object.assign(new Error('Rug pulled! Post not found 😭'), { status: 404 });
  return { post };
}));
app.post('/api/posts', limit('post', 5), wrap(async (req) => {
  const { title, body, category, flair, author } = req.body || {};
  const post = board.createPost({ title, body, category, flair: COINS[flair] ? flair : 'DOGE', author: cleanText(author, 40) || 'Anonymous Fren' });
  persist();
  sbInsert('posts', { id: post.id, title: post.title, category: post.category, author: post.author, flair: post.flair });
  return { post };
}));
app.post('/api/posts/:id/vote', limit('pvote', 60), wrap(async (req) => { const r = board.votePost(req.params.id, sid(req), Math.sign(+req.body.dir) || 0); persist(); return r; }));
app.post('/api/posts/:id/comments', limit('comment', 15), wrap(async (req) => {
  const { body, parentId, flair, author } = req.body || {};
  const comment = board.addComment({ postId: req.params.id, parentId, body: cleanText(body, 2000), flair: COINS[flair] ? flair : 'DOGE', author: cleanText(author, 40) || 'Anonymous Fren' });
  persist();
  return { comment };
}));
app.post('/api/posts/:pid/comments/:cid/vote', limit('cvote', 60), wrap(async (req) => { const r = board.voteComment(req.params.pid, req.params.cid, sid(req), Math.sign(+req.body.dir) || 0); persist(); return r; }));

const submissions = [];
app.post('/api/submissions', limit('submit', 3), wrap(async (req) => {
  const s = { name: cleanText(req.body.name, 60), ticker: cleanText(req.body.ticker, 10).toUpperCase(), chain: cleanText(req.body.chain, 20), contract: cleanText(req.body.contract, 80), why: cleanText(req.body.why, 200), at: Date.now() };
  if (!s.name || !/^[A-Z0-9]{2,10}$/.test(s.ticker)) throw new Error('Need a name and a 2–10 character ticker.');
  submissions.push(s);
  sbInsert('coin_submissions', s);
  return { ok: true };
}));

/* ------------------------- static client + SEO ------------------------- */
// /m/:id share links get matchup-specific meta tags server-side (crawlers don't run JS),
// then the SPA takes over at #/m/:id.
const indexHtml = () => (fs.existsSync(path.join(CLIENT_DIST, 'index.html')) ? fs.readFileSync(path.join(CLIENT_DIST, 'index.html'), 'utf8') : null);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

app.get('/m/:id', (req, res) => {
  const m = MATCHUPS.find((x) => x.id === req.params.id);
  const html = indexHtml();
  if (!html) return res.redirect(`/#/m/${encodeURIComponent(req.params.id)}`);
  if (!m) return res.redirect('/#/404');
  const L = COINS[m.left], R = COINS[m.right];
  const title = esc(`${L.ticker} vs ${R.ticker} — Would You Rather: Meme Edition`);
  const desc = esc(`${m.prompt} Vote live: ${L.name} vs ${R.name}.`);
  const url = esc(`${req.protocol}://${req.get('host')}/m/${m.id}`);
  const meta = `<title>${title}</title>
    <meta name="description" content="${desc}" /><link rel="canonical" href="${url}" />
    <meta property="og:title" content="${title}" /><meta property="og:description" content="${desc}" /><meta property="og:url" content="${url}" />
    <meta name="twitter:title" content="${title}" /><meta name="twitter:description" content="${desc}" />
    <script>location.replace('/#/m/${m.id}')</script>`;
  res.send(html.replace(/<title>[\s\S]*?<\/title>/, '').replace(/<meta name="description"[^>]*>/, '').replace('</head>', `${meta}\n</head>`));
});

if (fs.existsSync(CLIENT_DIST)) {
  app.use(express.static(CLIENT_DIST, { index: 'index.html', maxAge: '1h' }));
  app.get(/^\/(?!api|socket\.io).*/, (req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
}

server.listen(PORT, () => {
  console.log(`🪙 Would You Rather: Meme Edition server on http://localhost:${PORT}`);
  console.log(`   bots: ${SIM_BOTS ? 'ON (set SIM_BOTS=false for production)' : 'off'} · supabase: ${supabaseEnabled ? 'on' : 'off'} · client: ${fs.existsSync(CLIENT_DIST) ? 'serving build' : 'not built (use vite dev)'}`);
});
