import { Component, useEffect } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { useStore } from './store/useStore.js';
import Navbar from './components/layout/Navbar.jsx';
import Ticker from './components/layout/Ticker.jsx';
import Footer from './components/layout/Footer.jsx';
import Background from './components/layout/Background.jsx';
import Celebration from './components/game/Celebration.jsx';
import { ErrorState, Toasts } from './components/ui/Primitives.jsx';
import GamePage from './pages/GamePage.jsx';
import ComparePage from './pages/ComparePage.jsx';
import MatchupPage from './pages/MatchupPage.jsx';
import NewsPage from './pages/NewsPage.jsx';
import ForumPage from './pages/ForumPage.jsx';
import ThreadPage from './pages/ThreadPage.jsx';
import AcademyPage from './pages/AcademyPage.jsx';
import LessonPage from './pages/LessonPage.jsx';
import NotFound from './pages/NotFound.jsx';

class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error(error, info); }
  render() {
    if (this.state.error)
      return <div className="mx-auto max-w-xl px-4 py-24"><ErrorState message="Something crashed harder than a 2022 altcoin." onRetry={() => { this.setState({ error: null }); window.location.reload(); }} /></div>;
    return this.props.children;
  }
}

function AnimatedRoutes() {
  const location = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' }); }, [location.pathname]);
  return (
    <AnimatePresence mode="wait">
      <motion.main key={location.pathname} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
        <Routes location={location}>
          <Route path="/" element={<GamePage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/m/:id" element={<MatchupPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route path="/forum" element={<ForumPage />} />
          <Route path="/forum/:id" element={<ThreadPage />} />
          <Route path="/academy" element={<AcademyPage />} />
          <Route path="/academy/:id" element={<LessonPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </motion.main>
    </AnimatePresence>
  );
}

export default function App() {
  const theme = useStore((s) => s.theme);
  const init = useStore((s) => s.init);
  useEffect(() => { init(); }, [init]);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return (
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <Background />
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] btn-neon">Skip to content</a>
        <Navbar />
        <Ticker />
        <ErrorBoundary>
          <div id="main"><AnimatedRoutes /></div>
        </ErrorBoundary>
        <Footer />
        <Celebration />
        <Toasts />
      </HashRouter>
    </MotionConfig>
  );
}
