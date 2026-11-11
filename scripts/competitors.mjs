#!/usr/bin/env node
// Phân tích đối thủ (miễn phí): mỗi đối thủ là một thư mục, trong đó có các kênh theo nền tảng (hiện có TikTok).
// TikTok: yt-dlp lấy danh sách video + trang profile công khai, tính chỉ số rồi xuất <đối-thủ>.html (biểu đồ SVG) + <đối-thủ>.md.
// node competitors.mjs "<Tên đối thủ>" @kenh1 https://www.tiktok.com/@kenh2 [--out root] [--limit N] [--style N] [--refresh] [--offline]
// --style N: tải N video top, tách khung hình + chép lời (scripts/video/*.sh) để đo nhịp dựng.
// --offline: chỉ dùng dữ liệu đã cache, không gọi TikTok (dựng lại báo cáo sau khi sửa labels/style/insights).
// Chạy lại chỉ với tên đối thủ sẽ dùng danh sách kênh đã lưu trong competitor.json.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TZ = 'Asia/Ho_Chi_Minh';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const UNLABELED = 'Chưa phân loại';
const PLATFORMS = { tiktok: 'TikTok' };

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf(name); return i < 0 ? def : args[i + 1]; };
const flag = name => args.includes(name);
const valueFlags = new Set(['--out', '--limit', '--style']);
const positional = args.filter((a, i) => !a.startsWith('--') && !valueFlags.has(args[i - 1]));
const isTiktok = a => a.startsWith('@') || /tiktok\.com\/@/.test(a);
const slugify = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const today = new Date().toLocaleDateString('en-CA', { timeZone: TZ });
const LIMIT = Number(opt('--limit', 300));
const STYLE = Number(opt('--style', 5));
const OFFLINE = flag('--offline');
const VIDEO_SCRIPTS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'video');

let tiktok = positional.filter(isTiktok).map(a => a.match(/@([\w.-]+)/)[1]);
let name = positional.filter(a => !isTiktok(a)).join(' ').trim() || tiktok[0];
if (!name) {
  console.error('Cách dùng: node competitors.mjs "<Tên đối thủ>" @kenh1 @kenh2 [--out root] [--limit 300] [--style 5] [--refresh] [--offline]');
  process.exit(2);
}
const SLUG = slugify(name);
const OUT = path.resolve(opt('--out', 'docs'), SLUG);
const metaFile = path.join(OUT, 'competitor.json');
const meta = (() => { try { return JSON.parse(fs.readFileSync(metaFile, 'utf8')); } catch { return null; } })();
if (meta) {
  // Thư mục đã đặt theo tên đối thủ nên giữ tên hiển thị đã lưu (gõ thường hay có dấu đều trỏ về cùng thư mục)
  name = meta.name;
  tiktok = [...new Set([...(meta.channels?.tiktok || []), ...tiktok])];
}
if (!tiktok.length) { console.error(`Đối thủ "${name}" chưa có kênh nào. Thêm @handle TikTok vào lệnh.`); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(metaFile, JSON.stringify({ name, channels: { tiktok } }, null, 2));

// ---------- thu thập ----------
const readJson = (f, def) => { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return def; } };
const writeJson = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2));

function scrapeVideos(handle) {
  const r = spawnSync('yt-dlp', ['--flat-playlist', '-J', '--playlist-end', String(LIMIT), `https://www.tiktok.com/@${handle}`],
    { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`yt-dlp lỗi với @${handle}: ${(r.stderr || '').trim().split('\n').pop()}`);
  return JSON.parse(r.stdout).entries.map(e => ({
    id: e.id, title: e.description || e.title || '', timestamp: e.timestamp, duration: e.duration,
    views: e.view_count ?? 0, likes: e.like_count ?? 0, comments: e.comment_count ?? 0,
    shares: e.repost_count ?? 0, saves: e.save_count ?? 0, track: e.track || '',
    cover: (e.thumbnails || []).find(t => t.id === 'cover')?.url || e.thumbnails?.[0]?.url || '',
    url: `https://www.tiktok.com/@${handle}/video/${e.id}`,
  }));
}

// WAF của TikTok hay chặn UA desktop (trả trang thử thách) nên thử UA điện thoại trước
const PROFILE_UAS = ['Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1', UA];
async function scrapeProfile(handle) {
  for (const ua of PROFILE_UAS) {
    const html = spawnSync('curl', ['-sL', '-A', ua, '-H', 'accept-language: en-US,en;q=0.9', `https://www.tiktok.com/@${handle}`], { encoding: 'utf8', maxBuffer: 1 << 26 }).stdout || '';
    const num = k => Number((html.match(new RegExp(`"${k}":"?(\\d+)`)) || [])[1]) || null;
    const str = k => { const m = html.match(new RegExp(`"${k}":"((?:[^"\\\\]|\\\\.)*)"`)); try { return m ? JSON.parse(`"${m[1]}"`) : ''; } catch { return ''; } };
    if (num('followerCount')) return { followers: num('followerCount'), hearts: num('heartCount'), videoCount: num('videoCount'), nickname: str('nickname'), bio: str('signature') };
  }
  console.warn(`! @${handle}: TikTok chặn trang profile, thiếu số follower (chạy lại sau ít phút với --refresh)`);
  return {};
}

async function download(url, file) {
  if (fs.existsSync(file) || !url || OFFLINE) return fs.existsSync(file);
  try {
    const res = await fetch(url, { headers: { 'user-agent': UA } });
    if (!res.ok) return false;
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch { return false; }
}

// Phong cách dựng của một video: khung hình + lưới montage + chép lời (whisper-cli, miễn phí) rồi đo nhịp.
// Ngưỡng 0.06 bắt cả kiểu đổi hình minh hoạ trên nền tĩnh, còn 0.3 chỉ bắt cắt cảnh hẳn.
function analyzeStyle(v, dir) {
  const out = path.join(dir, 'style.json');
  const cached = readJson(out);
  if (cached) return cached;
  if (OFFLINE) return null;
  fs.mkdirSync(dir, { recursive: true });
  const mp4 = path.join(dir, 'video.mp4');
  if (!fs.existsSync(mp4) && spawnSync('yt-dlp', ['-q', '-f', 'b[ext=mp4]/b', '-o', mp4, v.url]).status !== 0) return null;
  const dur = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], { encoding: 'utf8' }).stdout) || v.duration || 60;
  const sh = (script, ...a) => spawnSync('bash', [path.join(VIDEO_SCRIPTS, script), ...a.map(String)], { encoding: 'utf8', maxBuffer: 1 << 26 });
  sh('extract-frames.sh', mp4, path.join(dir, 'frames'), dur <= 90 ? 2 : 1, 180, 'auto', '3x5');
  sh('extract-audio.sh', mp4, path.join(dir, 'audio'), 'large');
  const changesAt = t => [...spawnSync('ffmpeg', ['-hide_banner', '-i', mp4, '-map', '0:v:0', '-vf', `select='gt(scene,${t})',showinfo`, '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).stderr
    .matchAll(/pts_time:([\d.]+)/g)].map(m => Number(m[1]));
  const changes = changesAt(0.06), cuts = changesAt(0.3);
  // Dải 6 khung hình của 3 giây đầu (cắt bớt nền trên/dưới của khung 9:16): nhìn ngay câu móc bằng hình
  spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp4, '-t', '3', '-vf', 'fps=2,crop=iw:ih*0.62,scale=240:-1,tile=6x1', '-frames:v', '1', path.join(dir, 'hook.jpg')]);
  const audio = readJson(path.join(dir, 'audio', 'audio.json'), { words: [], segments: [] });
  const words = audio.words || [];
  const speech = (audio.segments || []).reduce((a, x) => a + Math.max(0, Math.min(x.end, dur) - x.start), 0);
  const vol = (() => { try { return fs.readFileSync(path.join(dir, 'audio', 'volume.txt'), 'utf8'); } catch { return ''; } })();
  const style = {
    id: v.id, duration: dur, language: audio.language || '',
    changes: changes.length, secPerChange: dur / (changes.length + 1), cuts: cuts.length,
    changesFirst3s: changes.filter(t => t < 3).length, firstChangeAt: changes[0] ?? null,
    wpm: speech ? words.length / speech * 60 : 0, speechCoverage: Math.min(1, speech / dur),
    lufs: Number((vol.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*LRA/) || [])[1]) || null,
    hook: words.filter(w => w.start < 3).map(w => w.word).join(' ').trim(),
    transcript: (audio.text || '').trim(),
    grids: fs.existsSync(path.join(dir, 'frames')) ? fs.readdirSync(path.join(dir, 'frames')).filter(n => n.startsWith('grid_')).sort() : [],
  };
  writeJson(out, style);
  // Giữ lưới montage, khung chuyển cảnh và lời thoại; bỏ video và khung lẻ cho nhẹ thư mục
  fs.rmSync(mp4, { force: true });
  fs.rmSync(path.join(dir, 'audio', 'audio.wav'), { force: true });
  for (const n of fs.readdirSync(path.join(dir, 'frames'))) if (n.startsWith('frame_')) fs.rmSync(path.join(dir, 'frames', n));
  // Key frames are high-res duplicates of the grids; drop them to keep the public repo small
  fs.rmSync(path.join(dir, 'frames', 'key_frames'), { recursive: true, force: true });
  return style;
}

// ---------- chỉ số ----------
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const mean = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const er = v => v.views ? (v.likes + v.comments + v.shares + v.saves) / v.views : 0;
const parts = ts => {
  const d = new Date(ts * 1000);
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
    .formatToParts(d).reduce((o, p) => (o[p.type] = p.value, o), {});
  return { date: `${f.year}-${f.month}-${f.day}`, month: `${f.year}-${f.month}`, hour: Number(f.hour) % 24, time: `${f.hour}:${f.minute}`,
    weekday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(f.weekday) };
};
const hashtags = t => (t.match(/#[\p{L}\p{N}_]+/gu) || []).map(h => h.toLowerCase());
const group = (vs, key) => {
  const m = new Map();
  for (const v of vs) { const k = key(v); if (!m.has(k)) m.set(k, []); m.get(k).push(v); }
  return [...m].map(([name, list]) => ({ name, count: list.length, median: median(list.map(v => v.views)), mean: mean(list.map(v => v.views)) }));
};
const TIME_BUCKETS = [[5, 11, 'Sáng (5–11h)'], [11, 14, 'Trưa (11–14h)'], [14, 18, 'Chiều (14–18h)'], [18, 23, 'Tối (18–23h)'], [23, 29, 'Đêm (23–5h)']];
const DURATION_BUCKETS = [[0, 30, '≤30s'], [31, 45, '31–45s'], [46, 60, '46–60s'], [61, 90, '61–90s'], [91, 1e9, '>90s']];

function analyze(handle, profile, videos, labels) {
  const vs = videos.filter(v => v.timestamp).map(v => ({ ...v, ...parts(v.timestamp), er: er(v), category: labels[v.id] || UNLABELED, tags: hashtags(v.title) }))
    .sort((a, b) => a.timestamp - b.timestamp);
  const views = vs.map(v => v.views), med = median(views);
  for (const v of vs) v.ratio = med ? v.views / med : 0;
  const spanDays = Math.max(1, (vs.at(-1).timestamp - vs[0].timestamp) / 86400);
  const gaps = vs.slice(1).map((v, i) => (v.timestamp - vs[i].timestamp) / 86400);
  const months = group(vs, v => v.month).sort((a, b) => a.name.localeCompare(b.name));
  const weekdays = WEEKDAYS.map((name, i) => { const l = vs.filter(v => v.weekday === i); return { name, count: l.length, median: median(l.map(v => v.views)) }; });
  const timeBuckets = TIME_BUCKETS.map(([lo, hi, name]) => { const l = vs.filter(v => (v.hour < 5 ? v.hour + 24 : v.hour) >= lo && (v.hour < 5 ? v.hour + 24 : v.hour) < hi); return { name, count: l.length, median: median(l.map(v => v.views)) }; });
  const durations = DURATION_BUCKETS.map(([lo, hi, name]) => { const l = vs.filter(v => v.duration >= lo && v.duration <= hi); return { name, count: l.length, median: median(l.map(v => v.views)) }; }).filter(d => d.count);
  const tagMap = new Map();
  for (const v of vs) for (const t of new Set(v.tags)) { if (!tagMap.has(t)) tagMap.set(t, []); tagMap.get(t).push(v.views); }
  const tags = [...tagMap].map(([name, l]) => ({ name, count: l.length, median: median(l) })).sort((a, b) => b.count - a.count).slice(0, 15);
  const categories = group(vs, v => v.category).sort((a, b) => b.median - a.median);
  const lastDays = Math.floor((Date.now() / 1000 - vs.at(-1).timestamp) / 86400);
  return {
    handle, profile, videos: vs, months, weekdays, timeBuckets, durations, tags, categories,
    labeled: vs.some(v => v.category !== UNLABELED),
    stats: {
      n: vs.length, first: vs[0].date, last: vs.at(-1).date, daysSinceLast: lastDays,
      totalViews: views.reduce((a, b) => a + b, 0), meanViews: mean(views), medianViews: med,
      maxViews: Math.max(...views), minViews: Math.min(...views), medianER: median(vs.map(v => v.er)),
      postsPerWeek: vs.length / spanDays * 7, medianGapDays: median(gaps),
      postsLast30: vs.filter(v => Date.now() / 1000 - v.timestamp <= 30 * 86400).length,
      medianDuration: median(vs.map(v => v.duration || 0)),
      originalSoundShare: vs.filter(v => /original sound|âm thanh gốc/i.test(v.track)).length / vs.length,
      viralCount: vs.filter(v => v.ratio >= 3).length,
    },
    top: [...vs].sort((a, b) => b.views - a.views).slice(0, 10),
  };
}

// ---------- định dạng ----------
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const vn = (n, d = 1) => n.toFixed(d).replace('.', ',');
const fmt = n => n == null ? '—' : n >= 1e6 ? `${vn(n / 1e6)} tr` : n >= 1e3 ? `${Math.round(n / 1e3)}k` : String(Math.round(n));
const pct = x => `${vn(x * 100)}%`;
const niceMax = m => { if (m <= 0) return 1; const p = 10 ** Math.floor(Math.log10(m)); return [1, 2, 2.5, 5, 10].map(k => k * p).find(k => k >= m); };

// ---------- nhận định tự động + biểu đồ ----------
// Mỗi biểu đồ trả lời một câu hỏi; tiêu đề là câu trả lời tính từ dữ liệu. Nhóm dưới MIN_N video bị đánh dấu "ít mẫu".
const MIN_N = 5;
const W = 720;
const monthLabel = m => `T${Number(m.slice(5))}/${m.slice(2, 4)}`;
const times = x => x >= 10 ? `${Math.round(x)}×` : `${vn(x)}×`;
const bestOf = items => items.filter(i => i.count >= MIN_N).sort((a, b) => b.median - a.median)[0];

function takeaways(c) {
  const s = c.stats, vs = c.videos, t = {};
  const named = c.categories.filter(x => x.name !== UNLABELED);
  if (c.labeled && named.length > 1) {
    const win = bestOf(named) || named[0], low = [...named].sort((a, b) => a.median - b.median)[0];
    t.category = `**${win.name}** thắng: trung vị ${fmt(win.median)} view/video, gấp ${times(win.median / Math.max(1, low.median))} nhóm thấp nhất (${low.name})`;
    const shares = named.map(x => ({ ...x, postShare: x.count / s.n, viewShare: vs.filter(v => v.category === x.name).reduce((a, v) => a + v.views, 0) / s.totalViews }));
    const waste = shares.sort((a, b) => (a.viewShare - a.postShare) - (b.viewShare - b.postShare))[0];
    if (waste.postShare - waste.viewShare > 0.1) t.share = `**${waste.name}** chiếm ${pct(waste.postShare)} số video nhưng chỉ mang về ${pct(waste.viewShare)} tổng view`;
    c.shares = shares.sort((a, b) => b.viewShare - a.viewShare);
  }
  const top3 = c.top.slice(0, 3).reduce((a, v) => a + v.views, 0) / s.totalViews;
  t.viral = top3 > 0.4 ? `Top 3 video chiếm **${pct(top3)}** tổng view: kênh sống nhờ vài cú viral, video thường chỉ quanh ${fmt(s.medianViews)}`
    : `Top 3 video chiếm ${pct(top3)} tổng view: view phân bố khá đều, video thường đạt ${fmt(s.medianViews)}`;
  if (c.months.length >= 4) {
    const k = Math.min(3, Math.floor(c.months.length / 2)), a = c.months.slice(0, k).map(m => m.name), b = c.months.slice(-k).map(m => m.name);
    const ma = median(vs.filter(v => a.includes(v.month)).map(v => v.views)), mb = median(vs.filter(v => b.includes(v.month)).map(v => v.views));
    const dir = mb < ma * 0.7 ? 'giảm' : mb > ma * 1.3 ? 'tăng' : 'đi ngang';
    t.trend = `View trung vị **${dir}**: ${fmt(ma)} ở ${k} tháng đầu → ${fmt(mb)} ở ${k} tháng gần nhất`;
  }
  const peak = [...c.months].sort((x, y) => y.count - x.count)[0];
  t.cadence = `Đăng ${vn(s.postsPerWeek)} video/tuần; tháng dày nhất ${monthLabel(peak.name)} có ${peak.count} video; 30 ngày qua: ${s.postsLast30} video`;
  const tb = bestOf(c.timeBuckets), dur = bestOf(c.durations), wd = bestOf(c.weekdays);
  t.time = tb ? `Đăng **${tb.name.toLowerCase()}** (giờ VN) có view trung vị cao nhất: ${fmt(tb.median)}${wd ? `; thứ tốt nhất là ${wd.name} (${fmt(wd.median)})` : ''}` : 'Chưa đủ mẫu để kết luận giờ đăng';
  t.duration = dur ? `Độ dài **${dur.name}** có view trung vị cao nhất: ${fmt(dur.median)} (${dur.count} video)` : 'Chưa đủ mẫu để kết luận độ dài';
  const goodTags = c.tags.filter(x => x.count >= 3 && x.median > s.medianViews).sort((a, b) => b.median - a.median);
  t.tags = goodTags.length ? `Hashtag đi kèm view cao hơn trung vị kênh: ${goodTags.slice(0, 3).map(x => `**${x.name}**`).join(', ')}` : 'Không hashtag nào kéo view vượt trung vị kênh';
  return t;
}
const mdInline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const plain = s => s.replace(/\*\*/g, '');

// Thanh ngang bằng HTML: chữ giữ nguyên cỡ, đọc rõ trên điện thoại
function bars(items, { fmtv = fmt, ref, emphasize = true } = {}) {
  if (!items.length) return '';
  const max = Math.max(...items.map(i => i.value), ref?.value || 0) || 1;
  const strong = items.filter(i => !i.weak);
  const best = Math.max(...(strong.length ? strong : items).map(i => i.value));
  const vw = Math.max(...items.map(i => fmtv(i.value).length * 8.5 + (i.note ? i.note.length * 6.6 + 6 : 0) + (i.weak ? 56 : 0))) + 8;
  return `<div class="bars" style="--vw:${Math.ceil(vw)}px">${items.map(i => `<div class="brow${i.weak ? ' weak' : ''}" data-tip="${esc(i.tip || `${i.label}: ${fmtv(i.value)}`)}"${i.href ? ` data-href="${esc(i.href)}"` : ''}>
<div class="blabel">${i.labelHtml || esc(i.label)}</div>
<div class="btrack"><div class="bfill ${i.cls || (!emphasize || i.value === best ? 'hi' : 'lo')}" style="width:${Math.max(0.6, 100 * i.value / max).toFixed(1)}%"></div>${ref ? `<div class="bref" style="left:${(100 * ref.value / max).toFixed(1)}%"></div>` : ''}</div>
<div class="bval"><b>${esc(fmtv(i.value))}</b>${i.note ? ` <span class="muted">${esc(i.note)}</span>` : ''}${i.weak ? ' <span class="weaktag">ít mẫu</span>' : ''}</div></div>`).join('')}
${ref ? `<p class="brefnote"><i></i>${esc(ref.label)}</p>` : ''}</div>`;
}

function chart(question, answer, body, note = '') {
  return `<div class="chart"><p class="q">${esc(question)}</p><h3>${mdInline(answer)}</h3>${note ? `<p class="muted small">${esc(note)}</p>` : ''}${body}</div>`;
}

// Cột theo tháng: view trung vị, tháng cao nhất được tô màu, số video ghi dưới cột (không dùng hai trục)
function monthColumns(c) {
  const ms = c.months, h = 220, top = 26, bottom = 52, left = 8, max = Math.max(...ms.map(m => m.median), c.stats.medianViews) * 1.05;
  const bw = (W - left) / ms.length, y = v => top + (h - top - bottom) * (1 - v / max), base = y(0);
  const solid = ms.filter(m => m.count >= 3), peak = Math.max(...(solid.length ? solid : ms).map(m => m.median));
  return `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="View trung vị theo tháng">
<line class="refline" x1="${left}" x2="${W}" y1="${y(c.stats.medianViews)}" y2="${y(c.stats.medianViews)}"/>
${ms.map((m, i) => { const x0 = left + i * bw + bw * .15, w = bw * .7, hh = Math.max(2, base - y(m.median));
    return `<g data-tip="${esc(`${monthLabel(m.name)}: trung vị ${fmt(m.median)} view · ${m.count} video`)}"><rect class="hit" x="${left + i * bw}" y="${top - 20}" width="${bw}" height="${h - top}"/>
<path class="${m.count < 3 && solid.length ? 'cfill-weak' : m.median === peak ? 'cfill-hi' : 'cfill-lo'}" d="M${x0},${base} v-${Math.max(0, hh - 4)} a4,4 0 0 1 4,-4 h${Math.max(0, w - 8)} a4,4 0 0 1 4,4 v${Math.max(0, hh - 4)}z"/>
${m.median === peak || ms.length <= 14 ? `<text class="cval" x="${x0 + w / 2}" y="${base - hh - 6}" text-anchor="middle">${fmt(m.median)}</text>` : ''}
<text class="axis" x="${x0 + w / 2}" y="${h - bottom + 18}" text-anchor="middle">${monthLabel(m.name)}</text>
<text class="cnt${m.count < 3 ? ' weakc' : ''}" x="${x0 + w / 2}" y="${h - bottom + 36}" text-anchor="middle">${m.count} video</text></g>`; }).join('')}
<line class="base" x1="${left}" x2="${W}" y1="${base}" y2="${base}"/></svg>
<p class="brefnote"><i></i>Trung vị cả kênh ${fmt(c.stats.medianViews)} view${ms.some(m => m.count < 3) ? ' · cột nhạt: tháng có dưới 3 video, ít mẫu' : ''}</p>`;
}

// Mọi video theo thứ tự đăng (trục tuyến tính để thấy rõ các cú viral)
function videoColumns(c, slot) {
  const vs = c.videos, h = 210, top = 24, bottom = 26, max = Math.max(...vs.map(v => v.views));
  const bw = W / vs.length, y = v => top + (h - top - bottom) * (1 - v / max), base = y(0);
  const top3 = new Set(c.top.slice(0, 3).map(v => v.id));
  const ticks = [];
  let lastMonth = '';
  vs.forEach((v, i) => { if (v.month !== lastMonth) { ticks.push([i, v.month]); lastMonth = v.month; } });
  const every = Math.ceil(ticks.length / 8);
  return `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="View từng video theo thứ tự đăng">
<line class="refline" x1="0" x2="${W}" y1="${y(c.stats.medianViews)}" y2="${y(c.stats.medianViews)}"/>
${vs.map((v, i) => `<g data-tip="${esc(`${v.title.slice(0, 80)}\n${v.date} · ${fmt(v.views)} view · ${v.duration}s${c.labeled ? `\n${v.category}` : ''}`)}" data-href="${esc(v.url)}"><rect class="hit" x="${i * bw}" y="${top}" width="${bw}" height="${base - top}"/><rect class="vcol ${slot(v.category)}" x="${i * bw + Math.min(1, bw * .15)}" y="${base - Math.max(1.5, base - y(v.views))}" width="${Math.max(1, bw - Math.min(2, bw * .3))}" height="${Math.max(1.5, base - y(v.views))}" rx="${Math.min(2, bw / 3)}"/>${top3.has(v.id) ? `<text class="cval" x="${i * bw + bw / 2}" y="${y(v.views) - 6}" text-anchor="${i < vs.length * .1 ? 'start' : i > vs.length * .9 ? 'end' : 'middle'}">${fmt(v.views)}</text>` : ''}</g>`).join('')}
${ticks.filter((_, k) => k % every === 0).map(([i, m]) => `<text class="axis" x="${i * bw}" y="${h - 6}">${monthLabel(m)}</text>`).join('')}
<line class="base" x1="0" x2="${W}" y1="${base}" y2="${base}"/></svg>
<p class="brefnote"><i></i>Trung vị cả kênh ${fmt(c.stats.medianViews)} view · bấm vào cột để mở video</p>`;
}

// ---------- markdown nhỏ cho insights.md ----------
function md(src) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/`(.+?)`/g, '<code>$1</code>').replace(/\[(.+?)\]\((https?:[^)]+)\)/g, '<a href="$2">$1</a>');
  let out = '', list = '';
  for (const line of src.split('\n')) {
    const m = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)/);
    if (m) { list += `<li>${inline(m[1])}</li>`; continue; }
    if (list) { out += `<ul>${list}</ul>`; list = ''; }
    const hd = line.match(/^(#{1,4})\s+(.*)/);
    if (hd) out += `<h${Math.min(4, hd[1].length + 2)}>${inline(hd[2])}</h${Math.min(4, hd[1].length + 2)}>`;
    else if (line.trim()) out += `<p>${inline(line)}</p>`;
  }
  return out + (list ? `<ul>${list}</ul>` : '');
}

// ---------- báo cáo ----------
function channelHtml(c) {
  const s = c.stats, p = c.profile, t = c.takeaways;
  // Tô màu 3 nhóm mang về nhiều view nhất (không phải nhóm đông video nhất) để nhóm thắng không bị gộp vào "Khác"
  const cats = c.categories.filter(x => x.name !== UNLABELED).sort((a, b) => b.mean * b.count - a.mean * a.count).slice(0, 3).map(x => x.name);
  const slot = cat => { if (!c.labeled) return 'c1'; const i = cats.indexOf(cat); return i < 0 ? 'cother' : `c${i + 1}`; };
  const hasOther = c.labeled && c.videos.some(v => !cats.includes(v.category));
  const legend = c.labeled ? `<div class="legend">${cats.map((n, i) => `<span><i class="sw c${i + 1}"></i>${esc(n)}</span>`).join('')}${hasOther ? '<span><i class="sw cother"></i>Khác</span>' : ''}</div>` : '';
  const kpis = [
    ['Follower', fmt(p.followers), `${fmt(p.hearts)} tim`], ['View trung vị / video', fmt(s.medianViews), `cao nhất ${fmt(s.maxViews)}`],
    ['Tương tác trung vị', pct(s.medianER), 'like+bình luận+chia sẻ+lưu / view'], ['Video / tuần', vn(s.postsPerWeek), `${s.postsLast30} video trong 30 ngày qua`],
  ];
  const top = bars(c.top.map((v, i) => ({
    label: v.title, value: v.views, cls: slot(v.category), href: v.url,
    labelHtml: `<span class="rank">${i + 1}</span>${v.coverFile ? `<img class="thumb" src="${esc(v.coverFile)}" alt="" loading="lazy">` : ''}<span class="ttl">${esc(v.title.replace(/#[\p{L}\p{N}_]+/gu, '').trim().slice(0, 70) || v.title.slice(0, 70))}<small>${v.date} · ${v.duration}s${c.labeled ? ` · ${esc(v.category)}` : ''}</small></span>`,
    note: `gấp ${times(v.ratio)} trung vị`, tip: `${v.title.slice(0, 90)}\n${fmt(v.views)} view · tương tác ${pct(v.er)}`,
  })), { ref: { value: s.medianViews, label: `Vạch đứt: trung vị kênh ${fmt(s.medianViews)} view` } });
  const catChart = c.labeled ? chart('Loại nội dung nào thắng?', t.category, bars(c.categories.map(x => ({ label: x.name, value: x.median, note: `${x.count} video`, weak: x.count < MIN_N, tip: `${x.name}: trung vị ${fmt(x.median)} view · ${x.count} video` })),
    { ref: { value: s.medianViews, label: `Vạch đứt: trung vị kênh ${fmt(s.medianViews)}` } }), 'View trung vị mỗi video theo nhóm nội dung')
    + (c.shares ? chart('Công sức đổ vào đâu, view đến từ đâu?', t.share || 'Tỷ trọng view gần tương xứng với số video của mỗi nhóm',
      `<div class="legend"><span><i class="sw lo"></i>% số video</span><span><i class="sw hi"></i>% tổng view</span></div><div class="bars" style="--vw:190px">${c.shares.map(x => `<div class="brow" data-tip="${esc(`${x.name}: ${pct(x.postShare)} số video · ${pct(x.viewShare)} tổng view`)}"><div class="blabel">${esc(x.name)}</div><div class="btrack pair"><div class="bfill lo" style="width:${(100 * x.postShare).toFixed(1)}%"></div><div class="bfill hi" style="width:${(100 * x.viewShare).toFixed(1)}%"></div></div><div class="bval"><span class="muted">${pct(x.postShare)} video</span> → <b>${pct(x.viewShare)} view</b></div></div>`).join('')}</div>`) : '')
    : '<p class="note">Chưa có nhãn loại hình. Hãy điền <code>labels.json</code> theo hướng dẫn của skill rồi chạy lại để biết loại nội dung nào thắng.</p>';
  const tags = c.tags.filter(x => x.count >= 3).slice(0, 8);
  return `<section class="channel" id="${esc(c.handle)}">
<h2><a href="https://www.tiktok.com/@${esc(c.handle)}" target="_blank" rel="noopener">@${esc(c.handle)}</a> <span class="muted">${esc(p.nickname || '')}</span></h2>
${p.bio ? `<p class="muted bio">${esc(p.bio)}</p>` : ''}
<p class="muted small">${s.n} video, đăng từ ${s.first} đến ${s.last}. Giờ tính theo giờ Việt Nam.</p>
${s.daysSinceLast > 30 ? `<p class="alert">⚠ Kênh không đăng video mới trong <b>${s.daysSinceLast} ngày</b> (video gần nhất ${s.last}).</p>` : ''}
<div class="kpis">${kpis.map(([k, v, sub]) => `<div class="kpi"><span>${k}</span><b>${v}</b><small>${esc(sub)}</small></div>`).join('')}</div>
<div class="keys"><p class="q">Điểm chính</p><ul>${[t.category, t.share, t.viral, t.trend, t.cadence, t.time, t.duration].filter(Boolean).map(x => `<li>${mdInline(x)}</li>`).join('')}</ul></div>
${chart('Video nào thắng?', `Top 1 đạt **${fmt(c.top[0].views)} view**, gấp ${times(c.top[0].ratio)} một video bình thường của kênh`, legend + top)}
${styleHtml(c)}
${catChart}
${chart('Kênh đang lên hay đi xuống?', t.trend || t.cadence, monthColumns(c), 'Cột: view trung vị của các video đăng trong tháng · dưới cột: số video đăng')}
${chart('Có phụ thuộc vào vài video viral?', t.viral, legend + videoColumns(c, slot), 'Mỗi cột là một video, xếp theo ngày đăng')}
<div class="two">
${chart('Đăng giờ nào?', t.time, bars(c.timeBuckets.filter(b => b.count).map(b => ({ label: b.name, value: b.median, note: `${b.count} video`, weak: b.count < MIN_N }))), 'View trung vị theo khung giờ đăng (giờ VN)')}
${chart('Đăng thứ mấy?', bestOf(c.weekdays) ? `Thứ tốt nhất: **${bestOf(c.weekdays).name}** (${fmt(bestOf(c.weekdays).median)})` : 'Chưa đủ mẫu', bars(c.weekdays.filter(w => w.count).map(w => ({ label: w.name, value: w.median, note: `${w.count} video`, weak: w.count < MIN_N }))), 'View trung vị theo thứ đăng')}
</div>
<div class="two">
${chart('Video dài bao nhiêu?', t.duration, bars(c.durations.map(d => ({ label: d.name, value: d.median, note: `${d.count} video`, weak: d.count < MIN_N }))), 'View trung vị theo độ dài')}
${tags.length ? chart('Hashtag nào đi kèm view cao?', t.tags, bars(tags.map(x => ({ label: x.name, value: x.median, note: `${x.count} video`, cls: x.median > s.medianViews ? 'hi' : 'lo' })), { ref: { value: s.medianViews, label: `Màu xanh: cao hơn trung vị kênh (${fmt(s.medianViews)})` } }), 'Hashtag dùng ít nhất 3 lần') : ''}
</div>
<details><summary>Bảng dữ liệu đầy đủ (${s.n} video)</summary><div class="tablewrap"><table><thead><tr><th>Ngày</th><th>Tiêu đề</th>${c.labeled ? '<th>Loại</th>' : ''}<th>Giây</th><th>View</th><th>Like</th><th>Bình luận</th><th>Chia sẻ</th><th>Lưu</th><th>Tương tác</th></tr></thead><tbody>
${[...c.videos].reverse().map(v => `<tr><td>${v.date}</td><td><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.title.slice(0, 90))}</a></td>${c.labeled ? `<td>${esc(v.category)}</td>` : ''}<td>${v.duration}</td><td>${v.views.toLocaleString('vi')}</td><td>${v.likes.toLocaleString('vi')}</td><td>${v.comments.toLocaleString('vi')}</td><td>${v.shares.toLocaleString('vi')}</td><td>${v.saves.toLocaleString('vi')}</td><td>${pct(v.er)}</td></tr>`).join('')}
</tbody></table></div></details></section>`;
}

// Phong cách dựng: số đo tự động của các video top + công thức dựng do agent viết (style.md)
function styleHtml(c) {
  const ss = c.styles || [];
  if (!ss.length) return '';
  const m = k => median(ss.map(x => x[k]).filter(x => x != null));
  // whisper tách tiếng Việt theo âm tiết nên đơn vị là âm tiết, không phải từ
  const unit = ss[0].language === 'vi' ? 'âm tiết/phút' : 'từ/phút';
  const head = `Đổi hình mỗi **${vn(m('secPerChange'))} giây**, đọc **${Math.round(m('wpm'))} ${unit}**, lời phủ ${pct(m('speechCoverage'))} thời lượng`;
  const kp = [
    ['Đổi hình', `${vn(m('secPerChange'))}s/lần`, `${vn(60 / m('secPerChange'), 0)} lần/phút · cắt cảnh hẳn: ${Math.round(m('cuts'))}`],
    ['3 giây đầu', `${Math.round(m('changesFirst3s'))} lần đổi hình`, 'trung vị các video top'],
    ['Tốc độ đọc', `${Math.round(m('wpm'))} ${unit}`, ss[0].language ? `ngôn ngữ: ${ss[0].language}` : ''],
    ['Độ to', m('lufs') ? `${vn(m('lufs'))} LUFS` : '—', `lời phủ ${pct(m('speechCoverage'))} thời lượng`],
  ];
  const card = x => `<article class="scard">
<a href="${esc(x.video.url)}" target="_blank" rel="noopener" class="stitle"><b>${fmt(x.video.views)} view</b> · ${esc(x.video.title.replace(/#[\p{L}\p{N}_]+/gu, '').trim().slice(0, 70))}</a>
${fs.existsSync(path.join(OUT, x.base, 'hook.jpg')) ? `<img class="hook" src="${esc(x.base)}/hook.jpg" alt="6 khung hình của 3 giây đầu">` : ''}
<p class="hookq"><span class="q">3 giây đầu nói</span>“${esc(x.hook || '(không lời)')}”</p>
<div class="chips"><span>đổi hình ${vn(x.secPerChange)}s/lần</span><span>${x.changesFirst3s} lần trong 3s đầu</span><span>${Math.round(x.wpm)} ${unit}</span><span>${Math.round(x.duration)}s</span>${x.lufs ? `<span>${vn(x.lufs)} LUFS</span>` : ''}</div>
<details><summary>Khung hình (${x.grids.length} lưới) & lời thoại</summary>${x.grids.map(g => `<img class="grid" src="${esc(x.base)}/frames/${esc(g)}" alt="" loading="lazy">`).join('')}<p class="transcript">${esc(x.transcript)}</p></details>
</article>`;
  return `${chart('Họ dựng video thế nào?', head, `<div class="kpis small">${kp.map(([k, v, sub]) => `<div class="kpi"><span>${k}</span><b>${v}</b><small>${esc(sub)}</small></div>`).join('')}</div>
${c.styleNotes ? `<div class="stylenotes">${md(c.styleNotes)}</div>` : '<p class="note">Chưa có công thức dựng. Agent cần xem lưới khung hình + lời thoại của các video dưới đây rồi viết <code>style.md</code> theo hướng dẫn của skill.</p>'}
<div class="scards">${ss.map(card).join('')}</div>`, `Đo trên ${ss.length} video nhiều view nhất · khung hình và lời thoại tách bằng ffmpeg + whisper`)}`;
}

function compareHtml(cs) {
  if (cs.length < 2) return '';
  const block = (q, key, fmtv) => {
    const items = cs.map(c => ({ label: '@' + c.handle, value: key(c) || 0 })).sort((a, b) => b.value - a.value);
    return chart(q, `Dẫn đầu: **${items[0].label}** (${fmtv(items[0].value)})`, bars(items, { fmtv }));
  };
  return `<section><h2>So sánh các kênh</h2><div class="two">
${block('Ai lớn nhất?', c => c.profile.followers, fmt)}${block('Video của ai thường được xem nhiều nhất?', c => c.stats.medianViews, fmt)}
${block('Ai giữ chân người xem tốt nhất?', c => c.stats.medianER, pct)}${block('Ai đăng đều nhất?', c => c.stats.postsPerWeek, v => `${vn(v)}/tuần`)}
</div></section>`;
}

const CSS = `:root{color-scheme:light;--bg:#f6f5f2;--surface:#fcfcfb;--ink:#0b0b0b;--ink2:#52514e;--muted:#7a7974;--line:#e4e2dc;--grid:#ecebe6;--track:#efeee9;--hi:#2a78d6;--lo:#c9c7c0;--c1:#2a78d6;--c2:#eb6834;--c3:#1baf7a;--cother:#a9a8a2;--warn:#b54708;--warnbg:#fef3e7}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){color-scheme:dark;--bg:#121211;--surface:#1a1a19;--ink:#f0efec;--ink2:#c3c2b7;--muted:#8e8d86;--line:#2e2d2a;--grid:#262624;--track:#242422;--hi:#3987e5;--lo:#4a4945;--c1:#3987e5;--c2:#d95926;--c3:#199e70;--cother:#6b6a65;--warn:#f79009;--warnbg:#2b1d0e}}
:root[data-theme="dark"]{color-scheme:dark;--bg:#121211;--surface:#1a1a19;--ink:#f0efec;--ink2:#c3c2b7;--muted:#8e8d86;--line:#2e2d2a;--grid:#262624;--track:#242422;--hi:#3987e5;--lo:#4a4945;--c1:#3987e5;--c2:#d95926;--c3:#199e70;--cother:#6b6a65;--warn:#f79009;--warnbg:#2b1d0e}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:15px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1000px;margin:0 auto;padding:28px 16px 64px}h1{font-size:30px;margin:0 0 4px}h2{font-size:22px;margin:0 0 4px}h2 a{color:inherit}.eyebrow{margin:0;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}h2.platform{font-size:24px;margin:40px 0 0;padding-bottom:8px;border-bottom:2px solid var(--ink)}
section{background:var(--surface);border:1px solid var(--line);border-radius:14px;padding:24px;margin-top:22px}.muted{color:var(--muted)}.small{font-size:13px}.bio{white-space:pre-line;margin:2px 0}
.alert{background:var(--warnbg);color:var(--warn);border-radius:8px;padding:8px 12px;margin:10px 0}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px;margin:16px 0}.kpi{border:1px solid var(--line);border-radius:12px;padding:14px 16px}.kpi span{display:block;font-size:13px;color:var(--ink2)}.kpi b{display:block;font-size:30px;line-height:1.2;font-variant-numeric:tabular-nums}.kpi small{color:var(--muted);font-size:12px}
.keys{border-left:4px solid var(--hi);padding:4px 0 4px 16px;margin:20px 0}.keys ul{margin:6px 0 0;padding-left:18px}.keys li{margin:4px 0}
.q{margin:0;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);font-weight:600}
.chart{margin-top:34px}.chart h3{font-size:18px;line-height:1.35;margin:2px 0 4px;font-weight:600}.chart h3 b{color:var(--hi)}.chart>.muted{margin:0 0 12px}
.two{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,400px),1fr));gap:0 32px}
.bars{display:flex;flex-direction:column;gap:6px;margin-top:10px}.brow{display:grid;grid-template-columns:minmax(110px,32%) 1fr var(--vw,120px);gap:10px;align-items:center;font-size:14px;border-radius:6px;padding:2px 0}.brow[data-href]{cursor:pointer}.brow:hover{background:var(--track)}
.blabel{color:var(--ink2);display:flex;align-items:center;gap:8px;min-width:0}.btrack{position:relative;height:18px;background:var(--track);border-radius:4px}.bfill{height:100%;border-radius:0 4px 4px 0;min-width:2px}
.btrack.pair{height:22px;display:flex;flex-direction:column;gap:2px;background:none}.btrack.pair .bfill{height:10px;border-radius:0 3px 3px 0}
.bref{position:absolute;top:-3px;bottom:-3px;border-left:2px dashed var(--ink2)}.bval{font-variant-numeric:tabular-nums;white-space:nowrap;font-size:13px;text-align:right}.bval b{font-size:14px}
.brow.weak .bfill{opacity:.45}.weaktag{font-size:11px;color:var(--warn);border:1px solid currentColor;border-radius:99px;padding:0 6px}
.brefnote{font-size:12px;color:var(--muted);margin:6px 0 0}.brefnote i{display:inline-block;width:14px;border-top:2px dashed var(--ink2);vertical-align:middle;margin-right:6px}
.rank{flex:none;width:22px;text-align:right;font-weight:700;color:var(--ink)}.thumb{flex:none;width:30px;height:53px;object-fit:cover;border-radius:4px;background:var(--grid)}.ttl{min-width:0;overflow:hidden;color:var(--ink);font-size:13px;line-height:1.3}.ttl small{display:block;color:var(--muted);font-size:11px}
.hi{background:var(--hi)}.lo{background:var(--lo)}.c1{background:var(--c1);fill:var(--c1)}.c2{background:var(--c2);fill:var(--c2)}.c3{background:var(--c3);fill:var(--c3)}.cother{background:var(--cother);fill:var(--cother)}
.legend{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:13px;color:var(--ink2);margin:8px 0 4px}.sw{display:inline-block;width:10px;height:10px;border-radius:3px;margin-right:6px}
svg{width:100%;height:auto;display:block;overflow:visible;margin-top:8px}.grid{stroke:var(--grid)}.base{stroke:var(--line);stroke-width:1.5}.refline{stroke:var(--ink2);stroke-width:1.5;stroke-dasharray:5 4}
.axis{fill:var(--muted);font-size:12px}.cnt{fill:var(--muted);font-size:11px}.cval{fill:var(--ink);font-size:13px;font-weight:600;font-variant-numeric:tabular-nums}
.cfill-hi{fill:var(--hi)}.cfill-lo{fill:var(--lo)}.cfill-weak{fill:var(--lo);opacity:.4}.weakc{fill:var(--warn)}.hit{fill:transparent}g[data-tip]:hover .vcol,g[data-tip]:hover path{opacity:.75}g[data-href]{cursor:pointer}
.note{border-left:3px solid var(--hi);padding:6px 12px;color:var(--ink2)}.insights{border-left:4px solid var(--hi)}.insights h3{font-size:16px;margin:18px 0 4px}
.kpis.small .kpi b{font-size:22px}.stylenotes{border:1px solid var(--line);border-radius:12px;padding:4px 18px 12px;margin:14px 0}.stylenotes h3{font-size:15px;margin:14px 0 4px}.stylenotes ul{margin:4px 0;padding-left:18px}
.scards{display:grid;grid-template-columns:1fr;gap:12px;margin-top:14px}.scard{border:1px solid var(--line);border-radius:12px;padding:12px;min-width:0}.stitle{display:block;color:var(--ink);text-decoration:none;font-size:13px;line-height:1.35;margin-bottom:8px}.hook{width:100%;border-radius:6px;border:1px solid var(--line);background:#fff}.hookq{font-size:13px;margin:8px 0;font-style:italic}.hookq .q{display:block;font-style:normal;margin-bottom:2px}
.chips{display:flex;flex-wrap:wrap;gap:4px}.chips span{font-size:11px;border:1px solid var(--line);border-radius:99px;padding:1px 8px;color:var(--ink2)}.scard details{margin-top:10px;font-size:13px}.scard .grid{width:100%;margin-top:6px;border-radius:6px;background:#fff}.transcript{font-size:12px;color:var(--ink2);white-space:pre-line}
details{margin-top:24px}summary{cursor:pointer;color:var(--ink2)}.sheetbox{margin-top:12px}.tablewrap{overflow-x:auto}table{border-collapse:collapse;font-size:12px;width:100%;margin-top:8px}th,td{padding:5px 8px;border-bottom:1px solid var(--line);text-align:left;white-space:nowrap}td:nth-child(2){white-space:normal;min-width:220px}td a{color:inherit}
@media (max-width:560px){section{padding:16px}.brow{grid-template-columns:1fr auto}.blabel{grid-column:1/-1}.kpi b{font-size:24px}}
#tip{position:fixed;pointer-events:none;background:var(--ink);color:var(--surface);font-size:12px;padding:6px 9px;border-radius:6px;white-space:pre-line;max-width:320px;opacity:0;transition:opacity .1s;z-index:9}`;

const JS = `const t=document.getElementById('tip');document.addEventListener('mousemove',e=>{const g=e.target.closest('[data-tip]');if(!g){t.style.opacity=0;return}t.textContent=g.dataset.tip;t.style.opacity=1;const x=Math.min(e.clientX+14,innerWidth-t.offsetWidth-8);t.style.left=x+'px';t.style.top=(e.clientY+14)+'px'});document.addEventListener('click',e=>{const g=e.target.closest('[data-href]');if(g)window.open(g.dataset.href,'_blank','noopener')});`;

function reportMd(cs, insights) {
  const L = [`# ${name} — phân tích đối thủ`, '', `Cập nhật ${today} · TikTok: ${cs.map(c => '@' + c.handle).join(', ')}. Biểu đồ xem trong \`${SLUG}.html\`.`, ''];
  if (insights) L.push('## Nhận định', '', insights.trim(), '');
  L.push('## TikTok', '');
  if (cs.length > 1) {
    L.push('### So sánh các kênh TikTok', '', '| Kênh | Follower | Video | View trung vị | Tương tác | Video/tuần | Video gần nhất |', '|---|---|---|---|---|---|---|');
    for (const c of cs) L.push(`| @${c.handle} | ${fmt(c.profile.followers)} | ${c.profile.videoCount ?? c.stats.n} | ${fmt(c.stats.medianViews)} | ${pct(c.stats.medianER)} | ${vn(c.stats.postsPerWeek)} | ${c.stats.daysSinceLast} ngày trước |`);
    L.push('');
  }
  for (const c of cs) {
    const s = c.stats;
    L.push(`### @${c.handle}`, '', `- ${fmt(c.profile.followers)} follower · ${s.n} video phân tích (${s.first} → ${s.last}) · tổng ${fmt(s.totalViews)} view`,
      `- View trung vị ${fmt(s.medianViews)}, trung bình ${fmt(s.meanViews)}, cao nhất ${fmt(s.maxViews)} · tương tác trung vị ${pct(s.medianER)}`,
      `- ${vn(s.postsPerWeek)} video/tuần · ${s.postsLast30} video trong 30 ngày qua · độ dài trung vị ${s.medianDuration}s · ${pct(s.originalSoundShare)} dùng âm thanh gốc`, '',
      '**Điểm chính**', '', ...Object.values(c.takeaways).map(x => `- ${x}`), '',
      '| # | Video | View | Tương tác | Giây | Ngày |' + (c.labeled ? ' Loại |' : ''), '|---|---|---|---|---|---|' + (c.labeled ? '---|' : ''),
      ...c.top.map((v, i) => `| ${i + 1} | [${v.title.slice(0, 60).replace(/\|/g, '/')}](${v.url}) | ${fmt(v.views)} | ${pct(v.er)} | ${v.duration} | ${v.date} |` + (c.labeled ? ` ${v.category} |` : '')), '');
    if (c.styles?.length) L.push('**Phong cách dựng (video top)**', '', ...(c.styleNotes ? [c.styleNotes.trim(), ''] : []), `| Video | View | Đổi hình | 3s đầu | ${c.styles[0].language === 'vi' ? 'Âm tiết' : 'Từ'}/phút | 3 giây đầu nói |`, '|---|---|---|---|---|---|',
      ...c.styles.map(x => `| [${x.video.title.slice(0, 40).replace(/\|/g, '/')}](${x.video.url}) | ${fmt(x.video.views)} | ${vn(x.secPerChange)}s | ${x.changesFirst3s} | ${Math.round(x.wpm)} | ${(x.hook || '').replace(/\|/g, '/')} |`), '');
    if (c.labeled) L.push('| Loại hình | Số video | View trung vị |', '|---|---|---|', ...c.categories.map(x => `| ${x.name} | ${x.count} | ${fmt(x.median)} |`), '');
    L.push('| Tháng | Số video | View trung vị |', '|---|---|---|', ...c.months.map(m => `| ${m.name} | ${m.count} | ${fmt(m.median)} |`), '');
  }
  return L.join('\n');
}

// ---------- chạy ----------
const channels = [];
for (const handle of tiktok) {
  const dir = path.join(OUT, 'tiktok', handle);
  fs.mkdirSync(path.join(dir, 'covers'), { recursive: true });
  const vf = path.join(dir, 'videos.json'), pf = path.join(dir, 'profile.json');
  let videos = readJson(vf), profile = readJson(pf);
  if (OFFLINE && !videos) { console.error(`! @${handle}: chưa có dữ liệu cache, bỏ qua (--offline)`); continue; }
  if (!OFFLINE && (!videos || flag('--refresh'))) { console.log(`↓ @${handle}: lấy danh sách video…`); videos = scrapeVideos(handle); writeJson(vf, videos); }
  if (!OFFLINE && (!profile?.followers || flag('--refresh'))) { const fresh = await scrapeProfile(handle); if (fresh.followers || !profile) profile = fresh; writeJson(pf, profile); }
  if (!videos.length) { console.error(`@${handle}: không có video công khai`); continue; }
  const labelsFile = path.join(dir, 'labels.json');
  const labels = readJson(labelsFile, {});
  const todo = videos.filter(v => !labels[v.id]).map(v => ({ id: v.id, title: v.title, views: v.views, duration: v.duration }));
  writeJson(path.join(dir, 'labels.todo.json'), todo);
  const c = analyze(handle, profile, videos, labels);
  c.takeaways = takeaways(c);
  for (const v of c.top) if (await download(v.cover, path.join(dir, 'covers', `${v.id}.jpg`))) v.coverFile = `tiktok/${handle}/covers/${v.id}.jpg`;
  c.styles = [];
  for (const v of c.top.slice(0, STYLE)) {
    console.log(`  phân tích phong cách dựng video ${c.styles.length + 1}/${Math.min(STYLE, c.top.length)}…`);
    const st = analyzeStyle(v, path.join(dir, 'style', v.id));
    if (st) c.styles.push({ ...st, video: v, base: `tiktok/${handle}/style/${v.id}` });
  }
  c.styleNotes = (() => { try { return fs.readFileSync(path.join(dir, 'style.md'), 'utf8'); } catch { return ''; } })();
  channels.push(c);
  console.log(`✓ @${handle}: ${c.stats.n} video, view trung vị ${fmt(c.stats.medianViews)}, ${todo.length} video chưa gắn nhãn`);
}
if (!channels.length) process.exit(1);

const insightsFile = path.join(OUT, 'insights.md');
const insights = fs.existsSync(insightsFile) ? fs.readFileSync(insightsFile, 'utf8') : '';
const title = `${name} — phân tích đối thủ`;
const platformHtml = (key, cs) => `<h2 class="platform" id="${key}">${PLATFORMS[key]} <span class="muted">· ${cs.length} kênh</span></h2>${compareHtml(cs)}${cs.map(channelHtml).join('')}`;
fs.writeFileSync(path.join(OUT, `${SLUG}.html`), `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><style>${CSS}</style></head><body><main>
<p class="eyebrow"><a href="../" style="color:inherit">← Tất cả đối thủ</a> · Phân tích đối thủ</p><h1>${esc(name)}</h1><p class="muted">Cập nhật ${today} · TikTok: ${channels.map(c => `<a href="#${esc(c.handle)}">@${esc(c.handle)}</a>`).join(' · ')} · Nguồn: dữ liệu công khai (yt-dlp + trang profile)</p>
${insights ? `<section class="insights"><h2>Nhận định</h2>${md(insights)}</section>` : ''}
${platformHtml('tiktok', channels)}
<p class="muted">TikTok không công khai thời gian xem, tỷ lệ xem hết và chân dung khán giả, nên báo cáo không có các số này. View là số tại thời điểm chạy.</p>
</main><div id="tip" role="tooltip"></div><script>${JS}</script></body></html>`);
fs.writeFileSync(path.join(OUT, `${SLUG}.md`), reportMd(channels, insights));
const summary = {
  name, updated: today,
  tiktok: channels.map(c => ({
    handle: c.handle, profile: c.profile, stats: c.stats, takeaways: Object.fromEntries(Object.entries(c.takeaways).map(([k, v]) => [k, plain(v)])), timeBuckets: c.timeBuckets, categories: c.categories, months: c.months, weekdays: c.weekdays, durations: c.durations, tags: c.tags,
    styles: (c.styles || []).map(({ video, base, transcript, grids, ...x }) => ({ ...x, title: video.title, views: video.views, folder: base })),
    top: c.top.map(({ id, title, url, views, er, duration, date, time, category, ratio }) => ({ id, title, url, views, er, duration, date, time, category, ratio })),
  })),
};
writeJson(path.join(OUT, 'summary.json'), summary);
// Ảnh chụp số liệu theo ngày để so xu hướng giữa các lần chạy
fs.mkdirSync(path.join(OUT, 'history'), { recursive: true });
writeJson(path.join(OUT, 'history', `${today}.json`), summary);
console.log(`\nBáo cáo: ${path.join(OUT, `${SLUG}.html`)}\n         ${path.join(OUT, `${SLUG}.md`)}`);
