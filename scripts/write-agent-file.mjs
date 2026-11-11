#!/usr/bin/env node
// Writes one agent-authored file from workflow_dispatch inputs (W_PATH, W_CONTENT), for agents without git (e.g. ChatGPT).
// Only the three agent files inside an existing competitor folder are allowed; labels.json is validated and merged.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rel = (process.env.W_PATH || '').trim().replace(/\\/g, '/');
const content = process.env.W_CONTENT || '';
const ALLOWED = /^docs\/([a-z0-9-]+)\/(insights\.md|tiktok\/([A-Za-z0-9._-]+)\/(labels\.json|style\.md))$/;
const m = rel.match(ALLOWED);
const fail = msg => { console.error(`write-agent-file: ${msg}`); process.exit(1); };

if (!m) fail(`path not allowed: "${rel}" (allowed: docs/<slug>/insights.md, docs/<slug>/tiktok/<handle>/labels.json|style.md)`);
if (!content.trim()) fail('write_content is empty');
if (!fs.existsSync(path.join(ROOT, 'docs', m[1], 'competitor.json'))) fail(`competitor "${m[1]}" does not exist yet — run an analysis first`);
if (m[3] && !fs.existsSync(path.join(ROOT, 'docs', m[1], 'tiktok', m[3]))) fail(`channel "${m[3]}" not found under ${m[1]}`);

const file = path.join(ROOT, rel);
if (rel.endsWith('labels.json')) {
  let incoming;
  try { incoming = JSON.parse(content); } catch (e) { fail(`labels.json is not valid JSON: ${e.message}`); }
  if (!incoming || typeof incoming !== 'object' || Array.isArray(incoming) || Object.values(incoming).some(v => typeof v !== 'string'))
    fail('labels.json must be an object { "<video id>": "<category>" }');
  // Merge so an agent can send labels in several batches
  let existing = {};
  try { existing = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  fs.writeFileSync(file, JSON.stringify({ ...existing, ...incoming }, null, 2) + '\n');
  console.log(`labels.json: +${Object.keys(incoming).length} (total ${Object.keys({ ...existing, ...incoming }).length})`);
} else {
  fs.writeFileSync(file, content.replace(/\r\n/g, '\n').trimEnd() + '\n');
  console.log(`wrote ${rel} (${content.length} chars)`);
}
