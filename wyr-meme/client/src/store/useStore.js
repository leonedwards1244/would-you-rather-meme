import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { COINS } from '@shared/coins.js';
import { randomIdentity } from '@shared/engine.js';
import { connectTransport } from '../realtime/transport.js';

const safeStorage = createJSONStorage(() => {
  try {
    const k = '__wyr_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    const mem = new Map();
    return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
  }
});

const newSessionId = () =>
  (globalThis.crypto?.randomUUID?.() || `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);

let unsubs = [];
let lastFeedAt = 0;
let priceTimer;
let initStarted = false;

export const useStore = create(
  persist(
    (set, get) => ({
      /* persisted */
      identity: { sessionId: newSessionId(), ...randomIdentity() },
      favoriteCoin: 'DOGE',
      wallet: null,
      theme: 'dark',
      academy: { completed: [], quiz: {} },

      /* runtime */
      transport: null,
      mode: 'connecting',
      game: null,
      clockOffset: 0,
      myVote: null,
      online: 0,
      feed: [],
      toasts: [],
      coins: COINS,
      coinsLive: false,
      coinsSource: 'snapshot',
      celebration: null, // round:end payload to celebrate

      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setFavoriteCoin: (favoriteCoin) => set({ favoriteCoin }),
      connectWallet: () => {
        const hex = [...Array(40)].map(() => '0123456789abcdef'[Math.floor(Math.random() * 16)]).join('');
        set({ wallet: `0x${hex}` });
        get().toast('Wallet connected (demo only — no real Web3) 🦊', 'success');
      },
      disconnectWallet: () => set({ wallet: null }),
      completeLesson: (id, score) =>
        set((s) => ({
          academy: {
            completed: s.academy.completed.includes(id) ? s.academy.completed : [...s.academy.completed, id],
            quiz: { ...s.academy.quiz, [id]: Math.max(score, s.academy.quiz[id] || 0) },
          },
        })),
      resetAcademy: () => set({ academy: { completed: [], quiz: {} } }),

      toast: (msg, kind = 'info') => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({ toasts: [...s.toasts, { id, msg, kind }] }));
        setTimeout(() => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })), 3200);
      },
      dismissCelebration: () => set({ celebration: null }),

      init: async () => {
        if (initStarted) return; // StrictMode / remount guard
        initStarted = true;
        const identity = get().identity;
        // a connected wallet doubles as the anti-double-vote key
        const t = await connectTransport({ ...identity, sessionId: get().wallet || identity.sessionId });
        set({ transport: t, mode: t.mode });

        const applySnapshot = (snap, myVote = null) =>
          set({ game: snap, clockOffset: (snap.serverNow ?? Date.now()) - Date.now(), myVote });

        unsubs.forEach((u) => u?.());
        unsubs = [
          t.on('round:start', (snap) => applySnapshot(snap, null)),
          t.on('tally', ({ round, votes }) =>
            set((s) => (s.game && s.game.round === round ? { game: { ...s.game, votes } } : {}))),
          t.on('feed', (item) => {
            const mine = item.name === get().identity.name && item.emoji === get().identity.emoji;
            const now = Date.now();
            if (!mine && now - lastFeedAt < 450) return; // keep the ticker readable
            lastFeedAt = now;
            set((s) => ({ feed: [{ ...item, mine }, ...s.feed].slice(0, 10) }));
          }),
          t.on('round:end', (payload) =>
            set((s) => ({
              game: s.game && { ...s.game, phase: 'results', winner: payload.winner, history: payload.history, leaderboard: payload.leaderboard, votes: { left: payload.leftVotes, right: payload.rightVotes }, nextAt: payload.nextAt },
              celebration: payload,
            }))),
          t.on('presence', ({ online }) => set({ online })),
          t.on('queue', ({ upNext }) => set((s) => ({ game: s.game && { ...s.game, upNext } }))),
          t.on('leaderboard', (leaderboard) => set((s) => ({ game: s.game && { ...s.game, leaderboard } }))),
        ];

        try {
          const hello = await t.hello();
          applySnapshot(hello.state, hello.myVote);
          if (hello.online) set({ online: hello.online });
        } catch {
          set({ mode: 'error' });
        }

        const loadPrices = async () => {
          try {
            const { coins, live, source } = await t.api.coins();
            set({ coins: Object.fromEntries(coins.map((c) => [c.id, { ...COINS[c.id], ...c }])), coinsLive: !!live, coinsSource: source || 'snapshot' });
          } catch { /* keep seed prices */ }
        };
        loadPrices();
        clearInterval(priceTimer);
        priceTimer = setInterval(loadPrices, 30_000); // DexScreener data refreshes every 30s
      },

      vote: async (side) => {
        const { transport, myVote, game } = get();
        if (!transport || !game || myVote || game.phase !== 'voting') return;
        set({ myVote: side }); // optimistic lock-in
        try {
          const res = await transport.vote(side);
          if (!res?.ok) {
            get().toast(res?.error || 'Vote failed', 'error');
            if (!/Already voted/.test(res?.error || '')) set({ myVote: null });
          }
        } catch {
          set({ myVote: null });
          get().toast('Network rugged your vote. Try again 🧯', 'error');
        }
      },

      suggest: async (m) => {
        const t = get().transport;
        if (!t) return { ok: false, error: 'Not connected yet' };
        try { return await t.suggest(m); } catch { return { ok: false, error: 'Server timeout 🐢' }; }
      },
    }),
    {
      name: 'wyr-meme-prefs',
      storage: safeStorage,
      partialize: (s) => ({ identity: s.identity, favoriteCoin: s.favoriteCoin, wallet: s.wallet, theme: s.theme, academy: s.academy }),
    },
  ),
);

export const api = () => useStore.getState().transport?.api;
