import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useApi } from '../lib/useApi.js';
import { useStore } from '../store/useStore.js';
import { ErrorState, FlairBadge, Skeleton, VoteArrows } from '../components/ui/Primitives.jsx';
import { timeAgo } from '../lib/format.js';
import { sanitize } from '../lib/sanitize.js';
import { useSeo } from '../lib/seo.js';

function ReplyBox({ onSubmit, onCancel, autoFocus, placeholder = 'Add a comment…' }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <form className="mt-2" onSubmit={async (e) => { e.preventDefault(); if (!text.trim()) return; setBusy(true); const ok = await onSubmit(text); setBusy(false); if (ok) setText(''); }}>
      <textarea className="input min-h-[70px]" value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} maxLength={2000} aria-label="Comment" />
      <div className="flex gap-2 mt-2 justify-end">
        {onCancel && <button type="button" className="btn-ghost text-sm" onClick={onCancel}>Cancel</button>}
        <button className="btn-neon text-sm" disabled={busy || !text.trim()}>{busy ? 'Sending…' : 'Comment'}</button>
      </div>
    </form>
  );
}

function Comment({ c, depth, onReply, onVote }) {
  const [replying, setReplying] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  return (
    <motion.li initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="mt-3">
      <div className="flex gap-2">
        <button className="w-5 shrink-0 flex justify-center group" onClick={() => setCollapsed((v) => !v)} aria-label={collapsed ? 'Expand thread' : 'Collapse thread'}>
          <span className="w-0.5 h-full rounded bg-[var(--border)] group-hover:bg-[var(--cyan)] transition" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <b className="text-[var(--fg)]">{c.author}</b><FlairBadge coin={c.flair} /><span>· {timeAgo(c.at)}</span>
            {collapsed && <span className="chip">{(c.replies?.length || 0) + 1} hidden</span>}
          </div>
          {!collapsed && (
            <>
              <p className="mt-1 whitespace-pre-wrap break-words">{c.body}</p>
              <div className="flex items-center gap-3 mt-1">
                <VoteArrows horizontal score={c.score} myVote={c.myVote} onVote={(d) => onVote(c.id, d)} />
                {depth < 5 && <button className="text-xs font-semibold text-muted hover:text-cyan" onClick={() => setReplying((r) => !r)}>↩ Reply</button>}
              </div>
              {replying && <ReplyBox autoFocus placeholder={`Reply to ${c.author}…`} onCancel={() => setReplying(false)} onSubmit={async (t) => { const ok = await onReply(t, c.id); if (ok) setReplying(false); return ok; }} />}
              {!!c.replies?.length && (
                <ul className="pl-1">{c.replies.map((r) => <Comment key={r.id} c={r} depth={depth + 1} onReply={onReply} onVote={onVote} />)}</ul>
              )}
            </>
          )}
        </div>
      </div>
    </motion.li>
  );
}

export default function ThreadPage() {
  const { id } = useParams();
  const { transport, toast, favoriteCoin, identity } = useStore();
  const { data, loading, error, reload } = useApi((api) => api.post(id), [id]);
  useSeo({ title: data?.post?.title || 'Thread', description: data?.post ? `Discussion in ${data.post.category} on Would You Rather: Meme Edition` : undefined });

  const reply = async (body, parentId) => {
    try { await transport.api.comment(id, { body, parentId, flair: favoriteCoin, author: identity.name }); await reload(true); return true; }
    catch (e) { toast(e.message, 'error'); return false; }
  };
  const votePost = async (dir) => { try { await transport.api.votePost(id, dir); reload(true); } catch (e) { toast(e.message, 'error'); } };
  const voteComment = async (cid, dir) => { try { await transport.api.voteComment(id, cid, dir); reload(true); } catch (e) { toast(e.message, 'error'); } };

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10">
      <Link to="/forum" className="text-sm text-muted hover:text-cyan">← Back to forum</Link>
      {error ? <div className="mt-4"><ErrorState message={error} onRetry={reload} /></div> : loading && !data ? (
        <div className="glass rounded-2xl p-6 mt-4"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-8 mt-3" /><Skeleton className="h-24 mt-3" /></div>
      ) : (
        <>
          <article className="glass rounded-2xl p-5 mt-4 flex gap-3">
            <VoteArrows score={data.post.score} myVote={data.post.myVote} onVote={votePost} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                <span className="chip">{data.post.category}</span><span>{data.post.author}</span><FlairBadge coin={data.post.flair} /><span>· {timeAgo(data.post.at)}</span>
              </div>
              <h1 className="heading text-4xl mt-2">{data.post.title}</h1>
              <div className="rich-content mt-3 break-words" dangerouslySetInnerHTML={{ __html: sanitize(data.post.body) }} />
            </div>
          </article>
          <section className="glass rounded-2xl p-5 mt-4" aria-label="Comments">
            <h2 className="heading text-2xl">Comments</h2>
            <ReplyBox onSubmit={(t) => reply(t)} />
            <ul><AnimatePresence>{data.post.comments.map((c) => <Comment key={c.id} c={c} depth={0} onReply={reply} onVote={voteComment} />)}</AnimatePresence></ul>
            {!data.post.comments.length && <p className="text-muted text-sm mt-4">No comments yet. First!!1 🥇</p>}
          </section>
        </>
      )}
    </div>
  );
}
