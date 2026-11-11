import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeEvidence, quantile, evidenceTables, pickPeriod } from './evidence.mjs';

const BASE = 1746057600; // 2025-05-01 00:00 UTC
const video = (id, category, views, extra = {}) => {
  const timestamp = extra.timestamp ?? BASE + id * 86400, date = new Date(timestamp * 1000).toISOString().slice(0, 10);
  return { id: String(id), category, views, month: date.slice(0, 7), date, timestamp, duration: 30, title: `Video ${id}`, likes: 10, comments: 1, shares: 2, saves: 3, ...extra };
};

test('quantiles handle empty input, ties and interpolation', () => {
  assert.equal(quantile([], .5), null);
  assert.equal(quantile([0, 10, 20, 30], .25), 7.5);
  assert.equal(quantile([2, 2, 2], .75), 2);
});
test('removing top posts can reverse leader and weak groups never lead', () => {
  const rows = [...[1, 2, 100, 101, 102].map((n, i) => video(i, 'A', n)), ...Array.from({ length: 6 }, (_, i) => video(i + 10, 'B', 90)), video(30, 'C', 10000)];
  const e = analyzeEvidence(rows);
  assert.deepEqual(e.sensitivity[0].leaders, ['A']);
  assert.deepEqual(e.sensitivity[2].leaders, ['B']);
  assert.ok(e.sensitivity.every(s => !s.leaders.includes('C')));
});
test('equal medians tie; above threshold is strict; missing metrics stay missing', () => {
  const rows = Array.from({ length: 10 }, (_, i) => video(i, i < 5 ? 'A' : 'B', 100, { shares: null, views: i === 0 ? 0 : 100 }));
  const e = analyzeEvidence(rows);
  assert.deepEqual(e.sensitivity[0].leaders, ['A', 'B']);
  assert.equal(e.categories[0].aboveChannel, 0);
  assert.deepEqual(e.categories[0].interactions.shares, { count: 0, median: null });
  assert.ok(evidenceTables(e, String, String).length >= 6);
});
test('duration buckets follow the group tertiles and need two adequate buckets', () => {
  // long-form posts must not collapse into one ">60s" bucket
  const rows = Array.from({ length: 12 }, (_, i) => video(i, 'A', 100, { duration: i < 6 ? 180 : 420 }));
  const [s] = analyzeEvidence(rows).durationStrata;
  assert.equal(s.comparable, true);
  assert.deepEqual(s.durations.map(d => d.count), [6, 6]);
  const thin = analyzeEvidence(rows.slice(3, 9).map((v, i) => ({ ...v, duration: i < 2 ? 180 : 420 }))).durationStrata[0];
  assert.equal(thin.comparable, false);
});
test('period is weekly for dense channels and coarser for sparse ones', () => {
  const dense = Array.from({ length: 40 }, (_, i) => video(i, 'A', 100, { timestamp: BASE + i * 43200 }));
  const sparse = Array.from({ length: 12 }, (_, i) => video(i, 'A', 100, { timestamp: BASE + i * 10 * 86400 }));
  assert.equal(pickPeriod(dense).unit, 'tuần');
  assert.equal(pickPeriod(sparse).unit, 'quý');
});
test('relative view compares with contemporaries; hits counted against channel median', () => {
  // era 1: 10 posts at 100 views; era 2 (90 days later): 9 posts at 10k and one at 200k
  const rows = [...Array.from({ length: 10 }, (_, i) => video(i, 'Old', 100)),
    ...Array.from({ length: 10 }, (_, i) => video(100 + i, 'New', i === 0 ? 200000 : 10000))];
  const e = analyzeEvidence(rows);
  const cat = name => e.categories.find(c => c.name === name);
  assert.equal(cat('New').relMedian, 1);   // ordinary among its own era, although 100x the old era
  assert.equal(cat('Old').relMedian, 1);
  assert.equal(e.hitThreshold, 50500);
  assert.equal(cat('New').hits, 1);
  assert.equal(cat('Old').hits, 0);
});
test('comparison pairs enforce matching criteria, skip young posts and do not reuse posts', () => {
  const rows = [video(1, 'A', 1000), video(2, 'A', 100), video(3, 'A', 200), video(4, 'B', 1), video(50, 'A', 1), video(5, 'A', 1, { duration: 80 })];
  const { pairs } = analyzeEvidence(rows);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].high.id, '1');
  assert.equal(pairs[0].low.id, '2');
  // the newest posts have not finished accumulating views: never offered as the "low" side
  const young = [video(1, 'A', 1000), video(2, 'A', 500), video(20, 'A', 10)];
  assert.deepEqual(analyzeEvidence(young).pairs.map(p => p.low.id), ['2']);
  assert.equal(analyzeEvidence(young).youngCount, 1);
  assert.deepEqual(analyzeEvidence([]).categories, []);
});
