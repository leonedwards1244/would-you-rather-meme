// Round engine shared by the Socket.io server and the in-browser demo simulator.
// It is transport-agnostic: everything it wants to tell clients goes through `emit(event, payload)`.
import { COINS, MATCHUPS } from './coins.js';

const ADJ = ['Anonymous', 'Diamond-Handed', 'Paper-Handed', 'Degen', 'Sleepy', 'Moonbound', 'Rugproof', 'Based', 'Wen-Lambo', 'Giga', 'Smol', 'Bullish', 'Bearish', 'Ser', 'Fren'];
const ANIMALS = [['Frog', '🐸'], ['Doge', '🐕'], ['Shiba', '🐶'], ['Viking', '⚔️'], ['Ape', '🦍'], ['Whale', '🐋'], ['Hamster', '🐹'], ['Cat', '🐱'], ['Penguin', '🐧'], ['Bull', '🐂'], ['Bear', '🐻'], ['Unicorn', '🦄']];

export function randomIdentity(seed = Math.random()) {
  const a = ADJ[Math.floor(seed * 9973) % ADJ.length];
  const [n, emoji] = ANIMALS[Math.floor(seed * 7919) % ANIMALS.length];
  return { name: `${a} ${n}`, emoji };
}

export function createEngine({
  emit = () => {},
  roundMs = 60_000,
  resultsMs = 7_000,
  threshold = 1_000,
  now = () => Date.now(),
} = {}) {
  const rotation = MATCHUPS.map((m) => ({ ...m }));
  const queue = []; // user-suggested matchups wait here, played next
  let rotationIdx = 0;

  const s = {
    round: 0,
    matchup: null,
    phase: 'voting', // 'voting' | 'results'
    startedAt: 0,
    endsAt: 0,
    votes: { left: 0, right: 0 },
    voters: new Map(), // sessionId -> side (this round)
    winner: null,
    history: [], // [{round, matchupId, left, right, winner, leftVotes, rightVotes}]
    voterStats: new Map(), // sessionId -> {name, emoji, votes, calls}
    coinVotes: {}, // ticker -> votes today
    suggestions: [],
  };
  let nextAt = 0;

  function publicMatchup(m) {
    return m && { id: m.id, left: m.left, right: m.right, prompt: m.prompt, custom: !!m.custom, by: m.by };
  }

  function snapshot() {
    return {
      round: s.round,
      matchup: publicMatchup(s.matchup),
      phase: s.phase,
      startedAt: s.startedAt,
      endsAt: s.endsAt,
      serverNow: now(),
      votes: { ...s.votes },
      winner: s.winner,
      threshold,
      history: s.history.slice(-20),
      upNext: publicMatchup(peekNext()),
      leaderboard: leaderboard(),
    };
  }

  function peekNext() {
    return queue[0] || rotation[rotationIdx % rotation.length];
  }

  function leaderboard() {
    const voters = [...s.voterStats.values()]
      .sort((a, b) => b.calls - a.calls || b.votes - a.votes)
      .slice(0, 8)
      .map(({ name, emoji, votes, calls }) => ({ name, emoji, votes, calls }));
    const coins = Object.entries(s.coinVotes)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([ticker, votes]) => ({ ticker, votes }));
    return { voters, coins };
  }

  function startRound() {
    const m = queue.length ? queue.shift() : rotation[rotationIdx++ % rotation.length];
    s.round += 1;
    s.matchup = m;
    s.phase = 'voting';
    s.startedAt = now();
    s.endsAt = s.startedAt + roundMs;
    s.votes = { left: 0, right: 0 };
    s.voters = new Map();
    s.winner = null;
    emit('round:start', snapshot());
  }

  function endRound(reason) {
    if (s.phase !== 'voting') return;
    const { left, right } = s.votes;
    s.phase = 'results';
    s.winner = left === right ? 'tie' : left > right ? 'left' : 'right';
    const record = {
      round: s.round, matchupId: s.matchup.id, left: s.matchup.left, right: s.matchup.right,
      winner: s.winner, leftVotes: left, rightVotes: right, reason,
    };
    s.history.push(record);
    // reward voters who sided with the crowd
    for (const [sid, side] of s.voters) {
      const st = s.voterStats.get(sid);
      if (st && side === s.winner) st.calls += 1;
    }
    nextAt = now() + resultsMs;
    emit('round:end', { ...record, history: s.history.slice(-20), leaderboard: leaderboard(), nextAt });
  }

  /** returns {ok:true, tally} | {ok:false, error} */
  function vote(sessionId, side, identity = randomIdentity()) {
    if (!sessionId) return { ok: false, error: 'No session' };
    if (side !== 'left' && side !== 'right') return { ok: false, error: 'Pick a side, ser' };
    if (s.phase !== 'voting') return { ok: false, error: 'Round is over — next one loading 🔄' };
    if (s.voters.has(sessionId)) return { ok: false, error: 'Already voted this round. No double-dipping! 🥄' };

    s.voters.set(sessionId, side);
    s.votes[side] += 1;
    const ticker = s.matchup[side];
    s.coinVotes[ticker] = (s.coinVotes[ticker] || 0) + 1;
    const st = s.voterStats.get(sessionId) || { name: identity.name, emoji: identity.emoji, votes: 0, calls: 0 };
    st.votes += 1;
    s.voterStats.set(sessionId, st);

    const tally = { round: s.round, votes: { ...s.votes } };
    emit('tally', tally);
    emit('feed', {
      id: `${s.round}-${sessionId}-${now()}`,
      name: identity.name, emoji: identity.emoji, side, ticker, at: now(),
    });
    if (s.votes.left + s.votes.right >= threshold) endRound('threshold');
    return { ok: true, tally };
  }

  function suggest({ left, right, prompt, by = 'Anonymous' }) {
    left = String(left || '').toUpperCase();
    right = String(right || '').toUpperCase();
    if (!COINS[left] || !COINS[right]) return { ok: false, error: 'Unknown coin — rug pulled before launch 😭' };
    if (left === right) return { ok: false, error: 'A coin can’t fight itself (yet).' };
    if (queue.length >= 5) return { ok: false, error: 'Matchup queue is full — try again in a few rounds.' };
    const clean = String(prompt || '').slice(0, 160).trim() || `Would you rather hold ${left} or ${right}?`;
    const m = { id: `custom-${left.toLowerCase()}-vs-${right.toLowerCase()}-${now()}`, left, right, prompt: clean, custom: true, by: String(by).slice(0, 40) };
    queue.push(m);
    s.suggestions.push(m);
    emit('queue', { upNext: publicMatchup(peekNext()), queued: queue.length });
    return { ok: true, matchup: publicMatchup(m), position: queue.length };
  }

  function tick() {
    const t = now();
    if (s.round === 0) return startRound();
    if (s.phase === 'voting' && t >= s.endsAt) endRound('timer');
    else if (s.phase === 'results' && t >= nextAt) startRound();
  }

  function hasVoted(sessionId) {
    return s.voters.get(sessionId) || null;
  }

  return { tick, vote, suggest, snapshot, hasVoted, leaderboard, get state() { return s; } };
}

/**
 * Simulated crowd. Bots vote with a per-round bias so results are not a coin flip.
 * Used by the browser demo and optionally by the server (SIM_BOTS=true).
 */
export function attachBots(engine, { votesPerSecond = 6, onPresence } = {}) {
  let bias = 0.5;
  let lastRound = -1;
  let online = 1100 + Math.floor(Math.random() * 400);
  const iv = setInterval(() => {
    const st = engine.state;
    if (st.round !== lastRound) {
      lastRound = st.round;
      bias = 0.3 + Math.random() * 0.4;
    }
    if (st.phase === 'voting') {
      const n = Math.max(0, Math.round(votesPerSecond * (0.4 + Math.random() * 1.2)));
      for (let i = 0; i < n; i++) {
        const id = `bot-${Math.random().toString(36).slice(2)}`;
        engine.vote(id, Math.random() < bias ? 'left' : 'right', randomIdentity(Math.random()));
      }
    }
    online = Math.max(400, Math.round(online + (Math.random() - 0.5) * 40));
    onPresence?.(online);
  }, 1000);
  return () => clearInterval(iv);
}
