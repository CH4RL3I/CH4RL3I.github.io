#!/usr/bin/env node
// Rebuilds data/projects.json and data/index.json (BM25), plus the copies the browser fetches from public/data/.
//
//   node scripts/build-index.mjs                      # refresh everything from GitHub (needs `gh auth login`)
//   node scripts/build-index.mjs mood-weighted hivemap   # add repos to data/projects.config.json, then refresh
//   node scripts/build-index.mjs --offline            # rebuild from data/cache/*.md without touching the network
//
// Only public READMEs (plus the profile README for private-project blurbs) are read.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync, existsSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildIndex } from '../lib/bm25.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const p = (...a) => join(root, ...a);
const cfgPath = p('data/projects.config.json');
const cfg = JSON.parse(readFileSync(cfgPath, 'utf8'));
const args = process.argv.slice(2);
const offline = args.includes('--offline');
const added = args.filter((a) => !a.startsWith('--'));
if (added.length) {
  for (const r of added) if (!cfg.repos.includes(r)) cfg.repos.push(r);
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2) + '\n');
}

mkdirSync(p('data/cache'), { recursive: true });
const gh = (...a) => execFileSync('gh', ['api', ...a], { encoding: 'utf8', maxBuffer: 16 << 20 });

function fetchRepo(id) {
  const cache = p('data/cache', `${id}.md`);
  const metaCache = p('data/cache', `${id}.json`);
  if (offline) {
    if (!existsSync(cache)) throw new Error(`no cache for ${id}`);
    return { readme: readFileSync(cache, 'utf8'), info: JSON.parse(readFileSync(metaCache, 'utf8')) };
  }
  const info = JSON.parse(gh(`repos/${cfg.owner}/${id}`));
  if (info.private) throw new Error(`${id} is private, refusing to index it`);
  const readme = gh('-H', 'Accept: application/vnd.github.raw', `repos/${cfg.owner}/${id}/readme`);
  const slim = { name: info.name, description: info.description, language: info.language, homepage: info.homepage, topics: info.topics || [], html_url: info.html_url };
  writeFileSync(cache, readme);
  writeFileSync(metaCache, JSON.stringify(slim, null, 2) + '\n');
  return { readme, info: slim };
}

// ---------- markdown helpers ----------
const ghSlug = (h) => h.toLowerCase().trim().replace(/[`*_~]/g, '').replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');

function clean(md) {
  return md
    .replace(/```[\s\S]*?```/g, '')                 // code blocks are noise for retrieval
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')            // images / badges
    .replace(/<[^>]+>/g, '')                         // html
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')         // links -> text
    .replace(/^\s*\|?[\s:|-]+\|[\s:|-]*$/gm, '')     // table separator rows
    .replace(/^\s*\|(.+)\|\s*$/gm, (_, r) => r.split('|').map((c) => c.trim()).filter(Boolean).join(', '))
    .replace(/(\*\*|__|\*|_|`)/g, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sections(md) {
  const lines = md.replace(/\r/g, '').split('\n');
  const out = [];
  let cur = { heading: 'Overview', body: [], h1: true };
  let fence = false;
  for (const line of lines) {
    if (/^```/.test(line)) fence = !fence;
    const m = !fence && line.match(/^(#{1,6})\s+(.*)$/);
    if (m) {
      if (cur.body.join('').trim()) out.push(cur);
      cur = { heading: m[2].trim(), body: [], level: m[1].length };
      if (m[1].length === 1) cur.heading = 'Overview';
    } else cur.body.push(line);
  }
  if (cur.body.join('').trim()) out.push(cur);
  return out;
}

const MAX = 900;
function pieces(text) {
  const paras = text.split(/\n\n+/);
  const out = [];
  let buf = '';
  for (const para of paras) {
    if (buf && (buf + '\n\n' + para).length > MAX) { out.push(buf); buf = para; }
    else buf = buf ? buf + '\n\n' + para : para;
  }
  if (buf) out.push(buf);
  return out.flatMap((b) => (b.length <= MAX * 1.6 ? [b] : b.match(new RegExp(`[\\s\\S]{1,${MAX}}(?:\\s|$)`, 'g')).map((s) => s.trim())));
}

const chunks = [];
const seen = new Map();
function addChunk(repo, section, text, url, anchor) {
  text = text.trim();
  if (text.length < 30) return;
  const base = `${repo}#${anchor || ghSlug(section) || 'section'}`;
  const n = (seen.get(base) || 0) + 1;
  seen.set(base, n);
  chunks.push({ id: n === 1 ? base : `${base}-${n}`, repo, section, url, text });
}

// ---------- public repos ----------
const projects = [];
for (const id of cfg.repos) {
  let r;
  try { r = fetchRepo(id); } catch (e) { console.warn(`skip ${id}: ${e.message.split('\n')[0]}`); continue; }
  const m = cfg.meta[id] || {};
  const repoUrl = r.info.html_url || `https://github.com/${cfg.owner}/${id}`;
  projects.push({
    id, name: id, kind: 'public', group: m.group || 'research',
    pitch: r.info.description || '', headline: m.headline || '', stack: m.stack || (r.info.language ? [r.info.language] : []),
    url: repoUrl, homepage: m.homepage || r.info.homepage || null, language: r.info.language || null, topics: r.info.topics || [],
  });
  const desc = r.info.description || '';
  const head = m.headline && !desc.includes(m.headline.slice(0, 24)) ? m.headline : '';
  const topics = (r.info.topics || []).map((t) => t.replace(/-/g, ' ')).join(', ');
  addChunk(id, 'Summary', `${id}: ${desc} ${head} Stack: ${(m.stack || []).join(', ')}.${topics ? ` Topics: ${topics}.` : ''}`.replace(/\s+/g, ' '), repoUrl, 'summary');
  for (const s of sections(r.readme)) {
    if (/^licen[sc]e$/i.test(s.heading)) continue;
    const body = clean(s.body.join('\n'));
    const url = s.heading === 'Overview' ? repoUrl : `${repoUrl}#${ghSlug(s.heading)}`;
    const parts = pieces(body);
    parts.forEach((part) => addChunk(id, s.heading, part, url, s.heading === 'Overview' ? 'overview' : undefined));
  }
}

// ---------- profile README: private projects + stack ----------
const profileUrl = `https://github.com/${cfg.owner}`;
const pr = fetchRepo(cfg.profileRepo);
const prof = sections(pr.readme);
const intro = prof.find((s) => s.heading === 'Overview');
if (intro) addChunk('profile', 'About', clean(intro.body.join('\n')), profileUrl, 'about');

const building = prof.find((s) => /building/i.test(s.heading));
const privateOut = [];
const publicIds = new Set(cfg.repos.map((x) => x.toLowerCase()));
for (const line of (building?.body || [])) {
  const m = line.match(/^\s*[-*]\s+\*\*(?:\[([^\]]+)\]\([^)]*\)|([^*]+))\*\*\s*[—–-]\s*(.*)$/);
  if (!m) continue;
  const name = (m[1] || m[2]).trim();
  if (publicIds.has(name.toLowerCase())) continue;           // has its own repo: handled above
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const conf = cfg.private[slug] || Object.values(cfg.private).find((x) => x.name === name) || {};
  const id = cfg.private[slug] ? slug : Object.keys(cfg.private).find((k) => cfg.private[k].name === name) || slug;
  const body = clean(m[3]);
  const status = (m[3].match(/\*([^*]+)\*\s*$/) || [])[1];
  const pitch = (status ? body.replace(status, '') : body).replace(/\bmy\b/g, 'his').trim();
  privateOut.push({
    id, name: conf.name || name, kind: 'private', group: 'product',
    pitch: (/^[a-z][A-Z]/.test(pitch) ? pitch : pitch.charAt(0).toUpperCase() + pitch.slice(1)).replace(/\.?$/, '.'), headline: conf.headline || status || '', stack: conf.stack || [],
    url: profileUrl, homepage: null, language: null, topics: [],
  });
  addChunk(id, 'Overview', `${conf.name || name}: ${body.replace(/\bmy\b/g, 'his')} Private repository, code walkthrough on request.`, profileUrl, 'overview');
}
projects.push(...privateOut);

const icons = (pr.readme.match(/skillicons\.dev\/icons\?i=([a-z0-9,]+)/) || [])[1];
const ICON = { ts: 'TypeScript', react: 'React', nextjs: 'Next.js', swift: 'Swift', tailwind: 'Tailwind CSS', postgres: 'PostgreSQL', prisma: 'Prisma', python: 'Python', azure: 'Azure', vercel: 'Vercel', js: 'JavaScript', node: 'Node.js', docker: 'Docker', git: 'Git' };
if (icons) addChunk('profile', 'Stack', `Emilio's stack, as listed on his GitHub profile: ${icons.split(',').map((i) => ICON[i] || i).join(', ')}.`, profileUrl, 'stack');

// ---------- this site's own texts: cards and timeline from content/site.json ----------
// Lets `ask` answer about work that has no public README (employer work, private products).
const sitePath = p('content/site.json');
if (existsSync(sitePath)) {
  const site = JSON.parse(readFileSync(sitePath, 'utf8'));
  const home = 'https://gappa.me/';
  const slug = (x) => x.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  addChunk('gappa.me', 'About', `Emilio Gappa, based in ${site.hero.place}. ${site.hero.eyebrow}. ${site.hero.bio}`, home, 'about');
  for (const pj of site.projects) {
    const text = `${pj.name} (${pj.kind}): ${pj.what} ${pj.figure}: ${pj.figureCaption}. ${pj.result} Stack: ${pj.stack.join(', ')}.${pj.note ? ` ${pj.note}.` : ''}`;
    addChunk('gappa.me', `Work: ${pj.name}`, text, `${home}#work`, `work-${slug(pj.id)}`);
  }
  for (const e of site.resume.work) {
    addChunk('gappa.me', `Work experience: ${e.org}`, `Emilio worked as ${e.role}, ${e.org} (${e.place}), ${e.start} to ${e.end}. ${e.line}`, `${home}#resume`, `resume-${slug(e.org)}`);
  }
  for (const e of site.resume.education) {
    addChunk('gappa.me', `Education: ${e.org}`, `Study: Emilio studied ${e.role} at ${e.org} (${e.place}), ${e.start} to ${e.end}. ${e.line}`, `${home}#resume`, `education-${slug(e.org)}`);
  }
}

// ---------- write ----------
const index = buildIndex(chunks);
const min = (o) => JSON.stringify(o);
const projOut = { owner: cfg.owner, links: { github: profileUrl, linkedin: 'https://www.linkedin.com/in/emilio-gappa-44448223a/' }, projects };
writeFileSync(p('data/projects.json'), JSON.stringify(projOut, null, 2) + '\n');
writeFileSync(p('data/index.json'), min(index));
mkdirSync(p('public/data'), { recursive: true });
copyFileSync(p('data/index.json'), p('public/data/index.json'));
writeFileSync(p('public/data/projects.json'), min(projOut));

const kb = (readFileSync(p('data/index.json')).length / 1024).toFixed(0);
console.log(`${projects.length} projects, ${chunks.length} chunks, index.json ${kb} KB`);
