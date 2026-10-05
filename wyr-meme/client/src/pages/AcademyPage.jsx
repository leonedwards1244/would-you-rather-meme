import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LESSONS, GLOSSARY } from '../data/academy.js';
import { useStore } from '../store/useStore.js';
import { SectionTitle } from '../components/ui/Primitives.jsx';
import { cx } from '../lib/format.js';
import { useSeo } from '../lib/seo.js';

export function ProgressTracker() {
  const done = useStore((s) => s.academy.completed.length);
  const pct = (done / LESSONS.length) * 100;
  const rank = done === LESSONS.length ? '🎓 Meme Professor' : done >= 7 ? '🧠 Big Brain' : done >= 4 ? '📚 Degen Scholar' : done >= 1 ? '🐣 Fresh Fren' : '🥚 Unhatched';
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex justify-between items-end gap-2">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">Your progress</div>
          <div className="heading text-3xl">You’ve completed {done}/{LESSONS.length} lessons</div>
        </div>
        <span className="chip text-sm">{rank}</span>
      </div>
      <div className="h-3 rounded-full bg-black/20 mt-3 overflow-hidden" role="progressbar" aria-valuenow={done} aria-valuemin={0} aria-valuemax={LESSONS.length}>
        <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, var(--pink), var(--cyan), var(--green))' }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }} />
      </div>
    </div>
  );
}

function Glossary() {
  const [q, setQ] = useState('');
  const list = useMemo(() => GLOSSARY.filter(([t, d]) => (t + d).toLowerCase().includes(q.toLowerCase())), [q]);
  return (
    <section className="mt-14" id="glossary">
      <SectionTitle kicker="Glossary" title="Speak fluent degen" />
      <input className="input max-w-md mb-4" placeholder="Search terms… (try “rug”)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search glossary" />
      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map(([term, def]) => (
          <motion.div layout key={term} className="glass rounded-xl p-3 hover:border-[var(--green)] transition">
            <dt className="font-bold text-green">{term}</dt><dd className="text-sm text-muted mt-0.5">{def}</dd>
          </motion.div>
        ))}
      </dl>
      {!list.length && <p className="text-muted">No terms match. Maybe you just invented one? 🧪</p>}
    </section>
  );
}

export default function AcademyPage() {
  useSeo({ title: 'Meme Academy', description: 'Beginner-friendly memecoin lessons with quizzes: what is a memecoin, how to spot a rug pull, tokenomics, and a crypto glossary.' });
  const { completed, quiz } = useStore((s) => s.academy);
  return (
    <div className="mx-auto max-w-7xl px-4 pt-10">
      <SectionTitle kicker="Meme Academy" title="Learn before you ape">Ten bite-sized lessons, each with a 3-question quiz. Pass with 2/3 to tick it off.</SectionTitle>
      <ProgressTracker />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {LESSONS.map((l, i) => {
          const done = completed.includes(l.id);
          return (
            <motion.div key={l.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 3) * 0.06 }} whileHover={{ y: -4 }}>
              <Link to={`/academy/${l.id}`} className={cx('glass rounded-2xl p-5 block h-full transition hover:shadow-glow-cyan', done && 'border-[var(--green)]')}>
                <div className="flex items-start justify-between">
                  <span className="text-4xl">{l.emoji}</span>
                  {done ? <span className="chip text-green" style={{ borderColor: 'var(--green)' }}>✓ {quiz[l.id]}/3</span> : <span className="chip">Lesson {i + 1}</span>}
                </div>
                <h3 className="heading text-2xl mt-3">{l.title}</h3>
                <p className="text-sm text-muted mt-1 line-clamp-2">{l.body[0]}</p>
                <div className="text-xs text-muted mt-3">⏱ {l.minutes} min · {l.level}</div>
              </Link>
            </motion.div>
          );
        })}
      </div>
      <Glossary />
    </div>
  );
}
