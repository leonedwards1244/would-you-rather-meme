import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore.js';
import GameArena from '../components/game/GameArena.jsx';
import { LiveFeed, Leaderboard, RoundHistory, MatchupCreator } from '../components/game/Sidebar.jsx';
import ComparePanel from '../components/compare/ComparePanel.jsx';
import { SectionTitle } from '../components/ui/Primitives.jsx';
import { OnlineBadge } from '../components/layout/Navbar.jsx';
import { useSeo } from '../lib/seo.js';

function Hero() {
  const words = ['Old school', 'or', 'new wave?'];
  return (
    <section className="text-center pt-6 pb-6 md:pt-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="inline-flex mb-3"><OnlineBadge className="text-sm py-1" /></motion.div>
      <h1 className="heading text-4xl sm:text-6xl md:text-7xl">
        {words.map((w, i) => (
          <motion.span key={w} className={`inline-block mr-3 ${i === 0 ? 'neon-text-pink' : i === 2 ? 'neon-text-cyan' : ''}`}
            initial={{ y: 40, opacity: 0, rotate: -4 }} animate={{ y: 0, opacity: 1, rotate: 0 }} transition={{ delay: 0.15 * i, type: 'spring', stiffness: 160 }}>
            {w}
          </motion.span>
        ))}
        <motion.span className="block neon-text-green" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.55, type: 'spring' }}>You decide.</motion.span>
      </h1>
      <p className="text-muted mt-3 max-w-xl mx-auto text-sm md:text-base">Live 60-second rounds. Pick a side, watch the crowd swing in real time, and see who the internet really believes in.</p>
    </section>
  );
}

export default function GamePage() {
  const matchup = useStore((s) => s.game?.matchup);
  useSeo({ title: 'Play', description: 'Vote live: old-school memecoins vs the new wave. 60-second rounds, real-time results.' });
  return (
    <div className="mx-auto max-w-7xl px-4">
      <Hero />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0"><GameArena /></div>
        <aside className="grid gap-4 content-start" aria-label="Leaderboard and live feed">
          <Leaderboard />
          <LiveFeed />
        </aside>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px] mt-6 items-start">
        <div className="min-w-0"><RoundHistory /></div>
        <MatchupCreator />
      </div>
      {matchup && (
        <section className="mt-16">
          <SectionTitle kicker="Deep dive" title={`${matchup.left} vs ${matchup.right}, by the numbers`}>
            The live matchup, compared five ways. Want to pit any two coins? <Link to="/compare" className="text-cyan underline">Open the comparison tool</Link>.
          </SectionTitle>
          <ComparePanel left={matchup.left} right={matchup.right} />
        </section>
      )}
    </div>
  );
}
