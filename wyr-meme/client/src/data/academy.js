// Meme Academy: short, beginner-friendly lessons, each followed by a 3-question quiz.
// `answer` is the index of the correct option.
export const LESSONS = [
  {
    id: 'what-is-memecoin', emoji: '🐸', title: 'What is a memecoin?', minutes: 3, level: 'Beginner',
    body: [
      'A memecoin is a cryptocurrency whose main “product” is a joke, a mascot or an internet culture moment. DOGE started in 2013 as a parody of crypto hype; it became the template for everything that followed.',
      'Most memecoins have little or no built-in utility. Their value comes almost entirely from attention: how many people know the meme, talk about it and want to hold it.',
      'That makes them extremely volatile. Prices can double in a day — and fall 90% in a week. For every DOGE there are thousands of tokens that quietly went to zero.',
    ],
    quiz: [
      { q: 'What mostly drives a memecoin’s price?', options: ['Company profits', 'Attention and community', 'Government backing', 'Gold reserves'], answer: 1 },
      { q: 'Which coin is widely considered the first memecoin?', options: ['PEPE', 'BONK', 'DOGE', 'WIF'], answer: 2 },
      { q: 'What’s a healthy rule for memecoin money?', options: ['Borrow to buy more', 'Only use money you can afford to lose', 'Put your savings in', 'Copy whatever trends'], answer: 1 },
    ],
  },
  {
    id: 'rug-pulls', emoji: '🧶', title: 'How to spot a rug pull', minutes: 4, level: 'Beginner',
    body: [
      'A “rug pull” is when the creators of a token drain its liquidity or dump their huge supply on buyers, leaving holders with a worthless coin.',
      'Red flags: a few wallets hold most of the supply; liquidity isn’t locked; the contract still lets the deployer mint new tokens or block selling; anonymous devs plus wild promises; a copycat name of a popular coin.',
      'Always verify the contract address from official channels. If you can buy but can’t sell (a “honeypot”), it’s already too late.',
    ],
    quiz: [
      { q: 'Top 10 wallets hold 75% of supply. This is…', options: ['A green flag', 'A red flag', 'Irrelevant', 'Required by law'], answer: 1 },
      { q: 'A token you can buy but not sell is called a…', options: ['Honeypot', 'Moonshot', 'Stablecoin', 'Airdrop'], answer: 0 },
      { q: 'Where should you get a contract address?', options: ['A random reply on X', 'Official project channels', 'A DM from a stranger', 'Any search result'], answer: 1 },
    ],
  },
  {
    id: 'tokenomics', emoji: '🪙', title: 'Understanding tokenomics', minutes: 4, level: 'Beginner',
    body: [
      'Tokenomics describes how a token’s supply works: how many exist, how many can ever exist, who holds them, and whether new ones are created or old ones burned.',
      'Price × circulating supply = market cap. A coin at $0.00001 is not “cheap” if there are 400 trillion of them — the market cap is what tells you its size.',
      'Inflationary coins (like DOGE) add new supply over time. Fixed-supply coins (like PEPE) never mint more. Neither is automatically better.',
    ],
    quiz: [
      { q: 'Market cap equals…', options: ['Price × circulating supply', 'Price ÷ holders', 'Volume × 24', 'Max supply ÷ price'], answer: 0 },
      { q: 'A very low price per token means the coin is…', options: ['Definitely undervalued', 'Not necessarily cheap', 'About to moon', 'Risk-free'], answer: 1 },
      { q: 'DOGE’s supply is…', options: ['Fixed at 21M', 'Inflationary, no max', 'Burned to zero yearly', '420.69T'], answer: 1 },
    ],
  },
  {
    id: 'burns', emoji: '🔥', title: 'Token burns: hype vs. reality', minutes: 3, level: 'Intermediate',
    body: [
      'Burning means sending tokens to an address nobody controls, removing them from circulation forever.',
      'Burns reduce supply, but price depends on demand too. If market cap stays the same, a 10% burn only raises the price by about 11% — and only if nobody sells.',
      'Big burn announcements are often marketing. Look at the actual percentage of supply burned, not the headline number of tokens.',
    ],
    quiz: [
      { q: 'Burned tokens are…', options: ['Locked for a year', 'Gone permanently', 'Given to devs', 'Staked'], answer: 1 },
      { q: '“1 billion SHIB burned!” out of ~589 trillion is about…', options: ['17%', '1.7%', '0.0002%', '50%'], answer: 2 },
      { q: 'Burns guarantee a higher price.', options: ['True', 'False'], answer: 1 },
    ],
  },
  {
    id: 'wallets', emoji: '👛', title: 'Wallets & seed phrases', minutes: 3, level: 'Beginner',
    body: [
      'A self-custody wallet (MetaMask, Phantom…) holds the keys to your coins. The 12–24 word seed phrase IS your money.',
      'Never type your seed phrase into a website, never share it with “support”, never store it in a screenshot. Nobody legit will ever ask for it.',
      'Use a separate “burner” wallet for experimental tokens so a bad approval can’t drain your main stash.',
    ],
    quiz: [
      { q: 'Someone from “support” asks for your seed phrase. You…', options: ['Send it quickly', 'Refuse — it’s a scam', 'Send half of it', 'Post it publicly'], answer: 1 },
      { q: 'A burner wallet is for…', options: ['Isolating risky activity', 'Burning tokens', 'Mining', 'Taxes'], answer: 0 },
      { q: 'Your seed phrase should be stored…', options: ['In a screenshot', 'Offline, privately', 'In a group chat', 'In your bio'], answer: 1 },
    ],
  },
  {
    id: 'liquidity', emoji: '💧', title: 'Liquidity & slippage', minutes: 3, level: 'Intermediate',
    body: [
      'Liquidity is how much money sits in a trading pool. Low liquidity means even small trades move the price a lot.',
      'Slippage is the difference between the price you expect and the price you get. High slippage settings on tiny-liquidity tokens are how people get sandwiched by bots.',
      'Locked liquidity (via a time-lock contract) means the creators can’t simply pull it — a basic safety check.',
    ],
    quiz: [
      { q: 'Low liquidity causes…', options: ['Stable prices', 'Big price moves on small trades', 'Free tokens', 'Faster blocks'], answer: 1 },
      { q: 'Locked liquidity helps protect against…', options: ['Rug pulls', 'Taxes', 'Gas fees', 'Airdrops'], answer: 0 },
      { q: 'Slippage is…', options: ['A bug', 'Expected vs actual price difference', 'A token name', 'A wallet type'], answer: 1 },
    ],
  },
  {
    id: 'hype-cycles', emoji: '🎢', title: 'Hype cycles & FOMO', minutes: 3, level: 'Beginner',
    body: [
      'Memecoins move in waves: discovery, viral run, euphoria (“this time it’s different”), crash, and a long quiet period.',
      'FOMO — fear of missing out — makes people buy after the biggest moves, often near the top. The loudest timeline moment is rarely the best entry.',
      'Write your plan before you buy: how much, and when you’ll take profit or cut losses.',
    ],
    quiz: [
      { q: 'FOMO stands for…', options: ['Fear of missing out', 'Funds on my order', 'Future of money online', 'First on market only'], answer: 0 },
      { q: 'When is the timeline usually loudest?', options: ['At the bottom', 'Near the top', 'Never', 'Before launch'], answer: 1 },
      { q: 'A good habit is to…', options: ['Decide exits in advance', 'Never sell', 'Follow every tip', 'Max leverage'], answer: 0 },
    ],
  },
  {
    id: 'chains', emoji: '⛓️', title: 'Chains: Ethereum, Solana, Base', minutes: 3, level: 'Beginner',
    body: [
      'Memecoins live on blockchains. ETH memes (PEPE, SHIB) have deep liquidity but higher fees. Solana memes (BONK, WIF) are fast and cheap, so launches are frantic.',
      'Base, built by Coinbase, became a meme hub in 2024 with tokens like BRETT.',
      'Same name on a different chain is often a different token entirely. Always check which chain a contract lives on.',
    ],
    quiz: [
      { q: 'BONK and WIF live mainly on…', options: ['Bitcoin', 'Solana', 'Base', 'Dogecoin'], answer: 1 },
      { q: 'BRETT is the flagship meme on…', options: ['Base', 'Tron', 'Cardano', 'Polygon'], answer: 0 },
      { q: 'Same ticker on a different chain is…', options: ['Always the same token', 'Often a different token', 'Illegal', 'A stablecoin'], answer: 1 },
    ],
  },
  {
    id: 'reading-charts', emoji: '📈', title: 'Reading a price chart', minutes: 4, level: 'Intermediate',
    body: [
      'Look at percentage change over a timeframe rather than raw price — that’s how you compare a $0.20 coin with a $0.00001 coin.',
      'Volume matters: a pump on tiny volume can disappear just as fast. Big, sustained volume suggests real interest.',
      'Charts show the past, not the future. Patterns are probabilities at best, and memes break patterns all the time.',
    ],
    quiz: [
      { q: 'To compare coins with very different prices, use…', options: ['Raw price', '% change', 'Ticker length', 'Logo color'], answer: 1 },
      { q: 'A pump on tiny volume is…', options: ['Very reliable', 'Fragile', 'Guaranteed', 'Impossible'], answer: 1 },
      { q: 'Charts predict the future with certainty.', options: ['True', 'False'], answer: 1 },
    ],
  },
  {
    id: 'staying-safe', emoji: '🛡️', title: 'Staying safe (and sane)', minutes: 3, level: 'Beginner',
    body: [
      'Turn on 2FA everywhere, bookmark exchange URLs, and ignore DMs offering “guaranteed returns”.',
      'Track your trades for taxes — many countries treat every swap as a taxable event.',
      'It’s a game until it isn’t. Take breaks, don’t chase losses, and remember that the best memes are free to enjoy without buying anything.',
    ],
    quiz: [
      { q: '“Guaranteed 10x” in your DMs is…', options: ['A great deal', 'A scam', 'Financial advice', 'An airdrop'], answer: 1 },
      { q: 'In many countries swaps can be…', options: ['Taxable events', 'Tax-free always', 'Illegal', 'Invisible'], answer: 0 },
      { q: 'After a big loss you should…', options: ['Double down', 'Take a break', 'Borrow more', 'Revenge trade'], answer: 1 },
    ],
  },
];

export const GLOSSARY = [
  ['Airdrop', 'Free tokens sent to wallets, often to bootstrap a community (BONK airdropped 50% of supply).'],
  ['Ape (in)', 'To buy quickly and heavily, usually without much research.'],
  ['ATH', 'All-time high — the highest price a coin has ever reached.'],
  ['Bag', 'Your holdings of a coin. “Bagholder” = stuck holding after a crash.'],
  ['Bullish / Bearish', 'Expecting price to go up / down.'],
  ['Burn', 'Permanently destroying tokens by sending them to an unusable address.'],
  ['CA', 'Contract address — the unique on-chain ID of a token.'],
  ['DEX', 'Decentralized exchange, e.g. Uniswap or Raydium.'],
  ['DYOR', 'Do your own research.'],
  ['FDV', 'Fully diluted valuation — price × max supply.'],
  ['FOMO / FUD', 'Fear of missing out / fear, uncertainty and doubt.'],
  ['Gas', 'Transaction fee paid to the network.'],
  ['gm / wagmi / ngmi', 'Good morning / we’re all gonna make it / not gonna make it.'],
  ['HODL', 'Hold on for dear life — a typo that became a philosophy.'],
  ['Honeypot', 'A token you can buy but can’t sell.'],
  ['Jeet', 'Someone who sells at the first sign of profit (or fear).'],
  ['Liquidity', 'Funds in a trading pool that let people buy and sell.'],
  ['Market cap', 'Price × circulating supply.'],
  ['Moon', 'A huge price increase. “Wen moon?”'],
  ['Paper / Diamond hands', 'Sells easily / refuses to sell no matter what.'],
  ['Rug pull', 'Creators drain liquidity or dump supply, leaving holders with nothing.'],
  ['Seed phrase', '12–24 words that control your wallet. Never share it.'],
  ['Ser', 'Meme spelling of “sir”. Used politely and sarcastically.'],
  ['Slippage', 'Difference between expected and executed trade price.'],
  ['Whale', 'A wallet holding a very large amount of a token.'],
];
