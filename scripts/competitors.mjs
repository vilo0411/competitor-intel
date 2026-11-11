#!/usr/bin/env node
// Phân tích đối thủ (miễn phí): mỗi đối thủ là một thư mục, trong đó có các kênh theo nền tảng (hiện có TikTok).
// TikTok: yt-dlp lấy danh sách video + trang profile công khai, tính chỉ số rồi xuất <đối-thủ>.html (biểu đồ SVG) + <đối-thủ>.md.
// node competitors.mjs "<Tên đối thủ>" @kenh1 https://www.tiktok.com/@kenh2 [--out root] [--limit N] [--style N] [--refresh] [--offline]
// --style N: tải N video top, tách khung hình + chép lời (scripts/video/*.sh) để đo nhịp dựng.
// --offline: chỉ dùng dữ liệu đã cache, không gọi TikTok (dựng lại báo cáo sau khi sửa labels/style/insights).
// Chạy lại chỉ với tên đối thủ sẽ dùng danh sách kênh đã lưu trong competitor.json.
import fs from 'node:fs';
import { analyzeEvidence, evidenceTables, EVIDENCE_LIMITS, quantile, localBenchmarks } from './evidence.mjs';
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
    views: e.view_count ?? 0, likes: e.like_count ?? null, comments: e.comment_count ?? null,
    shares: e.repost_count ?? null, saves: e.save_count ?? null, track: e.track || '',
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
// Motion timeline (scripts/video/motion-timeline.mjs, adapted from rea-video): measured sticker beats, entrances and
// caption pacing. --split 0.06 because explainer shorts swap pictures on a static background.
function measureMotion(mp4, dir) {
  const md = path.join(dir, 'motion');
  const r = spawnSync(process.execPath, [path.join(VIDEO_SCRIPTS, 'motion-timeline.mjs'), mp4, md, '--split', '0.06', '--words', path.join(dir, 'audio', 'audio.json')],
    { encoding: 'utf8', maxBuffer: 1 << 26 });
  const m = readJson(path.join(md, 'motion.json'));
  if (r.status !== 0 || !m) { console.warn(`  ! motion-timeline lỗi: ${(r.stderr || '').trim().split('\n').pop()}`); return null; }
  const beats = m.stickerBeats.beats, fx = {};
  for (const b of beats) fx[b.fx] = (fx[b.fx] || 0) + 1;
  return {
    beats: beats.length, beatsPerMin: m.stickerBeats.perMinute, medianBeat: m.stickerBeats.medianInterval,
    beatsFirst3s: beats.filter(b => b.t > 0 && b.t < 3).length, entrances: fx,
    caption: m.captionTrack ? { swaps: m.captionTrack.swaps, medianInterval: m.captionTrack.medianInterval, box: m.captionTrack.box } : null,
    // the first beats with the word spoken at that moment: the hook's picture/word sync
    firstBeats: beats.slice(0, 8).map(b => ({ t: b.t, at: b.at, fx: b.fx })),
  };
}

// whisper-cli can split a multi-byte character across two tokens, so audio_raw.json is not valid UTF-8 token by
// token and the Python normaliser used to crash on Vietnamese (no audio.json -> empty transcript, 0 wpm).
// Reading as latin1 keeps every byte; tokens are joined into words first and decoded as UTF-8 afterwards.
function normalizeWhisper(dir) {
  const out = path.join(dir, 'audio', 'audio.json'), raw = path.join(dir, 'audio', 'audio_raw.json');
  if (fs.existsSync(out) || !fs.existsSync(raw)) return;
  let j;
  try { j = JSON.parse(fs.readFileSync(raw, 'latin1')); } catch { return; }
  const utf8 = t => Buffer.from(t, 'latin1').toString('utf8'), segments = [], words = [];
  const strip = t => t.replace(/^[ \t\r\n]+|[ \t\r\n]+$/g, ''); // ASCII only: String.trim() eats 0xA0, the second byte of "à"
  for (const [id, seg] of (j.transcription || []).entries()) {
    const text = utf8(seg.text || '').trim();
    if (text) segments.push({ id, start: (seg.offsets?.from || 0) / 1000, end: (seg.offsets?.to || 0) / 1000, text });
    for (const t of seg.tokens || []) {
      const piece = t.text || '';
      if (piece.startsWith('[_') || !strip(piece)) continue;
      if (piece.startsWith(' ') || !words.length) words.push({ word: strip(piece), start: (t.offsets?.from || 0) / 1000, end: (t.offsets?.to || 0) / 1000 });
      else { words.at(-1).word += strip(piece); words.at(-1).end = (t.offsets?.to || 0) / 1000; }
    }
  }
  for (const w of words) w.word = utf8(w.word);
  writeJson(out, { engine: 'whisper-cli', language: j.result?.language || 'auto', text: segments.map(x => x.text).join(' '), segments, words });
}
function speechStats(dir, dur) {
  normalizeWhisper(dir);
  const audio = readJson(path.join(dir, 'audio', 'audio.json'), { words: [], segments: [] });
  const words = audio.words || [];
  const speech = (audio.segments || []).reduce((a, x) => a + Math.max(0, Math.min(x.end, dur) - x.start), 0);
  return {
    language: audio.language || '', wpm: speech ? words.length / speech * 60 : null, speechCoverage: speech ? Math.min(1, speech / dur) : null,
    hook: words.filter(w => w.start < 3).map(w => w.word).join(' ').trim(), transcript: (audio.text || '').trim(),
  };
}

function downloadVideo(v, mp4) {
  return fs.existsSync(mp4) || spawnSync('yt-dlp', ['-q', '-f', 'b[ext=mp4]/b', '-o', mp4, v.url]).status === 0;
}

function analyzeStyle(v, dir) {
  const out = path.join(dir, 'style.json');
  const cached = readJson(out);
  if (cached && !cached.transcript && fs.existsSync(path.join(dir, 'audio', 'audio_raw.json'))) {
    // repair runs whose transcript step failed; the raw whisper output is still in the cache
    Object.assign(cached, speechStats(dir, cached.duration));
    if (cached.transcript) writeJson(out, cached);
  }
  if (cached && (cached.motion !== undefined || OFFLINE)) return cached;
  if (OFFLINE) return null;
  fs.mkdirSync(dir, { recursive: true });
  const mp4 = path.join(dir, 'video.mp4');
  if (cached) {
    // backfill: style measured before the motion timeline existed
    if (!downloadVideo(v, mp4)) return cached;
    cached.motion = measureMotion(mp4, dir);
    writeJson(out, cached);
    fs.rmSync(mp4, { force: true });
    return cached;
  }
  if (!downloadVideo(v, mp4)) return null;
  const dur = Number(spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', mp4], { encoding: 'utf8' }).stdout) || v.duration || 60;
  const sh = (script, ...a) => spawnSync('bash', [path.join(VIDEO_SCRIPTS, script), ...a.map(String)], { encoding: 'utf8', maxBuffer: 1 << 26 });
  sh('extract-frames.sh', mp4, path.join(dir, 'frames'), dur <= 90 ? 2 : 1, 180, 'auto', '3x5');
  sh('extract-audio.sh', mp4, path.join(dir, 'audio'), 'large');
  const changesAt = t => [...spawnSync('ffmpeg', ['-hide_banner', '-i', mp4, '-map', '0:v:0', '-vf', `select='gt(scene,${t})',showinfo`, '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 26 }).stderr
    .matchAll(/pts_time:([\d.]+)/g)].map(m => Number(m[1]));
  const changes = changesAt(0.06), cuts = changesAt(0.3);
  // Dải 6 khung hình của 3 giây đầu (cắt bớt nền trên/dưới của khung 9:16): nhìn ngay câu móc bằng hình
  spawnSync('ffmpeg', ['-loglevel', 'error', '-y', '-i', mp4, '-t', '3', '-vf', 'fps=2,crop=iw:ih*0.62,scale=240:-1,tile=6x1', '-frames:v', '1', path.join(dir, 'hook.jpg')]);
  const vol = (() => { try { return fs.readFileSync(path.join(dir, 'audio', 'volume.txt'), 'utf8'); } catch { return ''; } })();
  const style = {
    id: v.id, duration: dur, ...speechStats(dir, dur),
    changes: changes.length, secPerChange: dur / (changes.length + 1), cuts: cuts.length,
    changesFirst3s: changes.filter(t => t < 3).length, firstChangeAt: changes[0] ?? null,
    lufs: Number((vol.match(/I:\s+(-?[\d.]+) LUFS\s*\n\s*LRA/) || [])[1]) || null,
    grids: fs.existsSync(path.join(dir, 'frames')) ? fs.readdirSync(path.join(dir, 'frames')).filter(n => n.startsWith('grid_')).sort() : [],
    motion: measureMotion(mp4, dir),
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
const er = v => v.views > 0 && [v.likes, v.comments, v.shares, v.saves].every(Number.isFinite) ? (v.likes + v.comments + v.shares + v.saves) / v.views : null;
const parts = ts => {
  const d = new Date(ts * 1000);
  const f = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', weekday: 'short', hour12: false })
    .formatToParts(d).reduce((o, p) => (o[p.type] = p.value, o), {});
  return { date: `${f.year}-${f.month}-${f.day}`, month: `${f.year}-${f.month}`, hour: Number(f.hour) % 24, time: `${f.hour}:${f.minute}`,
    weekday: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(f.weekday) };
};
const hashtags = t => (t.match(/#[\p{L}\p{N}_]+/gu) || []).map(h => h.toLowerCase());
const stat = (name, list) => {
  const w = list.map(v => v.views), rels = list.map(v => v.rel).filter(Number.isFinite);
  const o = { name, count: list.length, median: median(w), mean: mean(w), q25: quantile(w, .25) ?? 0, q75: quantile(w, .75) ?? 0, relMedian: quantile(rels, .5), relQ25: quantile(rels, .25), relQ75: quantile(rels, .75) };
  // raw values for the chance check in leader(); non-enumerable so they stay out of summary.json
  return Object.defineProperty(o, 'values', { value: { median: w, relMedian: rels } });
};
const group = (vs, key) => {
  const m = new Map();
  for (const v of vs) { const k = key(v); if (!m.has(k)) m.set(k, []); m.get(k).push(v); }
  return [...m].map(([name, list]) => stat(name, list));
};
const TIME_BUCKETS = [[5, 11, 'Sáng (5–11h)'], [11, 14, 'Trưa (11–14h)'], [14, 18, 'Chiều (14–18h)'], [18, 23, 'Tối (18–23h)'], [23, 29, 'Đêm (23–5h)']];
const DURATION_SHORT = [[0, 30, '≤30s'], [31, 45, '31–45s'], [46, 60, '46–60s'], [61, 90, '61–90s'], [91, 1e9, '>90s']];
const DURATION_LONG = [[0, 60, '≤1 phút'], [61, 180, '1–3 phút'], [181, 240, '3–4 phút'], [241, 360, '4–6 phút'], [361, 1e9, '>6 phút']];
const fmtDur = d => d < 90 ? `${Math.round(d)}s` : `${Math.floor(d / 60)}:${String(Math.round(d % 60)).padStart(2, '0')}`;

// A channel that switches format (news clips -> long explainers) is two channels in one cache. Find the day
// where the median duration on both sides differs the most (>= 2.5x, both sides >= 20 posts).
function detectEra(vs) {
  const min = Math.max(20, Math.ceil(vs.length * .1)), dur = l => median(l.map(v => v.duration).filter(d => d > 0));
  let best = null;
  for (let i = min; i <= vs.length - min; i++) {
    if (vs[i].date === vs[i - 1].date) continue;
    const a = dur(vs.slice(0, i)), b = dur(vs.slice(i));
    if (!a || !b) continue;
    const ratio = Math.max(a / b, b / a), cut = Math.sqrt(a * b), long = v => v.duration > cut;
    // fewest posts on the wrong side of the split (a long post before a short->long switch, and vice versa)
    const wrong = vs.slice(0, i).filter(v => long(v) === b > a).length + vs.slice(i).filter(v => long(v) !== b > a).length;
    if (ratio >= 2.5 && (!best || wrong < best.wrong)) best = { index: i, ratio, wrong, before: a, after: b, start: vs[i].date, timestamp: vs[i].timestamp };
  }
  return best;
}

function analyze(handle, profile, videos, labels) {
  const vs = videos.filter(v => v.timestamp).map(v => ({ ...v, ...parts(v.timestamp), er: er(v), category: labels[v.id] || UNLABELED, tags: hashtags(v.title) }))
    .sort((a, b) => a.timestamp - b.timestamp);
  const views = vs.map(v => v.views), med = median(views), rel = localBenchmarks(vs);
  // views relative to the posts published within ±7 days: removes "this group happened to be posted in a hot week"
  for (const v of vs) v.rel = rel.get(v.id);
  for (const v of vs) v.ratio = med ? v.views / med : 0;
  const spanDays = Math.max(1, (vs.at(-1).timestamp - vs[0].timestamp) / 86400);
  const gaps = vs.slice(1).map((v, i) => (v.timestamp - vs[i].timestamp) / 86400);
  const months = group(vs, v => v.month).sort((a, b) => a.name.localeCompare(b.name));
  // Group comparisons (weekday, hour, duration, hashtag, category chart) only use the current format when
  // the channel switched: mixing two formats makes every "best group" an artefact of the switch.
  const era = detectEra(vs), sv = era ? vs.slice(era.index) : vs, scopeMedian = median(sv.map(v => v.views));
  const weekdays = WEEKDAYS.map((name, i) => stat(name, sv.filter(v => v.weekday === i)));
  const timeBuckets = TIME_BUCKETS.map(([lo, hi, name]) => stat(name, sv.filter(v => (v.hour < 5 ? v.hour + 24 : v.hour) >= lo && (v.hour < 5 ? v.hour + 24 : v.hour) < hi)));
  const durations = (median(sv.map(v => v.duration || 0)) > 120 ? DURATION_LONG : DURATION_SHORT).map(([lo, hi, name]) => stat(name, sv.filter(v => v.duration >= lo && v.duration <= hi))).filter(d => d.count);
  const tagMap = new Map();
  for (const v of sv) for (const t of new Set(v.tags)) { if (!tagMap.has(t)) tagMap.set(t, []); tagMap.get(t).push(v); }
  const tags = [...tagMap].map(([name, l]) => stat(name, l)).sort((a, b) => b.count - a.count).slice(0, 15);
  const categories = group(vs, v => v.category).sort((a, b) => b.median - a.median);
  const scopeCategories = group(sv, v => v.category).sort((a, b) => b.median - a.median);
  const lastDays = Math.floor((Date.now() / 1000 - vs.at(-1).timestamp) / 86400);
  return {
    handle, profile, videos: vs, months, weekdays, timeBuckets, durations, tags, categories, scopeCategories,
    era: era && { start: era.start, timestamp: era.timestamp, count: sv.length, medianDurationBefore: era.before, medianDurationAfter: era.after, medianViewsBefore: median(vs.slice(0, era.index).map(v => v.views)), medianViewsAfter: scopeMedian },
    scope: { videos: sv, count: sv.length, medianViews: scopeMedian },
    labeled: vs.some(v => v.category !== UNLABELED),
    stats: {
      n: vs.length, first: vs[0].date, last: vs.at(-1).date, daysSinceLast: lastDays,
      totalViews: views.reduce((a, b) => a + b, 0), meanViews: mean(views), medianViews: med,
      maxViews: Math.max(...views), minViews: Math.min(...views), medianER: vs.some(v => v.er != null) ? median(vs.map(v => v.er).filter(v => v != null)) : null,
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
// one decimal below 10k: "1k" for everything between 500 and 1 499 made different groups look identical
const fmt = n => n == null ? '—' : n >= 1e6 ? `${vn(n / 1e6).replace(',0', '')} tr` : n >= 9950 ? `${Math.round(n / 1e3)}k` : n >= 1e3 ? `${vn(n / 1e3).replace(',0', '')}k` : String(Math.round(n));
const pct = x => x == null ? '—' : `${vn(x * 100)}%`;
const niceMax = m => { if (m <= 0) return 1; const p = 10 ** Math.floor(Math.log10(m)); return [1, 2, 2.5, 5, 10].map(k => k * p).find(k => k >= m); };

// ---------- nhận định tự động + biểu đồ ----------
// Mỗi biểu đồ trả lời một câu hỏi; tiêu đề là câu trả lời tính từ dữ liệu. Nhóm dưới MIN_N video bị đánh dấu "ít mẫu".
const MIN_N = 5;
const W = 720;
const monthLabel = m => `T${Number(m.slice(5))}/${m.slice(2, 4)}`;
const times = x => x >= 10 ? `${Math.round(x)}×` : `${vn(x)}×`;
const dmy = d => `${d.slice(8)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;
// A group only "leads" when it has enough posts AND its median is clearly above the runner-up.
// Otherwise the chart highlights nothing: equal groups must look equal.
const LEAD = 1.3;
// The comparison uses views relative to contemporaries when available (falls back to raw medians).
// Views are heavy-tailed (a few hits at 100x), so the median of 5–15 posts jumps around by itself: the leader
// must also beat what random groups of the same size reach (permutation check, fixed seed => stable output).
const CHANCE = 0.05; // divided by the number of groups compared (the leader is the best of k)
function chance(n, observed, values) {
  let seed = 20261111;
  const rnd = () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const TRIALS = 2000, a = [...values];
  let hit = 0;
  for (let k = 0; k < TRIALS; k++) {
    for (let i = 0; i < n; i++) { const j = i + Math.floor(rnd() * (a.length - i)); [a[i], a[j]] = [a[j], a[i]]; }
    if (median(a.slice(0, n)) >= observed) hit++;
  }
  return hit / TRIALS;
}
function leader(items) {
  const pool = items.filter(i => i.count >= MIN_N), key = pool.every(i => i.relMedian != null) ? 'relMedian' : 'median';
  const ok = [...pool].sort((a, b) => b[key] - a[key]);
  let win = ok.length >= 2 && ok[0][key] >= ok[1][key] * LEAD ? ok[0] : null;
  const values = items.flatMap(i => i.values?.[key] || []);
  if (win && values.length > win.values[key].length && chance(win.values[key].length, win[key], values) > CHANCE / ok.length) win = null;
  return { ok, key, win };
}
function verdict(items, noun) {
  const { ok, win, key } = leader(items), rel = key === 'relMedian';
  if (ok.length < 2) return `Chưa đủ mẫu để so sánh ${noun}`;
  if (win && rel) return `**${win.name}** nổi trội: gấp ${times(win.relMedian)} các bài đăng cùng thời, nhóm kế tiếp (${ok[1].name}) ${times(ok[1].relMedian)}`;
  if (win) return `**${win.name}** có view trung vị cao nhất: ${fmt(win.median)}, gấp ${times(win.median / Math.max(1, ok[1].median))} nhóm kế tiếp (${ok[1].name})`;
  const m = ok.map(i => i.median);
  return `Không ${noun} nào nổi trội rõ: chênh lệch giữa các nhóm còn trong mức ngẫu nhiên (trung vị ${fmt(Math.min(...m))}–${fmt(Math.max(...m))})`;
}

function takeaways(c) {
  const s = c.stats, vs = c.videos, sv = c.scope.videos, t = {};
  const named = c.scopeCategories.filter(x => x.name !== UNLABELED);
  if (c.labeled && named.length > 1) {
    t.category = verdict(named, 'loại nội dung');
    const total = sv.reduce((a, v) => a + v.views, 0) || 1;
    const shares = named.map(x => ({ ...x, postShare: x.count / sv.length, viewShare: sv.filter(v => v.category === x.name).reduce((a, v) => a + v.views, 0) / total }));
    const waste = [...shares].sort((a, b) => (a.viewShare - a.postShare) - (b.viewShare - b.postShare))[0];
    if (waste.postShare - waste.viewShare > 0.1) t.share = `**${waste.name}** chiếm ${pct(waste.postShare)} số video nhưng chỉ mang về ${pct(waste.viewShare)} tổng view`;
    c.shares = shares.sort((a, b) => b.viewShare - a.viewShare);
  }
  t.category ||= 'Chưa đủ nhóm có nhãn để so sánh';
  const top3 = c.top.slice(0, 3).reduce((a, v) => a + v.views, 0) / s.totalViews;
  const e = c.evidence, hits = vs.filter(v => v.views >= e.hitThreshold);
  t.viral = `**${hits.length}/${s.n} video** đạt từ ${fmt(e.hitThreshold)} view (10× trung vị kênh) và mang về **${pct(hits.reduce((a, v) => a + v.views, 0) / s.totalViews)}** tổng view; top 3 chiếm ${pct(top3)}`;
  if (c.era) {
    t.trend = `Kênh **đổi format từ ${dmy(c.era.start)}** (độ dài trung vị ${fmtDur(c.era.medianDurationBefore)} → ${fmtDur(c.era.medianDurationAfter)}): view trung vị ${fmt(c.era.medianViewsBefore)} trước đó → ${fmt(c.era.medianViewsAfter)} sau đó; chưa so ở cùng tuổi bài`;
  } else if (c.months.length >= 4) {
    const k = Math.min(3, Math.floor(c.months.length / 2)), a = c.months.slice(0, k).map(m => m.name), b = c.months.slice(-k).map(m => m.name);
    const ma = median(vs.filter(v => a.includes(v.month)).map(v => v.views)), mb = median(vs.filter(v => b.includes(v.month)).map(v => v.views));
    const dir = mb < ma * 0.7 ? 'giảm' : mb > ma * 1.3 ? 'tăng' : 'đi ngang';
    t.trend = `View tích lũy trung vị **${dir}**: ${fmt(ma)} ở ${k} tháng có bài đầu → ${fmt(mb)} ở ${k} tháng có bài cuối; chưa so ở cùng tuổi bài`;
  }
  const recent = e.timeline.slice(-4);
  if (recent.length >= 2 && recent.some(r => r.hits)) t.hits = `Số hit (từ ${fmt(e.hitThreshold)} view) theo ${e.periodUnit} gần nhất: **${recent.map(r => `${r.hits}/${r.count}`).join(' → ')}**${recent.at(-1).young ? ` (kỳ cuối có ${recent.at(-1).young} bài dưới 7 ngày tuổi, còn tích view)` : ''}`;
  const peak = [...c.months].sort((x, y) => y.count - x.count)[0];
  t.cadence = `Đăng ${vn(s.postsPerWeek)} video/tuần; tháng dày nhất ${monthLabel(peak.name)} có ${peak.count} video; 30 ngày qua: ${s.postsLast30} video`;
  t.time = verdict(c.timeBuckets, 'khung giờ');
  t.weekday = verdict(c.weekdays, 'thứ');
  t.duration = verdict(c.durations, 'mức độ dài');
  const goodTags = c.tags.filter(x => x.count >= MIN_N && x.median >= c.scope.medianViews * LEAD).sort((a, b) => b.median - a.median);
  t.tags = (goodTags.length ? `Hashtag đi kèm view cao hơn hẳn trung vị: ${goodTags.slice(0, 3).map(x => `**${x.name}**`).join(', ')}` : 'Không hashtag đủ mẫu nào đi kèm view cao hơn hẳn trung vị') + '; không chứng minh hashtag làm tăng view';
  return t;
}
const mdInline = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
const plain = s => s.replace(/\*\*/g, '');

// Thanh ngang bằng HTML: chữ giữ nguyên cỡ, đọc rõ trên điện thoại
function bars(items, { fmtv = fmt, ref, emphasize = true } = {}) {
  if (!items.length) return '';
  const max = Math.max(...items.map(i => i.value), ref?.value || 0) || 1;
  const strong = items.filter(i => !i.weak);
  const best = strong.length ? Math.max(...strong.map(i => i.value)) : null;
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

// Range rows for "which group wins?": the band is P25–P75 (the middle half of the posts), the tick is the median,
// on a log scale. Overlapping bands = no real difference. Only a clear leader (see leader()) is coloured.
function ranges(items, { ref, lead = true } = {}) {
  items = items.filter(i => i.count);
  if (!items.length) return '';
  const L = lead ? leader(items) : { win: null, key: 'median' }, win = L.win, rel = L.key === 'relMedian';
  const val = i => rel ? [i.relQ25, i.relMedian, i.relQ75] : [i.q25, i.median, i.q75];
  if (rel) ref = { value: 1, label: 'vạch đứt: bằng các bài đăng cùng thời (1×)' };
  const pos = [...items.flatMap(val), ref?.value].filter(x => x > 0);
  const lo = Math.max(rel ? 0.01 : 1, Math.min(...pos) / 1.6), hi = Math.max(lo * 10, Math.max(...pos) * 1.6);
  const x = v => 100 * Math.log(Math.min(hi, Math.max(v, lo)) / lo) / Math.log(hi / lo);
  let ticks = [];
  for (let k = Math.floor(Math.log10(lo)); 10 ** k <= hi; k++) for (const m of [1, 3]) { const v = m * 10 ** k; if (v >= lo * 1.05 && v <= hi / 1.05) ticks.push(Number(v.toPrecision(1))); }
  if (ticks.length > 5) ticks = ticks.filter(v => /^[0.]*1/.test(String(v)));
  const tl = v => rel ? `${String(v).replace('.', ',')}×` : fmt(v);
  const grid = ticks.map(v => `<i class="rtick" style="left:${x(v).toFixed(1)}%"></i>`).join('');
  const row = i => {
    const [a, m, b] = val(i), drawn = m > 0;
    const tip = `${i.name}: trung vị ${fmt(i.median)} view (nửa số video trong ${fmt(i.q25)}–${fmt(i.q75)})${i.relMedian != null ? `\nGấp ${times(i.relMedian)} trung vị các bài đăng trong ±7 ngày` : ''}\n${i.count} video`;
    return `<div class="brow${i.count < MIN_N ? ' weak' : ''}" data-tip="${esc(tip)}">
<div class="blabel">${esc(i.name)}</div>
<div class="btrack rtrack">${grid}${ref ? `<div class="bref" style="left:${x(ref.value).toFixed(1)}%"></div>` : ''}${drawn ? `<div class="rband ${i === win ? 'hi' : 'lo'}" style="left:${x(a).toFixed(1)}%;width:${Math.max(0.8, x(b) - x(a)).toFixed(1)}%"></div><div class="rmed${i === win ? ' win' : ''}" style="left:${x(m).toFixed(1)}%"></div>` : ''}</div>
<div class="bval">${rel ? `<b>${drawn ? times(m) : '—'}</b> <span class="muted">${fmt(i.median)} · ${i.count} video</span>` : `<b>${fmt(i.median)}</b> <span class="muted">${i.count} video</span>`}${i.count < MIN_N ? ' <span class="weaktag">ít mẫu</span>' : ''}</div></div>`;
  };
  return `<div class="bars ranges" style="--vw:${rel ? 168 : 124}px">${items.map(row).join('')}
<div class="brow raxis"><div></div><div class="btrack rtrack">${ticks.map(v => `<span style="left:${x(v).toFixed(1)}%">${tl(v)}</span>`).join('')}</div><div></div></div>
<p class="brefnote">${rel ? 'Trục: gấp mấy lần bài cùng thời (thang log) · số mờ: view trung vị' : 'Trục: view (thang log)'}${ref ? ` · <i></i>${esc(ref.label)}` : ''}</p></div>`;
}

// Every post as a dot on a real time axis with a log view axis, plus the median per week/month and the number
// of posts per period underneath (same x axis). Linear columns hid everything except the three biggest hits.
function timeline(c, vs, slot, { markEra = false } = {}) {
  const DAY = 86400, t0 = vs[0].timestamp, t1 = Math.max(vs.at(-1).timestamp, t0 + DAY), span = (t1 - t0) / DAY;
  const L = 46, R = 14, h = 320, top = 18, bottom = 30, pw = W - L - R;
  const x = t => L + pw * (t - t0) / (t1 - t0);
  const views = vs.map(v => Math.max(1, v.views));
  const yLo = 10 ** Math.floor(Math.log10(Math.max(1, quantile(views, .02)))), yHi = Math.max(yLo * 10, Math.max(...views) * 1.6);
  const y = v => top + (h - top - bottom) * (1 - Math.log(Math.max(v, yLo) / yLo) / Math.log(yHi / yLo));
  const yt = []; for (let p = yLo; p <= yHi; p *= 10) yt.push(p);
  // buckets: weeks for short spans, months otherwise
  const weekly = span <= 150;
  const utc = d => Date.parse(`${d}T00:00:00+07:00`) / 1000;
  const monday = date => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return utc(d.toISOString().slice(0, 10)); };
  const bucketStart = v => weekly ? monday(v.date) : utc(`${v.month}-01`);
  const bucketEnd = s => { if (weekly) return s + 7 * DAY; const d = new Date((s + 7 * 3600) * 1000); d.setUTCMonth(d.getUTCMonth() + 1); return d.getTime() / 1000 - 7 * 3600; };
  const bm = new Map();
  for (const v of vs) { const k = bucketStart(v); if (!bm.has(k)) bm.set(k, []); bm.get(k).push(v); }
  const buckets = [...bm].sort((a, b) => a[0] - b[0]).map(([s, l]) => ({ s, e: bucketEnd(s), count: l.length, median: median(l.map(v => v.views)), mid: mean(l.map(v => v.timestamp)) }));
  const line = buckets.filter(b => b.count >= 3);
  const short = span <= 75;
  const lbl = t => { const d = new Date((t + 7 * 3600) * 1000).toISOString(); return short || weekly ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : `T${Number(d.slice(5, 7))}/${d.slice(2, 4)}`; };
  const tick = t => { const d = new Date((t + 7 * 3600) * 1000).toISOString(); return short ? `${d.slice(8, 10)}/${d.slice(5, 7)}` : `T${Number(d.slice(5, 7))}/${d.slice(2, 4)}`; };
  // x ticks: Mondays for short spans, month starts otherwise
  const xt = [];
  if (short) { for (let s = monday(vs[0].date); s <= t1; s += 7 * DAY) if (s >= t0) xt.push(s); }
  else { const d = new Date(`${vs[0].month}-01T00:00:00Z`); for (;;) { d.setUTCMonth(d.getUTCMonth() + 1); const s = d.getTime() / 1000 - 7 * 3600; if (s > t1) break; xt.push(s); } }
  const every = Math.ceil(xt.length / 9);
  const top3 = new Set([...vs].sort((a, b) => b.views - a.views).slice(0, markEra && c.era ? 1 : 3).map(v => v.id));
  const eraX = markEra && c.era ? x(c.era.timestamp) : null;
  const cmax = Math.max(...buckets.map(b => b.count)), ch = 96, cTop = 28, cBase = ch - 6;
  return `<svg viewBox="0 0 ${W} ${h}" role="img" aria-label="View từng video theo ngày đăng, thang log">
${yt.map(v => `<line class="grid" x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}"/><text class="axis" x="${L - 8}" y="${y(v) + 4}" text-anchor="end">${fmt(v)}</text>`).join('')}
${xt.filter((_, k) => k % every === 0).map(s => `<line class="grid" x1="${x(s)}" x2="${x(s)}" y1="${top}" y2="${h - bottom}"/><text class="axis" x="${x(s)}" y="${h - 10}" text-anchor="middle">${tick(s)}</text>`).join('')}
${eraX != null ? `<line class="refline" x1="${eraX}" x2="${eraX}" y1="${top - 6}" y2="${h - bottom}"/><text class="axis" x="${eraX - 6}" y="${top + 4}" text-anchor="end">đổi format ${dmy(c.era.start).slice(0, 5)}</text>` : ''}
${vs.map(v => `<g data-tip="${esc(`${v.title.slice(0, 80)}\n${v.date} · ${fmt(v.views)} view · ${fmtDur(v.duration || 0)}${c.labeled ? `\n${v.category}` : ''}`)}" data-href="${esc(v.url)}"><circle class="hit" cx="${x(v.timestamp).toFixed(1)}" cy="${y(v.views).toFixed(1)}" r="8"/><circle class="dot ${slot(v.category)}" cx="${x(v.timestamp).toFixed(1)}" cy="${y(v.views).toFixed(1)}" r="3.6"/>${top3.has(v.id) ? `<text class="cval" x="${x(v.timestamp) - 8}" y="${y(v.views) + 4}" text-anchor="end">${fmt(v.views)}</text>` : ''}</g>`).join('')}
${line.length >= 2 ? `<polyline class="medline" points="${line.map(b => `${x(b.mid).toFixed(1)},${y(b.median).toFixed(1)}`).join(' ')}"/>` : ''}${line.map(b => `<circle class="meddot" cx="${x(b.mid).toFixed(1)}" cy="${y(b.median).toFixed(1)}" r="3"><title>${lbl(b.s)}: trung vị ${fmt(b.median)} · ${b.count} video</title></circle>`).join('')}
<line class="base" x1="${L}" x2="${W - R}" y1="${h - bottom}" y2="${h - bottom}"/></svg>
<p class="brefnote"><b class="mkey"></b>Trung vị theo ${weekly ? 'tuần' : 'tháng'} (kỳ có từ 3 video) · mỗi chấm là một video, bấm để mở · trục dọc thang log: mỗi nấc gấp 10 lần</p>
<svg viewBox="0 0 ${W} ${ch}" role="img" aria-label="Số video đăng mỗi ${weekly ? 'tuần' : 'tháng'}">
<text class="axis" x="${L}" y="12">Số video đăng mỗi ${weekly ? 'tuần' : 'tháng'}</text>
${buckets.map(b => { const x0 = Math.max(L, x(b.s)) + 1, x1 = Math.min(W - R, x(b.e)) - 1, bh = Math.max(2, (cBase - cTop) * b.count / cmax);
    return `<g data-tip="${esc(`${weekly ? 'Tuần từ ' : ''}${lbl(b.s)}: ${b.count} video · trung vị ${fmt(b.median)} view`)}"><rect class="hit" x="${x0}" y="${cTop - 10}" width="${Math.max(1, x1 - x0)}" height="${cBase - cTop + 10}"/><rect class="ccol" x="${x0}" y="${cBase - bh}" width="${Math.max(1, x1 - x0)}" height="${bh}" rx="2"/>${x1 - x0 >= 18 ? `<text class="cnt" x="${(x0 + x1) / 2}" y="${cBase - bh - 3}" text-anchor="middle">${b.count}</text>` : ''}</g>`; }).join('')}
<line class="base" x1="${L}" x2="${W - R}" y1="${cBase}" y2="${cBase}"/></svg>`;
}

// How views are spread: counts per view band. Makes "most posts sit at the floor, a few hits carry the channel" visible.
function distribution(c) {
  const edges = [0, 1e3, 3e3, 1e4, 3e4, 1e5, 3e5, 1e6, Infinity], total = c.stats.totalViews || 1;
  const bins = edges.slice(1).map((hi, i) => { const lo = edges[i], l = c.videos.filter(v => v.views >= lo && v.views < hi);
    return { label: hi === Infinity ? `từ ${fmt(lo)}` : lo === 0 ? `dưới ${fmt(hi)}` : `${fmt(lo)}–${fmt(hi)}`, value: l.length, share: l.reduce((a, v) => a + v.views, 0) / total }; });
  while (bins.length && !bins[0].value) bins.shift();
  while (bins.length && !bins.at(-1).value) bins.pop();
  return bars(bins.map(b => ({ label: `${b.label} view`, value: b.value, note: `· ${pct(b.share)} tổng view`, tip: `${b.label} view: ${b.value} video (${pct(b.value / c.stats.n)}) · ${pct(b.share)} tổng view` })), { fmtv: v => `${v} video`, emphasize: false });
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
function evidenceHtml(c) {
  return `<div class="chart"><h3>Kiểm tra bằng chứng</h3><p class="note">${esc(EVIDENCE_LIMITS)}</p><p>Đã gắn nhãn ${c.evidence.labeledCount}/${c.evidence.totalCount} video. P25–P75 là khoảng phân vị, không phải khoảng tin cậy.</p>${evidenceTables(c.evidence, fmt, pct).map(t => `<details><summary>${esc(t.title)}</summary>${t.rows.length ? `<div class="tablewrap"><table><thead><tr>${t.headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map(row => `<tr>${row.map(cell => `<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>` : '<p>Chưa đủ dữ liệu.</p>'}</details>`).join('')}<p class="small muted">Cặp đối chứng: cùng loại, cách tối đa 30 ngày, độ dài chênh tối đa 15% (ít nhất 10 giây), view chênh ít nhất 2 lần, cả hai bài đã đủ 7 ngày tuổi; mỗi loại tối đa 2 cặp, không lặp video, ưu tiên chênh view lớn. Chỉ dùng để xem thủ công, chưa chứng minh nguyên nhân.</p></div>`;
}
function evidenceMarkdown(c) {
  const cell = value => String(value).replace(/\|/g, ' / ').replace(/[\r\n]/g, ' ');
  return ['#### Kiểm tra bằng chứng', '', EVIDENCE_LIMITS, '', `Đã gắn nhãn ${c.evidence.labeledCount}/${c.evidence.totalCount} video. P25–P75 là khoảng phân vị, không phải khoảng tin cậy.`, '', ...evidenceTables(c.evidence, fmt, pct).flatMap(t => [`**${t.title}**`, '', ...(t.rows.length ? ['| ' + t.headers.map(cell).join(' | ') + ' |', '|' + t.headers.map(() => '---').join('|') + '|', ...t.rows.map(row => '| ' + row.map(cell).join(' | ') + ' |')] : ['Chưa đủ dữ liệu.']), '']), 'Cặp đối chứng: cùng loại, cách tối đa 30 ngày, độ dài chênh tối đa 15% (ít nhất 10 giây), view chênh ít nhất 2 lần, cả hai bài đã đủ 7 ngày tuổi; mỗi loại tối đa 2 cặp, không lặp video, ưu tiên chênh view lớn. Chỉ dùng để xem thủ công, chưa chứng minh nguyên nhân.'].join('\n');
}

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
  const ref = { value: c.scope.medianViews, label: `vạch đứt: trung vị ${c.era ? 'giai đoạn' : 'kênh'} ${fmt(c.scope.medianViews)}` };
  const scopeNote = c.era ? ` · chỉ tính ${c.scope.count} video từ ${dmy(c.era.start)}` : '';
  const catChart = c.labeled ? chart('Loại nội dung nào thắng?', t.category, ranges(c.scopeCategories, { ref }), `View mỗi video theo nhóm nội dung${scopeNote}`)
    + (c.shares ? chart('Công sức đổ vào đâu, view đến từ đâu?', t.share || 'Tỷ trọng view gần tương xứng với số video của mỗi nhóm',
      `${c.era ? `<p class="muted small">Chỉ tính ${c.scope.count} video từ ${dmy(c.era.start)}</p>` : ''}<div class="legend"><span><i class="sw lo"></i>% số video</span><span><i class="sw hi"></i>% tổng view</span></div><div class="bars" style="--vw:190px">${c.shares.map(x => `<div class="brow" data-tip="${esc(`${x.name}: ${pct(x.postShare)} số video · ${pct(x.viewShare)} tổng view`)}"><div class="blabel">${esc(x.name)}</div><div class="btrack pair"><div class="bfill lo" style="width:${(100 * x.postShare).toFixed(1)}%"></div><div class="bfill hi" style="width:${(100 * x.viewShare).toFixed(1)}%"></div></div><div class="bval"><span class="muted">${pct(x.postShare)} video</span> → <b>${pct(x.viewShare)} view</b></div></div>`).join('')}</div>`) : '')
    : '<p class="note">Chưa có nhãn loại hình. Hãy điền <code>labels.json</code> theo hướng dẫn của skill rồi chạy lại để biết loại nội dung nào thắng.</p>';
  const tags = c.tags.filter(x => x.count >= MIN_N).slice(0, 8);
  return `<section class="channel" id="${esc(c.handle)}">
<h2><a href="https://www.tiktok.com/@${esc(c.handle)}" target="_blank" rel="noopener">@${esc(c.handle)}</a> <span class="muted">${esc(p.nickname || '')}</span></h2>
${p.bio ? `<p class="muted bio">${esc(p.bio)}</p>` : ''}
<p class="muted small">${s.n} video, đăng từ ${s.first} đến ${s.last}. Giờ tính theo giờ Việt Nam.</p>
${s.daysSinceLast > 30 ? `<p class="alert">⚠ Chưa ghi nhận video mới trong <b>${s.daysSinceLast} ngày</b> trong dữ liệu thu thập (video gần nhất ${s.last}).</p>` : ''}
<div class="kpis">${kpis.map(([k, v, sub]) => `<div class="kpi"><span>${k}</span><b>${v}</b><small>${esc(sub)}</small></div>`).join('')}</div>
${c.era ? `<p class="note">Kênh <b>đổi format từ ${dmy(c.era.start)}</b>: độ dài trung vị ${fmtDur(c.era.medianDurationBefore)} → ${fmtDur(c.era.medianDurationAfter)}. Các biểu đồ so sánh nhóm (loại nội dung, giờ, thứ, độ dài, hashtag) chỉ tính <b>${c.scope.count} video</b> của format hiện tại; dòng thời gian, top video và phân bố view tính toàn bộ ${s.n} video.</p>` : ''}
<div class="keys"><p class="q">Điểm chính</p><ul>${[t.trend, t.viral, t.hits, t.category, t.share, t.cadence, t.duration, t.time, t.weekday].filter(Boolean).map(x => `<li>${mdInline(x)}</li>`).join('')}</ul></div>
${chart('Video nào thắng?', `Top 1 đạt **${fmt(c.top[0].views)} view**, gấp ${times(c.top[0].ratio)} một video bình thường của kênh`, legend + top)}
${styleHtml(c)}
<p class="note howto"><b>Cách đọc các biểu đồ so sánh nhóm</b> (loại nội dung, giờ, thứ, độ dài): mỗi hàng là một nhóm video. <b class="rkey"></b>Dải xám là nửa số video ở giữa (P25–P75), vạch đậm là trung vị. Trục không phải view thô mà là <b>view của video chia cho trung vị các video khác đăng trong ±7 ngày</b>: 1× nghĩa là ngang bài cùng thời, nên một nhóm không "thắng" chỉ vì rơi vào tuần kênh đang viral. Nhóm chỉ được tô màu khi vượt nhóm kế tiếp từ 1,3 lần và chênh lệch khó là ngẫu nhiên; không có nhóm nào tô màu nghĩa là dữ liệu chưa đủ để nói nhóm nào hơn.</p>
${catChart}
${evidenceHtml(c)}
${chart('Kênh đang lên hay đi xuống?', t.trend || t.cadence, legend + `<div class="tl">${timeline(c, c.videos, slot, { markEra: true })}</div>`, `Toàn bộ ${s.n} video theo ngày đăng`)}
${c.era ? chart('Format hiện tại đang chạy thế nào?', t.hits || `${c.scope.count} video từ ${dmy(c.era.start)}, trung vị ${fmt(c.scope.medianViews)} view`, legend + `<div class="tl">${timeline(c, c.scope.videos, slot)}</div>`, `Phóng to ${c.scope.count} video từ ${dmy(c.era.start)}`) : ''}
${chart('Có phụ thuộc vào vài video viral?', t.viral, distribution(c), 'Số video theo mức view · toàn bộ kênh')}
<div class="two">
${chart('Đăng giờ nào?', t.time, ranges(c.timeBuckets), `View theo khung giờ đăng (giờ VN)${scopeNote}`)}
${chart('Đăng thứ mấy?', t.weekday, ranges(c.weekdays), `View theo thứ đăng${scopeNote}`)}
</div>
<div class="two">
${chart('Video dài bao nhiêu?', t.duration, ranges(c.durations), `View theo độ dài${scopeNote}`)}
${tags.length ? chart('Hashtag nào đi kèm view cao?', t.tags, ranges(tags, { ref, lead: false }), `Hashtag dùng ít nhất ${MIN_N} lần${scopeNote}`) : ''}
</div>
<details><summary>Bảng dữ liệu đầy đủ (${s.n} video)</summary><div class="tablewrap"><table><thead><tr><th>Ngày</th><th>Tiêu đề</th>${c.labeled ? '<th>Loại</th>' : ''}<th>Giây</th><th>View</th><th>Like</th><th>Bình luận</th><th>Chia sẻ</th><th>Lưu</th><th>Tương tác</th></tr></thead><tbody>
${[...c.videos].reverse().map(v => `<tr><td>${v.date}</td><td><a href="${esc(v.url)}" target="_blank" rel="noopener">${esc(v.title.slice(0, 90))}</a></td>${c.labeled ? `<td>${esc(v.category)}</td>` : ''}<td>${v.duration}</td><td>${v.views.toLocaleString('vi')}</td><td>${v.likes == null ? '—' : v.likes.toLocaleString('vi')}</td><td>${v.comments == null ? '—' : v.comments.toLocaleString('vi')}</td><td>${v.shares == null ? '—' : v.shares.toLocaleString('vi')}</td><td>${v.saves == null ? '—' : v.saves.toLocaleString('vi')}</td><td>${pct(v.er)}</td></tr>`).join('')}
</tbody></table></div></details></section>`;
}

// Phong cách dựng: số đo tự động của các video top + công thức dựng do agent viết (style.md)
function styleHtml(c) {
  const ss = c.styles || [];
  if (!ss.length) return '';
  const m = k => { const a = ss.map(x => x[k]).filter(x => x != null && x !== 0); return a.length ? median(a) : null; };
  // whisper tách tiếng Việt theo âm tiết nên đơn vị là âm tiết, không phải từ
  const unit = ss[0].language === 'vi' ? 'âm tiết/phút' : 'từ/phút';
  // measured beats (motion timeline) when available; caption swaps are excluded from beats
  const mo = ss.filter(x => x.motion);
  const mm = k => median(mo.map(x => x.motion[k]).filter(x => x != null));
  const caps = mo.filter(x => x.motion.caption);
  const capInt = median(caps.map(x => x.motion.caption.medianInterval));
  const fxAll = {};
  for (const x of mo) for (const [k, n] of Object.entries(x.motion.entrances || {})) fxAll[k] = (fxAll[k] || 0) + n;
  const fxTotal = Object.values(fxAll).reduce((a, b) => a + b, 0);
  const FXV = { cut: 'cắt cứng', pop: 'pop (phóng to)', drop: 'rơi xuống', fade: 'mờ dần', 'slide-left': 'trượt trái', 'slide-right': 'trượt phải', 'slide-up': 'trượt lên', 'draw-right': 'vẽ dần', 'draw-left': 'vẽ dần', 'draw-down': 'vẽ dần', 'draw-up': 'vẽ dần' };
  const topFx = Object.entries(fxAll).sort((a, b) => b[1] - a[1])[0];
  const wpmText = v => v ? `${Math.round(v)} ${unit}` : 'chưa đo được';
  const beatS = mo.length ? mm('medianBeat') : m('secPerChange');
  const head = `Đổi hình mỗi **${vn(beatS)} giây**, đọc **${wpmText(m('wpm'))}**, đoạn transcript phủ ${pct(m('speechCoverage'))} thời lượng (không đo khoảng nghỉ)`;
  const kp = mo.length ? [
    ['Nhịp hình', `${vn(beatS)}s/beat`, `${Math.round(mm('beatsPerMin'))} beat/phút · có thể lẫn chữ di chuyển`],
    ['3 giây đầu', `${Math.round(mm('beatsFirst3s'))} beat`, 'trung vị các video top'],
    ['Kiểu vào hình', topFx ? FXV[topFx[0]] || topFx[0] : '—', topFx ? `${pct(topFx[1] / fxTotal)} số beat` : ''],
    ['Phụ đề', caps.length ? `${vn(capInt)}s/cụm` : 'không thấy', caps.length ? `${caps.length}/${mo.length} video có dải phụ đề đổi đều` : 'không có dải chữ đổi đều'],
    ['Tốc độ đọc', `${wpmText(m('wpm'))}`, `đoạn transcript phủ ${pct(m('speechCoverage'))} thời lượng (không đo khoảng nghỉ)`],
    ['Độ to', m('lufs') ? `${vn(m('lufs'))} LUFS` : '—', ss[0].language ? `ngôn ngữ: ${ss[0].language}` : ''],
  ] : [
    ['Đổi hình', `${vn(m('secPerChange'))}s/lần`, `${vn(60 / m('secPerChange'), 0)} lần/phút · cắt cảnh hẳn: ${Math.round(m('cuts'))}`],
    ['3 giây đầu', `${Math.round(m('changesFirst3s'))} lần đổi hình`, 'trung vị các video top'],
    ['Tốc độ đọc', `${wpmText(m('wpm'))}`, ss[0].language ? `ngôn ngữ: ${ss[0].language}` : ''],
    ['Độ to', m('lufs') ? `${vn(m('lufs'))} LUFS` : '—', `đoạn transcript phủ ${pct(m('speechCoverage'))} thời lượng (không đo khoảng nghỉ)`],
  ];
  const beatLine = x => x.motion?.firstBeats?.length ? `<p class="small muted">Beat đầu: ${x.motion.firstBeats.map(b => `${vn(b.t)}s ${esc(FXV[b.fx] || b.fx)}${b.at ? ` “${esc(b.at)}”` : ''}`).join(' → ')}</p>` : '';
  const card = x => `<article class="scard">
<a href="${esc(x.video.url)}" target="_blank" rel="noopener" class="stitle"><b>${fmt(x.video.views)} view</b> · ${esc(x.video.title.replace(/#[\p{L}\p{N}_]+/gu, '').trim().slice(0, 70))}</a>
${fs.existsSync(path.join(OUT, x.base, 'hook.jpg')) ? `<img class="hook" src="${esc(x.base)}/hook.jpg" alt="6 khung hình của 3 giây đầu">` : ''}
<p class="hookq"><span class="q">3 giây đầu nói</span>“${esc(x.hook || '(không lời)')}”</p>
<div class="chips">${x.motion ? `<span>beat ${vn(x.motion.medianBeat)}s</span><span>${x.motion.beatsFirst3s} beat trong 3s đầu</span>${x.motion.caption ? `<span>phụ đề ${vn(x.motion.caption.medianInterval)}s/cụm</span>` : ''}` : `<span>đổi hình ${vn(x.secPerChange)}s/lần</span><span>${x.changesFirst3s} lần trong 3s đầu</span>`}${x.wpm ? `<span>${Math.round(x.wpm)} ${unit}</span>` : ''}<span>${Math.round(x.duration)}s</span>${x.lufs ? `<span>${vn(x.lufs)} LUFS</span>` : ''}</div>
${beatLine(x)}
<details><summary>Khung hình (${x.grids.length} lưới) & lời thoại</summary>${x.grids.map(g => `<img class="grid" src="${esc(x.base)}/frames/${esc(g)}" alt="" loading="lazy">`).join('')}<p class="transcript">${esc(x.transcript)}</p></details>
</article>`;
  return `${chart('Họ dựng video thế nào?', head, `<div class="kpis small">${kp.map(([k, v, sub]) => `<div class="kpi"><span>${k}</span><b>${v}</b><small>${esc(sub)}</small></div>`).join('')}</div>
${c.styleNotes ? `<div class="stylenotes">${md(c.styleNotes)}</div>` : '<p class="note">Chưa có công thức dựng. Agent cần xem lưới khung hình + lời thoại của các video dưới đây rồi viết <code>style.md</code> theo hướng dẫn của skill.</p>'}
<div class="scards">${ss.map(card).join('')}</div>`, `Mẫu ${ss.length} video top; chưa có đối chứng trung bình/thấp, không suy ra nguyên nhân thành công · khung hình và lời thoại tách bằng ffmpeg + whisper`)}`;
}

function compareHtml(cs) {
  if (cs.length < 2) return '';
  const block = (q, key, fmtv) => {
    const items = cs.filter(c => Number.isFinite(key(c))).map(c => ({ label: '@' + c.handle, value: key(c) })).sort((a, b) => b.value - a.value);
    if (!items.length) return chart(q, 'Chưa có số đo hợp lệ', '');
    return chart(q, `Dẫn đầu: **${items[0].label}** (${fmtv(items[0].value)})`, bars(items, { fmtv }));
  };
  return `<section><h2>So sánh các kênh</h2><div class="two">
${block('Ai lớn nhất?', c => c.profile.followers, fmt)}${block('Video của ai thường được xem nhiều nhất?', c => c.stats.medianViews, fmt)}
${block('Ai có tỷ lệ tương tác công khai cao nhất?', c => c.stats.medianER, pct)}${block('Ai đăng nhiều bài mỗi tuần nhất trong khoảng có bài?', c => c.stats.postsPerWeek, v => `${vn(v)}/tuần`)}
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
.ranges .brow{grid-template-columns:minmax(84px,24%) 1fr var(--vw,124px)}.ranges .rtrack{background:none;border-radius:0;height:22px}.rtick{position:absolute;top:0;bottom:0;border-left:1px solid var(--grid)}.rband{position:absolute;top:5px;bottom:5px;border-radius:4px}.rband.hi{opacity:.45}.rmed{position:absolute;top:0;bottom:0;width:3px;margin-left:-1.5px;border-radius:2px;background:var(--ink2)}.rmed.win{background:var(--hi)}.brow.weak .rband,.brow.weak .rmed{opacity:.45}
.raxis{padding:0!important}.raxis:hover{background:none!important}.raxis .rtrack{height:16px}.raxis span{position:absolute;transform:translateX(-50%);font-size:11px;color:var(--muted);white-space:nowrap}.rkey{display:inline-block;width:18px;height:8px;border-radius:3px;background:var(--lo);vertical-align:middle;margin-right:6px;border-right:3px solid var(--ink2)}.brefnote i{margin-left:2px}
.tl{overflow-x:auto}.tl svg,.tl p{min-width:600px}.howto{margin-top:34px;font-size:13px}.howto .rkey{margin:0 6px 0 2px}
.dot{fill-opacity:.8;stroke:var(--surface);stroke-width:1}.medline{fill:none;stroke:var(--ink);stroke-width:2;stroke-linejoin:round}.meddot{fill:var(--ink);stroke:var(--surface);stroke-width:1.5}.mkey{display:inline-block;width:16px;border-top:2px solid var(--ink);vertical-align:middle;margin-right:6px}.ccol{fill:var(--lo)}g[data-tip]:hover .dot{fill-opacity:1;stroke:var(--ink)}g[data-tip]:hover .ccol{fill:var(--ink2)}
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
@media (max-width:560px){section{padding:16px}.brow{grid-template-columns:1fr auto}.blabel{grid-column:1/-1}.raxis{display:none}.kpi b{font-size:24px}}
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
    if (c.styles?.length) L.push('**Phong cách dựng (video top)**', '', ...(c.styleNotes ? [c.styleNotes.trim(), ''] : []), `| Video | View | Đổi hình | 3s đầu | Phụ đề | ${c.styles[0].language === 'vi' ? 'Âm tiết' : 'Từ'}/phút | 3 giây đầu nói |`, '|---|---|---|---|---|---|---|',
      ...c.styles.map(x => `| [${x.video.title.slice(0, 40).replace(/\|/g, '/')}](${x.video.url}) | ${fmt(x.video.views)} | ${x.motion ? `${vn(x.motion.medianBeat)}s/beat` : `${vn(x.secPerChange)}s`} | ${x.motion ? x.motion.beatsFirst3s : x.changesFirst3s} | ${x.motion?.caption ? `${vn(x.motion.caption.medianInterval)}s/cụm` : '—'} | ${x.wpm ? Math.round(x.wpm) : '—'} | ${(x.hook || '').replace(/\|/g, '/')} |`), '');
    L.push(evidenceMarkdown(c), '');
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
  if (!OFFLINE && (!videos || flag('--refresh'))) { console.log(`↓ @${handle}: lấy danh sách video…`); videos = scrapeVideos(handle); writeJson(vf, videos);
    // Views per video at a known fetch time: the only way to compare posts at the same age later on.
    fs.mkdirSync(path.join(dir, 'snapshots'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'snapshots', `${today}.json`), JSON.stringify({ fetchedAt: new Date().toISOString(), views: Object.fromEntries(videos.map(v => [v.id, v.views])) }));
  }
  if (!OFFLINE && (!profile?.followers || flag('--refresh'))) { const fresh = await scrapeProfile(handle); if (fresh.followers || !profile) profile = fresh; writeJson(pf, profile); }
  if (!videos.length) { console.error(`@${handle}: không có video công khai`); continue; }
  const labelsFile = path.join(dir, 'labels.json');
  const labels = readJson(labelsFile, {});
  const todo = videos.filter(v => !labels[v.id]).map(v => ({ id: v.id, title: v.title, views: v.views, duration: v.duration }));
  writeJson(path.join(dir, 'labels.todo.json'), todo);
  const c = analyze(handle, profile, videos, labels);
  // When were the views read? Latest snapshot if any; otherwise the first run day (history/) is a lower bound.
  const days = d => { try { return fs.readdirSync(path.join(d)).filter(n => /^d{4}-d{2}-d{2}.json$/.test(n)).sort(); } catch { return []; } };
  const snap = days(path.join(dir, 'snapshots')).at(-1), firstRun = days(path.join(OUT, 'history'))[0] || today;
  const asOf = Date.parse(snap ? readJson(path.join(dir, 'snapshots', snap), {}).fetchedAt : `${firstRun.slice(0, 10)}T23:59:59+07:00`) / 1000 || 0;
  c.evidence = analyzeEvidence(c.videos, UNLABELED, { asOf });
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
    handle: c.handle, profile: c.profile, stats: c.stats, takeaways: Object.fromEntries(Object.entries(c.takeaways).map(([k, v]) => [k, plain(v)])), evidence: c.evidence, era: c.era, scope: { count: c.scope.count, medianViews: c.scope.medianViews, categories: c.scopeCategories, note: 'timeBuckets, weekdays, durations, tags and scope.categories only cover the current format when era is set' }, timeBuckets: c.timeBuckets, categories: c.categories, months: c.months, weekdays: c.weekdays, durations: c.durations, tags: c.tags,
    styles: (c.styles || []).map(({ video, base, transcript, grids, ...x }) => ({ ...x, title: video.title, views: video.views, folder: base })),
    top: c.top.map(({ id, title, url, views, er, duration, date, time, category, ratio }) => ({ id, title, url, views, er, duration, date, time, category, ratio })),
  })),
};
writeJson(path.join(OUT, 'summary.json'), summary);
// Ảnh chụp số liệu theo ngày để so xu hướng giữa các lần chạy
fs.mkdirSync(path.join(OUT, 'history'), { recursive: true });
writeJson(path.join(OUT, 'history', `${today}.json`), summary);
console.log(`\nBáo cáo: ${path.join(OUT, `${SLUG}.html`)}\n         ${path.join(OUT, `${SLUG}.md`)}`);
