import { search } from './bm25.mjs';

// Set after the `gappa-ask` Vercel project is deployed, e.g. 'https://gappa-ask.vercel.app/api/ask'.
// While empty, `ask` goes straight to the local BM25 fallback.
const ASK_ENDPOINT = 'https://gappa-ask.vercel.app/api/ask';
const ASK_TIMEOUT_MS = 4000;

const LINKEDIN = 'https://www.linkedin.com/in/emilio-gappa-44448223a/';
const GITHUB = 'https://github.com/CH4RL3I';
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (s) => document.querySelector(s);
const log = $('#log'), screen = $('#screen'), input = $('#cmd'), caret = $('#caret'), form = $('#prompt'), srStatus = $('#sr-status');

let index = null, projects = [], dataReady = null;
const history = []; let hpos = 0, draft = '';

// ---------- dom helpers ----------
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function a(href, text, cls) { const x = el('a', cls, text); x.href = href; x.target = '_blank'; x.rel = 'noopener'; return x; }
function cmdLink(text, cmd) { const b = el('button', 'lnk', text); b.type = 'button'; b.dataset.cmd = cmd; return b; }
function row(...kids) {
  const r = el('div', 'row');
  for (const k of kids) r.append(k instanceof Node ? k : document.createTextNode(k));
  log.append(r); toBottom(); return r;
}
function gap() { log.append(el('div', 'gap')); }
function toBottom() { screen.scrollTop = screen.scrollHeight; }
function announce(t) { srStatus.textContent = ''; setTimeout(() => { srStatus.textContent = t; }, 50); }
const span = (cls, t) => el('span', cls, t);

// ---------- typed output ----------
let skipTyping = false;
addEventListener('keydown', () => { skipTyping = true; }, true);
addEventListener('pointerdown', () => { skipTyping = true; }, true);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function typed(text, cls = '', speed = 11) {
  const r = el('div', `row ${cls}`);
  log.append(r);
  if (reduced || skipTyping) { r.textContent = text; toBottom(); return r; }
  r.setAttribute('aria-hidden', 'true');
  for (let i = 1; i <= text.length; i++) {
    if (skipTyping) { r.textContent = text; break; }
    r.textContent = text.slice(0, i);
    toBottom();
    await sleep(text[i - 1] === ' ' ? speed / 2 : speed);
  }
  r.removeAttribute('aria-hidden'); toBottom();
  return r;
}

// ---------- data ----------
function load() {
  dataReady ??= Promise.all([
    fetch('data/index.json').then((r) => r.json()),
    fetch('data/projects.json').then((r) => r.json()),
  ]).then(([i, p]) => { index = i; projects = p.projects; return true; }).catch(() => false);
  return dataReady;
}
const findProject = (q) => {
  q = q.toLowerCase().trim().replace(/^["']|["']$/g, '');
  if (!q) return null;
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const n = norm(q);
  return projects.find((p) => p.id.toLowerCase() === q || norm(p.id) === n || norm(p.name) === n)
    || (n.length >= 3 && projects.filter((p) => norm(p.id).startsWith(n) || norm(p.name).startsWith(n)).length === 1
      ? projects.find((p) => norm(p.id).startsWith(n) || norm(p.name).startsWith(n)) : null);
};

// ---------- fuzzy suggestions ----------
function lev(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function closest(word, options) {
  let best = null, bd = 99;
  for (const o of options) {
    const d = o.startsWith(word) && word.length >= 2 ? 0 : lev(word, o);
    if (d < bd) { bd = d; best = o; }
  }
  return bd <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
}

// ---------- commands ----------
const COMMANDS = ['help', 'whoami', 'ls', 'open', 'cat', 'ask', 'contact', 'clear', 'sudo'];
const HELP = [
  ['whoami', 'who this is'],
  ['ls', 'list the projects'],
  ['cat <project>', 'pitch, headline result and stack'],
  ['open <project>', 'open the GitHub repo'],
  ['ask <question>', 'ask the portfolio; answers come with sources'],
  ['contact', 'where to reach Emilio'],
  ['clear', 'clear the screen'],
];

const cmds = {
  help() {
    const g = el('div', 'cmds');
    for (const [c, d] of HELP) { g.append(el('b', '', c), el('span', '', d)); }
    row(g);
    row(span('dim', 'Up/Down for history, Tab to complete.'));
  },
  whoami() {
    row(span('b', 'Emilio Gappa'));
    row('Master in Management at NOVA SBE, Lisbon. Builds and ships software:');
    row('mobile apps, internal business tools and AI agents, from first sketch to production.');
    gap();
    row(span('dim', 'linkedin  '), a(LINKEDIN, 'emilio-gappa-44448223a'));
    row(span('dim', 'github    '), a(GITHUB, 'CH4RL3I'));
  },
  async ls() {
    if (!(await load())) return row(span('sig', 'could not load projects.json. The list below the terminal still works.'));
    const pub = projects.filter((p) => p.kind === 'public'), priv = projects.filter((p) => p.kind === 'private');
    const w = Math.max(...projects.map((p) => p.id.length)) + 2;
    row(span('dim', `open source (${pub.length})`));
    for (const p of pub) row(cmdLink(p.id, `cat ${p.id}`), span('dim', ' '.repeat(w - p.id.length) + short(p.pitch, 44)));
    gap();
    row(span('dim', `production and beta, private repos (${priv.length})`));
    for (const p of priv) row(cmdLink(p.id, `cat ${p.id}`), span('dim', ' '.repeat(w - p.id.length) + short(p.pitch, 44)));
    gap();
    row(span('dim', 'cat <name> for details, ask <question> to search them all.'));
  },
  async cat(arg) {
    await load();
    if (!arg) return row('usage: cat <project>   ', span('dim', 'try '), cmdLink('ls', 'ls'));
    const p = findProject(arg);
    if (!p) return unknownProject('cat', arg);
    row(span('b', p.name), span('dim', p.kind === 'private' ? '  private repository' : `  ${p.language || ''}`));
    row(p.pitch);
    gap();
    const dl = el('dl', 'kv');
    if (p.headline) { dl.append(el('dt', '', 'result'), el('dd', '', p.headline)); }
    dl.append(el('dt', '', 'stack'), el('dd', '', p.stack.join(', ') || 'n/a'));
    if (p.kind === 'public') { const dd = el('dd'); dd.append(a(p.url, p.url.replace('https://', ''))); dl.append(el('dt', '', 'repo'), dd); }
    if (p.homepage) { const dd = el('dd'); dd.append(a(p.homepage, p.homepage.replace('https://', ''))); dl.append(el('dt', '', 'live'), dd); }
    row(dl);
    if (p.kind === 'private') row(span('dim', 'The code is private; Emilio will walk through it on request. '), cmdLink('contact', 'contact'));
    else row(span('dim', 'Next: '), cmdLink(`open ${p.id}`, `open ${p.id}`), span('dim', ' for the repo, or '), cmdLink(`ask "how does ${p.id} work?"`, `ask "how does ${p.id} work?"`));
  },
  async open(arg) {
    await load();
    const a0 = (arg || '').toLowerCase();
    if (a0 === 'github') return openUrl(GITHUB, 'github.com/CH4RL3I');
    if (a0 === 'linkedin') return openUrl(LINKEDIN, 'linkedin.com/in/emilio-gappa');
    if (!arg) return row('usage: open <project>   ', span('dim', 'try '), cmdLink('ls', 'ls'));
    const p = findProject(arg);
    if (!p) return unknownProject('open', arg);
    if (p.kind === 'private') return row(`${p.name} is a private repository. `, span('dim', 'Emilio will walk through it on request: '), cmdLink('contact', 'contact'));
    openUrl(p.url, p.url.replace('https://', ''));
  },
  contact() {
    row('Message Emilio on LinkedIn, it is the fastest way:');
    row(a(LINKEDIN, 'linkedin.com/in/emilio-gappa-44448223a'));
    row(span('dim', 'Code: '), a(GITHUB, 'github.com/CH4RL3I'));
    row(span('dim', 'No email address is listed here on purpose.'));
  },
  clear() { log.textContent = ''; },
  async sudo(arg) {
    if (/^hire\s+(emilio|emilio gappa)$/i.test(arg.trim())) {
      row(span('dim', '[sudo] password for recruiter: '), '********');
      await sleep(reduced ? 0 : 450);
      row('recruiter is in the sudoers file. Offer accepted.');
      await sleep(reduced ? 0 : 350);
      row(span('ok', 'ok'), ' provisioning emilio ... done');
      row('Next step: ', a(LINKEDIN, 'message him on LinkedIn'), span('dim', ' (start date negotiable, coffee not).'));
      return;
    }
    row('sudo: a password is required. ', span('dim', 'Hint: '), cmdLink('sudo hire emilio', 'sudo hire emilio'));
  },
  exit() { row('There is no exit, only ', cmdLink('contact', 'contact'), '.'); },
};

function short(t, n) { return t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '...' : t; }
function openUrl(url, label) {
  row('opening ', a(url, label), span('dim', ' in a new tab'));
  const w = window.open(url, '_blank', 'noopener');
  if (!w) row(span('dim', 'Your browser blocked the tab; use the link above.'));
}
function unknownProject(cmd, arg) {
  const hit = closest(arg.toLowerCase(), projects.flatMap((p) => [p.id.toLowerCase(), p.name.toLowerCase()]));
  row(`${cmd}: no project called "${arg}". `);
  if (hit) { const p = findProject(hit); row(span('dim', 'Did you mean '), cmdLink(`${cmd} ${p.id}`, `${cmd} ${p.id}`), span('dim', '?')); }
  else row(span('dim', 'Try '), cmdLink('ls', 'ls'), span('dim', '.'));
}

// ---------- ask ----------
const EXAMPLES = ['what has he built with computer vision?', 'how does touchdown estimate pose?', 'has he shipped anything to production?'];

function excerpt(text, terms, n = 300) {
  const flat = text.replace(/\s*\n\s*/g, ' ').trim();
  if (flat.length <= n) return flat;
  const low = flat.toLowerCase();
  let at = 0;
  for (const t of terms) { const i = low.indexOf(t); if (i > 0) { at = Math.max(0, i - 80); break; } }
  let s = flat.slice(at, at + n);
  if (at > 0) s = '...' + s.replace(/^\S*\s/, '');
  return s.replace(/\s+\S*$/, '') + '...';
}

function passageBlock(chunk, terms, score) {
  const d = el('div', 'passage');
  const h = el('div', 'ph');
  h.append(a(chunk.url, `${chunk.repo} / ${chunk.section}`));
  if (score != null) h.append(span('sc', `  ${score.toFixed(1)}`));
  d.append(h, el('p', '', excerpt(chunk.text, terms)));
  return d;
}

function bar(p, n = 10) { const f = Math.round(p * n); return '▮'.repeat(f) + '▯'.repeat(n - f); }

function renderDecision(dec) {
  const box = el('div', 'decision');
  const add = (...kids) => kids.forEach((k) => box.append(k instanceof Node ? k : document.createTextNode(k)));
  const isNone = dec.project === 'none';
  add('{\n',
    '  ', span('k', '"project"'), ':     ', span('s', `"${dec.project}"`), ',\n',
    '  ', span('k', '"passage_ids"'), ': [', ...dec.passage_ids.flatMap((id, i) => [i ? ', ' : '', span('s', `"${id}"`)]), '],\n',
    '  ', span('k', '"confidence"'), ':  ', span('n', dec.confidence.toFixed(2)), ' ', span('bar', bar(dec.confidence)), ',\n',
    ...(dec.also.length ? ['  ', span('k', '"also"'), ':        [', ...dec.also.flatMap((x, i) => [i ? ', ' : '', span('s', `"${x.project}"`), ' ', span('n', x.p.toFixed(2))]), '],\n'] : []),
    '  ', span('k', '"answerable"'), ':  ', span(dec.answerable ? 't' : 'f', String(dec.answerable)), '\n',
    '}');
  log.append(box); toBottom();
  row(span('dim', `// decided by ${dec.model.replace(/-\d{8}$/, '')}, sources below`));
  return isNone;
}

async function askServer(question) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ASK_TIMEOUT_MS);
  try {
    const r = await fetch(ASK_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question }), signal: ctrl.signal });
    if (!r.ok) throw new Error(String(r.status));
    const d = await r.json();
    const ok = d && typeof d.project === 'string' && Array.isArray(d.passage_ids) && typeof d.confidence === 'number' && typeof d.answerable === 'boolean';
    if (!ok) throw new Error('shape');
    return { project: d.project.slice(0, 64), passage_ids: d.passage_ids.filter((x) => typeof x === 'string').slice(0, 5), confidence: Math.min(1, Math.max(0, d.confidence)), answerable: d.answerable, also: Array.isArray(d.also) ? d.also.filter((x) => x && typeof x.project === 'string' && typeof x.p === 'number').slice(0, 2).map((x) => ({ project: x.project.slice(0, 64), p: Math.min(1, Math.max(0, x.p)) })) : [], model: typeof d.model === 'string' ? d.model.slice(0, 40) : 'typesafe/jev-1.13' };
  } finally { clearTimeout(t); }
}

async function ask(arg) {
  const question = arg.trim().replace(/^(["'“])([\s\S]*)(["'”])$/, '$2').trim();
  if (!question) {
    row('usage: ask <question>');
    for (const e of EXAMPLES) row(span('dim', '  '), cmdLink(`ask "${e}"`, `ask "${e}"`));
    return;
  }
  if (question.length > 300) return row(span('sig', 'Questions are capped at 300 characters.'));
  if (!(await load())) return row(span('sig', 'The search index could not be loaded. Try ls, or use the project list below.'));
  const hits = search(index, question, 6);
  const terms = question.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const byId = new Map(index.chunks.map((c) => [c.id, c]));

  if (!hits.length) {
    row('No passage in the index matches that.');
    row(span('dim', 'Try '), cmdLink(`ask "${EXAMPLES[0]}"`, `ask "${EXAMPLES[0]}"`), span('dim', ' or '), cmdLink('ls', 'ls'), span('dim', '.'));
    return announce('No match in the index.');
  }

  let note = 'local ranking (BM25)';
  if (ASK_ENDPOINT) {
    const pend = row(span('dim pending', 'jev deciding'));
    try {
      const dec = await askServer(question);
      pend.remove();
      const picked = dec.passage_ids.map((id) => byId.get(id)).filter(Boolean);
      renderDecision(dec);
      if (!dec.answerable) row(span('dim', '// low coverage: the index may not answer this directly. Closest passages:'));
      const shown = picked.length ? picked : hits.filter((h) => h.score >= hits[0].score * 0.65).slice(0, 3).map((h) => h.chunk);
      for (const c of shown) log.append(passageBlock(c, terms));
      toBottom();
      announce(`Decision: project ${dec.project}, confidence ${Math.round(dec.confidence * 100)} percent, ${dec.answerable ? 'answerable' : 'not clearly answerable'}. ${shown.length} sources listed.`);
      return;
    } catch {
      pend.remove();
      note = 'decision service unavailable, showing local ranking (BM25)';
    }
  }
  row(span('dim', `// ${note}`));
  const close = hits.filter((h) => h.score >= hits[0].score * 0.65).slice(0, 4);
  for (const h of close) log.append(passageBlock(h.chunk, terms, h.score));
  toBottom();
  announce(`${close.length} passages found, best match ${hits[0].chunk.repo}, ${hits[0].chunk.section}.`);
}

// ---------- dispatch ----------
function parse(line) {
  const t = line.trim();
  const i = t.search(/\s/);
  return i < 0 ? [t.toLowerCase(), ''] : [t.slice(0, i).toLowerCase(), t.slice(i + 1).trim()];
}

let busy = Promise.resolve();
function run(line, { echo = true } = {}) {
  busy = busy.then(() => exec(line, echo)).catch(() => {});
  return busy;
}
async function exec(line, echo) {
  const t = line.trim();
  if (echo) { const r = el('div', 'row echo'); r.append(span('ps1', '$ '), document.createTextNode(t)); log.append(r); toBottom(); }
  if (!t) return;
  const [name, arg] = parse(t);
  if (/^rm\s+-rf?\s+\/?/.test(t)) return row('rm: / is not mine to delete. ', span('dim', 'Try '), cmdLink('ls', 'ls'), span('dim', '.'));
  if (name === 'ask') return ask(arg);
  if (name === 'ls' || name === 'dir') return cmds.ls();
  const fn = Object.hasOwn(cmds, name) ? cmds[name] : null;
  if (fn) return fn(arg);
  const hit = closest(name, [...COMMANDS, 'exit']);
  row(`${name}: command not found`);
  if (hit) row(span('dim', 'Did you mean '), cmdLink(hit, hit), span('dim', '?'));
  else row(span('dim', 'Type '), cmdLink('help', 'help'), span('dim', ' for the list.'));
}

// ---------- input: history, tab completion, caret ----------
const names = () => projects.flatMap((p) => [p.id]);
function complete() {
  const v = input.value, pos = input.selectionStart;
  if (pos !== v.length) return;
  const m = v.match(/^(\S*)(?:\s+(.*))?$/);
  const first = m[1], rest = m[2];
  if (rest === undefined) {
    const opts = [...COMMANDS, 'exit'].filter((c) => c.startsWith(first.toLowerCase()));
    return applyCompletion(opts, first, (o) => o + (o === 'ls' || o === 'help' || o === 'clear' || o === 'whoami' || o === 'contact' ? '' : ' '), (o) => o);
  }
  const f = first.toLowerCase();
  if (f === 'cat' || f === 'open') {
    const extra = f === 'open' ? ['github', 'linkedin'] : [];
    const opts = [...names(), ...extra].filter((n) => n.toLowerCase().startsWith(rest.toLowerCase()));
    return applyCompletion(opts, rest, (o) => `${first} ${o}`, (o) => o);
  }
  if (f === 'sudo') applyCompletion(['hire emilio'].filter((o) => o.startsWith(rest.toLowerCase())), rest, (o) => `${first} ${o}`, (o) => o);
}
function applyCompletion(opts, typed, build, label) {
  if (!opts.length) return;
  if (opts.length === 1) { input.value = build(opts[0]); return syncCaret(); }
  let pre = opts[0]; for (const o of opts) while (!o.toLowerCase().startsWith(pre.toLowerCase())) pre = pre.slice(0, -1);
  if (pre.length > typed.length) { input.value = build(pre); syncCaret(); }
  else row(span('dim', opts.map(label).join('  ')));
}

input.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (hpos === history.length) draft = input.value;
    if (hpos > 0) input.value = history[--hpos];
    requestAnimationFrame(() => { input.setSelectionRange(input.value.length, input.value.length); syncCaret(); });
  } else if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (hpos < history.length) { hpos++; input.value = hpos === history.length ? draft : history[hpos]; }
    requestAnimationFrame(() => { input.setSelectionRange(input.value.length, input.value.length); syncCaret(); });
  } else if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault(); load().then(complete);
  } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
    e.preventDefault(); cmds.clear();
  } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
    if (input.selectionStart === input.selectionEnd) { e.preventDefault(); if (input.value) { row(span('echo', '$ '), input.value + '^C'); input.value = ''; syncCaret(); } }
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = input.value;
  if (v.trim() && history[history.length - 1] !== v) history.push(v);
  hpos = history.length; draft = '';
  input.value = ''; syncCaret();
  skipTyping = true;
  run(v);
});

// Block caret drawn in ch units (the field is monospace). If the text outgrows the field, fall back to the native caret.
function syncCaret() {
  const over = input.scrollWidth > input.clientWidth + 1;
  input.classList.toggle('native', over);
  caret.classList.toggle('hide', over);
  caret.style.left = `${input.selectionStart ?? input.value.length}ch`;
  caret.classList.toggle('off', document.activeElement !== input);
}
['input', 'keyup', 'click', 'select', 'focus', 'blur'].forEach((ev) => input.addEventListener(ev, () => requestAnimationFrame(syncCaret)));
document.addEventListener('selectionchange', () => { if (document.activeElement === input) syncCaret(); });

// Clicking anywhere in the terminal focuses the prompt, unless the user is selecting text or hitting a control.
screen.addEventListener('click', (e) => {
  if (e.target.closest('a, button')) return;
  if (String(getSelection()).length) return;
  input.focus({ preventScroll: true });
});

// Chips, `cat` buttons in the list and in-terminal links all carry data-cmd.
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-cmd]');
  if (!b) return;
  skipTyping = true;
  run(b.dataset.cmd);
  if (b.closest('.projects')) $('#terminal').scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
});

// ---------- boot ----------
async function boot() {
  const ok = await load();
  syncCaret();
  await typed('gappa.me  tty1', 'dim');
  await typed(ok ? `indexing ${index.chunks.length} passages from ${new Set(index.chunks.map((c) => c.repo)).size} sources ... ok` : 'indexing ... failed, the project list below still works', ok ? 'dim' : 'sig', 7);
  await typed('ask is ready. Type help, or tap a suggestion below.', '', 14);
  gap();
  if (matchMedia('(pointer: fine)').matches) input.focus({ preventScroll: true });
  syncCaret();
}
boot();
