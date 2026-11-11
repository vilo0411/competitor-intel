#!/usr/bin/env node
// Motion timeline: what appears / moves / disappears where, when, how (slide, scale, draw-on, easing) and in what colour,
// measured from pixels instead of eyeballed from grids. Each event is tied to the Whisper word being spoken, and the
// result is also emitted as `beats` suggestions for scripts/build-sticker.mjs.
//
// Algorithm adapted from rea-video `rea_video/motion.py` (Apache-2.0, Copyright 2026 JuneYaooo,
// https://github.com/JuneYaooo/rea-video). Modified: ported from Python/OpenCV to dependency-free Node, cell-level
// static elements, per-shot runs over our scene_changes.txt, word alignment and sticker-beat output added.
//
// Usage: node motion-timeline.mjs <video> <out_dir> [--scenes <scene_changes.txt> | --split 0.3|0.06] [--words <audio.json>] [--fps 12]
// Writes <out_dir>/motion.json and <out_dir>/motion.md.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const W = 180;          // analysis width
export const CELL = 4;         // px per cell at that width
const DIFF = 12;               // per-channel change that counts (8-bit)
const MAX_FPS = 15;
const MAX_FRAMES = 1800;       // decode budget for long videos
const CONT = 0.7;              // a cell active in more than this share of the shot belongs to the continuous layer
const GAP_S = 0.12;            // start times further apart than this split an event
const MIN_AREA = 0.002;        // events smaller than this share of the frame are dropped
const MAX_EVENTS = 20;
const MIN_SHOT = 0.3;          // shots shorter than this (s) are skipped

const r3 = x => Math.round(x * 1000) / 1000;
const r2 = x => Math.round(x * 100) / 100;
const median = a => { if (!a.length) return 0; const s = Float64Array.from(a).sort(), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const percentile = (a, p) => { if (!a.length) return 0; const s = Float64Array.from(a).sort(); return s[Math.min(s.length - 1, Math.max(0, Math.round((p / 100) * (s.length - 1))))]; };
const std = a => { if (!a.length) return 0; let m = 0; for (const x of a) m += x; m /= a.length; let v = 0; for (const x of a) v += (x - m) ** 2; return Math.sqrt(v / a.length); };
const hex = rgb => '#' + rgb.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
const corr = (a, b) => {
  const n = a.length; let ma = 0, mb = 0;
  for (let i = 0; i < n; i++) { ma += a[i]; mb += b[i]; }
  ma /= n; mb /= n;
  let sab = 0, saa = 0, sbb = 0;
  for (let i = 0; i < n; i++) { const da = a[i] - ma, db = b[i] - mb; sab += da * db; saa += da * da; sbb += db * db; }
  return saa && sbb ? sab / Math.sqrt(saa * sbb) : 0;
};

// ---------- grid helpers (masks are Uint8Array of gh*gw) ----------
function dilate(mask, gh, gw, ry, rx) {
  const out = new Uint8Array(mask.length);
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    if (!mask[y * gw + x]) continue;
    for (let dy = -ry; dy <= ry; dy++) for (let dx = -rx; dx <= rx; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < gh && xx >= 0 && xx < gw) out[yy * gw + xx] = 1;
    }
  }
  return out;
}
// 8-connected components; returns array of index lists
function components(mask, gh, gw) {
  const seen = new Uint8Array(mask.length), out = [];
  for (let i = 0; i < mask.length; i++) {
    if (!mask[i] || seen[i]) continue;
    const comp = [], stack = [i]; seen[i] = 1;
    while (stack.length) {
      const k = stack.pop(); comp.push(k);
      const y = (k / gw) | 0, x = k % gw;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const yy = y + dy, xx = x + dx, j = yy * gw + xx;
        if (yy >= 0 && yy < gh && xx >= 0 && xx < gw && mask[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    out.push(comp);
  }
  return out;
}
const boxOf = (cells, gh, gw) => {
  let y0 = gh, y1 = -1, x0 = gw, x1 = -1;
  for (const k of cells) { const y = (k / gw) | 0, x = k % gw; if (y < y0) y0 = y; if (y > y1) y1 = y; if (x < x0) x0 = x; if (x > x1) x1 = x; }
  return { y0, y1, x0, x1, box: [r3(x0 / gw), r3(y0 / gh), r3((x1 + 1 - x0) / gw), r3((y1 + 1 - y0) / gh)] };
};

function easing(act) {
  const sum = act.reduce((a, b) => a + b, 0);
  if (act.length < 4 || sum <= 0) return 'instant';
  let c = 0; const cum = act.map(v => (c += v) / sum);
  const half = cum[(act.length >> 1) - (act.length % 2 === 0 ? 1 : 0)];
  if (half > 0.68) return 'ease_out';
  if (half < 0.32) return 'ease_in';
  const m = sum / act.length;
  return std(act) / (m + 1e-6) < 0.45 ? 'linear' : 'ease_in_out';
}

function direction(on, ys, xs) {
  if (on.length < 12 || std(on) < 1e-6) return null;
  let best = 0, axis = null;
  for (const [coord, pos, neg] of [[xs, 'right', 'left'], [ys, 'down', 'up']]) {
    if (std(coord) < 1e-6) continue;
    const r = corr(coord, on);
    if (Math.abs(r) > Math.abs(best)) { best = r; axis = r > 0 ? pos : neg; }
  }
  return Math.abs(best) > 0.6 ? axis : null;
}

/**
 * Analyse one shot.
 * @param {Uint8Array[]} frames RGB frames (w*h*3), consecutive at `fps`
 * @returns {{fps:number, layer:object|null, static:object[], events:object[], sequences:object[]}}
 */
export function analyzeShot(frames, { w, h, fps, start = 0 }) {
  const n = frames.length, dur = n / fps;
  const out = { fps: r2(fps), layer: null, static: [], events: [], sequences: [] };
  if (n < 3) return out;
  const gh = Math.floor(h / CELL), gw = Math.floor(w / CELL), G = gh * gw, cellPx = CELL * CELL;
  const pxMax = (a, b, i) => Math.max(Math.abs(a[i] - b[i]), Math.abs(a[i + 1] - b[i + 1]), Math.abs(a[i + 2] - b[i + 2]));
  // share of changed pixels per cell between two frames
  const cellChange = (a, b, thr) => {
    const s = new Float32Array(G);
    for (let y = 0; y < gh * CELL; y++) {
      const cy = (y / CELL) | 0;
      for (let x = 0; x < gw * CELL; x++) if (pxMax(a, b, (y * w + x) * 3) > thr) s[cy * gw + ((x / CELL) | 0)]++;
    }
    for (let k = 0; k < G; k++) s[k] /= cellPx;
    return s;
  };
  const act = [];
  for (let t = 0; t < n - 1; t++) act.push(Uint8Array.from(cellChange(frames[t], frames[t + 1], DIFF), v => (v > 0.12 ? 1 : 0)));
  const count = new Uint16Array(G), onset = new Int32Array(G).fill(-1), last = new Int32Array(G).fill(-1);
  for (let t = 0; t < n - 1; t++) for (let k = 0; k < G; k++) if (act[t][k]) { count[k]++; if (onset[k] < 0) onset[k] = t; last[k] = t; }
  const ever = Uint8Array.from(count, c => (c > 0 ? 1 : 0));
  const cont = Uint8Array.from(count, c => (c > CONT * (n - 1) ? 1 : 0));
  // slow drifts (gradients, glow) change by 1-3 levels per frame: compare 1 s apart
  const lag = Math.max(1, Math.round(fps));
  if (n > lag + 2) {
    const slow = new Float32Array(G);
    for (let t = 0; t + lag < n; t++) { const c = cellChange(frames[t], frames[t + lag], 8); for (let k = 0; k < G; k++) if (c[k] > 0.3) slow[k]++; }
    // a real drift almost never jumps between neighbouring frames; a label switched on and off does (count >= 2)
    for (let k = 0; k < G; k++) if (slow[k] / (n - lag) > 0.6 && count[k] < 2) cont[k] = 1;
  }
  const contShare = cont.reduce((a, b) => a + b, 0) / G;
  if (contShare > 0.01) out.layer = { share: r3(contShare), box: boxOf([...cont.keys()].filter(k => cont[k]), gh, gw).box };
  if (contShare < 0.4) out.static = staticElements(frames, ever.map((v, k) => v | cont[k]), { w, h, gh, gw });
  if (!ever.some(Boolean)) return out;

  const trans = ever.map((v, k) => (v && !cont[k] ? 1 : 0));
  const settledShare = cellChange(frames[n - 1], frames[0], DIFF);
  const settled = trans.map((v, k) => (v && settledShare[k] > 0.12 ? 1 : 0));
  // where an element comes to rest, its own entrance is the last burst of change there
  const arrive = Int32Array.from(last);
  for (let t = n - 2; t >= 0; t--) for (let k = 0; k < G; k++) if (act[t][k] && arrive[k] - t <= 3 && t < arrive[k]) arrive[k] = t;

  const ctx = { frames, act, last, start, fps, gh, gw, w, n };
  const covered = new Uint8Array(G);
  for (const comp of components(dilate(settled, gh, gw, 0, 1), gh, gw)) {
    const region = comp.filter(k => settled[k]);
    if (region.length / G < MIN_AREA) continue;
    const rm = new Uint8Array(G); for (const k of region) rm[k] = 1;
    const dl = dilate(rm, gh, gw, 2, 2); for (let k = 0; k < G; k++) if (dl[k]) covered[k] = 1;
    for (const cells of splitByStart(region, arrive, fps)) if (cells.length / G >= MIN_AREA) out.events.push(makeEvent(cells, arrive, ctx));
  }
  const rest = trans.map((v, k) => (v && !covered[k] ? 1 : 0));
  for (const comp of components(dilate(rest, gh, gw, 0, 1), gh, gw)) {
    const region = comp.filter(k => rest[k]);
    for (const cells of splitByStart(region, onset, fps)) if (cells.length / G >= MIN_AREA) out.events.push(makeEvent(cells, onset, ctx));
  }
  // whole-picture changes and specks of jitter are not elements. Unlike rea-video we keep small changes that are crisp
  // swaps (the region ends clearly different, within 0.5 s): label / caption swaps are beats in sticker explainers.
  out.events = out.events.filter(e => !(e.kind === 'change' && (e.box[2] * e.box[3] > 0.5 || e.t1 - e.t0 > 0.8 * dur
    || (e.area < 0.01 && !(e._swap && e.t1 - e.t0 <= 0.5)))));
  out.events = mergeSlides(chain(out.events));
  out.events = out.events.sort((a, b) => b._rank - a._rank).slice(0, MAX_EVENTS).map(({ _rank, _swap, ...e }) => e)
    .sort((a, b) => a.t0 - b.t0 || a.box[1] - b.box[1]);
  out.sequences = sequences(out.events);
  return out;
}

function splitByStart(region, startMap, fps) {
  const ts = [...new Set(region.map(k => startMap[k]))].sort((a, b) => a - b);
  if (!ts.length) return [];
  const gap = Math.max(2, GAP_S * 2 * fps), cuts = [ts[0]];
  for (let i = 1; i < ts.length; i++) if (ts[i] - ts[i - 1] > gap) cuts.push(ts[i]);
  const bounds = [...cuts, ts.at(-1) + 1];
  return cuts.map((c0, i) => region.filter(k => startMap[k] >= c0 && startMap[k] < bounds[i + 1])).filter(r => r.length);
}

function makeEvent(cells, startMap, { frames, act, last, start, fps, gh, gw, w, n }) {
  const G = gh * gw, area = cells.length / G;
  const ys = cells.map(k => (k / gw) | 0), xs = cells.map(k => k % gw), on = cells.map(k => startMap[k]);
  const t0 = Math.min(...on), t1 = Math.round(percentile(cells.map(k => last[k]), 90));
  const inCell = new Uint8Array(G); for (const k of cells) inCell[k] = 1;
  const prof = [];
  for (let t = t0; t <= Math.min(t1, act.length - 1); t++) { let s = 0; for (const k of cells) s += act[t][k]; prof.push(s); }
  const { y0, y1, x0, x1, box } = boxOf(cells, gh, gw);
  // region before the event vs after it
  const before = frames[Math.max(0, t0)], after = frames[Math.min(n - 1, t1 + 2)];
  const bv = [], av = [], diffPx = [];
  let changed = 0, total = 0;
  for (let y = y0 * CELL; y < (y1 + 1) * CELL; y++) for (let x = x0 * CELL; x < (x1 + 1) * CELL; x++) {
    const i = (y * w + x) * 3;
    for (let c = 0; c < 3; c++) { bv.push(before[i + c]); av.push(after[i + c]); }
    total++;
    if (Math.max(Math.abs(after[i] - before[i]), Math.abs(after[i + 1] - before[i + 1]), Math.abs(after[i + 2] - before[i + 2])) > DIFF) { changed++; diffPx.push(i); }
  }
  const sb = std(bv), sa = std(av);
  let kind = changed / total < 0.05 ? 'change' : sb < 0.5 * sa && sa > 6 ? 'appear' : sa < 0.5 * sb && sb > 6 ? 'disappear' : 'change';
  // back to how it was, but clearly different in between and held a while: shown temporarily (a label that pops up
  // and goes away is two beats, not jitter)
  if (changed / total < 0.05 && (t1 - t0) / fps > 0.3) {
    const mid = frames[Math.min(n - 1, Math.round((t0 + t1) / 2) + 1)];
    let midChanged = 0;
    for (let y = y0 * CELL; y < (y1 + 1) * CELL; y++) for (let x = x0 * CELL; x < (x1 + 1) * CELL; x++) {
      const i = (y * w + x) * 3;
      if (Math.max(Math.abs(mid[i] - before[i]), Math.abs(mid[i + 1] - before[i + 1]), Math.abs(mid[i + 2] - before[i + 2])) > DIFF) { midChanged++; diffPx.push(i); }
    }
    if (midChanged / total >= 0.05) kind = 'temporary';
  }
  const src = kind === 'disappear' ? before : kind === 'temporary' ? frames[Math.min(n - 1, Math.round((t0 + t1) / 2) + 1)] : after;
  const idx = diffPx.length ? diffPx : null;
  const colour = idx ? hex([0, 1, 2].map(c => median(idx.map(i => src[i + c])))) : null;
  // how it enters: only a moving tip changes per frame -> drawn along a direction; the whole element changes and its
  // centre travels -> slides in; centre fixed while its extent grows -> scales in
  const sl = [];
  for (let t = t0; t <= Math.min(t1, act.length - 1); t++) { const a = cells.filter(k => act[t][k]); if (a.length) sl.push(a); }
  const tip = sl.length ? median(sl.map(a => a.length)) / Math.max(1, cells.length) : 1;
  let slide = null, scale = null;
  const sweep = tip < 0.35 ? direction(on, ys, xs) : null;
  if (sl.length >= 3 && !sweep) {
    const cy = a => a.reduce((s, k) => s + ((k / gw) | 0), 0) / a.length / gh, cx = a => a.reduce((s, k) => s + (k % gw), 0) / a.length / gw;
    const dy = cy(sl.at(-1)) - cy(sl[0]), dx = cx(sl.at(-1)) - cx(sl[0]);
    if (Math.max(Math.abs(dy), Math.abs(dx)) > 0.02) slide = Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 'down' : 'up') : (dx > 0 ? 'right' : 'left');
    else {
      const span = a => { const v = a.map(k => k % gw); return Math.max(...v) - Math.min(...v) + 1; };
      if (span(sl[0]) < 0.6 * span(cells)) scale = true;
    }
  }
  // change index j sits between frames j and j+1: the change shows from frame j+1
  return { t0: r2(start + (t0 + 1) / fps), t1: r2(start + Math.max(t1 + 1, t0 + 2) / fps), box, area: r3(area), kind,
    easing: easing(prof), sweep, slide, scale, colour, _rank: area * (t1 - t0 + 1), _swap: changed / total >= 0.05 };
}

const touch = (a, b, tol) => !(a[0] + a[2] + tol < b[0] || b[0] + b[2] + tol < a[0] || a[1] + a[3] + tol < b[1] || b[1] + b[3] + tol < a[1]);
const union = (a, b) => { const x0 = Math.min(a[0], b[0]), y0 = Math.min(a[1], b[1]); return [r3(x0), r3(y0), r3(Math.max(a[0] + a[2], b[0] + b[2]) - x0), r3(Math.max(a[1] + a[3], b[1] + b[3]) - y0)]; };

// one element drawn piece by piece arrives as touching pieces, each starting as the previous ends: join them
function chain(evs) {
  const out = [];
  for (const e of [...evs].sort((a, b) => a.t0 - b.t0)) {
    const o = out.find(o => o.kind === e.kind && e.t0 - o._lastT1 >= -0.1 && e.t0 - o._lastT1 <= 0.2 && touch(o._lastBox, e.box, 0.01));
    if (o) {
      const [cx0, cy0] = o._firstC, cx1 = e.box[0] + e.box[2] / 2, cy1 = e.box[1] + e.box[3] / 2;
      o.sweep = Math.abs(cx1 - cx0) >= Math.abs(cy1 - cy0) ? (cx1 > cx0 ? 'right' : 'left') : (cy1 > cy0 ? 'down' : 'up');
      o.box = union(o.box, e.box); o.t1 = Math.max(o.t1, e.t1); o._lastT1 = e.t1; o._lastBox = e.box;
      o.area = r3(o.area + e.area); o._rank += e._rank; o._pieces++; o.slide = null;
    } else out.push({ ...e, _lastT1: e.t1, _lastBox: e.box, _firstC: [e.box[0] + e.box[2] / 2, e.box[1] + e.box[3] / 2], _pieces: 1 });
  }
  return out.map(({ _lastT1, _lastBox, _firstC, _pieces, ...o }) => (_pieces >= 3 && o.easing === 'instant' ? { ...o, easing: 'linear' } : o));
}

// A flat-coloured block sliding in only changes at its leading and trailing edges, so it reads as a "draw-on" where
// it settles plus a "temporary" trail behind it. Trail + settled piece sweeping the same way = one slide.
function mergeSlides(evs) {
  const drop = new Set();
  for (const e of evs) {
    if (e.kind !== 'appear' || !e.sweep) continue;
    const trail = evs.find(p => p !== e && !drop.has(p) && p.kind === 'temporary' && p.sweep === e.sweep
      && p.t0 <= e.t0 + 0.05 && p.t1 >= e.t0 - 0.1 && touch(p.box, e.box, 0.06));
    if (!trail) continue;
    drop.add(trail);
    Object.assign(e, { slide: e.sweep, sweep: null, t0: Math.min(e.t0, trail.t0), _rank: e._rank + trail._rank });
  }
  return evs.filter(e => !drop.has(e));
}

// same-sized elements entering the same way at a steady interval (list items, icons, bars, lines of text)
function sequences(evs) {
  const seqs = [], used = new Set();
  evs.forEach((e, i) => {
    if (used.has(i)) return;
    const grp = [i];
    for (let j = i + 1; j < evs.length; j++) {
      const f = evs[j];
      if (used.has(j) || f.kind !== e.kind) continue;
      if (Math.abs(f.box[2] - e.box[2]) < 0.4 * Math.max(e.box[2], f.box[2]) && Math.abs(f.box[3] - e.box[3]) < 0.4 * Math.max(e.box[3], f.box[3])
        && Math.abs((f.t1 - f.t0) - (e.t1 - e.t0)) < 0.5 * Math.max(0.2, e.t1 - e.t0)) grp.push(j);
    }
    if (grp.length < 3) return;
    const t = grp.map(k => evs[k].t0), gaps = t.slice(1).map((x, k) => x - t[k]);
    const mg = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (Math.min(...gaps) <= 0 || std(gaps) > 0.4 * mg) return;
    grp.forEach(k => used.add(k));
    seqs.push({ n: grp.length, events: grp, t0: t[0], interval: r2(mg), each: r2(median(grp.map(k => evs[k].t1 - evs[k].t0))) });
  });
  return seqs;
}

// shapes on screen for the whole shot that never move (axis lines, fixed cards, logos), at cell resolution
function staticElements(frames, moving, { w, gh, gw }, most = 8) {
  const first = frames[0], lastF = frames.at(-1), G = gh * gw, H = gh * CELL, Wc = gw * CELL;
  const border = [];
  for (let x = 0; x < Wc; x++) for (const y of [0, H - 1]) border.push((y * w + x) * 3);
  for (let y = 0; y < H; y++) for (const x of [0, Wc - 1]) border.push((y * w + x) * 3);
  const bg = [0, 1, 2].map(c => median(border.map(i => lastF[i + c])));
  const mov = dilate(moving, gh, gw, 1, 1);
  const fg = new Uint8Array(G), fgShare = new Float32Array(G);
  for (let y = 0; y < H; y++) for (let x = 0; x < Wc; x++) {
    const i = (y * w + x) * 3, k = ((y / CELL) | 0) * gw + ((x / CELL) | 0);
    const far = Math.max(Math.abs(lastF[i] - bg[0]), Math.abs(lastF[i + 1] - bg[1]), Math.abs(lastF[i + 2] - bg[2]));
    const same = Math.max(Math.abs(first[i] - lastF[i]), Math.abs(first[i + 1] - lastF[i + 1]), Math.abs(first[i + 2] - lastF[i + 2])) <= DIFF;
    if (far > 2 * DIFF && same) fgShare[k]++;
  }
  for (let k = 0; k < G; k++) fg[k] = fgShare[k] / (CELL * CELL) > 0.2 && !mov[k] ? 1 : 0;
  const items = [];
  for (const comp of components(dilate(fg, gh, gw, 1, 1), gh, gw)) {
    const cells = comp.filter(k => fg[k]);
    if (cells.length < 3) continue;
    const { y0, y1, x0, x1, box } = boxOf(cells, gh, gw);
    if (box[2] * box[3] > 0.6) continue;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const px = [];
    for (const k of cells) { const cy = ((k / gw) | 0) * CELL, cx = (k % gw) * CELL; for (let dy = 0; dy < CELL; dy++) for (let dx = 0; dx < CELL; dx++) px.push(((cy + dy) * w + cx + dx) * 3); }
    const core = px.filter(i => Math.max(...[0, 1, 2].map(c => Math.abs(lastF[i + c] - bg[c]))) > 2 * DIFF);
    items.push({ box, shape: bw > 8 * bh ? 'hline' : bh > 8 * bw ? 'vline' : 'block', colour: hex([0, 1, 2].map(c => median(core.map(i => lastF[i + c])))), _a: cells.length });
  }
  return items.sort((a, b) => b._a - a._a).slice(0, most).map(({ _a, ...e }) => e).sort((a, b) => a.box[1] - b.box[1] || a.box[0] - b.box[0]);
}

// ---------- word alignment + sticker beats ----------
export function nearestWord(words, t, before = 0.35, after = 0.2) {
  let best = null, bd = Infinity;
  for (const wd of words) {
    const d = wd.start - t;
    if (d >= -before && d <= after && Math.abs(d) < bd) { bd = Math.abs(d); best = wd; }
  }
  return best;
}

// Caption track: a short, wide-ish strip that keeps swapping in the same place across the video (2–3 word chunks).
// Marks those events `caption: true` so they are reported as caption pacing instead of sticker beats.
export function markCaptions(shots, minCount = 5) {
  const evs = shots.flatMap(s => s.events).filter(e => e.box[3] <= 0.12 && e.kind !== 'disappear');
  const centre = b => [b[0] + b[2] / 2, b[1] + b[3] / 2];
  const groups = [];
  for (const e of evs) {
    const [cx, cy] = centre(e.box);
    const g = groups.find(g => Math.abs(g.cy - cy) < 0.04 && Math.abs(g.cx - cx) < 0.12 && Math.abs(g.h - e.box[3]) < 0.04);
    if (g) g.list.push(e); else groups.push({ cx, cy, h: e.box[3], list: [e] });
  }
  const tracks = groups.filter(g => g.list.length >= minCount).sort((a, b) => b.list.length - a.list.length);
  if (!tracks.length) return null;
  const list = tracks[0].list.sort((a, b) => a.t0 - b.t0);
  for (const e of list) e.caption = true;
  const box = list.map(e => e.box).reduce(union);
  const gaps = list.slice(1).map((e, i) => e.t0 - list[i].t0).filter(g => g > 0.05);
  return { box, swaps: list.length, medianInterval: r2(median(gaps)) };
}

const FX = e => (e.scale ? 'pop' : e.slide === 'down' ? 'drop' : e.slide ? `slide-${e.slide}` : e.sweep ? `draw-${e.sweep}` : e.easing === 'instant' ? 'cut' : 'fade');
export function stickerBeats(shots) {
  const raw = [];
  for (const s of shots) {
    // a hard cut is itself a beat (new picture)
    raw.push({ t: s.start, at: s.startWord ?? null, fx: 'cut', boxes: [], area: 1, shot: s.index });
    for (const e of s.events) {
      if (e.caption || e.kind === 'disappear' || e.area < 0.003 || e.t0 - s.start < 0.15) continue;
      raw.push({ t: e.t0, at: e.word ?? null, fx: FX(e), boxes: [e.box], area: e.area, shot: s.index });
      if (e.kind === 'temporary') raw.push({ t: e.t1, at: e.endWord ?? null, fx: 'cut', boxes: [e.box], area: e.area, shot: s.index });
    }
  }
  raw.sort((a, b) => a.t - b.t);
  // elements that change together (within 0.25 s) are one beat; the largest element decides the entrance
  const beats = [];
  for (const b of raw) {
    const p = beats.at(-1);
    if (p && b.t - p.t <= 0.25) { p.boxes.push(...b.boxes); if (b.area > p.area) { p.fx = b.fx; p.area = b.area; } p.at ??= b.at; }
    else beats.push({ ...b, boxes: [...b.boxes] });
  }
  for (const b of beats) delete b.area;
  const gaps = beats.slice(1).map((b, i) => b.t - beats[i].t).filter(g => g > 0.05);
  return { beats, medianInterval: r2(median(gaps)), perMinute: beats.length && shots.length ? r2(beats.length / ((shots.at(-1).end - shots[0].start) / 60)) : 0 };
}

// ---------- Vietnamese one-liners for the report ----------
const KIND = { appear: 'xuất hiện', disappear: 'biến mất', change: 'thay đổi', temporary: 'hiện tạm rồi mất' };
const EASE = { ease_out: 'nhanh rồi chậm (ease-out)', ease_in: 'chậm rồi nhanh (ease-in)', linear: 'đều (linear)', ease_in_out: 'ease-in-out', instant: 'tức thì' };
const DIR = { right: 'sang phải', left: 'sang trái', down: 'xuống', up: 'lên' };
const where = b => { const cx = b[0] + b[2] / 2, cy = b[1] + b[3] / 2; return `${cy < 0.33 ? 'trên' : cy > 0.66 ? 'dưới' : 'giữa'}-${cx < 0.33 ? 'trái' : cx > 0.66 ? 'phải' : 'giữa'}`; };
export function eventLine(e) {
  const how = [e.slide && `trượt ${DIR[e.slide]}`, e.scale && 'phóng to dần', e.sweep && `vẽ/hiện dần ${DIR[e.sweep]}`].filter(Boolean).join(', ');
  return `${e.t0.toFixed(2)}–${e.t1.toFixed(2)}s · ${KIND[e.kind]} · ${where(e.box)} [${e.box.join(', ')}] · ${how || 'tại chỗ'} · ${EASE[e.easing]}${e.colour ? ` · ${e.colour}` : ''}${e.word ? ` · lúc nói “${e.word}”` : ''}`;
}

// ---------- CLI ----------
function probe(video) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,avg_frame_rate:format=duration', '-of', 'json', video], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`ffprobe failed: ${r.stderr}`);
  const j = JSON.parse(r.stdout), s = j.streams[0], [a, b] = s.avg_frame_rate.split('/').map(Number);
  return { width: s.width, height: s.height, fps: b ? a / b : 30, duration: Number(j.format.duration) };
}

function detectScenes(video, threshold) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', video, '-map', '0:v:0', '-vf', `select='gt(scene,${threshold})',showinfo`, '-an', '-f', 'null', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 });
  const ts = [...(r.stderr || '').matchAll(/pts_time:([\d.]+)/g)].map(m => Number(m[1]));
  // a swap animated over several frames fires several times: keep the first of each burst
  return ts.filter((t, i) => i === 0 || t - ts[i - 1] > 0.25);
}

function decode(video, fps, h) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-i', video, '-map', '0:v:0', '-vf', `fps=${fps},scale=${W}:${h}:flags=area`, '-f', 'rawvideo', '-pix_fmt', 'rgb24', 'pipe:1'], { maxBuffer: 1 << 30 });
  if (r.status !== 0) throw new Error(`ffmpeg decode failed: ${r.stderr}`);
  const size = W * h * 3, frames = [];
  for (let o = 0; o + size <= r.stdout.length; o += size) frames.push(new Uint8Array(r.stdout.buffer, r.stdout.byteOffset + o, size));
  return frames;
}

function main(argv) {
  const pos = argv.filter((a, i) => !a.startsWith('--') && !argv[i - 1]?.startsWith('--'));
  const opt = (k, d) => { const i = argv.indexOf(k); return i < 0 ? d : argv[i + 1]; };
  const [video, outDir] = pos;
  if (!video || !outDir) { console.error('Usage: motion-timeline.mjs <video> <out_dir> [--scenes scene_changes.txt] [--words audio.json] [--fps N]'); process.exit(2); }
  const info = probe(video);
  const fps = Math.min(Number(opt('--fps', MAX_FPS)), info.fps || 30, MAX_FRAMES / Math.max(1, info.duration));
  const h = Math.round((W * info.height) / info.width / 2) * 2;
  const frames = decode(video, fps, h);
  // Shot boundaries: an existing scene list, or detect at --split (0.3 = hard cuts; 0.06 = every sticker / picture swap,
  // which is what sticker explainers need since their swaps happen on a static background)
  const scenes = opt('--scenes') && fs.existsSync(opt('--scenes'))
    ? fs.readFileSync(opt('--scenes'), 'utf8').split(/\s+/).map(Number).filter(t => t > 0 && t < info.duration)
    : detectScenes(video, Number(opt('--split', 0.3)));
  let words = [];
  if (opt('--words') && fs.existsSync(opt('--words'))) { try { words = JSON.parse(fs.readFileSync(opt('--words'), 'utf8')).words || []; } catch {} }
  const runShots = cuts => {
    const bounds = [0, ...cuts, frames.length / fps], out = [];
    bounds.slice(0, -1).forEach((s, i) => {
      const e = bounds[i + 1];
      if (e - s < MIN_SHOT) return;
      const f0 = Math.ceil(s * fps), f1 = Math.min(frames.length, Math.floor(e * fps));
      const res = analyzeShot(frames.slice(f0, f1), { w: W, h, fps, start: f0 / fps });
      for (const ev of res.events) {
        const wd = nearestWord(words, ev.t0); if (wd) ev.word = wd.word;
        if (ev.kind === 'temporary') { const we = nearestWord(words, ev.t1); if (we) ev.endWord = we.word; }
      }
      out.push({ index: out.length + 1, start: r2(s), end: r2(e), startWord: nearestWord(words, s)?.word, ...res });
    });
    return out;
  };
  // Pass 2: a big swap inside a shot (a whole panel replaced) masks later small changes in the same place, so split
  // again at every large instant change found by pass 1.
  const cuts1 = [...scenes].sort((a, b) => a - b);
  const big = runShots(cuts1).flatMap(s => s.events.filter(e => e.t0 - s.start >= MIN_SHOT && e.t1 - e.t0 <= 0.3 && e.area >= 0.03).map(e => e.t0));
  const cuts2 = [...new Set([...cuts1, ...big].map(r2))].sort((a, b) => a - b).filter((t, i, a) => i === 0 || t - a[i - 1] >= MIN_SHOT);
  const shots = runShots(cuts2);
  const captionTrack = markCaptions(shots);
  const sticker = stickerBeats(shots);
  const result = { source: path.basename(video), width: info.width, height: info.height, duration: r2(info.duration), analysisFps: r2(fps),
    analysisSize: [W, h], boxUnits: 'fraction of frame [x, y, w, h]', captionTrack, shots, stickerBeats: sticker };
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'motion.json'), JSON.stringify(result, null, 2));
  const md = [`# Dòng thời gian chuyển động — ${result.source}`, '',
    `${shots.length} shot · ${sticker.beats.length} lần đổi hình (beat, không tính phụ đề) · trung vị ${sticker.medianInterval}s/beat · ${sticker.perMinute} beat/phút`,
    captionTrack ? `Phụ đề: ${captionTrack.swaps} lần đổi ở ${where(captionTrack.box)} [${captionTrack.box.join(', ')}], trung vị ${captionTrack.medianInterval}s/lần (cần xem grid để xác nhận đây là phụ đề)` : 'Không thấy dải phụ đề đổi đều.', ''];
  for (const s of shots) {
    md.push(`## Shot ${s.index} (${s.start}–${s.end}s)`);
    if (s.layer) md.push(`- Lớp chuyển động liên tục (nền trôi, hạt, glow): ${Math.round(s.layer.share * 100)}% khung hình`);
    for (const st of s.static) md.push(`- Cố định cả shot: ${st.shape} ${where(st.box)} [${st.box.join(', ')}] ${st.colour}`);
    for (const e of s.events) md.push(`- ${e.caption ? "[phụ đề] " : ""}${eventLine(e)}`);
    for (const q of s.sequences) md.push(`- Chuỗi ${q.n} phần tử giống nhau, cách nhau ${q.interval}s, mỗi cái ${q.each}s (từ ${q.t0}s)`);
    md.push('');
  }
  fs.writeFileSync(path.join(outDir, 'motion.md'), md.join('\n'));
  console.log(`motion.json: ${shots.length} shots, ${shots.reduce((a, s) => a + s.events.length, 0)} events, ${sticker.beats.length} beats (median ${sticker.medianInterval}s)`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
