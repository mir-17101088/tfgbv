// Tiny scroll engine: one passive listener, one rAF, progress for sticky scenes.
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
let ticking = false;

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);

function measure() {
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const r = s.el.getBoundingClientRect();
    s.top = r.top + window.pageYOffset;
    s.h = s.el.offsetHeight;
  }
}

export function progressOf(el) {
  const r = el.getBoundingClientRect();
  const range = Math.max(1, el.offsetHeight - window.innerHeight);
  return clamp(-r.top / range, 0, 1);
}

function update() {
  ticking = false;
  const y = window.pageYOffset;
  const vh = window.innerHeight;
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    const p = clamp((y - s.top) / Math.max(1, s.h - vh), 0, 1);
    if (p !== s.p) {
      s.p = p;
      s.el.style.setProperty('--p', p.toFixed(4));
      s.el.classList.toggle('is-final', p >= 0.999);
      s.cb(p, s.el);
    }
  }
  for (let i = 0; i < listeners.length; i++) listeners[i](y, vh);
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
  const s = { el, cb, top: 0, h: 0, p: undefined };
  scenes.push(s);
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
window.addEventListener('resize', () => { setVh(); measure(); request(); });
window.addEventListener('load', () => { measure(); request(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { measure(); request(); });
if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); request(); }).observe(document.body);

// Index of the last real (non-empty) card whose top has passed 65% of the viewport; -1 before the first.
export function activeCard(el) {
  if (reduced) return 99;
  const cards = el.querySelectorAll('.scene__steps > .step');
  const line = window.innerHeight * 0.8;
  let k = -1;
  for (let i = 0; i < cards.length; i++) if (cards[i].getBoundingClientRect().top < line) k = i;
  return k;
}
