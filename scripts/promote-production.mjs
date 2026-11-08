import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN } from '../public/site-config.js';

const [id, ...extra] = process.argv.slice(2);
if (!/^dpl_[a-zA-Z0-9]+$/.test(id ?? '') || extra.length) {
  console.error('Usage: npm run promote:production -- dpl_…');
  process.exit(1);
}

const cwd = fileURLToPath(new URL('..', import.meta.url));
const { orgId, projectId } = JSON.parse(readFileSync(new URL('../.vercel/project.json', import.meta.url), 'utf8'));
if (!orgId || !projectId) throw new Error('Link this checkout to the gappa-me Vercel project first.');

const team = orgId.startsWith('team_') ? { teamId: orgId } : {};
function api(path, query) {
  const params = new URLSearchParams({ ...team, ...query });
  const json = execFileSync('vercel', ['api', `${path}?${params}`, '--non-interactive'], { cwd, encoding: 'utf8', timeout: 20_000 });
  return JSON.parse(json);
}

const hostname = new URL(SITE_ORIGIN).hostname;
const aliasPath = `/v4/aliases/${hostname}`;
const live = api(aliasPath, { projectId });
if (live.alias !== hostname || live.projectId !== projectId) throw new Error(`This checkout is not linked to the project serving ${hostname}.`);

const candidate = api(`/v13/deployments/${id}`);
if (candidate.id !== id || candidate.projectId !== projectId || candidate.target !== 'production' || candidate.readyState !== 'READY') {
  throw new Error('Choose a ready, staged production deployment of the linked gappa-me project.');
}

if (live.deploymentId !== id) {
  execFileSync('vercel', ['promote', id, '--non-interactive', '--yes', '--timeout', '60s'], { cwd, stdio: 'inherit', timeout: 75_000 });
}
if (api(aliasPath, { projectId }).deploymentId !== id) throw new Error(`The promotion did not assign ${hostname} to ${id}.`);

execFileSync(process.execPath, [fileURLToPath(new URL('./check-live-ask.mjs', import.meta.url))], { cwd, stdio: 'inherit', timeout: 35_000 });
