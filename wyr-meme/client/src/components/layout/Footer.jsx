import { useState } from 'react';
import { useStore } from '../../store/useStore.js';

const SOCIALS = [['𝕏', 'X / Twitter', 'https://x.com'], ['✈️', 'Telegram', 'https://telegram.org'], ['💬', 'Discord', 'https://discord.com'], ['🐙', 'GitHub', 'https://github.com']];

function SubmitCoinForm() {
  const transport = useStore((s) => s.transport);
  const toast = useStore((s) => s.toast);
  const [form, setForm] = useState({ name: '', ticker: '', chain: 'Solana', contract: '', why: '' });
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !/^[A-Za-z0-9]{2,10}$/.test(form.ticker)) return toast('Need a name and a 2–10 character ticker 🧐', 'error');
    setBusy(true);
    try {
      await transport.api.submitCoin(form);
      toast(`$${form.ticker.toUpperCase()} submitted for review. Moon pending 🌕`, 'success');
      setForm({ name: '', ticker: '', chain: 'Solana', contract: '', why: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };
  return (
    <form onSubmit={submit} className="grid gap-2 sm:grid-cols-2">
      <input className="input" placeholder="Coin name" value={form.name} onChange={up('name')} aria-label="Coin name" />
      <input className="input font-mono uppercase" placeholder="TICKER" value={form.ticker} onChange={up('ticker')} aria-label="Ticker" maxLength={10} />
      <select className="input" value={form.chain} onChange={up('chain')} aria-label="Chain">
        {['Solana', 'Ethereum', 'Base', 'BNB Chain', 'Other'].map((c) => <option key={c}>{c}</option>)}
      </select>
      <input className="input font-mono text-xs" placeholder="Contract address (optional)" value={form.contract} onChange={up('contract')} aria-label="Contract address" />
      <input className="input sm:col-span-2" placeholder="Why should it battle? (be funny)" value={form.why} onChange={up('why')} aria-label="Reason" maxLength={200} />
      <button className="btn-neon sm:col-span-2" disabled={busy}>{busy ? 'Submitting…' : 'Submit coin 🚀'}</button>
    </form>
  );
}

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-theme glass-strong border-x-0 border-b-0">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-10 md:grid-cols-3">
        <div>
          <div className="heading text-3xl">Would You Rather 🪙</div>
          <p className="text-muted text-sm mt-2">Old school or new wave? A game about memecoins — not a place to get financial advice.</p>
          <div className="flex gap-2 mt-4">
            {SOCIALS.map(([icon, label, href]) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" className="btn-ghost px-3" aria-label={label} title={label}>{icon}</a>
            ))}
          </div>
        </div>
        <div className="md:col-span-2">
          <h3 className="heading text-2xl mb-3">Submit a coin for battle</h3>
          <SubmitCoinForm />
        </div>
      </div>
      <div className="border-t border-theme">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-muted leading-relaxed">
          <b>Disclaimer:</b> Everything here is for entertainment and education only. Nothing on this site is financial advice. Memecoins are extremely volatile and many go to zero. Votes reflect crowd vibes, not value. Concept coins (Doge 2.0, SHIB Burn Edition) are hypothetical. Prices may be delayed or simulated. Community numbers are approximate. Never invest more than you can afford to lose. © {new Date().getFullYear()} Would You Rather: Meme Edition.
        </p>
      </div>
    </footer>
  );
}
