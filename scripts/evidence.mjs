// Descriptive checks only: strata reduce confounding but do not identify causes.
export const MIN_SAMPLE = 5;
export const YOUNG_DAYS = 7;      // views of younger posts are still accumulating
export const HIT_MULTIPLE = 10;   // a "hit" is a post at >= 10x the channel median
const DAY = 86400;

export function quantile(values, p) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * p, lo = Math.floor(index);
  return sorted[lo] + (sorted[Math.ceil(index)] - sorted[lo]) * (index - lo);
}
const median = values => quantile(values, .5);
function groups(videos, key) {
  const map = new Map();
  for (const v of videos) {
    const name = key(v);
    if (!map.has(name)) map.set(name, []);
    map.get(name).push(v);
  }
  return [...map];
}

// Monday of the post's week (dates are already in the channel's local timezone)
const weekKey = v => { const d = new Date(`${v.date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); };
const PERIODS = [
  { unit: 'tuần', key: weekKey, label: k => `Tuần từ ${k.slice(8)}/${k.slice(5, 7)}/${k.slice(0, 4)}` },
  { unit: 'tháng', key: v => v.month, label: k => `T${Number(k.slice(5))}/${k.slice(0, 4)}` },
  { unit: 'quý', key: v => `${v.month.slice(0, 4)}-Q${Math.ceil(Number(v.month.slice(5)) / 3)}`, label: k => k },
];
// Finest period in which at least half of the posts sit in a period with >= 8 posts; a quarter hides
// everything on a channel that posts daily, a week is empty noise on a channel that posts weekly.
export function pickPeriod(videos) {
  return PERIODS.find((p, i) => i === PERIODS.length - 1
    || groups(videos, p.key).filter(([, l]) => l.length >= 8).reduce((a, [, l]) => a + l.length, 0) >= videos.length / 2);
}

// Benchmark of a post = median views of the other posts published within ±7 days (widened to ±14/±30 when
// fewer than MIN_SAMPLE). views / benchmark compares a post with its contemporaries, not with another era.
export function localBenchmarks(videos) {
  const out = new Map();
  for (const v of videos) {
    let peers = [];
    for (const days of [7, 14, 30]) {
      peers = videos.filter(o => o.id !== v.id && Math.abs(o.timestamp - v.timestamp) <= days * DAY);
      if (peers.length >= MIN_SAMPLE) break;
    }
    const bench = peers.length >= MIN_SAMPLE ? median(peers.map(o => o.views)) : null;
    out.set(v.id, bench > 0 ? v.views / bench : null);
  }
  return out;
}

const fmtDur = s => s < 90 ? `${s}s` : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
// Duration buckets from the tertiles of the group itself, so long-form channels are not all in ">60s"
function durationBuckets(list) {
  const ds = list.map(v => v.duration).filter(d => d > 0);
  const round = d => { const step = d < 90 ? 5 : 15; return Math.round(d / step) * step; };
  const cuts = [...new Set([quantile(ds, 1 / 3), quantile(ds, 2 / 3)].filter(Number.isFinite).map(round))];
  const edges = [0, ...cuts, Infinity];
  return edges.slice(1).map((hi, i) => {
    const lo = edges[i];
    return { name: hi === Infinity ? `>${fmtDur(lo)}` : lo === 0 ? `≤${fmtDur(hi)}` : `${fmtDur(lo)}–${fmtDur(hi)}`, items: list.filter(v => v.duration > lo && v.duration <= hi) };
  }).filter(b => b.items.length);
}

export function analyzeEvidence(videos, unlabeled = 'Chưa phân loại', { asOf: fetchedAt = 0 } = {}) {
  const channelMedian = median(videos.map(v => v.views));
  const hitThreshold = channelMedian * HIT_MULTIPLE;
  // Age is counted from the fetch time when the caller knows it; the newest post is only a lower bound for it.
  const asOf = Math.max(fetchedAt, ...videos.map(v => v.timestamp));
  const young = v => asOf - v.timestamp < YOUNG_DAYS * DAY;
  const rel = localBenchmarks(videos);
  const period = pickPeriod(videos);

  const describe = list => {
    const views = list.map(v => v.views), rels = list.map(v => rel.get(v.id)).filter(Number.isFinite);
    const hits = list.filter(v => v.views >= hitThreshold && hitThreshold > 0).length;
    const rates = field => list.filter(v => v.views > 0 && Number.isFinite(v[field])).map(v => v[field] / v.views);
    return {
      count: list.length, weak: list.length < MIN_SAMPLE, young: list.filter(young).length,
      median: median(views), q25: quantile(views, .25), q75: quantile(views, .75),
      aboveChannel: list.filter(v => v.views > channelMedian).length / list.length,
      // relative to posts of the same two weeks: removes "this group was only posted in a good/bad era"
      relMedian: median(rels), aboveLocal: rels.length ? rels.filter(r => r > 1).length / rels.length : null,
      hits, hitRate: hits / list.length,
      interactions: Object.fromEntries(['likes', 'comments', 'shares', 'saves'].map(field => {
        const values = rates(field);
        return [field, { median: median(values), count: values.length }];
      })),
    };
  };
  const named = videos.filter(v => v.category !== unlabeled);
  const summarize = list => groups(list, v => v.category).map(([name, rows]) => ({ name, ...describe(rows) })).sort((a, b) => b.median - a.median || a.name.localeCompare(b.name));
  const categories = summarize(named);

  const sorted = [...videos].sort((a, b) => b.views - a.views || String(a.id).localeCompare(String(b.id)));
  const sensitivity = [0, 1, 3].map(remove => {
    const excluded = new Set(sorted.slice(0, remove).map(v => v.id));
    const rows = summarize(named.filter(v => !excluded.has(v.id)));
    const eligible = rows.filter(v => !v.weak);
    return { remove, excluded: [...excluded], categories: rows, leaders: eligible.filter(v => v.median === eligible[0]?.median).map(v => v.name) };
  });

  // Only periods where at least two categories were posted: a period with one category compares nothing.
  const periods = groups(named, period.key).sort(([a], [b]) => a.localeCompare(b))
    .map(([key, list]) => ({ period: period.label(key), key, categories: summarize(list) })).filter(p => p.categories.length >= 2);

  const durationStrata = groups(named, v => v.category).sort(([a], [b]) => a.localeCompare(b)).map(([stratum, list]) => {
    const rows = durationBuckets(list).map(b => ({ name: b.name, ...describe(b.items) }));
    return { stratum, comparable: rows.filter(r => !r.weak).length >= 2, durations: rows };
  });

  // Hit rate over time (all posts): shows whether hits keep coming or were a one-off burst.
  const timeline = groups(videos, period.key).sort(([a], [b]) => a.localeCompare(b)).map(([key, list]) => {
    const d = describe(list);
    return { period: period.label(key), key, count: d.count, young: d.young, median: d.median, hits: d.hits, hitRate: d.hitRate };
  });

  // Match without replacement; candidates are leads for manual review, not experiments.
  // Young posts are excluded (their views are not final) and each category gets at most two pairs.
  const mature = named.filter(v => !young(v) && v.duration > 0 && v.views > 0);
  const candidates = [];
  for (let i = 0; i < mature.length; i++) for (let j = i + 1; j < mature.length; j++) {
    const a = mature[i], b = mature[j];
    const daysApart = Math.abs(a.timestamp - b.timestamp) / DAY;
    const tolerance = Math.max(10, .15 * Math.max(a.duration, b.duration));
    if (a.category !== b.category || daysApart > 30 || Math.abs(a.duration - b.duration) > tolerance) continue;
    const [high, low] = a.views >= b.views ? [a, b] : [b, a];
    const ratio = high.views / low.views;
    if (ratio >= 2) candidates.push({ high, low, ratio, daysApart });
  }
  const used = new Set(), perCategory = new Map(), pairs = [];
  for (const pair of candidates.sort((a, b) => b.ratio - a.ratio || a.daysApart - b.daysApart)) {
    const cat = pair.high.category;
    if (used.has(pair.high.id) || used.has(pair.low.id) || (perCategory.get(cat) || 0) >= 2) continue;
    const brief = v => ({ id: v.id, title: v.title, url: v.url, views: v.views, duration: v.duration, date: v.date, category: v.category });
    pairs.push({ ...pair, high: brief(pair.high), low: brief(pair.low) });
    used.add(pair.high.id); used.add(pair.low.id); perCategory.set(cat, (perCategory.get(cat) || 0) + 1);
    if (pairs.length === 8) break;
  }
  return {
    channelMedian, hitThreshold, periodUnit: period.unit, labeledCount: named.length, totalCount: videos.length,
    youngCount: videos.filter(young).length, categories, sensitivity, periods, durationStrata, timeline, pairs,
  };
}

export const EVIDENCE_LIMITS = `View là số tích lũy trong cache, không phải view ở cùng tuổi bài; bài dưới ${YOUNG_DAYS} ngày tuổi lúc thu thập còn đang tích view và được đếm riêng. "So với bài cùng thời" = view chia cho trung vị các bài khác đăng trong ±7 ngày (nới tới ±30 ngày nếu thiếu mẫu); cách này giảm nhiễu giai đoạn nhưng không chứng minh nhân quả. Hit = bài đạt từ ${HIT_MULTIPLE}× trung vị kênh. Nhóm dưới ${MIN_SAMPLE} bài là ít mẫu; không chọn làm nhóm dẫn đầu. Tỷ lệ vượt chuẩn dùng dấu >. Thiếu số đo hiển thị —; cache cũ có thể đã thay dữ liệu tương tác thiếu bằng 0. Không suy ra giữ chân, người xem quay lại hoặc cơ hội thị trường từ dữ liệu này.`;

// Shared content keeps HTML, Markdown and the agent summary consistent.
export function evidenceTables(e, fmt, pct) {
  const count = row => `${row.count}${row.weak ? ' · ít mẫu' : ''}${row.young ? ` · ${row.young} bài <${YOUNG_DAYS} ngày` : ''}`;
  const rate = metric => `${metric.median == null ? '—' : pct(metric.median)} (n=${metric.count})`;
  const x = v => v == null ? '—' : `${v.toFixed(v >= 10 ? 0 : 1).replace('.', ',')}×`;
  const hit = r => `${r.hits}/${r.count}`;
  return [
    { title: 'Độ ổn định theo loại nội dung', headers: ['Loại', 'n', 'Trung vị', 'P25–P75', `Hit (≥${fmt(e.hitThreshold)})`, 'So với bài cùng thời', 'Vượt bài cùng thời'], rows: e.categories.map(r => [r.name, count(r), fmt(r.median), `${fmt(r.q25)}–${fmt(r.q75)}`, hit(r), x(r.relMedian), pct(r.aboveLocal)]) },
    { title: `Tỷ lệ hit theo ${e.periodUnit} (mọi bài)`, headers: ['Kỳ', 'n', 'Trung vị', `Hit (≥${fmt(e.hitThreshold)})`], rows: e.timeline.map(r => [r.period, count(r), fmt(r.median), hit(r)]) },
    { title: 'Kiểm tra khi bỏ video nhiều view nhất toàn kênh', headers: ['Bỏ top', 'Loại', 'n còn lại', 'Trung vị', 'Dẫn đầu đủ mẫu'], rows: e.sensitivity.flatMap(s => s.categories.map(r => [s.remove, r.name, count(r), fmt(r.median), s.leaders.includes(r.name) ? 'Có (có thể đồng hạng)' : '—'])) },
    { title: `So chủ đề trong cùng ${e.periodUnit} (chỉ kỳ có từ 2 loại)`, headers: ['Kỳ', 'Loại', 'n', 'Trung vị', 'Hit'], rows: e.periods.flatMap(p => p.categories.map(r => [p.period, r.name, count(r), fmt(r.median), hit(r)])) },
    { title: 'Độ dài trong cùng chủ đề (mốc chia theo phân vị của từng loại)', headers: ['Loại', 'Độ dài', 'n', 'Trung vị', 'So với bài cùng thời', 'Hit', 'Đủ hai nhóm ≥5 bài'], rows: e.durationStrata.flatMap(s => s.durations.map(r => [s.stratum, r.name, count(r), fmt(r.median), x(r.relMedian), hit(r), s.comparable ? 'Có; vẫn là tương quan' : 'Chưa đủ mẫu'])) },
    { title: 'Tương tác theo từng loại (trung vị tỷ lệ trên view)', headers: ['Loại', 'Like/view', 'Bình luận/view', 'Chia sẻ/view', 'Lưu/view'], rows: e.categories.map(r => [r.name, ...['likes', 'comments', 'shares', 'saves'].map(k => rate(r.interactions[k]))]) },
    { title: 'Cặp video để xem đối chứng thủ công', headers: ['Loại', 'Video cao / ID', 'Video thấp / ID', 'Tỷ lệ view', 'Cách ngày'], rows: e.pairs.map(p => [p.high.category, `${p.high.title} [${p.high.id}]`, `${p.low.title} [${p.low.id}]`, `${p.ratio.toFixed(1)}×`, p.daysApart.toFixed(1)]) },
  ];
}
