#!/usr/bin/env node
// Builds docs/index.html: one card per competitor (from summary.json) + the latest runs (docs/_runs/).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return d; } };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = n => n == null ? '—' : n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} tr` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n));

fs.mkdirSync(DOCS, { recursive: true });
const competitors = fs.readdirSync(DOCS, { withFileTypes: true })
  .filter(d => d.isDirectory() && !d.name.startsWith('_'))
  .map(d => {
    const dir = path.join(DOCS, d.name), s = readJson(path.join(dir, 'summary.json'));
    if (!s) return null;
    const ch = s.tiktok || [];
    // What the agent still has to do for this competitor
    const todo = [];
    if (ch.some(c => readJson(path.join(dir, 'tiktok', c.handle, 'labels.todo.json'), []).length)) todo.push('gắn nhãn');
    if (ch.some(c => c.styles?.length && !fs.existsSync(path.join(dir, 'tiktok', c.handle, 'style.md')))) todo.push('style.md');
    if (!fs.existsSync(path.join(dir, 'insights.md'))) todo.push('nhận định');
    return { slug: d.name, name: s.name, updated: s.updated, ch, todo };
  })
  .filter(Boolean)
  .sort((a, b) => b.updated.localeCompare(a.updated));

const runsDir = path.join(DOCS, '_runs');
const runs = fs.existsSync(runsDir) ? fs.readdirSync(runsDir).filter(f => f.endsWith('.json')).sort().reverse().slice(0, 10)
  .map(f => readJson(path.join(runsDir, f))).filter(Boolean) : [];

const card = c => `<a class="card" href="${esc(c.report || `${c.slug}/${c.slug}.html`)}">
<h2>${esc(c.name)}</h2>
<p class="muted">Cập nhật ${esc(c.updated)} · ${c.ch.map(x => '@' + esc(x.handle)).join(' · ')}</p>
<div class="kpis">${c.ch.map(x => `<div><span>@${esc(x.handle)}</span><b>${fmt(x.profile?.followers)}</b><small>follower · trung vị ${fmt(x.stats?.medianViews)} view · ${(x.stats?.postsPerWeek ?? 0).toFixed(1).replace('.', ',')} video/tuần</small></div>`).join('')}</div>
${c.todo.length ? `<p class="todo">Chưa xong: ${c.todo.map(esc).join(', ')}</p>` : '<p class="done">Đủ nhận định</p>'}
</a>`;

const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Phân tích đối thủ</title><style>
:root{--ink:#1d1d1f;--ink2:#48484a;--muted:#86868b;--line:#e5e5ea;--bg:#f5f5f7;--surface:#fff;--hi:#2a6df4;--warn:#b25000;--ok:#1a7f37}
@media (prefers-color-scheme:dark){:root{--ink:#f5f5f7;--ink2:#d1d1d6;--muted:#98989d;--line:#38383a;--bg:#000;--surface:#1c1c1e;--hi:#5b8cff;--warn:#ff9f0a;--ok:#30d158}}
body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif}
main{max-width:1000px;margin:0 auto;padding:32px 20px}h1{font-size:30px;margin:0 0 4px}.muted{color:var(--muted);margin:0}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;margin-top:24px}
.card{display:block;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:18px;color:inherit;text-decoration:none}.card:hover{border-color:var(--hi)}
.card h2{margin:0 0 2px;font-size:19px}.kpis{display:grid;gap:10px;margin:14px 0 8px}.kpis span{display:block;color:var(--muted);font-size:12px}.kpis b{font-size:22px}.kpis small{display:block;color:var(--ink2);font-size:12px}
.todo{color:var(--warn);font-size:13px;margin:8px 0 0}.done{color:var(--ok);font-size:13px;margin:8px 0 0}
h3{margin:36px 0 8px;font-size:16px}table{width:100%;border-collapse:collapse;font-size:13px;background:var(--surface);border-radius:12px;overflow:hidden}td,th{padding:7px 10px;border-bottom:1px solid var(--line);text-align:left}
.err{color:var(--warn)}code{font-size:12px}a{color:var(--hi)}
</style></head><body><main>
<h1>Phân tích đối thủ</h1>
<p class="muted">Dữ liệu công khai từ TikTok, chạy trên GitHub Actions. Thêm đối thủ: tab <b>Actions → analyze → Run workflow</b>, hoặc nhờ Claude Code (skill <code>analyzing-competitors</code>).</p>
${competitors.length ? `<div class="grid">${competitors.map(card).join('')}</div>` : '<p style="margin-top:24px">Chưa có đối thủ nào.</p>'}
${runs.length ? `<h3>Lần chạy gần nhất</h3><table><tr><th>Thời điểm (UTC)</th><th>Đối thủ</th><th>Kết quả</th><th>Thời gian</th></tr>
${runs.map(r => `<tr><td>${esc((r.finishedAt || '').slice(0, 16).replace('T', ' '))}</td><td>${r.report ? `<a href="${esc(r.report)}">${esc(r.name)}</a>` : esc(r.name || r.id)}</td><td class="${r.status === 'ok' ? '' : 'err'}">${r.status === 'ok' ? 'OK' : 'Lỗi'}</td><td>${r.seconds ?? '—'}s</td></tr>`).join('')}</table>` : ''}
</main></body></html>`;
fs.writeFileSync(path.join(DOCS, 'index.html'), html);
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');
console.log(`index.html: ${competitors.length} competitor(s), ${runs.length} run(s)`);
