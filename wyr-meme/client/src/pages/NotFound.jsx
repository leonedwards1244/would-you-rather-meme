import { Link } from 'react-router-dom';
import { useSeo } from '../lib/seo.js';

export default function NotFound() {
  useSeo({ title: 'Rug pulled (404)' });
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="text-8xl mb-4" aria-hidden>🧶😭</div>
      <h1 className="heading text-6xl neon-text-pink">Rug pulled!</h1>
      <p className="text-muted mt-2">This page got rugged. Liquidity: 0. Devs: gone. Your dignity: intact, probably.</p>
      <Link to="/" className="btn-neon mt-6">Back to safety 🏠</Link>
    </div>
  );
}
