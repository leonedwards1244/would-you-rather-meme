import { useEffect } from 'react';

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/** Per-route SEO tags. (The Express server also injects these server-side for /m/:id share links.) */
export function useSeo({ title, description }) {
  useEffect(() => {
    const full = title ? `${title} · Would You Rather: Meme Edition` : 'Would You Rather: Meme Edition';
    document.title = full;
    if (description) {
      setMeta('name', 'description', description);
      setMeta('property', 'og:description', description);
      setMeta('name', 'twitter:description', description);
    }
    setMeta('property', 'og:title', full);
    setMeta('name', 'twitter:title', full);
  }, [title, description]);
}
