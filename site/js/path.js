// Ch.6: the law's road vs the road she walked, to scale in days since the first message (21 Oct 2021 = day 0).
// The band is redrawn in screen space every frame: a camera walks beside her, pulls back as she reaches the
// legal limit (~day 150), and pulls all the way back at the charge sheet (day 256) to show both roads whole.
import { scene, activeCard } from './scroll.js';

const NS = 'http://www.w3.org/2000/svg';
export const CASE = 45;       // 5 Dec 2021, case filed
export const DEADLINE = 150;  // ~20 Mar 2022: 75 working days after the case was filed (holidays ignored)
export const END = 256;       // 4 Jul 2022, charge sheet
export const STAGES = ['Case filed', 'Charge sheet'];
// [day, label]: days from her timeline
export const EVENTS = [
  [0, 'First message'],
  [3, 'GD filed'],
  [40, 'Sent to DMP, DB, back'],
  [45, 'Case filed'],
  [48, 'Four witnesses asked'],
  [49, 'Two witnesses'],
  [52, 'DMP calls'],
  [59, 'ADC: within about a month'],
  [113, 'Calls from his side'],
  [150, 'Legal limit runs out'],
  [204, 'More witnesses asked'],
  [207, 'Meeting at a bakery'],
  [256, 'Charge sheet'],
];
// the day each card walks her to
const BEATS = [48, 49, 52, 59, 113, 150, 207, 256];

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const sstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const f1 = (n) => Math.round(n * 10) / 10;

function mk(tag, attrs, parent, text) {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, attrs[k]);
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}
const fmtDay = (d, approx) => (approx ? '~day ' : 'day ') + Math.round(d);

const HER = '<g class="her__legB"><path d="M0-42V-3h5" stroke="#3B4E4C" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>' +
  '<g class="her__legF"><path d="M0-42V-3h5" stroke="#10201F" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" fill="none"/></g>' +
  '<path fill="#10201F" d="M-3-86C-12-70-16-52-16-34H13C12-52 9-70 5-86Z"/>' +
  '<g class="her__arm"><path d="M1-80L2-54" stroke="#10201F" stroke-width="5" stroke-linecap="round" fill="none"/></g>' +
  '<circle cx="1" cy="-94" r="8.5" fill="#10201F"/><circle cx="-7.5" cy="-92" r="4.6" fill="#10201F"/>' +
  '<path fill="#246E72" d="M6-86C-2-80-14-66-21-48L-15-46C-9-60 0-73 9-80Z"/>';

export function initPath() {
  const root = document.querySelector('[data-scene="path"]');
  const svg = document.querySelector('.pathviz__svg');
  if (!root || !svg) return;
  const html = document.documentElement;
  const band = root.querySelector('.road__band');
  const stage = root.querySelector('.road__stage');
  const panel = document.getElementById('IL-06');
  const pSvg = panel && panel.querySelector('svg');
  const limitEl = root.querySelector('.road__limit');
  const overEl = root.querySelector('.road__over');
  const vig = panel ? panel.querySelectorAll('.v') : [];
  const cards = root.querySelectorAll('.scene__steps > .step');

  svg.textContent = ''; // drop the static no-JS snapshot
  const g = {};
  g.leader = mk('path', { class: 's s-th s-dash o-50' }, svg);
  g.lawRoad = mk('path', { class: 'road-law' }, svg);
  g.lawEdge = mk('path', { class: 's s-th' }, svg);
  g.lawText = mk('text', { class: 'road-lbl road-lbl--law' }, svg, 'what the law allows');
  g.lawStart = mk('g', {}, svg);
  mk('path', { class: 's s-th', d: 'M0 0V-26' }, g.lawStart);
  mk('path', { class: 'f-teal', d: 'M0-26H10L7-21L10-16H0Z' }, g.lawStart);
  mk('text', { class: 'road-sign', x: 14, y: -15 }, g.lawStart, STAGES[0]);
  g.lawEnd = mk('g', { class: 'road-end' }, svg);
  g.barrierBg = mk('path', { class: 'road-barrier road-barrier--bg' }, g.lawEnd);
  g.barrier = mk('path', { class: 'road-barrier' }, g.lawEnd);
  g.lawEndSign = mk('g', {}, g.lawEnd);
  mk('path', { class: 's s-th', d: 'M0 0V-26' }, g.lawEndSign);
  mk('path', { class: 'f-teal', d: 'M0-26H10L7-21L10-16H0Z' }, g.lawEndSign);
  mk('text', { class: 'road-sign', x: 14, y: -15 }, g.lawEndSign, STAGES[1]);
  g.herRoad = mk('path', { class: 'road-her' }, svg);
  g.herLate = mk('path', { class: 'road-her road-her--late' }, svg);
  g.herEdge = mk('path', { class: 's s-th' }, svg);
  g.herMid = mk('path', { class: 'road-mid' }, svg);
  g.herText = mk('text', { class: 'road-lbl road-lbl--her' }, svg, 'Her road');
  g.onward = mk('path', { class: 's s-dash', opacity: 0 }, svg);
  g.pins = EVENTS.map(([d]) => mk('circle', { r: 3, class: 'road-pin' + (d > DEADLINE ? ' is-late' : '') }, svg));
  g.base = mk('path', { class: 's s-th' }, svg);
  g.t1 = mk('path', { class: 's s-th o-25' }, svg);
  g.t10 = mk('path', { class: 's s-th o-50' }, svg);
  g.t50 = mk('path', { class: 's s-th' }, svg);
  g.lbls = [];
  for (let i = 0; i < 34; i++) g.lbls.push(mk('text', { class: 'road-tick', 'text-anchor': 'middle' }, svg, ''));
  g.caption = mk('text', { class: 'road-tick road-cap', 'text-anchor': 'end' }, svg, 'days since the first message');
  g.dl = mk('g', { class: 'pathviz__deadline' }, svg);
  g.dlLine = mk('path', { class: 's s-dash' }, g.dl);
  g.dlText = mk('text', { class: 'pathviz__dltext', 'text-anchor': 'end' }, g.dl, 'limit ~day 150');
  g.her = mk('g', { class: 'her' }, svg);
  g.her.innerHTML = HER;
  const legF = g.her.querySelector('.her__legF'), legB = g.her.querySelector('.her__legB'), arm = g.her.querySelector('.her__arm');
  g.pill = mk('g', { class: 'road-pill' }, svg);
  g.pillBg = mk('rect', { rx: 9, height: 18, y: -9 }, g.pill);
  g.pillText = mk('text', { 'text-anchor': 'middle', y: 4 }, g.pill, '');
  g.now = mk('text', { class: 'pathviz__now' }, svg, '');

  let W = 0, H = 0, live = false, desk = false, minL = 0, anchor = 0, pw = 0, ph = 0;
  let P = BEATS.map((_, i) => (i + 1) / (BEATS.length + 1));
  let lastP = 1, lastVi = -1;
  let lawW = 110, herW = 60;
  let lastPillStr = '', lastPillW = 64, lastNowStr = '', lastNowW = 120;
  let lastPassed = null, lastPillLate = null, lastNowLate = null, lastDlPassed = null;
  const nowWidthCache = new Map();
  const pillWidthCache = new Map();

  function measureTextW(el, fallback) {
    return el.getComputedTextLength ? (el.getComputedTextLength() || fallback) : fallback;
  }

  function layout() {
    live = html.classList.contains('js');
    desk = window.innerWidth >= 900;
    W = Math.max(200, band.clientWidth);
    H = live ? Math.max(150, band.clientHeight) : Math.round(clamp(W * (W < 600 ? 0.75 : 0.46), 260, 330));
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    minL = 12;
    if (live && desk && cards[0]) minL = cards[0].getBoundingClientRect().right - root.getBoundingClientRect().left + 28;
    anchor = live && desk ? (minL + W) / 2 : W * 0.5;
    if (live && panel) {
      const sh = stage.clientHeight;
      if (desk) { ph = Math.min(sh - 34, (W - minL - 24) / 1.6); pw = ph * 1.6; }
      else { pw = Math.min(W - 24, (sh - 34) * 1.2); ph = pw / 1.2; }
      panel.style.width = Math.round(pw) + 'px';
      panel.style.height = Math.round(ph) + 'px';
      pSvg.setAttribute('viewBox', desk ? '0 0 640 400' : '88 0 480 400');
    } else if (panel) {
      panel.style.width = panel.style.height = panel.style.transform = '';
      pSvg.setAttribute('viewBox', '0 0 640 400');
    }
    // Pre-measure static SVG text widths once on layout/font load instead of every scroll frame
    lawW = measureTextW(g.lawText, 110);
    herW = measureTextW(g.herText, 60);
    nowWidthCache.clear();
    pillWidthCache.clear();
    lastPillStr = '';
    lastNowStr = '';
    // scroll progress at which each card becomes the active one (its top crosses 80% of the viewport)
    if (live) {
      const vh = window.innerHeight;
      const top = root.getBoundingClientRect().top;
      const range = Math.max(1, root.offsetHeight - vh);
      const q = [];
      for (let i = 0; i < BEATS.length && i < cards.length; i++) q.push(clamp((cards[i].getBoundingClientRect().top - top - vh * 0.8) / range, 0, 1));
      if (q.length === BEATS.length) P = q;
    }
  }

  // her day as a function of scroll: she holds at a beat while its card is read, then walks to the next
  function dayAt(p) {
    if (p <= P[0]) return CASE + (BEATS[0] - CASE) * sstep(0, 1, p / Math.max(P[0], 1e-4));
    for (let i = 0; i < BEATS.length - 1; i++) {
      if (p < P[i + 1]) {
        const t = (p - P[i]) / Math.max(P[i + 1] - P[i], 1e-4);
        return BEATS[i] + (BEATS[i + 1] - BEATS[i]) * sstep(0.25, 0.95, t);
      }
    }
    return END;
  }

  function render(p) {
    lastP = p;
    const day = dayAt(p);
    const fin = p >= P[7] ? sstep(0.08, 0.8, (p - P[7]) / Math.max(1 - P[7], 1e-4)) : 0;
    const passed = day >= DEADLINE - 0.5;
    // camera: the visible window [L, R] in days
    const kc = desk ? clamp(W / 75, 10, 22) : W / 38;
    let L = day - anchor / kc, R = L + W / kc;
    const m = sstep(122, 147, day) * (1 - sstep(156, 192, day));
    const mw = desk ? [6, 172] : [28, 174];
    L += (mw[0] - L) * m; R += (mw[1] - R) * m;
    const fw = desk ? [-8, 290] : [-6, 274];
    L += (fw[0] - L) * fin; R += (fw[1] - R) * fin;
    const k = W / (R - L);
    const sx = (d) => (d - L) * k;

    const hl = Math.max(10, H * 0.06), yL = Math.max(H * 0.155, hl + 36);
    const yR = H * 0.64, hr = Math.max(13, H * 0.09);
    const cap = H >= 240;
    const yT = Math.min(Math.max(H * 0.82, yR + hr + 30), H - (cap ? 46 : 24));
    const amp = H * 0.02;
    const wob = (d) => amp * (0.6 * Math.sin(d / 6.5) + 0.4 * Math.sin(d / 15 + 1));
    const fh = clamp(yR - hr - (yL + hl) - 8, 40, 130);

    // law's road: straight, paved, from the case to the limit, then it stops
    const a = sx(CASE), b = sx(DEADLINE);
    g.lawRoad.setAttribute('d', 'M' + f1(a) + ' ' + f1(yL - hl) + 'H' + f1(b) + 'V' + f1(yL + hl) + 'H' + f1(a) + 'Z');
    g.lawEdge.setAttribute('d', 'M' + f1(a) + ' ' + f1(yL - hl) + 'H' + f1(b) + 'M' + f1(a) + ' ' + f1(yL + hl) + 'H' + f1(b) + 'M' + f1(a) + ' ' + f1(yL - hl) + 'V' + f1(yL + hl));
    g.lawStart.setAttribute('transform', 'translate(' + f1(a) + ' ' + f1(yL - hl) + ')');
    g.lawEnd.setAttribute('transform', 'translate(' + f1(b) + ' 0)');
    g.barrier.setAttribute('d', 'M0 ' + f1(yL - hl - 6) + 'V' + f1(yL + hl + 6));
    g.barrierBg.setAttribute('d', 'M0 ' + f1(yL - hl - 6) + 'V' + f1(yL + hl + 6));
    g.lawEndSign.setAttribute('transform', 'translate(0 ' + f1(yL - hl - 6) + ')');
    g.lawText.setAttribute('x', f1(clamp(a + 10, 8, b - lawW - 10)));
    g.lawText.setAttribute('y', f1(yL + 4));
    g.lawText.style.opacity = b - a > lawW + 16 ? 1 : 0;

    // her road: revealed only as far as she has walked; past the limit it turns red
    const step = Math.max(0.25, 5 / k);
    const s0 = Math.max(0, L - 2), s1 = Math.min(day, R + 2);
    const strip = (d0, d1) => {
      if (d1 <= d0) return '';
      let top = '', bot = '';
      for (let d = d0; ; d = Math.min(d1, d + step)) {
        const x = f1(sx(d)), y = yR + wob(d);
        top += (top ? 'L' : 'M') + x + ' ' + f1(y - hr);
        bot = 'L' + x + ' ' + f1(y + hr) + bot;
        if (d >= d1) break;
      }
      return top + bot + 'Z';
    };
    const edge = (d0, d1) => {
      if (d1 <= d0) return '';
      let t = '', u = '';
      for (let d = d0; ; d = Math.min(d1, d + step)) {
        const x = f1(sx(d)), y = yR + wob(d);
        t += (t ? 'L' : 'M') + x + ' ' + f1(y - hr);
        u += (u ? 'L' : 'M') + x + ' ' + f1(y + hr);
        if (d >= d1) break;
      }
      return t + u;
    };
    g.herRoad.setAttribute('d', strip(s0, Math.min(s1, DEADLINE)));
    g.herLate.setAttribute('d', strip(Math.max(s0, DEADLINE), s1));
    g.herEdge.setAttribute('d', edge(s0, s1) + (s0 <= 0 ? 'M' + f1(sx(0)) + ' ' + f1(yR + wob(0) - hr) + 'V' + f1(yR + wob(0) + hr) : ''));
    const hx = clamp(sx(0) + 10, 8, sx(day) - herW - 14);
    g.herText.setAttribute('x', f1(hx));
    g.herText.setAttribute('y', f1(yR + wob(hx / k + L) - hr - 8));
    g.herText.style.opacity = sx(day) - Math.max(sx(0), 0) > herW + 24 ? 1 : 0;
    g.herMid.setAttribute('d', (function () {
      let t = '';
      for (let d = s0; d < s1; d = Math.min(s1, d + step)) t += (t ? 'L' : 'M') + f1(sx(d)) + ' ' + f1(yR + wob(d));
      return t ? t + 'L' + f1(sx(s1)) + ' ' + f1(yR + wob(s1)) : 'M0 0';
    })());
    g.onward.setAttribute('d', 'M' + f1(sx(END) + 10) + ' ' + f1(yR + wob(END)) + 'H' + f1(W));
    g.onward.setAttribute('opacity', (fin * 0.6).toFixed(2));

    // pins
    let cur = 0;
    EVENTS.forEach((e, i) => {
      const on = e[0] <= day + 0.01;
      if (on) cur = i;
      const pin = g.pins[i];
      pin.style.opacity = on ? 1 : 0;
      pin.setAttribute('cx', f1(sx(e[0])));
      pin.setAttribute('cy', f1(yR + wob(e[0])));
    });
    g.pins.forEach((c, i) => c.setAttribute('r', i === cur ? 6 : 3));

    // ruler
    g.base.setAttribute('d', 'M0 ' + f1(yT) + 'H' + W);
    let t1 = '', t10 = '', t50 = '';
    const lo = Math.max(-10, Math.ceil(L)), hi = Math.min(400, Math.floor(R));
    for (let d = lo; d <= hi; d++) {
      const x = f1(sx(d));
      if (d % 50 === 0) t50 += 'M' + x + ' ' + f1(yT) + 'v14';
      else if (d % 10 === 0) t10 += 'M' + x + ' ' + f1(yT) + 'v9';
      else if (k >= 4) t1 += 'M' + x + ' ' + f1(yT) + 'v5';
    }
    g.t1.setAttribute('d', t1 || 'M0 0'); g.t10.setAttribute('d', t10 || 'M0 0'); g.t50.setAttribute('d', t50 || 'M0 0');
    const hx2 = sx(day);
    const lstep = k * 10 >= 44 ? 10 : k * 50 >= 44 ? 50 : 100;
    let li = 0;
    for (let d = Math.ceil(Math.max(0, L) / lstep) * lstep; d <= R && li < g.lbls.length; d += lstep) {
      const x = sx(d);
      const t = g.lbls[li++];
      t.textContent = String(d);
      t.setAttribute('x', f1(x));
      t.setAttribute('y', f1(yT + 26));
      t.style.opacity = Math.abs(x - hx2) < 46 || x > W - 14 || x < 8 ? 0 : 1;
    }
    for (; li < g.lbls.length; li++) g.lbls[li].textContent = '';
    g.caption.setAttribute('x', W - 8);
    g.caption.setAttribute('y', f1(Math.min(H - 3, yT + 44)));
    g.caption.style.opacity = cap ? 1 : 0;

    // deadline
    const dx = sx(DEADLINE);
    g.dlLine.setAttribute('d', 'M' + f1(dx) + ' 0V' + f1(yT + 16));
    g.dlText.setAttribute('x', f1(dx - 6));
    g.dlText.setAttribute('y', f1(yL + hl + 16));
    if (passed !== lastDlPassed) {
      lastDlPassed = passed;
      g.dl.setAttribute('class', 'pathviz__deadline' + (passed ? ' is-passed' : ''));
    }

    // her, walking: legs swing between beats and settle when she stops
    let near = 1e9;
    for (let i = 0; i < BEATS.length; i++) near = Math.min(near, Math.abs(day - BEATS[i]));
    near = Math.min(near, Math.abs(day - CASE));
    const swing = Math.sin(day * Math.PI / 1.6) * 26 * Math.min(1, near * 1.2);
    const fy = yR + wob(day) - hr + 2;
    g.her.setAttribute('transform', 'translate(' + f1(hx2) + ' ' + f1(fy) + ') scale(' + (fh / 100).toFixed(3) + ')');
    legF.setAttribute('transform', 'rotate(' + f1(swing) + ' 0 -42)');
    legB.setAttribute('transform', 'rotate(' + f1(-swing) + ' 0 -42)');
    arm.setAttribute('transform', 'rotate(' + f1(-swing * 0.8) + ' 1 -80)');
    // the panel, its pointer and the leader stay pinned to the beat's own day; only she and the pill walk on
    const bd = BEATS[clamp(lastVi, 0, BEATS.length - 1)];
    const bx = sx(bd);
    const atBeat = Math.abs(day - bd) < 0.5;
    g.leader.setAttribute('d', 'M' + f1(bx) + ' 0V' + f1(atBeat ? fy - fh - 8 : yR + wob(bd) - hr - 2));
    g.leader.style.opacity = live ? 1 : 0;

    // readouts (cached widths avoid per-frame forced layout reflows)
    const ev = EVENTS[cur];
    const approx = ev[0] === DEADLINE && Math.round(day) === DEADLINE;
    const pillStr = fmtDay(day, approx);
    if (pillStr !== lastPillStr) {
      lastPillStr = pillStr;
      g.pillText.textContent = pillStr;
      let pw0 = pillWidthCache.get(pillStr);
      if (pw0 == null) {
        pw0 = measureTextW(g.pillText, 48) + 16;
        pillWidthCache.set(pillStr, pw0);
      }
      lastPillW = pw0;
      g.pillBg.setAttribute('width', f1(lastPillW));
      g.pillBg.setAttribute('x', f1(-lastPillW / 2));
    }
    g.pill.setAttribute('transform', 'translate(' + f1(clamp(hx2, lastPillW / 2 + 2, W - lastPillW / 2 - 2)) + ' ' + f1(yT + 24) + ')');
    const pillLate = day > DEADLINE + 0.5;
    if (pillLate !== lastPillLate) {
      lastPillLate = pillLate;
      g.pill.setAttribute('class', 'road-pill' + (pillLate ? ' is-late' : ''));
    }
    const nowStr = ev[1];
    if (nowStr !== lastNowStr) {
      lastNowStr = nowStr;
      g.now.textContent = nowStr;
      let nw0 = nowWidthCache.get(nowStr);
      if (nw0 == null) {
        nw0 = measureTextW(g.now, 120);
        nowWidthCache.set(nowStr, nw0);
      }
      lastNowW = nw0;
    }
    const ex = sx(ev[0]);
    const right = ex > W * 0.62;
    g.now.setAttribute('text-anchor', right ? 'end' : 'start');
    g.now.setAttribute('x', f1(right ? clamp(ex + 6, lastNowW + 4, W - 4) : clamp(ex - 6, 4, W - lastNowW - 4)));
    g.now.setAttribute('y', f1(yR + wob(day) + hr + 18));
    const nowLate = ev[0] >= DEADLINE;
    if (nowLate !== lastNowLate) {
      lastNowLate = nowLate;
      g.now.setAttribute('class', 'pathviz__now' + (nowLate ? ' is-late' : ''));
    }

    // stage: panel follows her, red limit line drops through the whole screen once passed
    if (passed !== lastPassed) {
      lastPassed = passed;
      root.classList.toggle('is-late', passed);
    }
    if (live && panel) {
      const left = clamp(bx - pw / 2, minL, W - pw - 12);
      panel.style.transform = 'translate3d(' + Math.round(left) + 'px,0,0)';
      panel.style.setProperty('--tail', Math.round(clamp(bx - left, 22, pw - 22)) + 'px');
      limitEl.style.left = Math.round(dx) + 'px';
      overEl.style.left = Math.round(dx) + 'px';
    }
  }

  function show(vi) {
    if (vi === lastVi) return;
    lastVi = vi;
    for (let i = 0; i < vig.length; i++) vig[i].classList.toggle('is-on', i === vi);
    if (panel) panel.classList.toggle('is-limit', vi === 5);
  }

  layout();
  scene('path', (p, el) => {
    show(p >= 0.999 ? vig.length - 1 : Math.min(vig.length - 1, Math.max(0, activeCard(el))));
    render(p);
    el.setAttribute('data-day-now', Math.round(dayAt(p)));
  });
  let rz = 0;
  const again = () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => { layout(); render(lastP); }); };
  window.addEventListener('resize', again, { passive: true });
  window.addEventListener('load', again);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(again);
}
