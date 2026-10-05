# 🪙 Would You Rather: Meme Edition

A real-time multiplayer "Would You Rather" game for memecoins: old school vs new wave, 60-second rounds, live vote bars, a shared winner celebration, a five-tab coin comparison, a news feed, a Reddit-style forum and the Meme Academy.

**Stack:** React 18 · Vite · Tailwind CSS · Framer Motion · Zustand · Recharts · Socket.io · Express · (optional) Supabase · canvas-confetti

```
wyr-meme/
├─ shared/          # code used by BOTH server and browser
│  ├─ engine.js     # round engine: timer/threshold, votes, dedupe, history, leaderboard, custom matchups
│  ├─ coins.js      # coin catalogue, 6 matchups, sentiment labels
│  ├─ board.js      # news + forum logic (hot/new/top, threaded comments, toggle votes, sanitizer)
│  ├─ dexscreener.js# DexScreener client: live price, mcap, liquidity, volume, txns, logos
│  ├─ seed.js       # sample news + forum threads
│  └─ history.js    # deterministic fallback price history
├─ server/          # Express + Socket.io
│  ├─ index.js      # sockets, REST API, rate limits, SEO share pages, static hosting
│  ├─ market.js     # /api/coins: DexScreener → CoinGecko → bundled snapshot (30s cache)
│  ├─ coingecko.js  # 7/30/90-day price history (DexScreener has no history API)
│  ├─ news.js       # optional RSS ingestion, auto-tags coin + #bullish/#bearish/#rug/#moon
│  └─ persistence.js# JSON file store + optional Supabase inserts
├─ client/          # React app
│  └─ src/
│     ├─ realtime/transport.js  # LIVE (socket.io) or DEMO (engine in the browser) behind one API
│     ├─ store/useStore.js      # Zustand store (game state, prefs, academy progress)
│     ├─ components/game/       # arena, timer, OR divider, celebration, feed, leaderboard, creator
│     ├─ components/compare/    # 5-tab comparison panel
│     └─ pages/                 # Game, Compare, Matchup (/m/:id), News, Forum, Thread, Academy, Lesson
└─ supabase/schema.sql
```

## Deploy with real multiplayer (Render, free)

`render.yaml` already has all the settings, so:

1. Push this folder to a GitHub repository.
2. On [render.com](https://render.com), choose **New → Blueprint**, pick the repo, then click **Deploy Blueprint**.
3. When the build finishes (a few minutes), the game is live at `https://would-you-rather-meme.onrender.com`. If that name is taken, Render adds a suffix.

What the Blueprint sets up: one free Node web service in Frankfurt that runs the Socket.io game server and serves the website. It runs `npm run install:all && npm run build` to build and `npm start` to run, and Render checks `/api/health` to confirm it's up. It uses Node 20 and `SIM_BOTS=false`, so only real players are counted. Every push to GitHub redeploys it.

Things to know about the free plan:
- The service sleeps after 15 minutes with no visitors, and the next visitor waits about a minute while it wakes. To keep it always on, change `plan: free` to `plan: 0.5c-512mb` (about $7/month).
- Forum posts and votes are stored on the server's disk, which is wiped whenever it restarts (including after every sleep). To keep them, add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` under Environment in the Render dashboard; the database setup file is `supabase/schema.sql`.
- Optional settings, also added under Environment: `COINGECKO_KEY` for real price history, and `NEWS_RSS_URLS` for real headlines.

## Run it

```bash
npm run install:all
npm run build          # build the client
npm start              # http://localhost:4000 — server hosts the app + realtime
```

Development with hot reload (two terminals):

```bash
npm run dev:server     # :4000
npm run dev:client     # :5173, proxies /api and /socket.io to :4000
```

Open two browser windows to see votes, the live feed and the round-end celebration sync between them.

**Demo build:** `npm run build:demo` produces one self-contained `client/dist-single/index.html` that runs the same round engine in the browser with a simulated crowd. The client also falls back to this mode on its own if it can't reach a server, and shows a "Demo · simulated crowd" badge when it does.

## Market data & token logos (DexScreener)

Live market data comes from the free, keyless [DexScreener API](https://docs.dexscreener.com/api/reference):
`GET https://api.dexscreener.com/latest/dex/tokens/{addresses}`, cached for 30 s. That endpoint returns at most 30 pairs per call *in total*, so a popular token with many pairs can push others out of a large batch. The app therefore asks for 3 addresses per call (9 calls for 26 coins) and re-asks individually for any token that comes back missing.
For each coin the **most liquid pair where it is the base token** is used. The app shows its price, 5m/1h/6h/24h change,
market cap, liquidity, 24h volume, buys/sells and a link to the pair on DexScreener.

| Coin | Chain | Contract |
|---|---|---|
| DOGE | BNB Chain (Binance-Peg DOGE) | `0xbA2aE424d960c26247Dd6c32edC70B295c744C43` |
| SHIB | Ethereum | `0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE` |
| PEPE | Ethereum | `0x6982508145454Ce325dDbE47a25d4ec3d2311933` |
| WIF | Solana | `EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm` |
| FLOKI | Ethereum | `0xcf0C122c6b73ff809C693DB761e7BaeBe62b6a2E` |
| BONK | Solana | `DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263` |
| BRETT | Base | `0x532f27101965dd16442E59d40670FaF5eBB142E4` |
| SAI (Sigma AI)\* | Solana | `6APnaLJaNtmXzqjfp8anVTYyG7ZVfuHaX5h3yR94pump` |
| AICOIN (AI Coins)\* | Solana | `EdsFuTw5W18iLpXdrbBS336iacLVd3fCEoDfoutFMbG7` |
| TEK (Tek Coins)\* | Solana | `GWeGoN9sYmZPUjLMS316HF8eppxVzr36Rp8Hmnwhpump` |
| CHILLGUY | Solana | `Df6yfrKC8kZE3KNkrHERKzAetSxbrWeniQfyJY4Jpump` |
| PNUT | Solana | `2qEHjDLDLbuBgRYvsxhc5D6uDWAivNFZGan56P1tpump` |
| NEET | Solana | `Ce2gx9KGXJ6C9Mp5b5x1sn9Mg87JwEbrQby4Zqo3pump` |
| KET | Solana | `9Pfync3ejPC9eHqVzq3nYQJAhyhjqpnB9UsaSfLxpump` |
| CATE | Solana | `Ai66LHZG9MCzg1WKdawwqduVAXpNDUuV8M3uyq5ppump` |
| PENGU | Solana | `2zMMhcVQEXDtdE6vsFS7S7D5oUodfJHE8vd1gnBouauv` |
| ANSEM | Solana | `9cRCn9rGT8V2imeM2BaKs13yhMEais3ruM3rPvTGpump` |
| USELESS | Solana | `Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk` |
| TROLL | Solana | `5UUH9RTDiSpq6HKS6bp4NdU9PNJpXRXuiw6ShBTBhgH2` |
| TOSHI | Base | `0xAC1Bd2486aAf3B5C0fc3Fd868558b082a531B2B4` |
| 4 (FOUR) | BNB Chain | `0x0A43fC31a73013089DF59194872Ecae4cAe14444` |
| POPCAT | Solana | `7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr` |
| GOAT | Solana | `CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump` |
| RETARDIO | Solana | `6ogzHhzdrQr9Pgv6hZ2MNze7UrzBMAFyBBWUYp1Fhitx` |
| WOJAK | Solana | `8J69rbLTzWWgUJziFY8jeu5tDwEPBwUz4pKBMr5rpump` |
| USDUC | Solana | `CB9dDufT3ZuQXqqSfa1c5kY935TEreyBw9XJXxHKpump` |

\* **Closest match only.** No token called exactly "Sigma AI", "AI Coins" or "Tek Coins" exists on DexScreener. These are the nearest-named tokens. All three are micro-caps with very thin liquidity, and the app shows a warning on them. **DUNA** isn't included because nothing matching it exists on DexScreener. When you have the contract addresses you meant, replace the `dex.address` values. Tokens with several look-alikes (CATE, WOJAK, ANSEM, KET) use the active Solana contract with a DexScreener profile.

Tokens added on 2026-10-05 don't have curated follower counts, holder splits or virality indexes. Instead, the Community tab shows their official links from DexScreener, the holder chart says the data isn't available, and the Virality Score is estimated from 24h trades, volume ÷ market cap, and age.

- **DOGE has no native DEX market.** Its price comes from Binance-Peg DOGE, and its market cap is calculated as price × DOGE's circulating supply. The DEX figure would only count the bridged supply.
- **Where the data comes from:** with the server running, the server makes the requests. Without a server, the browser calls DexScreener directly. If neither can reach it (for example in a sandboxed preview), the app shows the bundled **DexScreener snapshot from 4 Oct 2026** (`dex.snapshot` in `shared/coins.js`) and labels it as a snapshot.
- **Logos** are bundled in `client/src/assets/tokens/` as 112 px WebP files, so they load instantly and also work offline. PEPE, WIF, FLOKI, BONK, BRETT and all 19 tokens added on 2026-10-05 come from their DexScreener token profiles (`info.imageUrl`). DOGE and SHIB have no DexScreener profile image, so their logos come from Trust Wallet's open `assets` repo. If a bundled logo is missing, the live `info.imageUrl` from DexScreener is used, then an emoji.
- **Price history:** DexScreener has no public historical endpoint. The 7/30/90 D charts use CoinGecko through the server. When CoinGecko isn't available, the chart shows an illustrative series anchored on the live price, labelled "illustrative history".
- **Concept coins:** Doge 2.0 and SHIB (Burn Edition) aren't traded anywhere. They reuse the parent coin's logo with a "2.0" or 🔥 badge.

## How the multiplayer works

| Event (server → all clients) | When |
|---|---|
| `round:start` | new matchup, with the full snapshot and server time (clients correct for clock skew) |
| `tally` | after every accepted vote |
| `feed` | "🐸 Anonymous Frog just voted PEPE" |
| `round:end` | at 60 s or when the vote threshold is hit; includes the winner, history and leaderboard, so everyone celebrates at the same moment |
| `presence` | online count every 3 s |
| `queue` | a custom matchup was added to the queue |

Clients send `hello` (session id + anon identity), `vote {side}` and `suggest {left,right,prompt}`, each with an ack.

**Double voting is blocked** by the session id (or the demo wallet address if one is connected), one vote per round. There's also a per-IP cap of 5 votes per round to make session spoofing harder, a token-bucket rate limit, and a `unique(session_id, round)` constraint in the Supabase schema.

## Configuration

See `.env.example`. Notes:

- **`SIM_BOTS`** defaults to `true` so a fresh deploy doesn't feel empty. **Set it to `false` in production**, otherwise the online count and votes include simulated players.
- **Prices:** DexScreener needs no key. `DEX_CACHE_MS` sets the cache time (default 30000). CoinGecko is only used for price history and as a backup price source; add `COINGECKO_KEY` for a free demo key.
- **News:** set `NEWS_RSS_URLS` for real headlines. Until then the feed shows clearly labelled sample items from fictional outlets.
- **Supabase:** run `supabase/schema.sql`, then set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. Votes, rounds, posts and submissions are written there. Forum and news state is always persisted to `server/data/board.json`.

## Feature checklist

- Split-screen arena: the side you hover grows while the other dims. After you vote, each side's width follows its vote share. There's a neon OR divider, click ripples, and swipe-to-vote on mobile (panels stack vertically).
- Each coin card shows its real logo plus its DexScreener price, 24h change, market cap, era badge and tagline. After you vote you see animated percentages, fill bars, a sentiment label and the live total.
- Round system: 60 s or the vote cap, a countdown ring (it pulses in the last 10 s), a winner card with confetti, auto-advance, an "up next" preview and round history.
- Six preset matchups plus a custom matchup creator, which queues battles for everyone.
- Leaderboard sidebar: most-voted coins today, and top voters ranked by correct calls.
- Compare tabs: Price History (7/30/90 D), Community, Tokenomics with holder pie charts, Meme Virality Score (radar chart; the formula is shown on the tab) and Fun Facts.
- News: filter by coin, #tags, cards with thumbnail/source/time, up/down votes.
- Forum: 5 categories, Hot/New/Top sorting, search, rich text (bold, italic, underline, lists, links), image/GIF upload, threaded replies, votes, favorite-coin flair.
- Meme Academy: 10 lessons with quizzes, a progress tracker with ranks, and a searchable glossary.
- Sticky navbar with a coin-flip logo, live online counter, demo wallet connect, dark/light toggle and price ticker. Floating coin background.
- Page transitions, loading skeletons, meme-themed error and 404 states, and reduced-motion support.
- SEO: meta tags per route. `/m/:id` is rendered on the server with matchup-specific Open Graph and Twitter tags so share links get proper previews. The share-to-X button pre-fills the tweet text.

## Notes and disclaimers

- Entertainment only, not financial advice.
- "Doge 2.0" and "SHIB (Burn Edition)" are hypothetical concept coins with made-up data, and they are labelled that way in the app.
- Community follower counts are rounded approximations.
- Coin mascots are emoji, not official logos.
