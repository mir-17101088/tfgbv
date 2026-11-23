// Tiny zero-thrash scroll engine: one passive listener, one rAF, cached layout geometry for sticky scenes.
const mq = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
export const reduced = !!(mq.matches || (navigator.connection && navigator.connection.saveData));

// Android Chrome: 100vh is the viewport with the URL bar hidden, so sticky panels sized in vh get
// cropped while the bar shows. --vh = 1% of the real visible height; only refreshed when the width
// changes (rotation), so the bar sliding in and out doesn't make the panels jump.
let vhW = 0;
function setVh() {
  if (window.innerWidth === vhW) return;
  vhW = window.innerWidth;
  document.documentElement.style.setProperty('--vh', (window.innerHeight * 0.01).toFixed(2) + 'px');
}
setVh();

const scenes = [];
const listeners = [];
const measurers = [];
const cardTops = new WeakMap();
const sceneMap = new WeakMap();
let ticking = false;
let measureQueued = false;
let curY = window.pageYOffset || 0;
let curVh = window.innerHeight || 1;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function measure() {
  measureQueued = false;
  curY = window.pageYOffset || 0;
  curVh = window.innerHeight || 1;
  // Batch all DOM geometry reads before any writes
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const r = s.el.getBoundingClientRect();
    s.top = r.top + curY;
    s.h = s.el.offsetHeight;
    const cards = s.cardEls;
    const tops = new Array(cards.length);
    for (let j = 0; j < cards.length; j++) tops[j] = cards[j].getBoundingClientRect().top + curY;
    cardTops.set(s.el, tops);
  }
  for (let i = 0; i < measurers.length; i++) measurers[i](curY, curVh);
}

function scheduleMeasure() {
  if (!measureQueued) {
    measureQueued = true;
    window.requestAnimationFrame(() => {
      measure();
      request();
    });
  }
}

export function onMeasure(fn) {
  measurers.push(fn);
  fn(curY, curVh);
}

export function progressOf(el) {
  const s = sceneMap.get(el);
  if (s) {
    const range = Math.max(1, s.h - curVh);
    return clamp((curY - s.top) / range, 0, 1);
  }
  const r = el.getBoundingClientRect();
  const range = Math.max(1, el.offsetHeight - window.innerHeight);
  return clamp(-r.top / range, 0, 1);
}

function update() {
  ticking = false;
  curY = window.pageYOffset || 0;
  curVh = window.innerHeight || 1;
  // Write phase only — zero layout reads inside scroll frame
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const p = clamp((curY - s.top) / Math.max(1, s.h - curVh), 0, 1);
    if (p !== s.p) {
      s.p = p;
      s.el.style.setProperty('--p', p.toFixed(4));
      const fin = p >= 0.999;
      if (fin !== s.fin) {
        s.fin = fin;
        s.el.classList.toggle('is-final', fin);
      }
      s.cb(p, s.el);
    }
  }
  for (let i = 0; i < listeners.length; i++) listeners[i](curY, curVh);
}

function request() {
  if (!ticking) { ticking = true; window.requestAnimationFrame(update); }
}

// Register a sticky scene by its data-scene name. cb(p 0..1, el).
export function scene(name, cb) {
  const el = document.querySelector('[data-scene="' + name + '"]');
  if (!el) return;
  if (reduced) {
    el.classList.add('is-final');
    el.style.setProperty('--p', '1');
    cb(1, el);
    return;
  }
  const s = {
    el,
    cb,
    cardEls: el.querySelectorAll('.scene__steps > .step'),
    top: 0,
    h: 0,
    p: undefined,
    fin: false,
  };
  scenes.push(s);
  sceneMap.set(el, s);
  measure();
  update();
}

export function onScroll(fn) { listeners.push(fn); request(); }

export function onEnter(selector, cb, threshold = 0.5) {
  const els = document.querySelectorAll(selector);
  if (reduced || !('IntersectionObserver' in window)) { els.forEach(cb); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { cb(e.target); io.unobserve(e.target); } });
  }, { threshold });
  els.forEach((el) => io.observe(el));
}

window.addEventListener('scroll', request, { passive: true });
window.addEventListener('resize', () => { setVh(); scheduleMeasure(); }, { passive: true });
window.addEventListener('load', scheduleMeasure);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(scheduleMeasure);
if ('ResizeObserver' in window) new ResizeObserver(scheduleMeasure).observe(document.body);

// Index of the last real (non-empty) card whose top has passed 80% of the viewport; -1 before the first.
// Uses cached document-relative coordinates so scrolling triggers zero forced reflows.
export function activeCard(el) {
  if (reduced) return 99;
  const tops = cardTops.get(el);
  if (tops) {
    const line = curY + curVh * 0.8;
    let k = -1;
    for (let i = 0; i < tops.length; i++) if (tops[i] < line) k = i;
    return k;
  }
  const cards = el.querySelectorAll('.scene__steps > .step');
  const line = curVh * 0.8;
  let k = -1;
  for (let i = 0; i < cards.length; i++) if (cards[i].getBoundingClientRect().top < line) k = i;
  return k;
}
