// Sample content so the app is never empty. Outlets and handles below are FICTIONAL —
// the server can replace news with real RSS headlines (see server/news.js).
const H = 3600_000;

export function seedNews(now = Date.now()) {
  return [
    { id: 'n1', kind: 'article', coin: 'PEPE', tags: ['bullish', 'meme'], source: 'Meme Wire (sample)', at: now - 0.4 * H, headline: 'Frog season? PEPE social mentions spike as traders rotate into ETH memes', summary: 'On-chain trackers show a wave of new wallets picking up PEPE over the weekend while the timeline floods with frog art.' },
    { id: 'n2', kind: 'tweet', coin: 'DOGE', tags: ['meme', 'moon'], source: '@much_wow_daily', at: now - 1.1 * H, headline: 'gm to everyone except people who sold their DOGE in 2014 🐕🚀', summary: '' },
    { id: 'n3', kind: 'article', coin: 'SHIB', tags: ['bullish'], source: 'Degen Daily (sample)', at: now - 2 * H, headline: 'ShibArmy rallies behind new burn portal milestone', summary: 'Community dashboards show a fresh burn milestone. Reminder: burns only matter if demand shows up too.' },
    { id: 'n4', kind: 'article', coin: 'WIF', tags: ['bearish'], source: 'Solana Trench Report (sample)', at: now - 3.4 * H, headline: 'WIF cools off after a hot week — is the hat slipping?', summary: 'Funding rates normalise as leveraged longs get flushed. Holders insist the hat stays on.' },
    { id: 'n5', kind: 'tweet', coin: 'BONK', tags: ['meme'], source: '@bonk_enjoyer', at: now - 4.2 * H, headline: 'every time someone says “utility” a BONK holder gets their wings 🏏', summary: '' },
    { id: 'n6', kind: 'article', coin: 'FLOKI', tags: ['bullish'], source: 'Viking Ledger (sample)', at: now - 6 * H, headline: 'FLOKI pushes new game update to Valhalla testnet', summary: 'The team ships another build of its metaverse game; community reactions are mixed but loud.' },
    { id: 'n7', kind: 'article', coin: 'BRETT', tags: ['bearish', 'rug'], source: 'Base Camp News (sample)', at: now - 7.5 * H, headline: 'Copycat “BRETT 2” token drained within an hour — check your contract addresses', summary: 'A look-alike token rugged early buyers. Always verify the official contract before aping.' },
    { id: 'n8', kind: 'tweet', coin: 'PEPE', tags: ['moon', 'meme'], source: '@feelsgoodman_fi', at: now - 9 * H, headline: 'pepe chart looking like the frog is doing a kickflip rn 🐸🛹', summary: '' },
    { id: 'n9', kind: 'article', coin: 'DOGE', tags: ['bullish'], source: 'Meme Wire (sample)', at: now - 12 * H, headline: 'Dogecoin turns another year older — still the most recognised meme on the block', summary: 'The OG memecoin keeps its spot near the top of the memecoin market-cap table.' },
    { id: 'n10', kind: 'article', coin: 'BONK', tags: ['bullish', 'moon'], source: 'Solana Trench Report (sample)', at: now - 16 * H, headline: 'BONK integrations top a new milestone across Solana dApps', summary: 'From trading bots to NFT marketplaces, BONK keeps showing up everywhere on Solana.' },
    { id: 'n11', kind: 'article', coin: 'SHIB', tags: ['bearish'], source: 'Degen Daily (sample)', at: now - 22 * H, headline: 'Whale wallet moves trillions of SHIB to an exchange', summary: 'Large transfers often spark sell-off fears; sometimes it is just a wallet reshuffle.' },
    { id: 'n12', kind: 'tweet', coin: 'WIF', tags: ['meme'], source: '@hat_stays_on', at: now - 27 * H, headline: 'the hat stays on. the hat has always stayed on. 🧢', summary: '' },
  ].map((n) => ({ ...n, score: Math.floor(Math.random() * 120) + 5 }));
}

export function seedForum(now = Date.now()) {
  const c = (id, author, flair, body, hoursAgo, score, replies = []) => ({ id, author, flair, body, at: now - hoursAgo * H, score, replies });
  return [
    {
      id: 'p1', category: 'Predictions', title: 'Calling it now: DOGE wins every DOGE vs PEPE round this week', author: 'Diamond-Handed Doge', flair: 'DOGE', at: now - 2 * H, score: 42,
      body: '<p>Nostalgia is undefeated. The OG has <b>brand recognition</b> PEPE can only dream of. Fight me in the comments 🐕</p>',
      comments: [
        c('c1', 'Based Frog', 'PEPE', 'Ser the frog has been printing all week. Check the round history 🐸', 1.5, 12, [
          c('c2', 'Diamond-Handed Doge', 'DOGE', 'Round history is just recency bias wearing a hat.', 1.2, 7),
        ]),
        c('c3', 'Sleepy Penguin', 'BONK', 'Meanwhile BONK holders are just vibing.', 0.8, 3),
      ],
    },
    {
      id: 'p2', category: 'Coin Analysis', title: 'Holder concentration: why top-10 wallet % matters more than price', author: 'Rugproof Whale', flair: 'FLOKI', at: now - 6 * H, score: 87,
      body: '<p>Quick thread. Look at the <b>Tokenomics</b> tab on any matchup. If 10 wallets hold 60%+ of supply, a few people can move the chart whenever they want.</p><ul><li>Check the deployer wallet</li><li>Check LP lock</li><li>Check if mint authority is revoked</li></ul>',
      comments: [c('c4', 'Smol Hamster', 'WIF', 'This should be pinned in Newcomers tbh', 5, 21)],
    },
    {
      id: 'p3', category: 'Meme Drops', title: 'I made the WIF hat but for every coin', author: 'Giga Cat', flair: 'WIF', at: now - 10 * H, score: 133,
      body: '<p>🧢🐕 🧢🐸 🧢🐶 🧢⚔️ 🧢🏏 🧢🔵 — the hat is universal. The hat is eternal.</p>', comments: [],
    },
    {
      id: 'p4', category: 'Newcomers', title: 'First time here — what is a memecoin actually worth?', author: 'Fren Unicorn', flair: 'DOGE', at: now - 20 * H, score: 19,
      body: '<p>Saw my cousin talk about PEPE at dinner. Is there anything behind these coins or is it all vibes?</p>',
      comments: [c('c5', 'Ser Bear', 'SHIB', 'Mostly vibes + attention. Start with Meme Academy lesson 1, and never invest more than you can lose.', 19, 15)],
    },
    {
      id: 'p5', category: 'General', title: 'Rate my portfolio: 50% BONK, 50% hopes and dreams', author: 'Degen Ape', flair: 'BONK', at: now - 30 * H, score: 64,
      body: '<p>That’s it. That’s the post. 🏏</p>', comments: [],
    },
  ];
}
