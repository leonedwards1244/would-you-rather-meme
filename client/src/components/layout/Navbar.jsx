import { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useStore } from '../../store/useStore.js';
import { Modal } from '../ui/Primitives.jsx';
import { cx, fmtBig } from '../../lib/format.js';

const LINKS = [
  ['/', 'Game'], ['/compare', 'Compare'], ['/news', 'News'], ['/forum', 'Forum'], ['/academy', 'Academy'],
];

export function OnlineBadge({ className = '' }) {
  const online = useStore((s) => s.online);
  const demo = useStore((s) => s.mode === 'demo');
  return (
    <span className={cx('chip font-mono', className)} title="Players connected right now">
      <span className="relative flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75 animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
      </span>
      {online ? `${fmtBig(online)} ${demo ? 'simulated' : 'online'}` : 'connecting…'}
    </span>
  );
}

function WalletButton() {
  const { wallet, connectWallet, disconnectWallet } = useStore();
  const [open, setOpen] = useState(false);
  if (wallet)
    return (
      <button className="btn-ghost text-sm font-mono" onClick={disconnectWallet} title="Disconnect (demo wallet)">
        🟢 {wallet.slice(0, 6)}…{wallet.slice(-4)}
      </button>
    );
  return (
    <>
      <button className="btn-pink text-sm whitespace-nowrap" onClick={() => setOpen(true)}>Connect Wallet</button>
      <Modal open={open} onClose={() => setOpen(false)} label="Connect wallet">
        <h3 className="heading text-3xl mb-1">Connect a wallet</h3>
        <p className="text-muted text-sm mb-4">UI demo only — no real Web3, no signatures, no funds touched. Your “wallet” just becomes your voter ID.</p>
        <div className="grid gap-2">
          {[['🦊', 'MetaMask'], ['👻', 'Phantom'], ['🔗', 'WalletConnect'], ['🔵', 'Coinbase Wallet']].map(([e, n]) => (
            <button key={n} className="btn-ghost justify-start text-left py-3" onClick={() => { connectWallet(); setOpen(false); }}>
              <span className="text-2xl">{e}</span> {n}
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}

export default function Navbar() {
  const { theme, toggleTheme, mode } = useStore();
  const [menu, setMenu] = useState(false);
  const linkCls = ({ isActive }) =>
    cx('relative px-3 py-2 rounded-lg font-semibold transition hover:text-cyan', isActive ? 'text-cyan' : 'text-muted');

  return (
    <header className="sticky top-0 z-50 glass-strong border-x-0 border-t-0">
      <nav className="mx-auto max-w-7xl px-4 h-16 flex items-center gap-3" aria-label="Main">
        <Link to="/" className="flex items-center gap-2 shrink-0 group" aria-label="Would You Rather — home">
          <span className="text-3xl inline-block animate-flip [transform-style:preserve-3d]" aria-hidden>🪙</span>
          <span className="heading text-2xl leading-none">
            Would You Rather <span className="neon-text-pink hidden sm:inline">Meme Ed.</span>
          </span>
        </Link>

        <div className="hidden lg:flex items-center gap-1 ml-4">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={linkCls}>
              {({ isActive }) => (
                <>
                  {label}
                  {isActive && <motion.span layoutId="nav-underline" className="absolute left-2 right-2 -bottom-0.5 h-0.5 rounded bg-[var(--cyan)] shadow-glow-cyan" />}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {mode === 'demo' && <span className="chip text-[10px] uppercase tracking-wider" title="No realtime server connected — other players and votes are simulated in your browser">Demo<span className="hidden 2xl:inline">&nbsp;· simulated crowd</span></span>}
          <OnlineBadge className="hidden sm:inline-flex" />
          <button className="btn-ghost px-2.5" onClick={toggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? '🌙' : '☀️'}
          </button>
          <div className="hidden sm:block"><WalletButton /></div>
          <button className="btn-ghost px-2.5 lg:hidden" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-label="Menu">☰</button>
        </div>
      </nav>
      <AnimatePresence>
        {menu && (
          <motion.div className="lg:hidden overflow-hidden border-t border-theme" initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}>
            <div className="px-4 py-3 flex flex-col gap-1">
              {LINKS.map(([to, label]) => (
                <NavLink key={to} to={to} end={to === '/'} className={linkCls} onClick={() => setMenu(false)}>{label}</NavLink>
              ))}
              <div className="flex items-center gap-2 pt-2 sm:hidden"><OnlineBadge /><WalletButton /></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
