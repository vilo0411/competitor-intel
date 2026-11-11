#!/usr/bin/env node
// CI entry point. Runs competitors.mjs for queued requests and records one status file per request in docs/_runs/.
//   node scripts/process-requests.mjs queue                 run every requests/*.json, then delete it
//   node scripts/process-requests.mjs enqueue <json>        write a request file (used by the "Run workflow" button)
//   node scripts/process-requests.mjs refresh-all           queue a --refresh for every saved competitor (weekly schedule)
//   node scripts/process-requests.mjs offline               rebuild every report from cache, no TikTok calls
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQ = path.join(ROOT, 'requests'), DOCS = path.join(ROOT, 'docs'), RUNS = path.join(DOCS, '_runs');
const SCRIPT = path.join(ROOT, 'scripts', 'competitors.mjs');
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const stamp = () => new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const savedCompetitors = () => fs.existsSync(DOCS) ? fs.readdirSync(DOCS).map(d => readJson(path.join(DOCS, d, 'competitor.json'))).filter(Boolean) : [];

function enqueue(req) {
  fs.mkdirSync(REQ, { recursive: true });
  const id = req.id || `${stamp()}-${slugify(req.name || req.channels?.[0] || 'run')}`;
  fs.writeFileSync(path.join(REQ, `${id}.json`), JSON.stringify({ ...req, id }, null, 2));
  return id;
}

function run(req, extra = []) {
  const name = (req.name || '').trim();
  const channels = (Array.isArray(req.channels) ? req.channels : String(req.channels || '').split(/[\s,]+/))
    .map(c => c.trim()).filter(Boolean).map(c => (c.startsWith('@') || c.includes('tiktok.com') ? c : '@' + c));
  const args = [SCRIPT, ...(name ? [name] : []), ...channels, '--out', DOCS,
    '--limit', String(req.limit ?? 300), '--style', String(req.style ?? 5), ...(req.refresh ? ['--refresh'] : []), ...extra];
  console.log(`\n=== ${name || channels.join(' ')} ${extra.join(' ')} ===`);
  const t0 = Date.now();
  const r = spawnSync(process.execPath, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 });
  const log = `${r.stdout || ''}${r.stderr || ''}`;
  process.stdout.write(log);
  const slug = slugify(name || channels[0]?.match(/@([\w.-]+)/)?.[1] || '');
  return { status: r.status === 0 ? 'ok' : 'error', slug, name: readJson(path.join(DOCS, slug, 'competitor.json'))?.name || name,
    report: r.status === 0 ? `${slug}/${slug}.html` : null, seconds: Math.round((Date.now() - t0) / 1000),
    log: log.trim().split('\n').slice(-25).join('\n') };
}

const [mode, arg] = process.argv.slice(2);
if (mode === 'enqueue') {
  console.log(enqueue(JSON.parse(arg)));
} else if (mode === 'refresh-all') {
  for (const c of savedCompetitors()) enqueue({ name: c.name, refresh: true });
} else if (mode === 'offline') {
  for (const c of savedCompetitors()) {
    const r = run({ name: c.name }, ['--offline']);
    if (r.status !== 'ok') console.error(`! offline rebuild failed for ${c.name}`);
  }
} else if (mode === 'queue') {
  const files = fs.existsSync(REQ) ? fs.readdirSync(REQ).filter(f => f.endsWith('.json')).sort() : [];
  if (!files.length) console.log('No queued requests.');
  fs.mkdirSync(RUNS, { recursive: true });
  let failed = 0;
  for (const f of files) {
    const req = readJson(path.join(REQ, f), {});
    const id = req.id || f.replace(/\.json$/, '');
    const res = run(req);
    if (res.status !== 'ok') failed++;
    fs.writeFileSync(path.join(RUNS, `${id}.json`), JSON.stringify({ id, request: req, finishedAt: new Date().toISOString(), ...res }, null, 2));
    fs.rmSync(path.join(REQ, f));
  }
  // Keep the run log short: last 50 records
  const runs = fs.readdirSync(RUNS).filter(f => f.endsWith('.json')).sort();
  for (const f of runs.slice(0, -50)) fs.rmSync(path.join(RUNS, f));
  if (failed) console.error(`${failed} request(s) failed — see docs/_runs/`);
} else {
  console.error('Usage: process-requests.mjs queue | enqueue <json> | refresh-all | offline');
  process.exit(2);
}
