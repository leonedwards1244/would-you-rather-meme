import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { LESSONS } from '../data/academy.js';
import { useStore } from '../store/useStore.js';
import { cx } from '../lib/format.js';
import { useSeo } from '../lib/seo.js';
import NotFound from './NotFound.jsx';
import { ProgressTracker } from './AcademyPage.jsx';

function Quiz({ lesson }) {
  const completeLesson = useStore((s) => s.completeLesson);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const score = lesson.quiz.reduce((n, q, i) => n + (answers[i] === q.answer ? 1 : 0), 0);
  const passed = score >= 2;
  const submit = () => {
    setSubmitted(true);
    if (score >= 2) {
      completeLesson(lesson.id, score);
      if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) confetti({ particleCount: 90, spread: 70, origin: { y: 0.8 }, zIndex: 90 });
    }
  };
  return (
    <section className="glass rounded-2xl p-5 mt-6" aria-label="Quiz">
      <h2 className="heading text-3xl">Pop quiz 🧠</h2>
      <ol className="grid gap-5 mt-3">
        {lesson.quiz.map((q, i) => (
          <li key={i}>
            <p className="font-semibold">{i + 1}. {q.q}</p>
            <div className="grid sm:grid-cols-2 gap-2 mt-2" role="radiogroup">
              {q.options.map((o, j) => {
                const picked = answers[i] === j;
                const correct = submitted && j === q.answer;
                const wrong = submitted && picked && j !== q.answer;
                return (
                  <motion.button key={j} type="button" role="radio" aria-checked={picked} disabled={submitted} whileTap={{ scale: 0.97 }}
                    onClick={() => setAnswers((a) => ({ ...a, [i]: j }))}
                    className={cx('text-left rounded-xl px-3 py-2 border transition', picked ? 'border-[var(--cyan)] shadow-glow-cyan' : 'border-theme hover:border-[var(--cyan)]',
                      correct && '!border-[var(--green)] !shadow-glow-green', wrong && '!border-[var(--pink)] opacity-80')}
                    style={{ background: correct ? 'color-mix(in srgb, var(--green) 15%, transparent)' : wrong ? 'color-mix(in srgb, var(--pink) 15%, transparent)' : 'var(--card)' }}>
                    {correct ? '✅ ' : wrong ? '❌ ' : ''}{o}
                  </motion.button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>
      <AnimatePresence mode="wait">
        {!submitted ? (
          <motion.button key="s" className="btn-neon mt-5" disabled={Object.keys(answers).length < lesson.quiz.length} onClick={submit}>Submit answers</motion.button>
        ) : (
          <motion.div key="r" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-5 flex flex-wrap items-center gap-3">
            <span className={cx('heading text-3xl', passed ? 'neon-text-green' : 'neon-text-pink')}>{score}/3 — {passed ? 'Lesson complete! 🎉' : 'So close. Rug-proof yourself and retry.'}</span>
            {!passed && <button className="btn-ghost" onClick={() => { setAnswers({}); setSubmitted(false); }}>Retry</button>}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

export default function LessonPage() {
  const { id } = useParams();
  const idx = LESSONS.findIndex((l) => l.id === id);
  const lesson = LESSONS[idx];
  useSeo(lesson ? { title: `${lesson.title} — Meme Academy`, description: lesson.body[0] } : { title: 'Lesson not found' });
  if (!lesson) return <NotFound />;
  const next = LESSONS[idx + 1];
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10">
      <Link to="/academy" className="text-sm text-muted hover:text-cyan">← All lessons</Link>
      <div className="mt-4"><ProgressTracker /></div>
      <article className="glass rounded-2xl p-6 mt-6">
        <div className="text-5xl">{lesson.emoji}</div>
        <div className="text-xs uppercase tracking-[0.25em] text-cyan mt-3">Lesson {idx + 1} · {lesson.minutes} min · {lesson.level}</div>
        <h1 className="heading text-5xl mt-1">{lesson.title}</h1>
        <div className="mt-4 space-y-4 text-lg leading-relaxed">{lesson.body.map((p, i) => <p key={i}>{p}</p>)}</div>
      </article>
      <Quiz key={lesson.id} lesson={lesson} />
      <div className="flex justify-between mt-6">
        {idx > 0 ? <Link className="btn-ghost" to={`/academy/${LESSONS[idx - 1].id}`}>← Previous</Link> : <span />}
        {next ? <Link className="btn-pink" to={`/academy/${next.id}`}>Next: {next.title} →</Link> : <Link className="btn-neon" to="/academy">Finish 🎓</Link>}
      </div>
    </div>
  );
}
