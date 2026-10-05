import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { COINS } from '@shared/coins.js';
import { CATEGORIES } from '@shared/board.js';
import { useApi } from '../lib/useApi.js';
import { useStore } from '../store/useStore.js';
import { EmptyState, ErrorState, FlairBadge, Modal, SectionTitle, Skeleton, VoteArrows } from '../components/ui/Primitives.jsx';
import { cx, timeAgo } from '../lib/format.js';
import { sanitize } from '../lib/sanitize.js';
import { useSeo } from '../lib/seo.js';

const CAT_EMOJI = { All: '🌐', General: '💬', 'Coin Analysis': '🔬', 'Meme Drops': '🖼️', Predictions: '🔮', Newcomers: '🐣' };

export function RichEditor({ editorRef, placeholder }) {
  const fileRef = useRef(null);
  const rangeRef = useRef(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('https://');
  const addLink = () => {
    if (!/^https:\/\/\S+\.\S+/.test(linkUrl)) return toast('Links must start with https://', 'error');
    editorRef.current?.focus();
    const sel = window.getSelection();
    if (rangeRef.current) { sel.removeAllRanges(); sel.addRange(rangeRef.current); }
    if (sel.isCollapsed) document.execCommand('insertHTML', false, `<a href="${encodeURI(linkUrl)}">${encodeURI(linkUrl)}</a>`);
    else document.execCommand('createLink', false, linkUrl);
    setLinkMode(false); setLinkUrl('https://');
  };
  const toast = useStore((s) => s.toast);
  const exec = (cmd, val) => { editorRef.current?.focus(); document.execCommand(cmd, false, val); };
  const onFile = (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\/(png|jpe?g|gif|webp)$/.test(f.type)) return toast('Images and GIFs only (png, jpg, gif, webp)', 'error');
    if (f.size > 2_000_000) return toast('Max 2 MB — compress that meme 🗜️', 'error');
    const reader = new FileReader();
    reader.onload = () => exec('insertHTML', `<img src="${reader.result}" alt="uploaded meme" /><br/>`);
    reader.readAsDataURL(f);
  };
  const tools = [['B', 'bold', 'font-bold'], ['I', 'italic', 'italic'], ['U', 'underline', 'underline'], ['• List', 'insertUnorderedList', '']];
  return (
    <div className="rounded-xl border border-theme overflow-hidden">
      <div className="flex flex-wrap gap-1 p-1.5 border-b border-theme" style={{ background: 'var(--card)' }}>
        {tools.map(([label, cmd, cls]) => (
          <button key={cmd} type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => exec(cmd)} className={cx('px-2.5 py-1 rounded-lg hover:bg-white/10 text-sm', cls)} aria-label={cmd}>{label}</button>
        ))}
        <button type="button" onMouseDown={(e) => e.preventDefault()} className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-sm" onClick={() => {
          const sel = window.getSelection();
          rangeRef.current = sel && sel.rangeCount ? sel.getRangeAt(0).cloneRange() : null;
          setLinkMode((v) => !v);
        }}>🔗 Link</button>
        <button type="button" className="px-2.5 py-1 rounded-lg hover:bg-white/10 text-sm" onClick={() => fileRef.current?.click()}>🖼️ Image / GIF</button>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp" hidden onChange={onFile} />
      </div>
      {linkMode && (
        <div className="flex gap-2 p-2 border-b border-theme">
          <input className="input py-1 text-sm" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} aria-label="Link URL" autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addLink(); } }} />
          <button type="button" className="btn-neon text-sm py-1" onClick={addLink}>Add</button>
        </div>
      )}
      <div ref={editorRef} contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Post body"
        data-placeholder={placeholder} className="rich-editor rich-content min-h-[140px] max-h-[320px] overflow-y-auto p-3 outline-none" style={{ background: 'var(--card-strong)' }} />
    </div>
  );
}

function NewPostModal({ open, onClose, defaultCategory, onCreated }) {
  const { transport, favoriteCoin, setFavoriteCoin, toast, identity } = useStore();
  const editorRef = useRef(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(defaultCategory === 'All' ? 'General' : defaultCategory);
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const body = sanitize(editorRef.current?.innerHTML || '');
    setBusy(true);
    try {
      const { post } = await transport.api.createPost({ title, body, category, flair: favoriteCoin, author: identity.name });
      toast('Posted! May your upvotes be plentiful 🚀', 'success');
      setTitle('');
      if (editorRef.current) editorRef.current.innerHTML = '';
      onCreated(post);
    } catch (err) { toast(err.message, 'error'); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} label="Create post" wide>
      <form onSubmit={submit} className="grid gap-3">
        <h3 className="heading text-3xl">New post</h3>
        <input className="input text-lg font-semibold" placeholder="Title (make it spicy)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={140} aria-label="Title" />
        <div className="grid sm:grid-cols-2 gap-2">
          <label className="text-sm">Category
            <select className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          </label>
          <label className="text-sm">Your flair (favorite coin)
            <select className="input mt-1" value={favoriteCoin} onChange={(e) => setFavoriteCoin(e.target.value)}>
              {Object.values(COINS).map((c) => <option key={c.id} value={c.id}>{c.ticker} · {c.name}</option>)}
            </select>
          </label>
        </div>
        <RichEditor editorRef={editorRef} placeholder="Share your alpha, your memes, your cope…" />
        <div className="flex justify-between items-center gap-2">
          <span className="text-xs text-muted">Posting as {identity.emoji} {identity.name} <FlairBadge coin={favoriteCoin} /></span>
          <button className="btn-neon" disabled={busy}>{busy ? 'Posting…' : 'Post 🚀'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function ForumPage() {
  useSeo({ title: 'Community forum', description: 'Reddit-style memecoin discussions: coin analysis, meme drops, predictions and help for newcomers.' });
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('hot');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { transport, toast } = useStore();
  const { data, loading, error, reload, setData } = useApi((api) => api.posts({ category, sort, q }), [category, sort, q]);

  const vote = async (id, dir) => {
    try {
      const res = await transport.api.votePost(id, dir);
      setData((d) => ({ ...d, posts: d.posts.map((p) => (p.id === id ? { ...p, ...res } : p)) }));
    } catch (e) { toast(e.message, 'error'); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pt-10">
      <SectionTitle kicker="Forum" title="The degen roundtable">Threads, hot takes and genuinely useful analysis (sometimes).</SectionTitle>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="glass rounded-2xl p-3 h-max lg:sticky lg:top-24 flex lg:flex-col gap-1 overflow-x-auto" aria-label="Forum categories">
          {['All', ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setCategory(c)} aria-pressed={category === c}
              className={cx('text-left whitespace-nowrap rounded-lg px-3 py-2 font-semibold transition', category === c ? 'bg-[var(--pink)] text-white shadow-glow-pink' : 'text-muted hover:text-cyan')}>
              {CAT_EMOJI[c]} {c}
            </button>
          ))}
        </nav>
        <div className="min-w-0">
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <div className="flex rounded-xl overflow-hidden border border-theme" role="tablist" aria-label="Sort">
              {[['hot', '🔥 Hot'], ['new', '✨ New'], ['top', '🏆 Top']].map(([k, l]) => (
                <button key={k} role="tab" aria-selected={sort === k} onClick={() => setSort(k)} className={cx('px-3 py-1.5 text-sm font-semibold', sort === k ? 'bg-[var(--cyan)] text-black' : 'text-muted')}>{l}</button>
              ))}
            </div>
            <input className="input max-w-xs py-1.5" placeholder="Search threads…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search threads" />
            <button className="btn-pink ml-auto" onClick={() => setOpen(true)}>＋ New post</button>
          </div>
          {error ? <ErrorState message={error} onRetry={reload} /> : loading ? (
            <div className="grid gap-3">{[...Array(4)].map((_, i) => <div key={i} className="glass rounded-2xl p-4 flex gap-3"><Skeleton className="w-8 h-16" /><div className="flex-1"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-6 mt-2" /><Skeleton className="h-4 w-1/3 mt-2" /></div></div>)}</div>
          ) : data.posts.length ? (
            <motion.ul layout className="grid gap-3">
              <AnimatePresence>
                {data.posts.map((p) => (
                  <motion.li key={p.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="glass rounded-2xl p-4 flex gap-3 cursor-pointer hover:border-[var(--cyan)] transition" onClick={() => navigate(`/forum/${p.id}`)}>
                    <VoteArrows score={p.score} myVote={p.myVote} onVote={(d) => vote(p.id, d)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="chip">{CAT_EMOJI[p.category]} {p.category}</span>
                        <span>{p.author}</span><FlairBadge coin={p.flair} /><span>· {timeAgo(p.at)}</span>
                      </div>
                      <Link to={`/forum/${p.id}`} onClick={(e) => e.stopPropagation()} className="block font-bold text-lg mt-1 hover:text-cyan">{p.title}</Link>
                      <div className="text-sm text-muted mt-1">💬 {p.commentCount} comments</div>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          ) : <EmptyState emoji="🦗" title="Crickets in here">Be the first to start a thread in {category}.</EmptyState>}
        </div>
      </div>
      <NewPostModal open={open} onClose={() => setOpen(false)} defaultCategory={category} onCreated={(post) => { setOpen(false); navigate(`/forum/${post.id}`); }} />
    </div>
  );
}
