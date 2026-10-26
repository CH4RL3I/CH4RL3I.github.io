// The old gappa.me terminal, ported from legacy/app.js. Imperative DOM on purpose: it was
// built that way, it is small, and it only loads when someone presses `/`.
import { site } from '@/content/site';
import { askServer, excerpt, loadIndex, localPassages, splitCitations, MAX_QUESTION, type Chunk } from './ask/client';
import { track } from './track';

type Project = {
  id: string; name: string; kind: 'public' | 'private'; pitch: string; headline: string;
  stack: string[]; url: string; homepage: string | null; language: string | null;
};

const LINKEDIN = 'https://www.linkedin.com/in/emilio-gappa-44448223a/';
const GITHUB = 'https://github.com/CH4RL3I';

let projectsP: Promise<Project[] | null> | null = null;
const loadProjects = () =>
  (projectsP ??= fetch('/data/projects.json')
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => (d && Array.isArray(d.projects) ? (d.projects as Project[]) : null))
    .catch(() => null));

const history: string[] = []; // survives closing and reopening within the page

export function mountTerminal(root: HTMLElement, { onClose }: { onClose: () => void }) {
  const q = <T extends Element>(s: string) => root.querySelector(s) as T;
  const log = q<HTMLDivElement>('.t-log');
  const screen = q<HTMLDivElement>('.t-body');
  const input = q<HTMLInputElement>('.t-cmd');
  const caret = q<HTMLSpanElement>('.t-caret');
  const form = q<HTMLFormElement>('.t-prompt');
  const status = q<HTMLParagraphElement>('.t-status');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let alive = true;
  let projects: Project[] = [];
  let hpos = history.length;
  let draft = '';

  // ---------- dom helpers ----------
  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const a = (href: string, text: string) => {
    const x = el('a', '', text);
    x.href = href; x.target = '_blank'; x.rel = 'noopener';
    return x;
  };
  const cmdLink = (text: string, cmd: string) => {
    const b = el('button', 't-lnk', text);
    b.type = 'button'; b.dataset.cmd = cmd;
    return b;
  };
  const span = (cls: string, t: string) => el('span', cls, t);
  const toBottom = () => { screen.scrollTop = screen.scrollHeight; };
  const row = (...kids: (Node | string)[]) => {
    const r = el('div', 't-row');
    for (const k of kids) r.append(typeof k === 'string' ? document.createTextNode(k) : k);
    log.append(r); toBottom();
    return r;
  };
  const gap = () => log.append(el('div', 't-gap'));
  const announce = (t: string) => { status.textContent = ''; setTimeout(() => { status.textContent = t; }, 50); };
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // ---------- typed output ----------
  let skipTyping = false;
  const skip = () => { skipTyping = true; };
  root.addEventListener('keydown', skip, true);
  root.addEventListener('pointerdown', skip, true);
  async function typed(text: string, cls = '', speed = 11) {
    const r = el('div', `t-row ${cls}`);
    log.append(r);
    if (reduced || skipTyping) { r.textContent = text; toBottom(); return r; }
    r.setAttribute('aria-hidden', 'true');
    for (let i = 1; i <= text.length && alive; i++) {
      if (skipTyping) { r.textContent = text; break; }
      r.textContent = text.slice(0, i);
      toBottom();
      await sleep(text[i - 1] === ' ' ? speed / 2 : speed);
    }
    r.removeAttribute('aria-hidden'); toBottom();
    return r;
  }

  // ---------- data ----------
  async function load() {
    const p = await loadProjects();
    if (p) projects = p;
    return !!p;
  }
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '');
  function findProject(raw: string): Project | null {
    const s = raw.toLowerCase().trim().replace(/^["']|["']$/g, '');
    if (!s) return null;
    const n = norm(s);
    const exact = projects.find((p) => p.id.toLowerCase() === s || norm(p.id) === n || norm(p.name) === n);
    if (exact) return exact;
    const pre = n.length >= 3 ? projects.filter((p) => norm(p.id).startsWith(n) || norm(p.name).startsWith(n)) : [];
    return pre.length === 1 ? pre[0] : null;
  }

  // ---------- fuzzy suggestions ----------
  function lev(x: string, y: string) {
    const d = Array.from({ length: x.length + 1 }, (_, i) => [i, ...Array(y.length).fill(0)]);
    for (let j = 1; j <= y.length; j++) d[0][j] = j;
    for (let i = 1; i <= x.length; i++)
      for (let j = 1; j <= y.length; j++)
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (x[i - 1] === y[j - 1] ? 0 : 1));
    return d[x.length][y.length];
  }
  function closest(word: string, options: string[]) {
    let best: string | null = null, bd = 99;
    for (const o of options) {
      const dist = o.startsWith(word) && word.length >= 2 ? 0 : lev(word, o);
      if (dist < bd) { bd = dist; best = o; }
    }
    return bd <= Math.max(2, Math.floor(word.length / 3)) ? best : null;
  }

  // ---------- commands ----------
  const COMMANDS = ['help', 'whoami', 'ls', 'open', 'cat', 'ask', 'contact', 'clear', 'sudo', 'exit'];
  const HELP: [string, string][] = [
    ['whoami', 'who this is'],
    ['ls', 'list the projects'],
    ['cat <project>', 'pitch, headline result and stack'],
    ['open <project>', 'open the GitHub repo'],
    ['ask <question>', 'ask the portfolio; answers come with sources'],
    ['contact', 'where to reach Emilio'],
    ['clear', 'clear the screen'],
    ['exit', 'back to the page (or press esc)'],
  ];
  const short = (t: string, n: number) => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, '') + '...' : t);

  function openUrl(url: string, label: string) {
    row('opening ', a(url, label), span('t-dim', ' in a new tab'));
    const w = window.open(url, '_blank', 'noopener');
    if (!w) row(span('t-dim', 'Your browser blocked the tab; use the link above.'));
  }
  function unknownProject(cmd: string, arg: string) {
    const hit = closest(arg.toLowerCase(), projects.flatMap((p) => [p.id.toLowerCase(), p.name.toLowerCase()]));
    row(`${cmd}: no project called "${arg}". `);
    const p = hit ? findProject(hit) : null;
    if (p) row(span('t-dim', 'Did you mean '), cmdLink(`${cmd} ${p.id}`, `${cmd} ${p.id}`), span('t-dim', '?'));
    else row(span('t-dim', 'Try '), cmdLink('ls', 'ls'), span('t-dim', '.'));
  }

  const cmds: Record<string, (arg: string) => unknown> = {
    help() {
      const g = el('div', 't-cmds');
      for (const [c, d] of HELP) g.append(el('b', '', c), el('span', '', d));
      row(g);
      row(span('t-dim', 'Up/Down for history, Tab to complete.'));
    },
    whoami() {
      row(span('t-b', 'Emilio Gappa'));
      row(site.hero.bio);
      row('Master in Management at NOVA SBE, Lisbon. Open to internships from January 2027.');
      gap();
      row(span('t-dim', 'linkedin  '), a(LINKEDIN, 'emilio-gappa-44448223a'));
      row(span('t-dim', 'github    '), a(GITHUB, 'CH4RL3I'));
    },
    async ls() {
      if (!(await load())) return row(span('t-sig', 'could not load projects.json. The Work section of the page still works.'));
      const pub = projects.filter((p) => p.kind === 'public'), priv = projects.filter((p) => p.kind === 'private');
      const w = Math.max(...projects.map((p) => p.id.length)) + 2;
      row(span('t-dim', `open source (${pub.length})`));
      for (const p of pub) row(cmdLink(p.id, `cat ${p.id}`), span('t-dim', ' '.repeat(w - p.id.length) + short(p.pitch, 44)));
      gap();
      row(span('t-dim', `production and beta, private repos (${priv.length})`));
      for (const p of priv) row(cmdLink(p.id, `cat ${p.id}`), span('t-dim', ' '.repeat(w - p.id.length) + short(p.pitch, 44)));
      gap();
      row(span('t-dim', 'cat <name> for details, ask <question> to search them all.'));
    },
    async cat(arg) {
      await load();
      if (!arg) return row('usage: cat <project>   ', span('t-dim', 'try '), cmdLink('ls', 'ls'));
      const p = findProject(arg);
      if (!p) return unknownProject('cat', arg);
      row(span('t-b', p.name), span('t-dim', p.kind === 'private' ? '  private repository' : `  ${p.language || ''}`));
      row(p.pitch);
      gap();
      const dl = el('dl', 't-kv');
      if (p.headline) dl.append(el('dt', '', 'result'), el('dd', '', p.headline));
      dl.append(el('dt', '', 'stack'), el('dd', '', p.stack.join(', ') || 'n/a'));
      if (p.kind === 'public') { const dd = el('dd'); dd.append(a(p.url, p.url.replace('https://', ''))); dl.append(el('dt', '', 'repo'), dd); }
      if (p.homepage) { const dd = el('dd'); dd.append(a(p.homepage, p.homepage.replace('https://', ''))); dl.append(el('dt', '', 'live'), dd); }
      row(dl);
      if (p.kind === 'private') row(span('t-dim', 'The code is private; Emilio will walk through it on request. '), cmdLink('contact', 'contact'));
      else row(span('t-dim', 'Next: '), cmdLink(`open ${p.id}`, `open ${p.id}`), span('t-dim', ' for the repo, or '), cmdLink(`ask "how does ${p.id} work?"`, `ask "how does ${p.id} work?"`));
    },
    async open(arg) {
      await load();
      const a0 = (arg || '').toLowerCase();
      if (a0 === 'github') return openUrl(GITHUB, 'github.com/CH4RL3I');
      if (a0 === 'linkedin') return openUrl(LINKEDIN, 'linkedin.com/in/emilio-gappa');
      if (!arg) return row('usage: open <project>   ', span('t-dim', 'try '), cmdLink('ls', 'ls'));
      const p = findProject(arg);
      if (!p) return unknownProject('open', arg);
      if (p.kind === 'private') return row(`${p.name} is a private repository. `, span('t-dim', 'Emilio will walk through it on request: '), cmdLink('contact', 'contact'));
      openUrl(p.url, p.url.replace('https://', ''));
    },
    contact() {
      row('Message Emilio on LinkedIn, it is the fastest way:');
      row(a(LINKEDIN, 'linkedin.com/in/emilio-gappa-44448223a'));
      row(span('t-dim', 'Code: '), a(GITHUB, 'github.com/CH4RL3I'));
      row(span('t-dim', 'No email address is listed here on purpose.'));
    },
    clear() { log.textContent = ''; },
    async sudo(arg) {
      if (/^hire\s+(emilio|emilio gappa)$/i.test(arg.trim())) {
        row(span('t-dim', '[sudo] password for recruiter: '), '********');
        await sleep(reduced ? 0 : 450);
        row('recruiter is in the sudoers file. Offer accepted.');
        await sleep(reduced ? 0 : 350);
        row(span('t-ok', 'ok'), ' provisioning emilio ... done');
        row('Next step: ', a(LINKEDIN, 'message him on LinkedIn'), span('t-dim', ' (start date negotiable, coffee not).'));
        return;
      }
      row('sudo: a password is required. ', span('t-dim', 'Hint: '), cmdLink('sudo hire emilio', 'sudo hire emilio'));
    },
    exit() { onClose(); },
  };

  // ---------- ask ----------
  const EXAMPLES = ['what has he built with computer vision?', 'how does touchdown estimate pose?', 'has he shipped anything to production?'];

  function passageBlock(c: Pick<Chunk, 'url' | 'repo' | 'section'> & { text?: string }, question: string, label?: string) {
    const d = el('div', 't-passage');
    const h = el('div', 't-ph');
    if (label) h.append(span('t-dim', `[${label}] `));
    h.append(a(c.url, `${c.repo} / ${c.section}`));
    d.append(h);
    if (c.text) d.append(el('p', '', excerpt(c.text, question)));
    return d;
  }

  async function ask(arg: string) {
    const question = arg.trim().replace(/^(["'“])([\s\S]*)(["'”])$/, '$2').trim();
    if (!question) {
      row('usage: ask <question>');
      for (const e of EXAMPLES) row(span('t-dim', '  '), cmdLink(`ask "${e}"`, `ask "${e}"`));
      return;
    }
    if (question.length > MAX_QUESTION) return row(span('t-sig', `Questions are capped at ${MAX_QUESTION} characters.`));
    track('ask', { question, via: 'terminal' });
    const pend = row(span('t-dim t-pending', 'reading the write-ups'));
    const r = await askServer(question);
    pend.remove();
    if (r.kind === 'answer') {
      const ans = el('div', 't-answer');
      for (const part of splitCitations(r.data.answer)) ans.append(typeof part === 'string' ? document.createTextNode(part) : span('t-cite', `[${part}]`));
      if (!r.data.answerable) ans.classList.add('t-dim');
      log.append(ans);
      const index = r.data.sources.length ? await loadIndex() : null;
      const byId = new Map((index?.chunks ?? []).map((c) => [c.id, c]));
      for (const s of r.data.sources) log.append(passageBlock({ ...s, text: byId.get(s.id)?.text }, question, String(s.n)));
      row(span('t-dim', `// written by ${r.data.model} from the passages above`));
      toBottom();
      return announce(`Answer: ${r.data.answer.replace(/\[\d+\]/g, '')}`);
    }
    if (r.kind === 'rate-limited') return row(span('t-sig', 'Too many questions in a short time. Try again in a minute.'));
    if (r.kind === 'invalid') return row(span('t-sig', r.message));
    const hits = await localPassages(question, 4);
    if (!hits) return row(span('t-sig', 'The search index could not be loaded. Try ls.'));
    if (!hits.length) {
      row('No passage in the index matches that.');
      return row(span('t-dim', 'Try '), cmdLink(`ask "${EXAMPLES[0]}"`, `ask "${EXAMPLES[0]}"`), span('t-dim', ' or '), cmdLink('ls', 'ls'), span('t-dim', '.'));
    }
    row(span('t-dim', '// answer service unavailable, showing local ranking (BM25)'));
    for (const h of hits) log.append(passageBlock(h.chunk, question));
    toBottom();
    announce(`${hits.length} passages found, best match ${hits[0].chunk.repo}, ${hits[0].chunk.section}.`);
  }

  // ---------- dispatch ----------
  function parse(line: string): [string, string] {
    const t = line.trim();
    const i = t.search(/\s/);
    return i < 0 ? [t.toLowerCase(), ''] : [t.slice(0, i).toLowerCase(), t.slice(i + 1).trim()];
  }
  let busy: Promise<unknown> = Promise.resolve();
  const run = (line: string) => { busy = busy.then(() => exec(line)).catch(() => {}); return busy; };
  async function exec(line: string) {
    if (!alive) return;
    const t = line.trim();
    const r = el('div', 't-row t-echo');
    r.append(span('t-ps1', '$ '), document.createTextNode(t));
    log.append(r); toBottom();
    if (!t) return;
    const [name, arg] = parse(t);
    track('command', { name: name.slice(0, 32) });
    if (/^rm\s+-rf?\s+\/?/.test(t)) return row('rm: / is not mine to delete. ', span('t-dim', 'Try '), cmdLink('ls', 'ls'), span('t-dim', '.'));
    if (name === 'ask') return ask(arg);
    if (name === 'ls' || name === 'dir') return cmds.ls('');
    if (name === 'quit' || name === 'close') return cmds.exit('');
    const fn = Object.hasOwn(cmds, name) ? cmds[name] : null;
    if (fn) return fn(arg);
    const hit = closest(name, COMMANDS);
    row(`${name}: command not found`);
    if (hit) row(span('t-dim', 'Did you mean '), cmdLink(hit, hit), span('t-dim', '?'));
    else row(span('t-dim', 'Type '), cmdLink('help', 'help'), span('t-dim', ' for the list.'));
  }

  // ---------- input: history, tab completion, caret ----------
  function applyCompletion(opts: string[], typedSoFar: string, build: (o: string) => string) {
    if (!opts.length) return;
    if (opts.length === 1) { input.value = build(opts[0]); return syncCaret(); }
    let pre = opts[0];
    for (const o of opts) while (!o.toLowerCase().startsWith(pre.toLowerCase())) pre = pre.slice(0, -1);
    if (pre.length > typedSoFar.length) { input.value = build(pre); syncCaret(); }
    else row(span('t-dim', opts.join('  ')));
  }
  function complete() {
    const v = input.value, pos = input.selectionStart;
    if (pos !== v.length) return;
    const m = v.match(/^(\S*)(?:\s+(.*))?$/);
    if (!m) return;
    const first = m[1], rest = m[2];
    if (rest === undefined) {
      const bare = ['ls', 'help', 'clear', 'whoami', 'contact', 'exit'];
      return applyCompletion(COMMANDS.filter((c) => c.startsWith(first.toLowerCase())), first, (o) => o + (bare.includes(o) ? '' : ' '));
    }
    const f = first.toLowerCase();
    if (f === 'cat' || f === 'open') {
      const extra = f === 'open' ? ['github', 'linkedin'] : [];
      const opts = [...projects.map((p) => p.id), ...extra].filter((n) => n.toLowerCase().startsWith(rest.toLowerCase()));
      return applyCompletion(opts, rest, (o) => `${first} ${o}`);
    }
    if (f === 'sudo') applyCompletion(['hire emilio'].filter((o) => o.startsWith(rest.toLowerCase())), rest, (o) => `${first} ${o}`);
  }

  // Block caret drawn in ch units (the field is monospace). If the text outgrows the field, use the native caret.
  function syncCaret() {
    const over = input.scrollWidth > input.clientWidth + 1;
    input.classList.toggle('native', over);
    caret.classList.toggle('hide', over);
    caret.style.left = `${input.selectionStart ?? input.value.length}ch`;
    caret.classList.toggle('off', document.activeElement !== input);
  }
  const onCaret = () => requestAnimationFrame(syncCaret);
  const caretEvents = ['input', 'keyup', 'click', 'select', 'focus', 'blur'] as const;
  caretEvents.forEach((ev) => input.addEventListener(ev, onCaret));
  const onSel = () => { if (document.activeElement === input) syncCaret(); };
  document.addEventListener('selectionchange', onSel);

  input.addEventListener('keydown', (e) => {
    const end = () => requestAnimationFrame(() => { input.setSelectionRange(input.value.length, input.value.length); syncCaret(); });
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hpos === history.length) draft = input.value;
      if (hpos > 0) input.value = history[--hpos];
      end();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hpos < history.length) { hpos++; input.value = hpos === history.length ? draft : history[hpos]; }
      end();
    } else if (e.key === 'Tab' && !e.shiftKey) {
      e.preventDefault(); load().then(complete);
    } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
      e.preventDefault(); cmds.clear('');
    } else if (e.ctrlKey && e.key.toLowerCase() === 'c') {
      if (input.selectionStart === input.selectionEnd) {
        e.preventDefault();
        if (input.value) { row(span('t-echo', '$ '), input.value + '^C'); input.value = ''; syncCaret(); }
      }
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

  // Clicking in the terminal focuses the prompt, unless the user is selecting text or hitting a control.
  screen.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    if (String(getSelection()).length) return;
    input.focus({ preventScroll: true });
  });
  // Chips and in-terminal links carry data-cmd.
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-cmd]');
    if (!b?.dataset.cmd) return;
    skipTyping = true;
    run(b.dataset.cmd);
    input.focus({ preventScroll: true });
  });

  // ---------- boot ----------
  (async () => {
    input.focus({ preventScroll: true });
    syncCaret();
    const [ok, index] = await Promise.all([load(), loadIndex()]);
    if (!alive) return;
    await typed('gappa.me  tty1', 't-dim');
    await typed(
      ok && index ? `indexing ${index.chunks.length} passages from ${new Set(index.chunks.map((c) => c.repo)).size} sources ... ok` : 'indexing ... failed, ls may still work',
      ok && index ? 't-dim' : 't-sig',
      7,
    );
    await typed('ask is ready. Type help, or tap a suggestion below.', '', 14);
    gap();
    syncCaret();
  })();

  return () => {
    alive = false;
    document.removeEventListener('selectionchange', onSel);
  };
}
