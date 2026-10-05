// One interface, two backends:
//  • LIVE  – Socket.io + REST against the Express server (real multiplayer)
//  • DEMO  – the same round engine running in the browser with a simulated crowd
// The app never needs to know which one it got.
import { io } from 'socket.io-client';
import { createEngine, attachBots } from '@shared/engine.js';
import { createBoard, emptyData } from '@shared/board.js';
import { COINS } from '@shared/coins.js';
import { syntheticHistory } from '@shared/history.js';
import { fetchDexCoins, snapshotCoins } from '@shared/dexscreener.js';

const FORCE_DEMO = import.meta.env.MODE === 'single' || import.meta.env.VITE_DEMO === '1';
const SERVER_URL = import.meta.env.VITE_SERVER_URL || '';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function emitter() {
  const map = new Map();
  return {
    on(evt, cb) { (map.get(evt) || map.set(evt, new Set()).get(evt)).add(cb); return () => map.get(evt)?.delete(cb); },
    emit(evt, payload) { map.get(evt)?.forEach((cb) => cb(payload)); },
  };
}

/* ----------------------------- LIVE ----------------------------- */
function liveTransport(socket, identity) {
  const base = SERVER_URL;
  const json = async (path, opts = {}) => {
    const res = await fetch(base + path, {
      ...opts,
      headers: { 'Content-Type': 'application/json', 'x-session-id': identity.sessionId, ...(opts.headers || {}) },
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'Rug pulled! Data not found 😭');
    return data;
  };
  return {
    mode: 'live',
    on: (evt, cb) => { socket.on(evt, cb); return () => socket.off(evt, cb); },
    hello: () => socket.timeout(5000).emitWithAck('hello', identity),
    vote: (side) => socket.timeout(5000).emitWithAck('vote', { side }),
    suggest: (m) => socket.timeout(5000).emitWithAck('suggest', m),
    close: () => socket.close(),
    api: {
      coins: () => json('/api/coins'),
      history: (id, days) => json(`/api/history/${id}?days=${days}`),
      news: (q) => json(`/api/news?${new URLSearchParams(q)}`),
      voteNews: (id, dir) => json(`/api/news/${id}/vote`, { method: 'POST', body: { dir } }),
      posts: (q) => json(`/api/posts?${new URLSearchParams(q)}`),
      post: (id) => json(`/api/posts/${id}`),
      createPost: (p) => json('/api/posts', { method: 'POST', body: p }),
      votePost: (id, dir) => json(`/api/posts/${id}/vote`, { method: 'POST', body: { dir } }),
      comment: (postId, c) => json(`/api/posts/${postId}/comments`, { method: 'POST', body: c }),
      voteComment: (postId, cid, dir) => json(`/api/posts/${postId}/comments/${cid}/vote`, { method: 'POST', body: { dir } }),
      submitCoin: (c) => json('/api/submissions', { method: 'POST', body: c }),
    },
  };
}

/* ----------------------------- DEMO ----------------------------- */
const LS_KEY = 'wyr-meme-board-v1';
function loadBoardData() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* storage unavailable – fine */ }
  return emptyData();
}
function saveBoardData(data) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch { /* ignore quota / private mode */ }
}

function demoTransport(identity) {
  const bus = emitter();
  const engine = createEngine({ emit: bus.emit, roundMs: 60_000, resultsMs: 7_000, threshold: 1_000 });
  engine.tick();
  const tick = setInterval(engine.tick, 250);
  const stopBots = attachBots(engine, { votesPerSecond: 6, onPresence: (online) => bus.emit('presence', { online }) });
  const board = createBoard(loadBoardData());
  const sid = identity.sessionId;
  const run = async (fn, delay = 350) => {
    await sleep(delay + Math.random() * 250); // realistic latency so skeletons show
    const out = fn();
    saveBoardData(board.data);
    return out;
  };
  // No server? Ask DexScreener directly from the browser (its API allows cross-origin reads).
  // Sandboxed hosts that block outside requests fall back to the bundled DexScreener snapshot.
  let dexBlocked = false;
  let lastCoins = snapshotCoins();
  const loadCoins = async () => {
    if (!dexBlocked) {
      try {
        const live = await fetchDexCoins(fetch, { timeoutMs: 5000 });
        lastCoins = snapshotCoins().map((c) => (live[c.id] ? { ...c, ...live[c.id] } : c));
        return { coins: lastCoins, live: true, source: 'dexscreener' };
      } catch {
        dexBlocked = true; // don't keep hammering a blocked endpoint
      }
    }
    return { coins: lastCoins, live: false, source: 'snapshot' };
  };

  return {
    mode: 'demo',
    on: bus.on,
    hello: async () => ({ ok: true, state: engine.snapshot(), myVote: engine.hasVoted(sid), online: 1200 }),
    vote: async (side) => { await sleep(80); return engine.vote(sid, side, identity); },
    suggest: async (m) => engine.suggest({ ...m, by: identity.name }),
    close: () => { clearInterval(tick); stopBots(); },
    api: {
      coins: () => loadCoins(),
      history: (id, days) => run(() => ({ points: syntheticHistory({ ...COINS[id], price: lastCoins.find((c) => c.id === id)?.price ?? COINS[id].price }, days), live: false }), 450),
      news: (q) => run(() => ({ items: board.listNews({ ...q, sessionId: sid }) })),
      voteNews: (id, dir) => run(() => board.voteNews(id, sid, dir), 60),
      posts: (q) => run(() => ({ posts: board.listPosts({ ...q, sessionId: sid }) })),
      post: (id) => run(() => { const p = board.getPost(id, sid); if (!p) throw new Error('Rug pulled! Post not found 😭'); return { post: p }; }),
      createPost: (p) => run(() => ({ post: board.createPost({ ...p, author: identity.name }) }), 200),
      votePost: (id, dir) => run(() => board.votePost(id, sid, dir), 60),
      comment: (postId, c) => run(() => ({ comment: board.addComment({ ...c, postId, author: identity.name }) }), 150),
      voteComment: (postId, cid, dir) => run(() => board.voteComment(postId, cid, sid, dir), 60),
      submitCoin: (c) => run(() => ({ ok: true, received: c }), 300),
    },
  };
}

/* --------------------------- connect ---------------------------- */
export async function connectTransport(identity) {
  if (FORCE_DEMO) return demoTransport(identity);
  const socket = io(SERVER_URL || undefined, { transports: ['websocket', 'polling'], timeout: 3000, reconnectionAttempts: Infinity });
  const ok = await new Promise((resolve) => {
    const t = setTimeout(() => resolve(false), 3500);
    socket.once('connect', () => { clearTimeout(t); resolve(true); });
    socket.once('connect_error', () => { clearTimeout(t); resolve(false); });
  });
  if (ok) return liveTransport(socket, identity);
  socket.close();
  console.info('[wyr] Realtime server not reachable — running in demo mode with a simulated crowd.');
  return demoTransport(identity);
}
