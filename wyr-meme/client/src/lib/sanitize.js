// DOM-based whitelist sanitizer for user-generated rich text (forum posts).
const ALLOWED = { B: [], STRONG: [], I: [], EM: [], U: [], P: [], BR: [], UL: [], OL: [], LI: [], DIV: [], SPAN: [], A: ['href'], IMG: ['src', 'alt'] };
const safeUrl = (u = '', img) => /^https:\/\//i.test(u) || (img && /^data:image\/(png|jpe?g|gif|webp);base64,/i.test(u));

export function sanitize(html) {
  const doc = new DOMParser().parseFromString(`<div>${html || ''}</div>`, 'text/html');
  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) return;
      if (child.nodeType !== 1 || !ALLOWED[child.tagName]) {
        if (child.nodeType === 1 && !['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED'].includes(child.tagName)) {
          walk(child);
          child.replaceWith(...child.childNodes);
        } else child.remove();
        return;
      }
      [...child.attributes].forEach((a) => { if (!ALLOWED[child.tagName].includes(a.name)) child.removeAttribute(a.name); });
      if (child.tagName === 'A') {
        if (!safeUrl(child.getAttribute('href'))) child.removeAttribute('href');
        child.setAttribute('target', '_blank');
        child.setAttribute('rel', 'noopener noreferrer nofollow');
      }
      if (child.tagName === 'IMG' && !safeUrl(child.getAttribute('src'), true)) child.remove();
      else walk(child);
    });
  };
  const root = doc.body.firstChild;
  walk(root);
  return root.innerHTML;
}
